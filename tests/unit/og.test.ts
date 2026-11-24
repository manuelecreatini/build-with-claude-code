import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { describe, expect, it } from 'vitest';
import { clip, ogCard, ogPath, ogTree } from '~/lib/og';

describe('ogPath', () => {
  it('maps entry ids to image paths', () => {
    expect(ogPath('phases/f0-setup')).toBe('/og/phases/f0-setup.png');
    expect(ogPath('it/phases/f0-setup')).toBe('/og/it/phases/f0-setup.png');
    expect(ogPath('index.mdx')).toBe('/og/index.png');
    expect(ogPath('')).toBe('/og/index.png');
  });
  it('gives the 404 page the homepage card', () => {
    expect(ogPath('404')).toBe('/og/index.png');
  });
});

describe('clip', () => {
  it('leaves short text alone', () => {
    expect(clip('Short', 10)).toBe('Short');
  });
  it('cuts at a word boundary and adds an ellipsis', () => {
    const out = clip('One two three four five, six seven', 20);
    expect(out.length).toBeLessThanOrEqual(20);
    expect(out).toBe('One two three four…');
  });
});

describe('ogCard', () => {
  it('builds a phase card with the prefix stripped', () => {
    const c = ogCard({ id: 'phases/f5-build-loop', title: 'Phase 5 · The build loop', description: 'd', phase: 'F5' });
    expect(c).toMatchObject({ locale: 'en', section: 'The nine phases', kicker: 'Phase 5 of 8', title: 'The build loop', phase: 5 });
  });
  it('localises Italian pages', () => {
    const c = ogCard({ id: 'it/phases/f0-setup', title: 'Fase 0 · Setup', phase: 'F0' });
    expect(c).toMatchObject({ locale: 'it', section: 'Le nove fasi', kicker: 'Fase 0 di 8', title: 'Setup', phase: 0 });
  });
  it('treats the locale roots as the homepage', () => {
    expect(ogCard({ id: 'index', title: 'Build with Claude Code' }).section).toBe('Interactive playbook');
    expect(ogCard({ id: 'it', title: 'Build with Claude Code' }).section).toBe('Playbook interattivo');
  });
  it('has no kicker or progress outside the phases', () => {
    const c = ogCard({ id: 'tools/tracker', title: 'Progress tracker' });
    expect(c).toMatchObject({ section: 'Tools', kicker: null, phase: null });
  });
});

describe('ogTree', () => {
  it('renders to a 1200×630 PNG', async () => {
    const font = (pkg: string, file: string) =>
      readFileSync(join(process.cwd(), 'node_modules', '@fontsource', pkg, 'files', file));
    const fonts = [
      { name: 'Inter', data: font('inter', 'inter-latin-400-normal.woff'), weight: 400 as const, style: 'normal' as const },
      { name: 'Space Grotesk', data: font('space-grotesk', 'space-grotesk-latin-700-normal.woff'), weight: 700 as const, style: 'normal' as const },
    ];
    const card = ogCard({ id: 'phases/f5-build-loop', title: 'Phase 5 · The build loop', description: 'Each slice, verified.', phase: 'F5' });
    const svg = await satori(ogTree(card) as unknown as Parameters<typeof satori>[0], { width: 1200, height: 630, fonts });
    const img = new Resvg(svg).render();
    expect([img.width, img.height]).toEqual([1200, 630]);
  });
});
