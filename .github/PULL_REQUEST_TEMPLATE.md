## What and why

<!-- What does this change, and why? Link the issue it closes, e.g. "Closes #12". -->

## Checklist

- [ ] **Both languages:** the change is mirrored in English and Italian, or this PR says "translation needed".
- [ ] **Generated pages:** I edited the source (`content-source/playbook.en.md`, `scripts/split-playbook.mjs`, `scripts/teaching-inserts.mjs`…) and re-ran the split script, not the generated `.mdx` files.
- [ ] **Facts:** claims about Claude Code, skills or prices link a primary source below, and `lastVerified` was bumped only on pages I re-checked.
- [ ] **Interface text** is in `src/lib/i18n.ts` in both `en` and `it`.
- [ ] **No tracking:** no analytics, trackers or externally loaded scripts or fonts.
- [ ] **AI coach** (if touched): the API key goes only to `api.anthropic.com`, is never logged and is never stored with the tools data.
- [ ] `node scripts/check-mdx.mjs`, `npm run check`, `npm run build` and `npm test` pass locally (`npm run test:e2e` too if I changed a tool).

## Sources

<!-- Links to code.claude.com/docs or other primary sources, if this changes facts. -->
