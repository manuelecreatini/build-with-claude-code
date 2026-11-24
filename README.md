# Build with Claude Code

An open-source, interactive playbook that guides anyone through building a digital product with
[Claude Code](https://code.claude.com/docs), and explains what is happening at each step.

**Read it:** https://build-with-claude-code-playbook.vercel.app · in English, and
[in Italian](https://build-with-claude-code-playbook.vercel.app/it/).

> Community project. Not affiliated with, endorsed by or sponsored by Anthropic.

## What's inside

- **The method.** Nine phases, from setting up your computer to running the product after
  launch. Each step is marked with who acts (Claude, you, or a quality gate you must pass).
- **A guide that adapts to you.** Choose terminal or desktop app, your level (guided, standard,
  expert), baseline or hardened security, and the tools you use (including whether your product
  calls an AI model). The pages show the steps that fit those choices; every option lists its
  pros and cons and which one is recommended.
- **Templates.** Ready-to-paste prompts and documents (T0–T15), plus a bonus set.
- **A teaching layer.** Glossary tooltips, "why this step" notes, "under the hood" panels,
  concept pages (context window, CLAUDE.md, permissions, Git, tests, deploy…) and a short quiz
  at the end of each phase.
- **Interactive tools.**
  - Start wizard: describe your idea and get a personal path through the playbook.
  - Checklist tracker.
  - Template builder: fill in the placeholders and copy the result.
  - Build-loop companion: walks you through the eight steps of each build phase.
  - Context meter.
  - Optional AI coach (see below).

Your progress is kept in your own browser (`localStorage`). The site has no backend, accounts,
analytics or trackers. You can export or import your progress as a JSON file from the tools
pages.

### The AI coach and your API key

The coach is optional and uses **your own Anthropic API key**, billed to your Anthropic account.
The key and your questions go from your browser straight to `api.anthropic.com`, and to nowhere
else. The key is kept for the current tab only, unless you choose to remember it on your device.
It is never logged and never included in exports. The site's Content-Security-Policy
(`vercel.json`) only lets pages connect to the site itself and `api.anthropic.com`, so the
browser enforces this too. The code is in [`src/islands/Coach.tsx`](src/islands/Coach.tsx),
[`src/lib/coach.ts`](src/lib/coach.ts) and [`src/lib/coachKey.ts`](src/lib/coachKey.ts).

## Run it locally

You need **Node.js 24** (LTS).

```bash
git clone https://github.com/manuelecreatini/build-with-claude-code.git
cd build-with-claude-code
npm install
npm run dev          # http://localhost:4321
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server with hot reload. |
| `npm run build` | Production build into `dist/`. Also fails on broken internal links. |
| `npm run preview` | Serves the production build. |
| `npm run check` | Type check and content-schema check (`astro check`). |
| `npm test` | Unit tests (Vitest). |
| `npm run test:e2e` | End-to-end tests (Playwright, against `npm run preview`; build first), including axe accessibility checks and the Content-Security-Policy. |
| `node scripts/check-mdx.mjs` | Compiles every MDX page and reports the ones that fail. |
| `npm run check:freshness` | Lists pages whose `lastVerified` date is more than 90 days old. A weekly GitHub Action runs it and keeps one "freshness" issue up to date. |
| `npm run audit:content` | Checks that the generated pages still hold every heading, checkbox, callout, code block and glossary term of the sources, and that English and Italian match. |

## How it is built

[Astro](https://astro.build) + [Starlight](https://starlight.astro.build) for the docs, search
and translations, with [React](https://react.dev) islands for the interactive tools and
Mermaid for diagrams. It is deployed as static files on Vercel.

Most pages are **generated** from two Markdown sources by `scripts/split-playbook.mjs`:

| Locale | Source | Output |
| --- | --- | --- |
| English | `content-source/playbook.en.md` | `src/content/docs/*` |
| Italian | `content-source/playbook.it.md` | `src/content/docs/it/*` |

The Italian text is the original. `indicative-playbook/` keeps it exactly as first written;
`content-source/playbook.it.md` is the working copy that receives fixes.

Generated pages start with a `# Generated from …` comment in their frontmatter: edit the
source, not the page. The homepages, the concept pages (`concepts/`) and the tools pages
(`tools/`) are written by hand. [CONTRIBUTING.md](CONTRIBUTING.md) explains where each kind of
change goes.

```
content-source/       playbook sources (English and Italian)
indicative-playbook/  Italian original, kept unchanged for reference
scripts/              split script, teaching inserts, MDX checker
src/content/docs/     pages (English at the root, Italian under it/)
src/components/       Astro components used in pages (Role, GateCard, Term, ...)
src/islands/          React tools (Wizard, Tracker, TemplateBuilder, BuildLoop, ContextMeter, Coach)
src/data/             glossary, templates, quizzes, tools data
src/lib/              shared logic (i18n strings, storage, coach)
tests/                unit/ (Vitest) and e2e/ (Playwright)
```

## Contributing

Corrections, translations and new ideas are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md)
and follow the [code of conduct](CODE_OF_CONDUCT.md). To report a security problem (for
example anything that could expose a visitor's API key), see [SECURITY.md](SECURITY.md).

## License

- Code: [MIT](LICENSE).
- Written content (`src/content/`, `src/data/`, `content-source/` and `indicative-playbook/`):
  [CC BY 4.0](LICENSE-CONTENT).

"Claude" and "Claude Code" are trademarks of Anthropic. This project uses them only to
describe what the playbook is about.

---

## In italiano

**Build with Claude Code** è un playbook interattivo e open source che accompagna chiunque nella
costruzione di un prodotto digitale con Claude Code, spiegando cosa succede a ogni passo. Lo
trovi su https://build-with-claude-code-playbook.vercel.app/it/. Il testo italiano è l'originale
da cui nasce il sito. È un progetto della community, non affiliato ad Anthropic. Per contribuire
leggi [CONTRIBUTING.md](CONTRIBUTING.md): issue e pull request in italiano sono benvenute.
