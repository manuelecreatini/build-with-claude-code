#!/usr/bin/env node
/**
 * Lists pages whose `lastVerified` date is older than N days (default 90).
 *
 *   node scripts/check-freshness.mjs [--days 90] [--today 2027-03-01] [--out report.md]
 *
 * Prints a Markdown report. Exit code 0 either way; the last line of stdout is
 * `stale=<count>` so the weekly workflow can decide whether to open an issue.
 */
import fs from 'node:fs';
import { collectPages, DEFAULT_MAX_AGE_DAYS, findStale, formatReport } from './lib/freshness.mjs';

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const maxAgeDays = Number(opt('days') ?? DEFAULT_MAX_AGE_DAYS);
const today = opt('today') ? new Date(`${opt('today')}T00:00:00Z`) : new Date();
if (!Number.isFinite(maxAgeDays) || Number.isNaN(today.getTime())) {
  console.error('Usage: node scripts/check-freshness.mjs [--days 90] [--today YYYY-MM-DD] [--out file.md]');
  process.exit(1);
}

const pages = collectPages(process.cwd());
const stale = findStale(pages, { today, maxAgeDays });
const report = formatReport(stale, { maxAgeDays, total: pages.length });
if (opt('out')) fs.writeFileSync(opt('out'), report + '\n');
console.log(report);
console.log(`\nstale=${stale.length}`);
