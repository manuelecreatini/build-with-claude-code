import en from '~/data/glossary/en.json';
import it from '~/data/glossary/it.json';
import type { Locale } from './i18n';

export interface GlossaryEntry {
  id: string;
  term: string;
  definition: string;
  match: string[];
}

/** Generated from Appendix A by scripts/split-playbook.mjs. */
export const glossary: Record<Locale, GlossaryEntry[]> = { en, it };

export function glossaryEntry(locale: Locale, id: string): GlossaryEntry | undefined {
  return glossary[locale].find((e) => e.id === id);
}

export function glossaryHref(locale: Locale, id: string): string {
  return `${locale === 'en' ? '' : `/${locale}`}/reference/glossary/#${id}`;
}
