/**
 * Social preview cards (Open Graph, 1200×630). Pure helpers: the endpoint in
 * src/pages/og/[...slug].png.ts renders the tree with satori and resvg at build time,
 * so no external service ever sees the page.
 */
export type Locale = 'en' | 'it';

const SECTIONS: Record<string, Record<Locale, string>> = {
  start: { en: 'Start here', it: 'Inizia qui' },
  tools: { en: 'Tools', it: 'Strumenti' },
  method: { en: 'The method', it: 'Il metodo' },
  phases: { en: 'The nine phases', it: 'Le nove fasi' },
  concepts: { en: 'Concepts', it: 'Concetti' },
  toolkit: { en: 'Toolkit', it: 'Toolkit' },
  templates: { en: 'Templates', it: 'Template' },
  reference: { en: 'Reference', it: 'Riferimento' },
};

export interface OgInput {
  id: string;
  title: string;
  description?: string;
  phase?: string;
}

export interface OgCard {
  locale: Locale;
  section: string;
  kicker: string | null;
  title: string;
  text: string;
  /** Current phase 0–8, or null when the page is not part of a phase. */
  phase: number | null;
}

/** Image path for a docs entry id, e.g. "it/phases/f0-setup" → "/og/it/phases/f0-setup.png". */
export function ogPath(id: string): string {
  const slug = id.replace(/\.mdx?$/, '');
  // The 404 page has no card of its own: it shares the homepage one.
  return `/og/${!slug || slug === '404' ? 'index' : slug}.png`;
}

/** Shortens to at most `max` characters at a word boundary, with an ellipsis. */
export function clip(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return (space > 0 ? cut.slice(0, space) : cut).replace(/[,;:.\s]+$/, '') + '…';
}

export function ogCard({ id, title, description = '', phase }: OgInput): OgCard {
  const parts = id.replace(/\.mdx?$/, '').split('/').filter(Boolean);
  const locale: Locale = parts[0] === 'it' ? 'it' : 'en';
  if (locale === 'it') parts.shift();
  const n = phase && /^F[0-8]$/.test(phase) ? Number(phase.slice(1)) : null;
  const home = parts.length === 0 || parts[0] === 'index';
  const section = home
    ? locale === 'it'
      ? 'Playbook interattivo'
      : 'Interactive playbook'
    : (SECTIONS[parts[0]]?.[locale] ?? '');
  const kicker = n !== null ? (locale === 'it' ? `Fase ${n} di 8` : `Phase ${n} of 8`) : null;
  return {
    locale,
    section,
    kicker,
    title: clip(title.replace(/^(?:Phase|Fase)\s+\d+\s*·\s*/, ''), 70),
    text: clip(description, 150),
    phase: n,
  };
}

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, children?: unknown): Node => ({
  type,
  props: { style, children },
});

const C = {
  bg: '#F6F7F8',
  ink: '#14161B',
  muted: '#555B66',
  line: '#E2E4E8',
  accent: '#0A6B63',
  done: '#7FB8B1',
};

/** The satori element tree for a card. */
export function ogTree(card: OgCard): Node {
  const titleSize = card.title.length > 44 ? 62 : 76;
  const logo = h(
    'div',
    {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 48,
      height: 48,
      borderRadius: 12,
      background: C.ink,
      color: C.bg,
      fontFamily: 'Space Grotesk',
      fontSize: 22,
      fontWeight: 700,
    },
    '>_',
  );
  const pill = h(
    'div',
    {
      display: 'flex',
      padding: '8px 20px',
      borderRadius: 999,
      background: '#FFFFFF',
      border: `1px solid ${C.line}`,
      fontSize: 18,
      fontWeight: 600,
      color: C.muted,
    },
    card.section,
  );
  const header = h('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, [
    h('div', { display: 'flex', alignItems: 'center', gap: 18 }, [
      logo,
      h('div', { fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 28, color: C.ink }, 'Build with Claude Code'),
    ]),
    card.section ? pill : h('div', { display: 'flex' }, ''),
  ]);
  const body = h('div', { display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1000 }, [
    ...(card.kicker
      ? [
          h(
            'div',
            {
              fontFamily: 'Space Grotesk',
              fontWeight: 500,
              fontSize: 22,
              letterSpacing: 2,
              color: C.accent,
              textTransform: 'uppercase',
            },
            card.kicker,
          ),
        ]
      : []),
    h(
      'div',
      {
        fontFamily: 'Space Grotesk',
        fontWeight: 700,
        fontSize: titleSize,
        lineHeight: 1.04,
        letterSpacing: -2.5,
        color: C.ink,
      },
      card.title,
    ),
    ...(card.text ? [h('div', { fontSize: 28, lineHeight: 1.4, color: C.muted }, card.text)] : []),
  ]);
  const bars = h(
    'div',
    { display: 'flex', gap: 8 },
    Array.from({ length: 9 }, (_, i) =>
      h('div', {
        width: 44,
        height: 10,
        borderRadius: 5,
        background:
          card.phase === null ? C.line : i < card.phase ? C.done : i === card.phase ? C.accent : C.line,
      }),
    ),
  );
  const footer = h('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, [
    bars,
    h(
      'div',
      { fontSize: 18, color: C.muted },
      card.locale === 'it' ? 'Playbook open source · EN / IT' : 'Open-source playbook · EN / IT',
    ),
  ]);
  return h(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxSizing: 'border-box',
      width: 1200,
      height: 630,
      padding: '64px 72px',
      backgroundColor: C.bg,
      fontFamily: 'Inter',
    },
    [header, body, footer],
  );
}
