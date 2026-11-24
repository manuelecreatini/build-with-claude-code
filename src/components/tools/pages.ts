/** Server-side helpers shared by the tool wrappers: page titles from the docs collection. */
import { getCollection } from 'astro:content';
import type { Locale } from '~/lib/i18n';

let cache: Map<string, string> | undefined;

/** Title of a docs page by slug (without the locale prefix), e.g. "phases/f0-setup". */
export async function pageTitle(locale: Locale, slug: string): Promise<string> {
  if (!cache) {
    const docs = await getCollection('docs');
    cache = new Map(docs.map((d) => [d.id, d.data.title]));
  }
  const id = locale === 'en' ? slug : `${locale}/${slug}`;
  const title = cache.get(id);
  if (!title) throw new Error(`No docs page "${id}"`);
  return title;
}
