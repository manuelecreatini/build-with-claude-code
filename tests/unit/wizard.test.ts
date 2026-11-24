import { readFileSync } from 'node:fs';
import GithubSlugger from 'github-slugger';
import { describe, expect, it } from 'vitest';
import { planFor, wizardContent } from '../../src/data/wizard';
import { PROJECT_TYPES } from '../../src/lib/store';

/** The anchors Starlight generates for a page: github-slugger over each heading's text. */
function anchorsOf(file: string): Set<string> {
  const slugger = new GithubSlugger();
  const anchors = new Set<string>();
  let fence = false;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    if (fence) continue;
    const h = /^#{2,6} (.+)$/.exec(line);
    if (!h) continue;
    const text = h[1]
      .replace(/<[^>]+>/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[`*_]/g, '')
      .trim();
    anchors.add(slugger.slug(text));
  }
  return anchors;
}

describe('wizard sources', () => {
  for (const locale of ['en', 'it'] as const) {
    for (const [key, [slug, anchor]] of Object.entries(wizardContent[locale].sources)) {
      it(`${locale} ${key} links to an existing heading (${slug}#${anchor})`, () => {
        const file = `src/content/docs/${locale === 'en' ? '' : 'it/'}${slug}.mdx`;
        expect([...anchorsOf(file)]).toContain(anchor);
      });
    }
  }
});

describe('wizard content', () => {
  it('has the same keys in both locales', () => {
    const shape = (l: 'en' | 'it') => {
      const c = wizardContent[l];
      return [Object.keys(c.types), Object.keys(c.stack), Object.keys(c.tests), Object.keys(c.discovery), Object.keys(c.os)];
    };
    expect(shape('it')).toEqual(shape('en'));
  });

  it('covers every project type', () => {
    for (const l of ['en', 'it'] as const) expect(Object.keys(wizardContent[l].types).sort()).toEqual([...PROJECT_TYPES].sort());
  });
});

describe('planFor', () => {
  it('keeps a landing page small', () => {
    expect(planFor('landing', false, false)).toEqual({ stack: ['web', 'hosting', 'tests'], tests: ['landing'], discovery: 'small' });
  });

  it('adds backend and data for an internal tool', () => {
    const p = planFor('internal', false, false);
    expect(p.stack).toEqual(['web', 'backend', 'data', 'hosting', 'tests']);
    expect(p.discovery).toBe('maybeSmall');
  });

  it('adds payments and email for SaaS and marketplaces, which share the SaaS test row', () => {
    for (const type of ['saas', 'marketplace'] as const) {
      const p = planFor(type, false, false);
      expect(p.stack).toContain('payments');
      expect(p.stack).toContain('email');
      expect(p.tests).toEqual(['saas']);
      expect(p.discovery).toBe('map');
    }
  });

  it('adds mobile and AI rows when asked', () => {
    const p = planFor('saas', true, true);
    expect(p.stack).toEqual(['web', 'backend', 'data', 'hosting', 'mobile', 'payments', 'email', 'ai', 'tests']);
    expect(p.tests).toEqual(['saas', 'mobile', 'ai']);
  });
});
