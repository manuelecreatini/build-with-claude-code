import { describe, expect, it } from 'vitest';
import { applyInserts, INSERTS, QUIZ_PAGES } from '../../scripts/teaching-inserts.mjs';

type Insert = { at: 'top' | RegExp; kind: 'why' | 'hood'; title?: { en: string; it: string }; en: string; it: string };

describe('teaching inserts data', () => {
  it('has both locales for every insert, and a title for every panel', () => {
    for (const list of Object.values(INSERTS) as Insert[][]) {
      for (const ins of list) {
        expect(ins.en.trim()).not.toBe('');
        expect(ins.it.trim()).not.toBe('');
        if (ins.kind === 'hood') expect(ins.title?.en && ins.title?.it).toBeTruthy();
        // Concept links use the @c/ placeholder in both locales, the same number of times.
        expect(ins.it.split('@c/').length).toBe(ins.en.split('@c/').length);
      }
    }
  });

  it('has a quiz for every phase', () => {
    expect(Object.values(QUIZ_PAGES)).toEqual(['F0', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8']);
  });
});

describe('applyInserts', () => {
  const page = ['| **Goal** | x |', '|---|---|', '', 'Intro.', '', '## 0.3 Install', 'Body.', '', '### Sub', 'More.', '', '## 0.4 Next', 'Text.', '## 0.5 Settings', 'x', '## 0.7 Project', '### Step 2 — CLAUDE.md', 'y', '### Step 3 — GitHub', 'z'];

  it('puts top inserts after the summary table and section inserts at the end of the section', () => {
    const { lines, components } = applyInserts(page, 'phases/f0-setup', 'en', '/concepts/');
    const why = lines.findIndex((l: string) => l.startsWith('<WhyThisStep>'));
    const hood = lines.findIndex((l: string) => l.startsWith('<UnderTheHood title={"Under the hood: what \\"installing'));
    expect(why).toBe(3);
    expect(lines[1]).toBe('|---|---|');
    // The 0.3 panel closes the 0.3 section, after its sub-section, before "## 0.4".
    expect(hood).toBeGreaterThan(lines.indexOf('More.'));
    expect(hood).toBeLessThan(lines.indexOf('## 0.4 Next'));
    expect([...components].sort()).toEqual(['UnderTheHood', 'WhyThisStep']);
  });

  it('expands concept links per locale', () => {
    const { lines } = applyInserts(page, 'phases/f0-setup', 'it', '/it/concepts/');
    expect(lines.join('\n')).toContain('](/it/concepts/plan-mode-and-permissions/)');
  });

  it('fails loudly when a heading is missing', () => {
    expect(() => applyInserts(['Nothing here.'], 'phases/f0-setup', 'en', '/concepts/')).toThrow(/not found/);
  });
});
