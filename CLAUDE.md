# CLAUDE.md — Build with Claude Code

An open-source, bilingual (English default, Italian) interactive playbook that guides anyone through building a digital product with Claude Code, and explains what is happening at each step.

## Stack

- Astro + Starlight (docs framework, i18n, Pagefind search). English lives at the locale root (`src/content/docs/*`), Italian under `src/content/docs/it/*`.
- React islands (`src/islands/*.tsx`) for interactive tools only. Everything else is static.
- Mermaid diagrams via `astro-mermaid` (fenced ```mermaid blocks).
- No backend. User state is in `localStorage` (`src/lib/store.ts`). The optional AI coach calls the Anthropic API from the browser with the visitor's own key.

## Commands

- `npm run dev` — local dev server
- `npm run build` — production build (also validates internal links)
- `npm run check` — `astro check` (types + content schema)
- `npm test` — Vitest unit tests (`tests/unit`)
- `npm run test:e2e` — Playwright smoke tests (`tests/e2e`)
- `npm run audit:content` — compares heading/template/checklist/glossary counts between the source playbook and the generated pages

## Layout

- `indicative-playbook/` — the original Italian playbook, kept unchanged for reference. Never edit it; nothing reads it at build time.
- `content-source/` — the sources the pages are generated from: `playbook.en.md` and `playbook.it.md` (the Italian working copy, where Italian fixes go). Re-run `scripts/split-playbook.mjs` after editing.
- `src/content/docs/` — pages (MDX). Every page has `title`, `description` and `lastVerified` frontmatter.
- `src/data/` — templates, glossary, checklist, quizzes (typed TS modules, one export per locale).
- `src/components/` — Astro components used inside MDX (`Role`, `GateCard`, `UnderTheHood`, `WhyThisStep`, `Term`, `LastVerified`).
- `src/islands/` — React tools (Wizard, Tracker, TemplateBuilder, BuildLoop, ContextMeter, Quiz, Coach).
- `scripts/` — one-off migration and audit scripts.

## Rules

- Any change to a page in one locale must be mirrored in the other, or flagged in the PR as "translation needed".
- Bump `lastVerified` only when you re-checked the facts against the primary source (code.claude.com docs, the `mattpocock/skills` repo, vendor pricing pages).
- The AI coach must never send the API key anywhere except `api.anthropic.com`, and must never log it.
- No analytics, no third-party trackers.
- Community project: not affiliated with Anthropic. Do not use Anthropic logos.
- Write UI strings in both `en` and `it` (see `src/lib/i18n.ts`).
