import Anthropic from '@anthropic-ai/sdk';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  API_BASE_URL,
  DEFAULT_MODEL,
  FALLBACK_BETA,
  MODEL_IDS,
  PAGE_TEXT_LIMIT,
  answerText,
  basePrompt,
  buildRequest,
  echoContent,
  errorKind,
  projectSummary,
  servedByFallback,
  systemBlocks,
} from '../../src/lib/coach';
import { KEY_STORAGE, SETTINGS_STORAGE, clearKey, loadKey, loadSettings, looksLikeKey, maskKey, saveKey, saveSettings } from '../../src/lib/coachKey';
import { STORE_KEY, defaultState } from '../../src/lib/store';
import { parseBlocks, safeHref } from '../../src/islands/parts/Markdown';

const KEY = 'sk-ant-api03-' + 'a'.repeat(40);

function fakeStorage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

describe('coach key storage', () => {
  let local: ReturnType<typeof fakeStorage>;
  let session: ReturnType<typeof fakeStorage>;
  beforeEach(() => {
    local = fakeStorage();
    session = fakeStorage();
    vi.stubGlobal('window', { localStorage: local, sessionStorage: session });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('checks the key shape and masks it', () => {
    expect(looksLikeKey(KEY)).toBe(true);
    expect(looksLikeKey(`  ${KEY} `)).toBe(true);
    expect(looksLikeKey('sk-proj-abc')).toBe(false);
    expect(looksLikeKey('sk-ant-short')).toBe(false);
    expect(maskKey(KEY)).toBe('…aaaa');
    expect(maskKey(KEY)).not.toContain('sk-ant');
  });

  it('saves to the session by default and moves between areas', () => {
    expect(loadKey()).toBeNull();
    saveKey(KEY, false);
    expect(session.data.get(KEY_STORAGE)).toBe(KEY);
    expect(local.data.has(KEY_STORAGE)).toBe(false);
    expect(loadKey()).toEqual({ key: KEY, remember: false });

    saveKey(KEY, true);
    expect(local.data.get(KEY_STORAGE)).toBe(KEY);
    expect(session.data.has(KEY_STORAGE)).toBe(false);
    expect(loadKey()).toEqual({ key: KEY, remember: true });

    clearKey();
    expect(loadKey()).toBeNull();
    expect(local.data.size + session.data.size).toBe(0);
  });

  it('never writes the key into the tools state', () => {
    saveKey(KEY, true);
    expect(local.data.has(STORE_KEY)).toBe(false);
    expect(JSON.stringify(defaultState())).not.toContain('sk-ant');
  });

  it('survives blocked storage', () => {
    vi.stubGlobal('window', {
      get localStorage(): Storage {
        throw new Error('blocked');
      },
      get sessionStorage(): Storage {
        throw new Error('blocked');
      },
    });
    expect(() => saveKey(KEY, true)).not.toThrow();
    expect(loadKey()).toBeNull();
  });

  it('validates stored settings', () => {
    expect(loadSettings(DEFAULT_MODEL, MODEL_IDS)).toEqual({ model: DEFAULT_MODEL, shareProject: true });
    saveSettings({ model: 'claude-haiku-5-5', shareProject: false });
    expect(loadSettings(DEFAULT_MODEL, MODEL_IDS)).toEqual({ model: 'claude-haiku-5-5', shareProject: false });
    local.data.set(SETTINGS_STORAGE, JSON.stringify({ model: 'gpt-x', shareProject: 'yes' }));
    expect(loadSettings(DEFAULT_MODEL, MODEL_IDS)).toEqual({ model: DEFAULT_MODEL, shareProject: true });
    local.data.set(SETTINGS_STORAGE, '{not json');
    expect(loadSettings(DEFAULT_MODEL, MODEL_IDS).model).toBe(DEFAULT_MODEL);
  });
});

describe('buildRequest', () => {
  const system = systemBlocks('base', {});
  const messages = [{ role: 'user' as const, content: 'hi' }];

  it('uses adaptive thinking and no sampling or budget parameters', () => {
    const r = buildRequest('claude-opus-5-5', system, messages) as unknown as Record<string, unknown>;
    expect(r.thinking).toEqual({ type: 'adaptive' });
    expect(r.max_tokens).toBe(16000);
    for (const k of ['temperature', 'top_p', 'top_k', 'budget_tokens']) expect(r).not.toHaveProperty(k);
  });

  it('turns on server-side fallback for Opus and Sonnet only', () => {
    for (const m of ['claude-opus-5-5', 'claude-sonnet-5-5']) {
      const r = buildRequest(m, system, messages) as unknown as Record<string, unknown>;
      expect(r.betas).toEqual([FALLBACK_BETA]);
      expect(r.fallbacks).toBe('default');
    }
    const h = buildRequest('claude-haiku-5-5', system, messages) as unknown as Record<string, unknown>;
    expect(h).not.toHaveProperty('betas');
    expect(h).not.toHaveProperty('fallbacks');
  });

  it('talks only to api.anthropic.com', () => {
    expect(API_BASE_URL).toBe('https://api.anthropic.com');
  });
});

describe('system prompt', () => {
  const pages = [
    { slug: 'phases/f0-setup', title: 'Phase 0', description: 'Set up.' },
    { slug: 'glossary', title: 'Glossary', description: 'Terms.' },
  ];

  it('lists every page with its path and sets the language', () => {
    const en = basePrompt('en', pages, (s) => `/${s}/`);
    expect(en).toContain('- Phase 0 (/phases/f0-setup/): Set up.');
    expect(en).toContain('Reply in English');
    const it = basePrompt('it', pages, (s) => `/it/${s}/`);
    expect(it).toContain('(/it/glossary/)');
    expect(it).toContain('Rispondi in italiano');
  });

  it('caches the base block and keeps context blocks separate', () => {
    const blocks = systemBlocks('BASE', { project: 'Product name: X', page: { title: 'P', path: '/p/', text: 'x'.repeat(PAGE_TEXT_LIMIT + 500) } });
    expect(blocks).toHaveLength(3);
    expect(blocks[0]).toEqual({ type: 'text', text: 'BASE', cache_control: { type: 'ephemeral' } });
    expect(blocks[1].cache_control).toBeUndefined();
    expect(blocks[1].text).toContain('Product name: X');
    expect(blocks[2].text).toContain('"P" (/p/)');
    expect(blocks[2].text.length).toBeLessThan(PAGE_TEXT_LIMIT + 200);
    expect(systemBlocks('BASE', {})).toHaveLength(1);
  });

  it('summarises only what the visitor entered', () => {
    expect(projectSummary(defaultState())).toBe('');
    const s = defaultState();
    s.project = { ...s.project, name: 'Lumen', idea: 'A booking app', type: 'saas', mobile: true, os: 'macos' };
    s.loop = { ...s.loop, bp: 2, step: 3, title: 'Payments' };
    const text = projectSummary(s);
    expect(text).toContain('Product name: Lumen');
    expect(text).toContain('Product type: saas, with a mobile app');
    expect(text).toContain('build phase 2 ("Payments"), step 3 of 8');
  });
});

describe('answers', () => {
  type Block = Anthropic.Beta.BetaContentBlock;
  const thinking = { type: 'thinking', thinking: 't', signature: 's' } as unknown as Block;
  const text = (s: string) => ({ type: 'text', text: s, citations: null }) as unknown as Block;
  const fallback = { type: 'fallback', from: { model: 'claude-opus-5-5' }, to: { model: 'claude-sonnet-5-5' } } as unknown as Block;

  it('passes the content back unchanged when no fallback happened', () => {
    const content = [thinking, text('Hello')];
    expect(echoContent(content)).toEqual(content);
  });

  it('drops thinking before the last fallback block and keeps text and the block', () => {
    const later = { ...thinking, thinking: 'later' } as Block;
    const content = [thinking, text('partial '), fallback, later, text('rest')];
    expect(echoContent(content)).toEqual([text('partial '), fallback, later, text('rest')]);
  });

  it('joins the visible text and detects a fallback-served answer', () => {
    expect(answerText([thinking, text('a'), fallback, text('b')])).toBe('ab');
    const msg = (iterations: unknown) => ({ usage: { iterations } }) as unknown as Anthropic.Beta.BetaMessage;
    expect(servedByFallback(msg([{ type: 'message' }]))).toBe(false);
    expect(servedByFallback(msg([{ type: 'message' }, { type: 'fallback_message' }]))).toBe(true);
    expect(servedByFallback(msg(undefined))).toBe(false);
  });
});

describe('errorKind', () => {
  const h = new Headers();
  it('maps SDK errors from the most specific', () => {
    expect(errorKind(new Anthropic.APIUserAbortError())).toBe('aborted');
    expect(errorKind(new Anthropic.AuthenticationError(401, undefined, 'x', h))).toBe('auth');
    expect(errorKind(new Anthropic.RateLimitError(429, undefined, 'x', h))).toBe('rate');
    expect(errorKind(new Anthropic.BadRequestError(400, undefined, 'x', h))).toBe('bad');
    expect(errorKind(new Anthropic.PaymentRequiredError(402, undefined, 'x', h))).toBe('billing');
    expect(errorKind(new Anthropic.APIConnectionError({ message: 'down' }))).toBe('connection');
    expect(errorKind(new Anthropic.InternalServerError(500, undefined, 'x', h))).toBe('api');
    expect(errorKind(new Error('x'))).toBe('unknown');
  });
});

describe('Markdown', () => {
  it('parses paragraphs, headings, lists and fences', () => {
    const blocks = parseBlocks('# Title\n\nOne\ntwo\n\n- a\n- b\n  more\n1. x\n\n```bash\nnpm i\n```');
    expect(blocks).toEqual([
      { kind: 'h', level: 1, text: 'Title' },
      { kind: 'p', text: 'One two' },
      { kind: 'ul', items: ['a', 'b more'] },
      { kind: 'ol', items: ['x'] },
      { kind: 'code', lang: 'bash', text: 'npm i' },
    ]);
  });

  it('keeps only site-relative and https links', () => {
    expect(safeHref('/phases/f0-setup/')).toBe('/phases/f0-setup/');
    expect(safeHref('#top')).toBe('#top');
    expect(safeHref('https://code.claude.com/docs')).toBe('https://code.claude.com/docs');
    for (const bad of ['javascript:alert(1)', 'JavaScript:x', '//evil.example', 'http://x.example', 'data:text/html,x']) expect(safeHref(bad)).toBeNull();
  });
});
