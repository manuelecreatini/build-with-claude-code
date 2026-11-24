// Glossary helpers shared by split-playbook.mjs and the unit tests.
//
// Appendix A of the playbook is a list of `- **Term** — definition` bullets. From it we:
//   1. build a data module (src/data/glossary/<locale>.json) used by <Term> for tooltips;
//   2. add an anchor (<dfn id>) to every entry on the glossary page;
//   3. wrap the first mention of each term on a generated page in <Term id="...">.
import GithubSlugger from 'github-slugger';

/**
 * Terms that are too generic to auto-link (they collide with ordinary prose or with the
 * role badges). They stay in the glossary and can still be linked by hand with <Term>.
 */
const NO_AUTOLINK = new Set(['map', 'mappa', 'gate', 'label', 'preview', 'handoff', 'framework', 'database', 'deploy']);

/** @typedef {{ id: string, term: string, definition: string, match: string[] }} GlossaryEntry */

/**
 * Parse the glossary bullets.
 * @param {string[]} lines source lines of Appendix A
 * @returns {GlossaryEntry[]}
 */
export function parseGlossary(lines) {
  const slugger = new GithubSlugger();
  const entries = [];
  for (const line of lines) {
    const m = /^- \*\*(.+?)\*\* — (.+)$/.exec(line);
    if (!m) continue;
    const term = m[1].trim();
    entries.push({
      id: slugger.slug(term).replace(/-{2,}/g, '-'),
      term,
      definition: plain(m[2]),
      match: NO_AUTOLINK.has(term.toLowerCase()) ? [] : aliases(term),
    });
  }
  return entries;
}

/**
 * Surface forms to look for in prose: "CLI / terminal" -> ["CLI", "terminal"],
 * "Pull request (PR)" -> ["Pull request", "PR"]. "CI/CD" (no spaces) stays whole.
 * @param {string} term
 */
export function aliases(term) {
  const out = [];
  for (const part of term.split(' / ')) {
    const paren = /^(.+?)\s*\((.+)\)$/.exec(part);
    if (paren) out.push(paren[1].trim(), paren[2].trim());
    else out.push(part.trim());
  }
  return out.filter((a) => a.length > 1);
}

/** Strip inline Markdown for use in attributes and tooltips. */
export function plain(s) {
  return s
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*|__/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[\^[^\]]+\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Regex source for one alias. All-caps acronyms (PR, PATH, RICE) match case-sensitively,
 * everything else case-insensitively; in English a plural "s"/"es" is accepted.
 */
function aliasPattern(alias, locale) {
  const acronym = !/[a-z]/.test(alias);
  const plural = locale === 'en' && !/[s.]$/i.test(alias) ? (acronym ? 's?' : '(?:es|s)?') : '';
  let body = escapeRe(alias);
  if (!acronym) {
    // Case-insensitive without the global `i` flag (acronyms in the same regex stay strict).
    body = body.replace(/\p{L}/gu, (c) => (c.toLowerCase() === c.toUpperCase() ? c : `[${c.toLowerCase()}${c.toUpperCase()}]`));
  }
  return `${body}${plural}`;
}

/**
 * Pieces of a line that must never be touched: inline JSX/HTML tags, links and images,
 * footnote references, HTML entities, escaped characters and bare URLs.
 */
const PROTECTED = /<[^>]+>|!?\[[^\]]*\]\([^)]*\)|\[\^[^\]]+\]|&[a-z#0-9]+;|\\.|https?:\/\/\S+/g;

/**
 * Wrap the first mention of each glossary term in <Term id="...">…</Term>.
 * Skips fenced code, inline code, headings, JSX block lines, directives and protected spans.
 * @param {string[]} lines page body (already MDX-escaped)
 * @param {GlossaryEntry[]} entries
 * @param {'en'|'it'} locale
 * @returns {{ lines: string[], used: string[] }}
 */
export function linkTerms(lines, entries, locale) {
  const forms = [];
  for (const e of entries) for (const a of e.match) forms.push({ id: e.id, re: aliasPattern(a, locale), len: a.length });
  if (!forms.length) return { lines, used: [] };
  forms.sort((a, b) => b.len - a.len);
  // Not inside a word, path or file name (`docs/adr`, `Node.js`); a sentence-ending dot is fine.
  const big = new RegExp(
    `(?<![\\p{L}\\p{N}_/.-])(?:${forms.map((f, i) => `(?<g${i}>${f.re})`).join('|')})(?![\\p{L}\\p{N}_/-]|\\.[\\p{L}\\p{N}])`,
    'gu',
  );
  const used = new Set();

  const linkSegment = (seg) => {
    let out = '';
    let last = 0;
    for (const p of seg.matchAll(PROTECTED)) {
      out += linkPlain(seg.slice(last, p.index)) + p[0];
      last = p.index + p[0].length;
    }
    return out + linkPlain(seg.slice(last));
  };
  const linkPlain = (text) =>
    text.replace(big, (m, ...args) => {
      const groups = args.at(-1);
      const i = Object.keys(groups).findIndex((k) => groups[k] !== undefined);
      const id = forms[i].id;
      if (used.has(id)) return m;
      used.add(id);
      return `<Term id="${id}">${m}</Term>`;
    });

  let fence = false;
  const out = lines.map((line) => {
    if (/^\s*```/.test(line)) {
      fence = !fence;
      return line;
    }
    if (fence || /^\s*(#|<|:::|import |\[\^)/.test(line) || !line.trim()) return line;
    return mapOutsideInlineCode(line, linkSegment);
  });
  return { lines: out, used: [...used] };
}

/** Apply fn to the parts of a line outside inline code spans. */
export function mapOutsideInlineCode(line, fn) {
  let out = '';
  let i = 0;
  while (i < line.length) {
    const tick = line.indexOf('`', i);
    if (tick === -1) {
      out += fn(line.slice(i));
      break;
    }
    out += fn(line.slice(i, tick));
    let run = 1;
    while (line[tick + run] === '`') run++;
    const fence = '`'.repeat(run);
    const close = line.indexOf(fence, tick + run);
    if (close === -1) {
      out += line.slice(tick);
      break;
    }
    out += line.slice(tick, close + run);
    i = close + run;
  }
  return out;
}

/**
 * On the glossary page, give every entry an anchor: `- **<dfn id="adr">ADR</dfn>** — …`.
 * @param {string[]} lines
 * @param {GlossaryEntry[]} entries
 */
export function anchorGlossary(lines, entries) {
  const byTerm = new Map(entries.map((e) => [e.term, e.id]));
  return lines.map((line) =>
    line.replace(/^- \*\*(.+?)\*\* — /, (all, term) => {
      const id = byTerm.get(term.trim());
      return id ? `- **<dfn id="${id}">${term}</dfn>** — ` : all;
    }),
  );
}
