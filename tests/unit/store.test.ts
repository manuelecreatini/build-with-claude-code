import { describe, expect, it } from 'vitest';
import { STORE_KEY, defaultState, exportState, importState, load, normalize, save } from '../../src/lib/store';

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

describe('normalize', () => {
  it('returns the default state for anything that is not an object', () => {
    for (const raw of [null, undefined, 42, 'x', []]) expect(normalize(raw)).toEqual(defaultState());
  });

  it('keeps valid fields and drops or clamps invalid ones', () => {
    const s = normalize({
      project: { name: 'Acme', type: 'saas', os: 'beos', mobile: 'yes', ai: true },
      checks: { 's0-0': true, 's0-1': false, 's0-2': 'true' },
      values: { '<Product name>': 'Acme', '<n>': 3 },
      loop: { bp: 5000, step: 12, gates: { G5: true }, history: [{ bp: 2, title: 'Auth', closed: '2026-11-01' }, 'junk'] },
      tokens: -10,
    });
    expect(s.project).toEqual({ name: 'Acme', idea: '', type: 'saas', mobile: false, ai: true, os: '' });
    expect(s.checks).toEqual({ 's0-0': true });
    expect(s.values).toEqual({ '<Product name>': 'Acme' });
    expect(s.loop).toEqual({ bp: 999, title: '', step: 8, gates: { G5: true, G6: false }, history: [{ bp: 2, title: 'Auth', closed: '2026-11-01' }] });
    expect(s.tokens).toBe(0);
  });

  it('caps string lengths', () => {
    const s = normalize({ project: { name: 'x'.repeat(500) }, values: { k: 'v'.repeat(9000) } });
    expect(s.project.name).toHaveLength(200);
    expect(s.values.k).toHaveLength(5000);
  });
});

describe('load and save', () => {
  it('round-trips through storage', () => {
    const st = fakeStorage();
    const state = { ...defaultState(), checks: { 'dod-F0-0': true }, tokens: 120_000 };
    expect(save(state, st)).toBe(true);
    expect(st.data.has(STORE_KEY)).toBe(true);
    expect(load(st)).toEqual(state);
  });

  it('falls back to defaults on missing, corrupt or unavailable storage', () => {
    expect(load(fakeStorage())).toEqual(defaultState());
    expect(load(fakeStorage({ [STORE_KEY]: '{not json' }))).toEqual(defaultState());
    expect(load(null)).toEqual(defaultState());
    expect(save(defaultState(), null)).toBe(false);
    const throwing = { ...fakeStorage(), setItem: () => { throw new Error('quota'); } };
    expect(save(defaultState(), throwing)).toBe(false);
  });
});

describe('export and import', () => {
  it('round-trips an export', () => {
    const state = { ...defaultState(), project: { ...defaultState().project, name: 'Acme', type: 'landing' as const } };
    expect(importState(exportState(state))).toEqual(state);
  });

  it('rejects JSON that is not one of our exports', () => {
    expect(() => importState('{"checks":{}}')).toThrow('not-an-export');
    expect(() => importState('[1,2]')).toThrow('not-an-export');
    expect(() => importState('not json')).toThrow();
  });
});
