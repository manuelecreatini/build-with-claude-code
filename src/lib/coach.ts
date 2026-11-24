/**
 * The AI coach's pure logic: models, the system prompt, the request body and error mapping.
 * No network and no storage here, so all of it is unit-tested. The island (src/islands/Coach.tsx)
 * owns the client and the UI.
 */
import Anthropic from '@anthropic-ai/sdk';
import type { Locale } from './i18n';
import type { State } from './store';

/** The only host the coach talks to. Passed explicitly so no environment setting can change it. */
export const API_BASE_URL = 'https://api.anthropic.com';

export const MODELS = [
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5', price: '$4 / $20', fallback: true },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5', price: '$2 / $10', fallback: true },
  { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5', price: '$0.10 / $0.50', fallback: false },
] as const;
export type ModelId = (typeof MODELS)[number]['id'];
export const DEFAULT_MODEL: ModelId = 'claude-opus-5-5';
export const MODEL_IDS: readonly string[] = MODELS.map((m) => m.id);

/** Server-side fallback: when a model declines for policy reasons, the API retries on a substitute. */
export const FALLBACK_BETA = 'server-side-fallback-2026-07-01';
export const MAX_TOKENS = 16000;
/** A conversation is append-only (preserved thinking); past this many questions, start a new one. */
export const MAX_QUESTIONS = 30;
/** Cap on the attached page text, in characters (about 10k tokens). */
export const PAGE_TEXT_LIMIT = 40_000;
export const QUESTION_LIMIT = 8_000;

export interface PageInfo {
  /** Docs slug without the locale prefix, e.g. "phases/f0-setup". */
  slug: string;
  title: string;
  description: string;
}

export interface PageContext {
  title: string;
  path: string;
  text: string;
}

const LANGUAGE: Record<Locale, string> = {
  en: 'Reply in English unless the visitor writes in another language.',
  it: "Rispondi in italiano, a meno che il visitatore non scriva in un'altra lingua. Usa i termini tecnici inglesi che usa il playbook (build phase, gate, skill, pull request).",
};

/** The fixed part of the system prompt: role, rules and the map of the site. Cached by the API. */
export function basePrompt(locale: Locale, pages: PageInfo[], pathFor: (slug: string) => string): string {
  const map = pages.map((p) => `- ${p.title} (${pathFor(p.slug)}): ${p.description}`).join('\n');
  return `You are the coach on "Build with Claude Code", an open-source, community-made playbook (not affiliated with Anthropic) that guides people, often without a programming background, through building a digital product with Claude Code.

How the playbook works:
- The build runs in phases (F0 setup to the launch), each with a Definition of Done, and the main work happens in repeated build phases that follow an 8-step build loop.
- Every step is marked with who acts: CLAUDE (Claude Code does it on its own), YOU (the person decides, pays, creates an account, tests) or GATE (an approval point where Claude stops and waits for an explicit yes).
- The site also has templates (CLAUDE.md and prompts), a glossary, concept pages and interactive tools.

How to answer:
- Ground your answers in the playbook. Point to the relevant page with its path, for example "see Phase 0 (/phases/f0-setup/)". Only use paths from the map below.
- When a page's text is attached, rely on it and say so. When the playbook does not cover something, say that plainly, then give your best general advice and label it as such.
- Claude Code changes fast. For exact commands, flags and settings, suggest checking the official documentation at code.claude.com.
- Be concrete and brief: short paragraphs, numbered steps for procedures, code blocks for commands and file contents. Explain jargon the first time you use it.
- Respect the roles: never suggest skipping a GATE, and be clear about which steps the person must do themselves.
- Never ask for passwords, API keys or other secrets, and tell the visitor not to paste them into the chat.
- ${LANGUAGE[locale]}

Map of the site (title, path, description):
${map}`;
}

/** What the visitor told the start wizard and the build loop, as context for the coach. */
export function projectSummary(state: State): string {
  const p = state.project;
  const lines: string[] = [];
  if (p.name) lines.push(`Product name: ${p.name}`);
  if (p.idea) lines.push(`Idea: ${p.idea}`);
  if (p.type) lines.push(`Product type: ${p.type}${p.mobile ? ', with a mobile app' : ''}${p.ai ? ', with AI features' : ''}`);
  if (p.os) lines.push(`Computer: ${p.os}`);
  const l = state.loop;
  if (l.step > 0 || l.history.length > 0 || l.title) {
    lines.push(`Build loop: build phase ${l.bp}${l.title ? ` ("${l.title}")` : ''}, step ${l.step} of 8${l.step === 0 ? ' (preflight)' : ''}`);
  }
  if (state.tokens > 0) lines.push(`Last context reading: ${state.tokens.toLocaleString('en-US')} tokens in use`);
  return lines.join('\n');
}

/** The system prompt as blocks. The base block is cached; the context blocks vary per conversation. */
export function systemBlocks(base: string, opts: { project?: string; page?: PageContext | null }): Anthropic.Beta.BetaTextBlockParam[] {
  const blocks: Anthropic.Beta.BetaTextBlockParam[] = [{ type: 'text', text: base, cache_control: { type: 'ephemeral' } }];
  if (opts.project) {
    blocks.push({ type: 'text', text: `The visitor's project, from the site's tools (saved in their browser):\n${opts.project}` });
  }
  if (opts.page) {
    const text = opts.page.text.slice(0, PAGE_TEXT_LIMIT);
    blocks.push({
      type: 'text',
      text: `The visitor is asking about this page: "${opts.page.title}" (${opts.page.path}). Its text:\n<page>\n${text}\n</page>`,
    });
  }
  return blocks;
}

export type StreamParams = Parameters<Anthropic['beta']['messages']['stream']>[0];

/** The request body. Server-side fallback is on for the models that support it. */
export function buildRequest(model: string, system: Anthropic.Beta.BetaTextBlockParam[], messages: Anthropic.Beta.BetaMessageParam[]): StreamParams {
  const info = MODELS.find((m) => m.id === model);
  return {
    model,
    max_tokens: MAX_TOKENS,
    system,
    messages,
    thinking: { type: 'adaptive' },
    ...(info?.fallback ? { betas: [FALLBACK_BETA], fallbacks: 'default' as const } : {}),
  };
}

/**
 * The assistant turn to append to the history. Blocks are passed back unchanged (the API needs the
 * thinking blocks to keep the reasoning across turns), except after a mid-answer fallback: then the
 * thinking blocks before the last `fallback` block are omitted, and the fallback block stays put.
 */
export function echoContent(content: Anthropic.Beta.BetaContentBlock[]): Anthropic.Beta.BetaContentBlockParam[] {
  const last = content.map((b) => b.type).lastIndexOf('fallback');
  const kept = last === -1 ? content : content.filter((b, i) => i >= last || b.type === 'text');
  return kept as Anthropic.Beta.BetaContentBlockParam[];
}

/** The visible text of an answer. */
export function answerText(content: Anthropic.Beta.BetaContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
}

/** True when a fallback model served this answer (covers "sticky" turns, which carry no fallback block). */
export function servedByFallback(msg: Anthropic.Beta.BetaMessage): boolean {
  return (msg.usage.iterations ?? []).some((it) => it.type === 'fallback_message');
}

export type CoachErrorKind = 'aborted' | 'auth' | 'rate' | 'bad' | 'billing' | 'connection' | 'api' | 'unknown';

/** Maps an SDK error to a message kind. Most specific first; the abort check precedes the rest. */
export function errorKind(e: unknown): CoachErrorKind {
  if (e instanceof Anthropic.APIUserAbortError) return 'aborted';
  if (e instanceof Anthropic.AuthenticationError) return 'auth';
  if (e instanceof Anthropic.RateLimitError) return 'rate';
  if (e instanceof Anthropic.BadRequestError) return 'bad';
  if (e instanceof Anthropic.PaymentRequiredError) return 'billing';
  if (e instanceof Anthropic.APIConnectionError) return 'connection';
  if (e instanceof Anthropic.APIError) return 'api';
  return 'unknown';
}

/** Turns a page's rendered HTML into plain text with headings and line breaks kept. */
export function pageTextFromHtml(html: string): { title: string; text: string } {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const title = doc.querySelector('h1')?.textContent?.trim() ?? '';
  const main = doc.querySelector('.sl-markdown-content');
  if (!main) return { title, text: '' };
  main.querySelectorAll('script, style, astro-island, .bcc-tool, .bcc-term__tip, .expressive-code .copy').forEach((el) => el.remove());
  main.querySelectorAll('h2, h3, h4').forEach((h) => h.prepend(`${'#'.repeat(Number(h.tagName[1]))} `));
  main.querySelectorAll('li').forEach((li) => li.prepend('- '));
  main.querySelectorAll('p, li, h2, h3, h4, h5, h6, pre, tr, br, div.code, summary').forEach((el) => el.append('\n'));
  main.querySelectorAll('td, th').forEach((el) => el.append(' | '));
  const text = (main.textContent ?? '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { title, text };
}
