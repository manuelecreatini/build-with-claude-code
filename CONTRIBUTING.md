# Contributing

Thank you for helping. This project is a bilingual (English and Italian) playbook for building
products with Claude Code. Fixes to a typo, a step that no longer matches Claude Code, a better
explanation, a translation: all of it helps.

By taking part you agree to follow the [code of conduct](CODE_OF_CONDUCT.md). Issues and pull
requests are welcome in English or Italian.

## Ways to help

- **Report a problem.** [Open an issue](https://github.com/manuelecreatini/build-with-claude-code/issues/new/choose)
  for a wrong or outdated step, a bug in a tool, or a translation problem. Include the page link
  and, for facts about Claude Code, a link to the official docs that show the right version.
- **Fix it yourself.** Small pull requests are easiest to review. For bigger changes (a new tool,
  a new section, a change to the method), open an issue first so we can agree on the shape.
- **Security problems** (for example anything that could expose a visitor's API key) should
  not go in a public issue. Follow [SECURITY.md](SECURITY.md).

## Set up

You need Node.js 24.

```bash
npm install
npm run dev            # http://localhost:4321 (English) and /it/ (Italian)
```

## Where each change goes

Most pages are **generated**. A page that starts with `# Generated from …` in its frontmatter is
rewritten by the next run of the split script, so an edit made directly to it will be lost.

| You want to change | Edit | Then |
| --- | --- | --- |
| English playbook text (phases, method, templates, reference, toolkit) | `content-source/playbook.en.md` | `node scripts/split-playbook.mjs content-source/playbook.en.md en` |
| Italian playbook text | `content-source/playbook.it.md` (not `indicative-playbook/`, see [below](#the-italian-original)) | `node scripts/split-playbook.mjs content-source/playbook.it.md it` |
| How pages are generated (asides, role badges, anchors) | `scripts/split-playbook.mjs` | Re-run the script for **both** locales |
| Which source section becomes which page | `scripts/lib/page-map.mjs` | Re-run the script for both locales |
| Glossary entries | Appendix A in both playbook sources | Re-run the script. Terms that should not be linked automatically go in `NO_AUTOLINK` in `scripts/lib/glossary.mjs` |
| "Why this step" and "Under the hood" notes | `scripts/teaching-inserts.mjs` (every entry has `en` and `it`) | Re-run the script for both locales |
| End-of-phase quizzes | `src/data/quizzes.ts` (put the correct answer first; the page shuffles the options) | |
| Homepages, concept pages, tools pages | The `.mdx` file directly, in `src/content/docs/` and `src/content/docs/it/` | |
| Interface text (buttons, labels, messages) | `src/lib/i18n.ts`, in both `en` and `it` | |
| Start wizard rules | `src/data/wizard.ts` | |
| Interactive tools | `src/islands/` (React) and `src/components/tools/` (Astro wrappers) | Add or update tests |

The split script is idempotent: running it on an unchanged source produces no diff. Commit the
source change and the regenerated pages together. CI re-runs the script and fails if the
committed pages differ from its output.

### The Italian original

`indicative-playbook/AI-Assisted-Build-Playbook_IT.md` is the original playbook the site was built
from. It is kept unchanged as a record of the original text, and nothing reads it at build time.

The Italian pages are generated from `content-source/playbook.it.md`, a working copy that started
identical to the original. Fix Italian text there, exactly as you would fix English text in
`playbook.en.md`. If the fix changes meaning (not just wording), make the same fix in the English
source, or write "translation needed" in the pull request. Rendering problems are fixed in the
scripts, not in either source.

## Rules

1. **Both languages.** A change to a page in one locale must be mirrored in the other. If you
   can't write the second language, say "translation needed" in the pull request and someone
   will help.
2. **Facts need a primary source.** For anything about Claude Code, its commands or its
   settings, link the official documentation (https://code.claude.com/docs). For skills, link
   the [`mattpocock/skills`](https://github.com/mattpocock/skills) repo. For prices, link the
   vendor's pricing page. Update a page's `lastVerified` date only when you have re-checked
   its facts against those sources.
3. **No tracking.** No analytics, no third-party trackers, no scripts or fonts loaded from other
   sites.
4. **Visitors' keys stay private.** The AI coach may send the visitor's API key only to
   `api.anthropic.com`, and must never log it, store it with the tools data or include it in
   exports. Changes to `src/lib/coach.ts`, `src/lib/coachKey.ts` or `src/islands/Coach.tsx`
   get extra review.
5. **Not affiliated with Anthropic.** Don't use Anthropic's logos or suggest an endorsement.
6. **File names are in English** in both locales (for example `it/phases/f0-setup.mdx`).
7. **Never commit secrets** (API keys, `.env` files).

## Before you open a pull request

Run what CI runs:

```bash
npm run audit:content        # generated pages hold everything in the sources; EN matches IT
node scripts/check-mdx.mjs   # every MDX page compiles
npm run check                # types and frontmatter schema
npm run build                # production build; fails on broken internal links
npm test                     # unit tests
npm run test:e2e             # end-to-end tests (run after the build)
```

The first time, install the Playwright browser with `npx playwright install chromium`.

Then fill in the pull request checklist. Keep each pull request about one thing, and write the
commit message as a short sentence saying what changed.

## Using Claude Code on this repo

You're welcome to. [`CLAUDE.md`](CLAUDE.md) gives Claude Code the project's stack, commands and
rules, so it follows the same conventions as this guide. Review its changes as you would your
own: you are responsible for what you submit.

## License

By contributing, you agree that your code is released under the [MIT License](LICENSE) and your
written content under [CC BY 4.0](LICENSE-CONTENT).
