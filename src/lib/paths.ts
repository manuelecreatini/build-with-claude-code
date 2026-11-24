import type { Locale } from './i18n';

/** Site path for a docs slug in a locale (English lives at the root). */
export const pathFor = (locale: Locale, slug: string, hash = '') =>
  `${locale === 'en' ? '/' : `/${locale}/`}${slug}/${hash ? `#${hash}` : ''}`;
