import { describe, expect, it } from 'vitest';
import { cleanInline, parseChecklist } from '../../scripts/lib/tools-data.mjs';
import { PHASES, toolsData } from '../../src/data/tools';

const ids = (items: { id: string }[]) => items.map((i) => i.id);

describe('tools data', () => {
  const { en, it: it_ } = toolsData;

  it('has a non-empty master checklist with the same sections and ids in both locales', () => {
    expect(en.checklist.length).toBeGreaterThan(0);
    expect(it_.checklist.map((s) => [s.id, s.phase, ids(s.items)])).toEqual(en.checklist.map((s) => [s.id, s.phase, ids(s.items)]));
    for (const s of en.checklist) expect(s.items.length).toBeGreaterThan(0);
  });

  it('has a Definition of Done for every phase, with matching ids', () => {
    for (const phase of PHASES) {
      expect(en.dod[phase]?.items.length, phase).toBeGreaterThan(0);
      expect(ids(it_.dod[phase].items)).toEqual(ids(en.dod[phase].items));
    }
  });

  it('has the three T12 lists with matching ids', () => {
    for (const key of ['start', 'during', 'end'] as const) {
      expect(en.context[key].items.length, key).toBeGreaterThan(0);
      expect(ids(it_.context[key].items)).toEqual(ids(en.context[key].items));
    }
    // The context meter reads the first four "during" items as the four zones.
    expect(en.context.during.items.length).toBeGreaterThanOrEqual(4);
  });

  it('uses unique ids', () => {
    const all = [
      ...en.checklist.flatMap((s) => ids(s.items)),
      ...Object.values(en.dod).flatMap((l) => ids(l.items)),
      ...Object.values(en.context).flatMap((l) => ids(l.items)),
    ];
    expect(new Set(all).size).toBe(all.length);
  });

  it('leaves no MDX markup in the item text', () => {
    const texts = [
      ...en.checklist.flatMap((s) => s.items),
      ...it_.checklist.flatMap((s) => s.items),
      ...Object.values(en.dod).flatMap((l) => l.items),
      ...Object.values(it_.dod).flatMap((l) => l.items),
    ].map((i) => i.text);
    for (const t of texts) expect(t).not.toMatch(/<Term|<Role|&lt;|\[\^/);
  });
});

describe('tools data parsing', () => {
  it('cleans generated inline markup', () => {
    expect(cleanInline('Open a <Term id="pull-request">PR</Term> at <Role as="gate" n={6} /> [docs](/x/)[^1]')).toBe('Open a PR at **G6** docs');
  });

  it('parses checklist sections and skips fenced code', () => {
    const sections = parseChecklist(['#### F0 · Setup', '- [ ] Install Node', '```', '- [ ] not an item', '```', '- [ ] Install git']);
    expect(sections).toEqual([{ id: 's0', phase: 'F0', title: 'Setup', items: [{ id: 's0-0', text: 'Install Node' }, { id: 's0-1', text: 'Install git' }] }]);
  });
});
