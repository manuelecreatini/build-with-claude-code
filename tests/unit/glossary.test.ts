import { describe, expect, it } from 'vitest';
import { aliases, anchorGlossary, linkTerms, parseGlossary } from '../../scripts/lib/glossary.mjs';
import en from '../../src/data/glossary/en.json';
import it_ from '../../src/data/glossary/it.json';

const sample = parseGlossary([
  '- **Branch** — A parallel line of development; it joins `main` through a pull request.',
  '- **Pull request (PR)** — A proposal to merge a branch.',
  '- **CLI / terminal** — Programs you use by typing commands.',
  '- **Node.js / npm / npx** — The JavaScript runtime.',
  '- **PATH** — The list of folders the system searches.',
  '- **Map** — The /wayfinder map.',
  '- **Context window** — How many tokens the model considers at once.',
]);

describe('glossary parsing', () => {
  it('builds ids, plain definitions and aliases', () => {
    expect(sample[0]).toEqual({
      id: 'branch',
      term: 'Branch',
      definition: 'A parallel line of development; it joins main through a pull request.',
      match: ['Branch'],
    });
    expect(sample[1].id).toBe('pull-request-pr');
    expect(aliases('Pull request (PR)')).toEqual(['Pull request', 'PR']);
    expect(aliases('CLI / terminal')).toEqual(['CLI', 'terminal']);
    expect(aliases('CI/CD')).toEqual(['CI/CD']);
  });

  it('does not auto-link generic terms', () => {
    expect(sample.find((e: { id: string }) => e.id === 'map')!.match).toEqual([]);
  });
});

describe('linkTerms', () => {
  const link = (lines: string[]) => linkTerms(lines, sample, 'en').lines;

  it('links only the first mention of each term, plurals included', () => {
    expect(link(['Create two branches, then merge the branch.'])).toEqual([
      'Create two <Term id="branch">branches</Term>, then merge the branch.',
    ]);
  });

  it('treats any alias as the same entry', () => {
    expect(link(['Open a PR. A pull request is reviewed.'])).toEqual([
      'Open a <Term id="pull-request-pr">PR</Term>. A pull request is reviewed.',
    ]);
  });

  it('keeps acronyms case-sensitive', () => {
    expect(link(['the path to the file'])).toEqual(['the path to the file']);
    expect(link(['add it to PATH.'])).toEqual(['add it to <Term id="path">PATH</Term>.']);
  });

  it('accepts a sentence-ending dot but not a file extension or path', () => {
    expect(link(['Open the terminal.'])).toEqual(['Open the <Term id="cli-terminal">terminal</Term>.']);
    expect(link(['see docs/branch.md'])).toEqual(['see docs/branch.md']);
  });

  it('prefers the longest alias', () => {
    expect(link(['The context window fills up.'])).toEqual([
      'The <Term id="context-window">context window</Term> fills up.',
    ]);
  });

  it('skips code, headings, JSX lines, links and tags', () => {
    const lines = [
      '## Branch basics',
      '```',
      'git branch',
      '```',
      'Run `git branch` or read [the branch guide](/x/) <Role as="you" /> now.',
      '<Tabs syncKey="os">',
    ];
    expect(link(lines)).toEqual(lines);
  });

  it('reports which entries were used', () => {
    expect(linkTerms(['Use npm in the terminal.'], sample, 'en').used).toEqual(['nodejs-npm-npx', 'cli-terminal']);
  });
});

describe('anchorGlossary', () => {
  it('adds a dfn anchor to each entry', () => {
    expect(anchorGlossary(['- **Branch** — A line.'], sample)).toEqual(['- **<dfn id="branch">Branch</dfn>** — A line.']);
  });
});

describe('generated glossary data', () => {
  it('has the same number of entries in both locales, with unique ids', () => {
    expect(en.length).toBe(it_.length);
    for (const list of [en, it_]) {
      const ids = list.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const e of list) expect(e.definition.length).toBeGreaterThan(5);
    }
  });
});
