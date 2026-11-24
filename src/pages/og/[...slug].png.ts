/** Builds one social preview PNG per page at build time (see src/lib/og.ts). */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { ogCard, ogTree, type OgInput } from '~/lib/og';

export const getStaticPaths = (async () => {
  const entries = await getCollection('docs');
  return entries.map((e) => ({
    params: { slug: e.id.replace(/\.mdx?$/, '') || 'index' },
    props: { id: e.id, title: e.data.title, description: e.data.description, phase: e.data.phase } satisfies OgInput,
  }));
}) satisfies GetStaticPaths;

const font = (pkg: string, file: string) =>
  readFileSync(join(process.cwd(), 'node_modules', '@fontsource', pkg, 'files', file));

type Fonts = Parameters<typeof satori>[1]['fonts'];
let fonts: Fonts | undefined;

export const GET: APIRoute = async ({ props }) => {
  fonts ??= [
    { name: 'Inter', data: font('inter', 'inter-latin-400-normal.woff'), weight: 400, style: 'normal' },
    { name: 'Inter', data: font('inter', 'inter-latin-600-normal.woff'), weight: 600, style: 'normal' },
    { name: 'Space Grotesk', data: font('space-grotesk', 'space-grotesk-latin-500-normal.woff'), weight: 500, style: 'normal' },
    { name: 'Space Grotesk', data: font('space-grotesk', 'space-grotesk-latin-700-normal.woff'), weight: 700, style: 'normal' },
  ];
  const tree = ogTree(ogCard(props as OgInput));
  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], { width: 1200, height: 630, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
