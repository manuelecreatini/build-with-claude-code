import { Fragment, type ReactNode } from 'react';

/**
 * A small, safe Markdown renderer for the coach's answers: paragraphs, headings, lists, fenced
 * code, and inline code, bold, italic and links. Everything is rendered as React text, so no HTML
 * from the model reaches the page. Links are kept only when they are site-relative or https.
 */

export type MdBlock =
  | { kind: 'p'; text: string }
  | { kind: 'h'; level: number; text: string }
  | { kind: 'ul' | 'ol'; items: string[] }
  | { kind: 'code'; lang: string; text: string };

export function parseBlocks(src: string): MdBlock[] {
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const out: MdBlock[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) out.push({ kind: 'p', text: para.join(' ') });
    para = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = /^\s*(```|~~~)\s*([\w+-]*)/.exec(line);
    if (fence) {
      flush();
      const body: string[] = [];
      for (i++; i < lines.length && !lines[i].trim().startsWith(fence[1]); i++) body.push(lines[i]);
      out.push({ kind: 'code', lang: fence[2], text: body.join('\n') });
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      flush();
      out.push({ kind: 'h', level: h[1].length, text: h[2].trim() });
      continue;
    }
    const li = /^\s*(?:([-*+])|(\d+)[.)])\s+(.*)$/.exec(line);
    if (li) {
      flush();
      const kind = li[1] ? 'ul' : 'ol';
      const prev = out[out.length - 1];
      if (prev && prev.kind === kind) prev.items.push(li[3]);
      else out.push({ kind, items: [li[3]] });
      continue;
    }
    if (!line.trim()) {
      flush();
      continue;
    }
    // A continuation line of a list item.
    const prev = out[out.length - 1];
    if (!para.length && /^\s{2,}\S/.test(line) && prev && (prev.kind === 'ul' || prev.kind === 'ol')) {
      prev.items[prev.items.length - 1] += ` ${line.trim()}`;
      continue;
    }
    para.push(line.trim());
  }
  flush();
  return out;
}

export function safeHref(href: string): string | null {
  const h = href.trim();
  if (/^\/(?!\/)/.test(h) || /^#/.test(h)) return h;
  if (/^https:\/\//i.test(h)) return h;
  return null;
}

const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\)|\*[^*\s][^*]*\*)/g;

function inline(text: string): ReactNode[] {
  return text
    .split(INLINE)
    .filter(Boolean)
    .map((p, i) => {
      if (p.startsWith('`') && p.endsWith('`') && p.length > 1) return <code key={i}>{p.slice(1, -1)}</code>;
      if (p.startsWith('**') && p.endsWith('**') && p.length > 3) return <strong key={i}>{p.slice(2, -2)}</strong>;
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(p);
      if (link) {
        const href = safeHref(link[2]);
        if (!href) return <Fragment key={i}>{link[1]}</Fragment>;
        const external = href.startsWith('https://');
        return (
          <a key={i} href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
            {link[1]}
          </a>
        );
      }
      if (p.startsWith('*') && p.endsWith('*') && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>;
      return <Fragment key={i}>{p}</Fragment>;
    });
}

export function Markdown({ text }: { text: string }) {
  return (
    <>
      {parseBlocks(text).map((b, i) => {
        switch (b.kind) {
          case 'p':
            return <p key={i}>{inline(b.text)}</p>;
          case 'h':
            // Answers sit under the page's own headings, so they start at h3.
            return b.level <= 2 ? <h3 key={i}>{inline(b.text)}</h3> : <h4 key={i}>{inline(b.text)}</h4>;
          case 'ul':
            return (
              <ul key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>{inline(it)}</li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>{inline(it)}</li>
                ))}
              </ol>
            );
          case 'code':
            return (
              <pre key={i} className="bcc-coach__code" data-lang={b.lang || undefined}>
                <code>{b.text}</code>
              </pre>
            );
        }
      })}
    </>
  );
}
