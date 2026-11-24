import { useEffect, useMemo, useState } from 'react';
import { fmt, t, type Locale } from '~/lib/i18n';
import { useStore } from '~/lib/useStore';
import { copyText, downloadText } from './parts/clipboard';

export interface TemplateInfo {
  id: string;
  title: string;
  lang: string;
  group: string;
  href: string;
  placeholders: string[];
  text: string;
}

interface Props {
  locale: Locale;
  templates: TemplateInfo[];
}

/** Fills the placeholders of a template. Exported for the unit tests. */
export function fill(text: string, values: Record<string, string>, placeholders: string[]): string {
  let out = text;
  for (const ph of [...placeholders].sort((a, b) => b.length - a.length)) {
    const v = values[ph]?.trim();
    if (v) out = out.split(ph).join(v);
  }
  return out;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Pick a template, fill in its placeholders once (values are shared and saved), copy or download it. */
export default function TemplateBuilder({ locale, templates }: Props) {
  const [state, setState] = useStore();
  const [id, setId] = useState(templates[0]?.id ?? '');
  const [msg, setMsg] = useState('');
  const tpl = templates.find((x) => x.id === id) ?? templates[0];

  // ?t=t7-1 preselects a template (template pages link here that way).
  useEffect(() => {
    const want = new URLSearchParams(location.search).get('t');
    if (want && templates.some((x) => x.id === want)) setId(want);
  }, [templates]);

  const groups = useMemo(() => {
    const m = new Map<string, TemplateInfo[]>();
    for (const x of templates) m.set(x.group, [...(m.get(x.group) ?? []), x]);
    return [...m];
  }, [templates]);

  if (!tpl) return null;
  const values = state.values;
  const result = fill(tpl.text, values, tpl.placeholders);
  const filled = tpl.placeholders.filter((ph) => values[ph]?.trim()).length;
  const open = tpl.placeholders.filter((ph) => !values[ph]?.trim());
  const pieces = open.length ? result.split(new RegExp(`(${open.map(escapeRe).join('|')})`, 'g')) : [result];

  const setValue = (ph: string, v: string) =>
    setState((s) => {
      const next = { ...s.values };
      if (v) next[ph] = v;
      else delete next[ph];
      return { ...s, values: next };
    });

  const filename = /\.\w+$/.test(tpl.title) ? tpl.title.split('/').pop()! : `${tpl.id}.${tpl.lang === 'markdown' ? 'md' : 'txt'}`;

  return (
    <div className="bcc-tool bcc-tpl">
      <label className="bcc-field">
        <span>{t(locale, 'tpl.choose')}</span>
        <select
          value={tpl.id}
          onChange={(e) => {
            setId(e.target.value);
            setMsg('');
          }}
        >
          {groups.map(([group, list]) => (
            <optgroup key={group} label={group}>
              {list.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.title}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <p>
        <a href={tpl.href}>{t(locale, 'tpl.page')} →</a>
      </p>

      <h2>{t(locale, 'tpl.fields')}</h2>
      {tpl.placeholders.length === 0 ? (
        <p>{t(locale, 'tpl.noFields')}</p>
      ) : (
        <>
          <p className="bcc-muted">
            {t(locale, 'tpl.shared')} {fmt(t(locale, 'tpl.filled'), { n: filled, total: tpl.placeholders.length })}
          </p>
          <div className="bcc-field-group">
            {tpl.placeholders.map((ph) => {
              const label = ph.replace(/^<|>$/g, '');
              const long = ph.length > 40;
              return (
                <label key={ph} className="bcc-field">
                  <span>{label}</span>
                  {long ? (
                    <textarea rows={2} value={values[ph] ?? ''} onChange={(e) => setValue(ph, e.target.value)} />
                  ) : (
                    <input type="text" value={values[ph] ?? ''} onChange={(e) => setValue(ph, e.target.value)} />
                  )}
                </label>
              );
            })}
          </div>
          <button type="button" className="bcc-btn bcc-btn--small" onClick={() => tpl.placeholders.forEach((ph) => setValue(ph, ''))}>
            {t(locale, 'tpl.clear')}
          </button>
        </>
      )}

      <h2>{t(locale, 'tpl.preview')}</h2>
      <div className="bcc-row">
        <button
          type="button"
          className="bcc-btn bcc-btn--primary"
          onClick={async () => setMsg(t(locale, (await copyText(result)) ? 'tools.copied' : 'tools.copyError'))}
        >
          {t(locale, 'tools.copy')}
        </button>
        <button type="button" className="bcc-btn" onClick={() => downloadText(filename, result)}>
          {t(locale, 'tools.download')} <code>{filename}</code>
        </button>
        {msg && <span role="status">{msg}</span>}
      </div>
      <pre className="bcc-tpl__out" tabIndex={0} aria-label={t(locale, 'tpl.preview')}>
        <code>{pieces.map((piece, i) => (open.includes(piece) ? <mark key={i}>{piece}</mark> : piece))}</code>
      </pre>
    </div>
  );
}
