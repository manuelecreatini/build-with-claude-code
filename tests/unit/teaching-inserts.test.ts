import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { applyInserts, COMPONENT_PATHS, INSERTS, QUIZ_PAGES } from '../../scripts/teaching-inserts.mjs';
import { GUIDE_INSERTS } from '../../scripts/guide-inserts.mjs';
import { AXES, TOOLS } from '../../src/lib/prefs';

type Insert = {
  at: 'top' | RegExp;
  kind: 'why' | 'hood' | 'only' | 'choice' | 'swap';
  pos?: 'start' | 'end';
  title?: { en: string; it: string };
  when?: Record<string, string>;
  tool?: string;
  en: string;
  it: string;
};

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

  it('has valid guide inserts: known axes, values and tools, and both locales', () => {
    const axes = AXES as Record<string, { values: readonly string[] }>;
    for (const list of Object.values(GUIDE_INSERTS) as Insert[][]) {
      for (const ins of list) {
        if (ins.kind === 'choice') {
          expect(Object.keys(TOOLS)).toContain(ins.tool);
          continue;
        }
        expect(ins.en.trim()).not.toBe('');
        expect(ins.it.trim()).not.toBe('');
        for (const [k, v] of Object.entries(ins.when ?? {})) {
          for (const word of v.split(' ')) {
            if (k === 'tool') expect(Object.keys(TOOLS)).toContain(word.replace('!', ''));
            else expect(axes[k].values).toContain(word);
          }
        }
      }
    }
  });

  it('maps every component to a file that exists', () => {
    for (const path of Object.values(COMPONENT_PATHS)) expect(existsSync(`src/components/${path}.astro`)).toBe(true);
  });

  it('has a quiz for every phase', () => {
    expect(Object.values(QUIZ_PAGES)).toEqual(['F0', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8']);
  });
});

describe('applyInserts', () => {
  const page = [
    '| **Goal** | x |', '|---|---|', '', 'Intro.', '',
    '## 0.1 Chat or Code?', 'Chat.', '',
    '## 0.3 Install', 'Body.', '', '### Sub', 'More.', '',
    '## 0.4 Next', 'Text.',
    '## 0.5 Settings', 'x',
    '## 0.6 Skills', 's',
    '## 0.7 Project', '### Step 2 — CLAUDE.md', 'y', '### Step 3 — GitHub', 'z',
  ];

  it('puts top inserts after the summary table and section inserts at the end of the section', () => {
    const { lines, components } = applyInserts(page, 'phases/f0-setup', 'en', '/concepts/');
    const why = lines.findIndex((l: string) => l.startsWith('<WhyThisStep>'));
    const hood = lines.findIndex((l: string) => l.startsWith('<UnderTheHood title={"Under the hood: what \\"installing'));
    expect(why).toBe(3);
    expect(lines[1]).toBe('|---|---|');
    // The 0.3 panel closes the 0.3 section, after its sub-section, before "## 0.4".
    expect(hood).toBeGreaterThan(lines.indexOf('More.'));
    expect(hood).toBeLessThan(lines.indexOf('## 0.4 Next'));
    expect([...components].sort()).toEqual(['Only', 'ToolChoice', 'UnderTheHood', 'WhyThisStep']);
  });

  it('puts "start" inserts right after the heading', () => {
    const { lines } = applyInserts(page, 'phases/f0-setup', 'en', '/concepts/');
    expect(lines[lines.indexOf('## 0.4 Next') + 2]).toBe('<ToolChoice tool="github" />');
  });

  it('turns a swap into a terminal block then a desktop block, with other inserts after both', () => {
    const { lines } = applyInserts(page, 'phases/f0-setup', 'en', '/concepts/');
    const h = lines.indexOf('## 0.5 Settings');
    const term = lines.indexOf('<Only surface="terminal">');
    const desk = lines.indexOf('<Only surface="desktop">', term);
    expect(term).toBe(h + 2);
    expect(lines.indexOf('x')).toBeGreaterThan(term);
    expect(lines.indexOf('x')).toBeLessThan(desk);
    // The 0.5 settings panel applies to both surfaces, so it comes after the desktop block.
    const hood = lines.findIndex((l: string, i: number) => i > desk && l.startsWith('<UnderTheHood'));
    expect(hood).toBeGreaterThan(desk);
    expect(hood).toBeLessThan(lines.indexOf('## 0.6 Skills'));
  });

  it('expands concept links per locale', () => {
    const { lines } = applyInserts(page, 'phases/f0-setup', 'it', '/it/concepts/');
    expect(lines.join('\n')).toContain('](/it/concepts/plan-mode-and-permissions/)');
  });

  it('fails loudly when a heading is missing', () => {
    expect(() => applyInserts(['Nothing here.'], 'phases/f0-setup', 'en', '/concepts/')).toThrow(/not found/);
  });
});
