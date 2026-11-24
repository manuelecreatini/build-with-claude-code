import { describe, expect, it } from 'vitest';
import { advance, GATE_AT, LAST_STEP } from '../../src/islands/BuildLoop';
import { THRESHOLDS, zoneOf } from '../../src/islands/ContextMeter';
import { fill } from '../../src/islands/TemplateBuilder';
import { defaultState } from '../../src/lib/store';

describe('template fill', () => {
  const placeholders = ['<Product>', '<Product name>', '<stack>'];

  it('replaces every occurrence and prefers the longest placeholder', () => {
    const text = '# <Product name>\n<Product> runs on <stack>. <Product name> again.';
    expect(fill(text, { '<Product name>': 'Acme App', '<Product>': 'Acme', '<stack>': 'Astro' }, placeholders)).toBe(
      '# Acme App\nAcme runs on Astro. Acme App again.',
    );
  });

  it('leaves empty or blank values as placeholders and trims the rest', () => {
    expect(fill('<Product name> / <stack>', { '<Product name>': '  Acme  ', '<stack>': '   ' }, placeholders)).toBe('Acme / <stack>');
  });

  it('does not treat values as patterns', () => {
    expect(fill('<stack>', { '<stack>': '$& (.*)' }, placeholders)).toBe('$& (.*)');
  });
});

describe('build loop advance', () => {
  const start = defaultState().loop;

  it('is blocked by G5 at step 1 and G6 at step 6 until they are ticked', () => {
    expect(GATE_AT).toEqual({ 1: 'G5', 6: 'G6' });
    expect(advance({ ...start, step: 1 })).toBeNull();
    expect(advance({ ...start, step: 1, gates: { G5: true, G6: false } })?.step).toBe(2);
    expect(advance({ ...start, step: 6, gates: { G5: true, G6: false } })).toBeNull();
    expect(advance({ ...start, step: 6, gates: { G5: true, G6: true } })?.step).toBe(7);
  });

  it('moves freely through the other steps', () => {
    for (const step of [0, 2, 3, 4, 5, 7]) expect(advance({ ...start, step })?.step).toBe(step + 1);
  });

  it('closes the build phase after the last step and records it, newest first', () => {
    const loop = { bp: 3, title: 'Billing', step: LAST_STEP, gates: { G5: true, G6: true }, history: [{ bp: 2, title: 'Auth', closed: '2026-11-01' }] };
    expect(advance(loop, '2026-11-24')).toEqual({
      bp: 4,
      title: '',
      step: 0,
      gates: { G5: false, G6: false },
      history: [
        { bp: 3, title: 'Billing', closed: '2026-11-24' },
        { bp: 2, title: 'Auth', closed: '2026-11-01' },
      ],
    });
  });

  it('caps the history at 100 entries', () => {
    const history = Array.from({ length: 100 }, (_, i) => ({ bp: i + 1, title: '', closed: '' }));
    const next = advance({ ...start, bp: 101, step: LAST_STEP, history });
    expect(next?.history).toHaveLength(100);
    expect(next?.history[0].bp).toBe(101);
  });
});

describe('context meter zones', () => {
  it('maps tokens to the T12 zones', () => {
    expect(THRESHOLDS).toEqual([100_000, 150_000, 200_000]);
    expect([0, 99_999, 100_000, 149_999, 150_000, 199_999, 200_000, 400_000].map(zoneOf)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });
});
