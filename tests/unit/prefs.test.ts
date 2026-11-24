import { describe, expect, it } from 'vitest';
import { AXES, AXIS_NAMES, TOOLS, defaultPrefs, headScript, isRecommended, normalizePrefs, prefsAttributes, visibilityCss } from '../../src/lib/prefs';
import { prefsText } from '../../src/data/prefs';
import { normalize } from '../../src/lib/store';

describe('prefs', () => {
  it('defaults to the recommended value on every axis and tool', () => {
    const d = defaultPrefs();
    for (const a of AXIS_NAMES) expect(d[a]).toBe(AXES[a].recommended);
    expect(d.tools).toEqual(TOOLS);
    expect(isRecommended(d)).toBe(true);
  });

  it('keeps valid values and drops invalid ones', () => {
    const p = normalizePrefs({ surface: 'desktop', level: 'wizard', tools: { docker: true, vercel: 'no' }, extra: 1 });
    expect(p.surface).toBe('desktop');
    expect(p.level).toBe('standard');
    expect(p.tools.docker).toBe(true);
    expect(p.tools.vercel).toBe(true);
    expect('extra' in p).toBe(false);
    expect(isRecommended(p)).toBe(false);
    for (const raw of [null, 'x', 3, [], { tools: [] }]) expect(normalizePrefs(raw)).toEqual(defaultPrefs());
  });

  it('turns preferences into <html> attributes', () => {
    const attrs = prefsAttributes({ ...defaultPrefs(), surface: 'desktop', tools: { ...TOOLS, github: false } });
    expect(attrs['data-surface']).toBe('desktop');
    expect(attrs['data-tool-github']).toBe('off');
    expect(attrs['data-tool-docker']).toBe('off');
    expect(attrs['data-level']).toBe('standard');
  });

  it('hides blocks for other values, and applies the recommended value when no attribute is set', () => {
    const css = visibilityCss();
    expect(css).toContain('html[data-surface="desktop"] [data-only-surface]:not([data-only-surface~="desktop"])');
    expect(css).toContain('html:is([data-surface="terminal"],:not([data-surface])) [data-only-surface]:not([data-only-surface~="terminal"])');
    // Docker is off by default: "with Docker" blocks stay hidden until it is turned on.
    expect(css).toContain('html:is([data-tool-docker="off"],:not([data-tool-docker])) [data-only-tool~="docker"]');
    expect(css).toContain('html:is([data-tool-github="on"],:not([data-tool-github])) [data-only-tool~="!github"]');
    expect(css.trim().endsWith('{ display: none !important; }')).toBe(true);
  });

  function runHead(stored: string | null, throws = false) {
    const attrs: Record<string, string> = {};
    const document = { documentElement: { setAttribute: (k: string, v: string) => void (attrs[k] = v) } };
    const localStorage = {
      getItem: () => {
        if (throws) throw new Error('blocked');
        return stored;
      },
    };
    new Function('document', 'localStorage', headScript('bcc:v1'))(document, localStorage);
    return attrs;
  }

  it('head script applies the saved preferences before paint', () => {
    const attrs = runHead(JSON.stringify({ prefs: { surface: 'desktop', security: 'hardened', tools: { docker: true } } }));
    expect(attrs).toEqual(prefsAttributes({ ...defaultPrefs(), surface: 'desktop', security: 'hardened', tools: { ...TOOLS, docker: true } }));
  });

  it('head script falls back to the recommended set on bad or blocked storage', () => {
    const rec = prefsAttributes(defaultPrefs());
    expect(runHead(null)).toEqual(rec);
    expect(runHead('{not json')).toEqual(rec);
    expect(runHead(JSON.stringify({ prefs: { surface: 'phone' } }))).toEqual(rec);
    expect(runHead(null, true)).toEqual(rec);
  });

  it('the store keeps preferences through normalization', () => {
    const s = normalize({ prefs: { focus: 'polish', deps: 'lean' } });
    expect(s.prefs.focus).toBe('polish');
    expect(s.prefs.deps).toBe('lean');
    expect(normalize({}).prefs).toEqual(defaultPrefs());
  });

  it('has text for every option and tool in both locales, with pros and cons', () => {
    for (const locale of ['en', 'it'] as const) {
      const t = prefsText[locale];
      for (const a of AXIS_NAMES) {
        expect(t.axes[a].label).toBeTruthy();
        for (const v of AXES[a].values) {
          const o = t.axes[a].options[v];
          expect(o.label && o.summary).toBeTruthy();
          expect(o.pros.length).toBeGreaterThan(0);
          expect(o.cons.length).toBeGreaterThan(0);
        }
      }
      for (const tool of Object.keys(TOOLS) as (keyof typeof TOOLS)[]) {
        const x = t.tools[tool];
        expect(x.use.pros.length * x.use.cons.length * x.skip.pros.length * x.skip.cons.length).toBeGreaterThan(0);
        expect(x.instead).toBeTruthy();
      }
    }
  });
});
