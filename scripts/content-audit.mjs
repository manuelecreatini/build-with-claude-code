#!/usr/bin/env node
/**
 * Checks that the generated pages still hold everything in the playbook sources.
 *
 *   npm run audit:content
 *
 * For each locale it splits the source with the same page map as split-playbook.mjs and
 * compares, page by page, the number of headings, checkboxes, callouts, code blocks and
 * glossary entries in the source with the number in the generated .mdx file. It also checks
 * the data files the tools read (template manifest, glossary, checklist), that both locales
 * have the same structure, and that no stale generated page is left on disk.
 *
 * Exits with code 1 if anything does not match. It reads files only; it never writes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { findRule } from './lib/page-map.mjs';

const ROOT = process.cwd();
const LOCALES = {
  en: { source: 'content-source/playbook.en.md', docs: 'src/content/docs' },
  it: { source: 'indicative-playbook/AI-Assisted-Build-Playbook_IT.md', docs: 'src/content/docs/it' },
};
const METRICS = ['headings', 'checkboxes', 'callouts', 'code', 'glossary'];

// Differences the split script makes on purpose. Keep this list short and explained.
const EXPECTED = {
  // Section 0.3 becomes Windows/macOS/Linux tabs: the "other systems" note is replaced by the
  // macOS and Linux tabs, each with an install code block and a "check the installation" one.
  'phases/f0-setup': { callouts: -1, code: +4 },
};

const problems = [];
const results = {};

for (const [locale, cfg] of Object.entries(LOCALES)) {
  const { pages, dropped } = splitSource(read(cfg.source));
  const rows = [];
  for (const page of pages) {
    const file = path.join(cfg.docs, page.slug === 'templates' ? 'templates/index.mdx' : `${page.slug}.mdx`);
    if (!fs.existsSync(path.join(ROOT, file))) {
      problems.push(`${locale}: ${file} is missing (run the split script).`);
      continue;
    }
    const src = countSource(page.body, page.slug);
    const out = countOutput(stripFrontmatter(read(file)));
    const expected = EXPECTED[page.slug] ?? {};
    for (const m of METRICS) {
      const want = src[m] + (expected[m] ?? 0);
      if (out[m] !== want) {
        problems.push(`${locale}: ${page.slug}: ${m} ${out[m]} in the page, ${want} expected from the source (${src[m]}${expected[m] ? ` ${sign(expected[m])} by design` : ''}).`);
      }
    }
    rows.push({ slug: page.slug, src, out });
  }
  results[locale] = { rows, dropped };

  checkData(locale, cfg, pages);
  checkStale(locale, cfg, pages);
}

checkParity(results.en.rows, results.it.rows);
printReport();

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log('\nContent audit passed: every page matches its source, and EN and IT have the same structure.');

// ---------------------------------------------------------------------------

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
}

/** Same walk as split-playbook.mjs: headings outside fences start pages; dropped sections are kept apart. */
function splitSource(text) {
  const pages = [];
  const dropped = [];
  let current = null;
  let currentTop = null;
  let fence = false;
  for (const line of text.split('\n')) {
    if (/^\s*```/.test(line)) fence = !fence;
    const h = !fence && /^(#{1,6}) (.+)$/.exec(line);
    if (h) {
      const rule = findRule(h[1].length, h[2].trim(), currentTop);
      if (rule) {
        if (h[1].length <= 2) currentTop = rule.slug ?? null;
        current = { slug: rule.slug ?? null, title: h[2].trim(), body: [] };
        (rule.drop ? dropped : pages).push(current);
        continue;
      }
    }
    if (current) current.body.push(line);
  }
  return { pages, dropped };
}

/** Walk lines outside code fences; `fn(line)` for text lines, `onFence()` for each opening fence. */
function walk(lines, fn, onFence = () => {}) {
  let fence = false;
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      if (!fence) onFence(line);
      fence = !fence;
      continue;
    }
    if (!fence) fn(line);
  }
}

function countSource(lines, slug) {
  const c = { headings: 0, checkboxes: 0, callouts: 0, code: 0, glossary: 0 };
  walk(
    lines,
    (l) => {
      if (/^#{1,6} /.test(l)) c.headings++;
      if (/^(>\s?)*\s*- \[[ xX]\] /.test(l)) c.checkboxes++; // also inside > callouts
      if (/^> \[!(NOTE|WARNING|TIP|CAUTION)\]\s*$/.test(l)) c.callouts++;
      if (slug === 'reference/glossary' && /^- \*\*(.+?)\*\* — /.test(l)) c.glossary++;
    },
    () => c.code++,
  );
  return c;
}

function countOutput(lines) {
  const c = { headings: 0, checkboxes: 0, callouts: 0, code: 0, glossary: 0 };
  walk(
    lines,
    (l) => {
      if (/^#{1,6} /.test(l)) c.headings++;
      if (/^\s*- \[[ xX]\] /.test(l)) c.checkboxes++;
      if (/^:::(note|caution|tip|danger)\b/.test(l)) c.callouts++;
      if (/<TemplateBlock /.test(l)) c.code++;
      if (/^- \*\*<dfn id="/.test(l)) c.glossary++;
    },
    () => c.code++,
  );
  return c;
}

function stripFrontmatter(text) {
  const lines = text.split('\n');
  if (lines[0] !== '---') return lines;
  const end = lines.indexOf('---', 1);
  return lines.slice(end + 1);
}

/** The data files the interactive tools read must match the source too. */
function checkData(locale, cfg, pages) {
  // Templates: one manifest entry and one .txt file per non-Mermaid code block in a template page.
  const tplDir = path.join('src/data/templates', locale);
  const manifest = JSON.parse(read(path.join(tplDir, 'manifest.json')));
  let blocks = 0;
  for (const p of pages) {
    if (!p.slug.startsWith('templates/')) continue;
    walk(p.body, () => {}, (l) => { if (!/^\s*```mermaid/.test(l)) blocks++; });
  }
  if (manifest.length !== blocks) problems.push(`${locale}: template manifest has ${manifest.length} blocks, the source has ${blocks}.`);
  const files = fs.readdirSync(path.join(ROOT, tplDir)).filter((f) => f.endsWith('.txt'));
  const listed = new Set(manifest.map((b) => b.file));
  for (const f of files) if (!listed.has(f)) problems.push(`${locale}: ${tplDir}/${f} is not in the manifest (stale file).`);
  for (const f of listed) if (!files.includes(f)) problems.push(`${locale}: ${tplDir}/${f} is in the manifest but missing.`);

  // Glossary data used by the <Term> tooltips.
  const glossaryPage = pages.find((p) => p.slug === 'reference/glossary');
  const terms = JSON.parse(read(`src/data/glossary/${locale}.json`));
  const srcTerms = glossaryPage ? countSource(glossaryPage.body, glossaryPage.slug).glossary : 0;
  if (terms.length !== srcTerms) problems.push(`${locale}: glossary data has ${terms.length} terms, the source has ${srcTerms}.`);

  // Checklist data used by the tracker.
  const checklistPage = pages.find((p) => p.slug === 'reference/checklist');
  const tools = JSON.parse(read(`src/data/tools/${locale}.json`));
  const items = tools.checklist.reduce((n, s) => n + s.items.length, 0);
  const srcItems = checklistPage ? countSource(checklistPage.body, checklistPage.slug).checkboxes : 0;
  if (items !== srcItems) problems.push(`${locale}: tracker data has ${items} checklist items, the source has ${srcItems}.`);

  results[locale].data = { templates: manifest.length, glossary: terms.length, checklist: items };
}

/** A generated page whose section no longer exists in the source would linger on the site. */
function checkStale(locale, cfg, pages) {
  const expected = new Set(pages.map((p) => (p.slug === 'templates' ? 'templates/index' : p.slug)));
  const base = path.join(ROOT, cfg.docs);
  const stack = [base];
  while (stack.length) {
    const dir = stack.pop();
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (!(locale === 'en' && dir === base && e.name === 'it')) stack.push(full);
        continue;
      }
      if (!e.name.endsWith('.mdx')) continue;
      const head = fs.readFileSync(full, 'utf8').slice(0, 300);
      if (!head.includes('# Generated from ')) continue;
      const slug = path.relative(base, full).split(path.sep).join('/').replace(/\.mdx$/, '');
      if (!expected.has(slug)) problems.push(`${locale}: ${cfg.docs}/${slug}.mdx is generated but no longer in the source (stale page).`);
    }
  }
}

/** EN is a translation of IT with the same structure: every count must match. */
function checkParity(en, it) {
  const bySlug = new Map(it.map((r) => [r.slug, r]));
  for (const r of en) {
    const other = bySlug.get(r.slug);
    if (!other) {
      problems.push(`parity: ${r.slug} exists in EN but not in IT.`);
      continue;
    }
    bySlug.delete(r.slug);
    for (const m of METRICS) {
      if (r.src[m] !== other.src[m]) problems.push(`parity: ${r.slug}: ${m} EN ${r.src[m]}, IT ${other.src[m]}.`);
    }
  }
  for (const slug of bySlug.keys()) problems.push(`parity: ${slug} exists in IT but not in EN.`);
  for (const k of ['templates', 'glossary', 'checklist']) {
    if (results.en.data?.[k] !== results.it.data?.[k]) problems.push(`parity: ${k} data EN ${results.en.data?.[k]}, IT ${results.it.data?.[k]}.`);
  }
}

function printReport() {
  for (const [locale, { rows, dropped, data }] of Object.entries(results)) {
    console.log(`\n${locale.toUpperCase()}  ${LOCALES[locale].source}`);
    console.log(`  ${'page'.padEnd(30)} ${METRICS.map((m) => m.padStart(11)).join('')}`);
    const total = Object.fromEntries(METRICS.map((m) => [m, [0, 0]]));
    for (const { slug, src, out } of rows) {
      const cells = METRICS.map((m) => {
        total[m][0] += src[m];
        total[m][1] += out[m];
        return cell(src[m], out[m]).padStart(11);
      });
      console.log(`  ${slug.padEnd(30)} ${cells.join('')}`);
    }
    console.log(`  ${'TOTAL (source/page)'.padEnd(30)} ${METRICS.map((m) => cell(...total[m]).padStart(11)).join('')}`);
    const swallowed = dropped.map((d) => countSource(d.body, null)).reduce((a, c) => a + c.headings + c.checkboxes + c.callouts + c.code, 0);
    console.log(`  ${dropped.length} sections dropped by design (title, contents, part dividers); ${swallowed} headings/checkboxes/callouts/code blocks inside them.`);
    if (data) console.log(`  Data: ${data.templates} template blocks, ${data.glossary} glossary terms, ${data.checklist} checklist items.`);
  }
}

function cell(a, b) {
  return a === b ? String(a) : `${a}/${b}`;
}

function sign(n) {
  return n > 0 ? `+ ${n}` : `- ${-n}`;
}
