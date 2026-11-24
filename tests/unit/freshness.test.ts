import { describe, expect, it } from 'vitest';
import { collectPages, findStale, formatReport, readFrontmatter } from '../../scripts/lib/freshness.mjs';

const today = new Date('2027-03-01T00:00:00Z');

describe('readFrontmatter', () => {
  it('reads the date and whether the page is generated', () => {
    const text = '---\n# Generated from content-source/playbook.en.md by scripts/split-playbook.mjs.\ntitle: X\nlastVerified: 2026-11-12\n---\nbody';
    expect(readFrontmatter(text)).toEqual({ lastVerified: '2026-11-12', generated: true, source: 'content-source/playbook.en.md' });
  });
  it('handles hand-written pages and missing dates', () => {
    expect(readFrontmatter('---\ntitle: X\n---\n')).toEqual({ lastVerified: null, generated: false, source: null });
  });
});

describe('findStale', () => {
  const pages = [
    { file: 'a.mdx', lastVerified: '2027-02-01', generated: false, source: null },
    { file: 'b.mdx', lastVerified: '2026-11-12', generated: true, source: 's.md' },
    { file: 'c.mdx', lastVerified: null, generated: false, source: null },
    { file: 'd.mdx', lastVerified: '2026-12-01', generated: false, source: null },
  ];
  it('returns pages older than the limit and pages without a date, oldest first', () => {
    const stale = findStale(pages, { today, maxAgeDays: 90 });
    expect(stale.map((p: { file: string }) => p.file)).toEqual(['c.mdx', 'b.mdx']);
    expect(stale[1].ageDays).toBe(109);
  });
  it('respects a custom limit', () => {
    expect(findStale(pages, { today, maxAgeDays: 30 }).map((p: { file: string }) => p.file)).toEqual(['c.mdx', 'b.mdx', 'd.mdx']);
  });
});

describe('formatReport', () => {
  it('says so when nothing is stale', () => {
    expect(formatReport([], { total: 5 })).toBe('All 5 pages were verified in the last 90 days.');
  });
  it('groups generated pages by source and lists hand-written ones as tasks', () => {
    const report = formatReport(
      [
        { file: 'x.mdx', lastVerified: '2026-11-12', generated: true, source: 's.md', ageDays: 109 },
        { file: 'y.mdx', lastVerified: '2026-11-12', generated: true, source: 's.md', ageDays: 109 },
        { file: 'z.mdx', lastVerified: null, generated: false, source: null, ageDays: null },
      ],
      { total: 10 },
    );
    expect(report).toContain('3 of 10 pages');
    expect(report).toContain('`s.md`: 2 pages');
    expect(report).toContain('- [ ] `z.mdx`: no `lastVerified` date');
  });
});

describe('the real pages', () => {
  it('all have a lastVerified date', () => {
    const missing = collectPages(process.cwd()).filter((p: { lastVerified: string | null }) => !p.lastVerified);
    expect(missing).toEqual([]);
  });
});
