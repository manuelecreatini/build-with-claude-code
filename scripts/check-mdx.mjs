#!/usr/bin/env node
/** Compiles every MDX page with Astro's MDX compiler (satteri) to catch syntax errors early. */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const satteriEntry = path.join(
  path.dirname(require.resolve('@astrojs/markdown-satteri')),
  '..', 'node_modules', 'satteri', 'dist', 'index.js',
);
const { mdxToJs } = await import(fs.existsSync(satteriEntry) ? pathToFileURL(satteriEntry).href : 'satteri');

const root = path.resolve(process.argv[2] ?? 'src/content/docs');
const files = fs.readdirSync(root, { recursive: true }).filter((f) => String(f).endsWith('.mdx'));
let failed = 0;
for (const f of files) {
  const file = path.join(root, String(f));
  const src = fs.readFileSync(file, 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '');
  try {
    mdxToJs(src);
  } catch (e) {
    failed++;
    console.error(`✗ ${path.relative(process.cwd(), file)}: ${String(e.message ?? e).split('\n')[0]}`);
  }
}
console.log(`${files.length - failed}/${files.length} MDX files compile.`);
process.exit(failed ? 1 : 0);
