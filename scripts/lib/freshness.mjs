/**
 * Finds pages whose facts have not been re-checked for a while, using the `lastVerified`
 * frontmatter date. Used by scripts/check-freshness.mjs and the weekly freshness workflow.
 */
import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_MAX_AGE_DAYS = 90;
const DAY = 24 * 60 * 60 * 1000;

/**
 * @typedef {{ file: string, lastVerified: string | null, generated: boolean, source: string | null }} PageInfo
 * @typedef {PageInfo & { ageDays: number | null }} StalePage
 */

/**
 * Reads the frontmatter fields the check needs from one MDX/MD file's text.
 * @param {string} text
 * @returns {{ lastVerified: string | null, generated: boolean, source: string | null }}
 */
export function readFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  const fm = m ? m[1] : '';
  const date = /^lastVerified:\s*['"]?(\d{4}-\d{2}-\d{2})/m.exec(fm);
  const gen = /^# Generated from (\S+)/m.exec(fm);
  return { lastVerified: date ? date[1] : null, generated: Boolean(gen), source: gen ? gen[1] : null };
}

/**
 * Pages that are missing a date, or whose date is older than `maxAgeDays` on `today`.
 * @param {PageInfo[]} pages
 * @param {{ today: Date, maxAgeDays?: number }} opts
 * @returns {StalePage[]} oldest first; pages without a date come first
 */
export function findStale(pages, { today, maxAgeDays = DEFAULT_MAX_AGE_DAYS }) {
  const out = [];
  for (const p of pages) {
    if (!p.lastVerified) {
      out.push({ ...p, ageDays: null });
      continue;
    }
    const age = Math.floor((today.getTime() - Date.parse(`${p.lastVerified}T00:00:00Z`)) / DAY);
    if (age > maxAgeDays) out.push({ ...p, ageDays: age });
  }
  return out.sort((a, b) => (b.ageDays ?? Infinity) - (a.ageDays ?? Infinity) || a.file.localeCompare(b.file));
}

/**
 * Markdown report for the freshness issue. Generated pages are grouped by source, because
 * they are re-verified together (by changing LAST_VERIFIED in scripts/split-playbook.mjs).
 * @param {StalePage[]} stale
 * @param {{ maxAgeDays?: number, total: number }} opts
 */
export function formatReport(stale, { maxAgeDays = DEFAULT_MAX_AGE_DAYS, total }) {
  if (!stale.length) return `All ${total} pages were verified in the last ${maxAgeDays} days.`;
  const gen = stale.filter((p) => p.generated);
  const hand = stale.filter((p) => !p.generated);
  const age = (p) => (p.ageDays === null ? 'no `lastVerified` date' : `${p.lastVerified} (${p.ageDays} days ago)`);
  const lines = [
    `${stale.length} of ${total} pages have not been verified in the last ${maxAgeDays} days.`,
    '',
    'Re-check the facts on these pages against the primary sources (https://code.claude.com/docs, the',
    '[`mattpocock/skills`](https://github.com/mattpocock/skills) repo, vendor pricing pages), fix what',
    'changed, then update the date. Only update the date for facts you actually re-checked.',
  ];
  if (gen.length) {
    const bySource = new Map();
    for (const p of gen) bySource.set(p.source, [...(bySource.get(p.source) ?? []), p]);
    lines.push('', '### Generated pages', '');
    lines.push('These share one date: `LAST_VERIFIED` in `scripts/split-playbook.mjs`. After re-checking, change it and re-run the split for both locales.', '');
    for (const [source, list] of bySource) {
      lines.push(`- \`${source}\`: ${list.length} pages, last verified ${age(list[0])}`);
    }
  }
  if (hand.length) {
    lines.push('', '### Hand-written pages', '', 'Update `lastVerified` in each file after re-checking it.', '');
    for (const p of hand) lines.push(`- [ ] \`${p.file}\`: ${age(p)}`);
  }
  return lines.join('\n');
}

/**
 * Collects page info for every .md/.mdx file under `dir`.
 * @param {string} root repository root
 * @param {string} dir directory relative to root
 * @returns {PageInfo[]}
 */
export function collectPages(root, dir = 'src/content/docs') {
  /** @type {PageInfo[]} */
  const pages = [];
  const walk = (abs) => {
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      const full = path.join(abs, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.mdx?$/.test(entry.name)) {
        const file = path.relative(root, full).split(path.sep).join('/');
        pages.push({ file, ...readFrontmatter(fs.readFileSync(full, 'utf8')) });
      }
    }
  };
  walk(path.join(root, dir));
  return pages.sort((a, b) => a.file.localeCompare(b.file));
}
