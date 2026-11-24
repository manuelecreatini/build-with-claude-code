import { describe, expect, it } from 'vitest';
import { localeFrom, t, ui } from '../../src/lib/i18n';

describe('i18n', () => {
  it('has the same keys in every locale', () => {
    const en = Object.keys(ui.en).sort();
    expect(Object.keys(ui.it).sort()).toEqual(en);
  });

  it('has no empty strings', () => {
    for (const strings of Object.values(ui)) {
      for (const [key, value] of Object.entries(strings)) {
        expect(value.trim(), key).not.toBe('');
      }
    }
  });

  it('maps lang attributes to locales', () => {
    expect(localeFrom('it')).toBe('it');
    expect(localeFrom('it-IT')).toBe('it');
    expect(localeFrom('en')).toBe('en');
    expect(localeFrom(undefined)).toBe('en');
  });

  it('translates keys', () => {
    expect(t('it', 'role.you')).toBe('TU');
    expect(t('en', 'role.you')).toBe('YOU');
  });
});
