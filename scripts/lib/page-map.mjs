// Page map shared by split-playbook.mjs and content-audit.mjs.
//
// Each rule says which source heading starts a page. `re` matches the heading text (IT or EN)
// and `level` is its depth. `drop` swallows the section (its anchor points to `alias`), and
// `onlyIn` limits a rule to sub-headings of one level-2 page.

/** @typedef {{re: RegExp, level: number, slug?: string, drop?: boolean, order?: number, phase?: string, alias?: string, onlyIn?: string}} Rule */
/** @type {Rule[]} */
export const RULES = [
  { re: /^The AI-Assisted Build Playbook$/, level: 1, drop: true },
  { re: /^(Indice|Contents)$/, level: 2, drop: true },
  { re: /^(Prima di iniziare|Before you start)/, level: 2, slug: 'start/how-to-use', order: 1 },
  { re: /^(Parte|Part) I ·/, level: 1, drop: true, alias: 'method/overview' },
  { re: /^(Capitolo|Chapter) 1 ·/, level: 2, slug: 'method/overview', order: 1 },
  { re: /^(Capitolo|Chapter) 2 ·/, level: 2, slug: 'method/workflow', order: 2 },
  { re: /^(Capitolo|Chapter) 3 ·/, level: 2, slug: 'method/roles', order: 3 },
  { re: /^(Parte|Part) II ·/, level: 1, drop: true, alias: 'phases/f0-setup' },
  { re: /^(Fase|Phase) 0 ·/, level: 2, slug: 'phases/f0-setup', phase: 'F0' },
  { re: /^(Fase|Phase) 1 ·/, level: 2, slug: 'phases/f1-preliminary-spec', phase: 'F1' },
  { re: /^(Fase|Phase) 2 ·/, level: 2, slug: 'phases/f2-discovery', phase: 'F2' },
  { re: /^(Fase|Phase) 3 ·/, level: 2, slug: 'phases/f3-spec-architecture', phase: 'F3' },
  { re: /^(Fase|Phase) 4 ·/, level: 2, slug: 'phases/f4-build-phases', phase: 'F4' },
  { re: /^(Fase|Phase) 5 ·/, level: 2, slug: 'phases/f5-build-loop', phase: 'F5' },
  // Build-loop sub-pages (level 3 inside phase 5).
  { re: /^(Prima di ogni sessione|Before every session)/, level: 3, slug: 'phases/f5/preflight', phase: 'F5' },
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
    re: new RegExp(`^(Passo|Step) ${n} —`),
    level: 3,
    slug: `phases/f5/step-${n}`,
    phase: 'F5',
    onlyIn: 'phases/f5-build-loop',
  })),
  { re: /^(Dopo l'ultima build phase|After the last build phase)/, level: 3, slug: 'phases/f5/after-the-loop', phase: 'F5' },
  { re: /^(Fase|Phase) 6 ·/, level: 2, slug: 'phases/f6-integration', phase: 'F6' },
  { re: /^(Fase|Phase) 7 ·/, level: 2, slug: 'phases/f7-deploy', phase: 'F7' },
  { re: /^(Fase|Phase) 8 ·/, level: 2, slug: 'phases/f8-post-launch', phase: 'F8' },
  { re: /^(Parte|Part) III ·/, level: 1, drop: true, alias: 'templates' },
  { re: /^Template ·/, level: 2, slug: 'templates', order: 0 },
  ...Array.from({ length: 16 }, (_, n) => ({
    re: new RegExp(`^T${n} ·`),
    level: 3,
    slug: `templates/t${n}`,
    order: n + 1,
  })),
  { re: /^B1–B4/, level: 3, slug: 'templates/bonus', order: 20 },
  { re: /^(Parte|Part) IV ·/, level: 1, drop: true, alias: 'toolkit/tools' },
  { re: /^Toolkit · (Strumenti|Tools)/, level: 2, slug: 'toolkit/tools', order: 1 },
  { re: /^Toolkit · .*Matt Pocock/, level: 2, slug: 'toolkit/pocock-skills', order: 2 },
  { re: /^Toolkit · (Comandi|Claude Code commands)/, level: 2, slug: 'toolkit/commands', order: 3 },
  { re: /^(Parte|Part) V ·/, level: 1, drop: true, alias: 'reference/checklist' },
  { re: /^Checklist ·/, level: 2, slug: 'reference/checklist', order: 1 },
  { re: /^(Riferimento|Reference) ·/, level: 2, slug: 'reference/quick-reference', order: 2 },
  { re: /^(Appendici|Appendices)$/, level: 1, drop: true, alias: 'reference/glossary' },
  { re: /^(Appendice|Appendix) A ·/, level: 2, slug: 'reference/glossary', order: 3 },
  { re: /^(Appendice|Appendix) B ·/, level: 2, slug: 'reference/sources', order: 4 },
];

/**
 * The rule that starts a page at this heading, if any.
 * @param {number} level
 * @param {string} text
 * @param {string|null} currentTop slug of the current level-2 page
 */
export function findRule(level, text, currentTop) {
  return RULES.find((r) => r.level === level && r.re.test(text) && (!r.onlyIn || r.onlyIn === currentTop));
}
