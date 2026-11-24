/**
 * Extracts the data the interactive tools need (src/islands/*) from the generated page bodies,
 * so the Tracker and the Context meter stay in sync with the playbook source:
 *  - the master checklist (reference/checklist), one section per `####` heading;
 *  - the Definition of Done of every phase (the `:::tip[Definition of Done · …]` asides);
 *  - the T12 context-management lists (the three asides on templates/t12).
 *
 * Item ids are positional (section index + item index), so both locales share the same ids
 * and a visitor keeps their progress when they switch language. tests/unit/tools-data.test.ts
 * checks that the two locales have the same shape.
 */

/** Turns generated MDX inline markup back into plain inline Markdown (code and bold only). */
export function cleanInline(s) {
  return s
    .replace(/<Term id="[^"]*">(.*?)<\/Term>/g, '$1')
    .replace(/<Role as="gate" n=\{(\d)\} \/>/g, '**G$1**')
    .replace(/<Role as="[^"]*"(?: n=\{\d\})? \/>/g, '')
    .replace(/\[\^[^\]]+\]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<br \/>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/\\([{}])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const ITEM = /^- \[ \] (.+)$/;

/** Master checklist: `#### F0 · Title` headings followed by `- [ ]` items. */
export function parseChecklist(lines) {
  const sections = [];
  let fence = false;
  for (const line of lines) {
    if (/^```/.test(line)) fence = !fence;
    if (fence) continue;
    const h = /^#{2,6} (F\d) · (.+)$/.exec(line);
    if (h) {
      const id = `s${sections.length}`;
      sections.push({ id, phase: h[1], title: cleanInline(h[2]), items: [] });
      continue;
    }
    const m = ITEM.exec(line);
    if (m && sections.length) {
      const s = sections[sections.length - 1];
      s.items.push({ id: `${s.id}-${s.items.length}`, text: cleanInline(m[1]) });
    }
  }
  return sections;
}

/** Every `:::kind[Title]` aside in the page, with its checkbox items (or its paragraph text). */
export function parseAsides(lines) {
  const asides = [];
  let cur = null;
  for (const line of lines) {
    const open = /^:::(\w+)\[(.+)\]$/.exec(line);
    if (open) {
      cur = { kind: open[1], title: cleanInline(open[2]), items: [], text: [] };
      continue;
    }
    if (cur && line === ':::') {
      asides.push(cur);
      cur = null;
      continue;
    }
    if (!cur) continue;
    const m = ITEM.exec(line);
    if (m) cur.items.push(cleanInline(m[1]));
    else if (line.trim()) cur.text.push(cleanInline(line));
  }
  return asides;
}

/**
 * The Definition of Done aside of a phase page, or null. Phase 0 writes it as a sentence,
 * not a list: it becomes a single item.
 */
export function parseDod(lines, phase) {
  const dod = parseAsides(lines).find((a) => a.title.startsWith('Definition of Done'));
  if (!dod) return null;
  const items = dod.items.length ? dod.items : [dod.text.join(' ')];
  return { title: dod.title, items: items.map((text, i) => ({ id: `dod-${phase}-${i}`, text })) };
}

/** T12: session start, during (the zone heuristic), before /clear. */
export function parseContextLists(lines) {
  const asides = parseAsides(lines).filter((a) => a.items.length);
  if (asides.length !== 3) throw new Error(`T12: expected 3 checklists, found ${asides.length}`);
  const [start, during, end] = asides.map((a, k) => ({
    title: a.title,
    items: a.items.map((text, i) => ({ id: `ctx-${k}-${i}`, text })),
  }));
  return { start, during, end };
}
