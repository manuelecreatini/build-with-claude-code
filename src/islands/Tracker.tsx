import { useState } from 'react';
import { fmt, t, type Locale } from '~/lib/i18n';
import { useStore } from '~/lib/useStore';
import type { State } from '~/lib/store';
import type { ChecklistSection, ToolItem } from '~/data/tools';
import { CheckList, countDone } from './parts/CheckList';
import { DataControls } from './parts/DataControls';
import { copyText } from './parts/clipboard';

interface PhaseInfo {
  id: string;
  title: string;
  href: string;
}
interface Props {
  locale: Locale;
  phases: PhaseInfo[];
  checklist: ChecklistSection[];
  dod: Record<string, { title: string; items: ToolItem[] }>;
}

/** Master checklist + Definition of Done of every phase, with progress saved in this browser. */
export default function Tracker({ locale, phases, checklist, dod }: Props) {
  const [state] = useStore();
  const [copied, setCopied] = useState('');
  const groups = phases.map((p) => ({
    ...p,
    sections: checklist.filter((s) => s.phase === p.id),
    dod: dod[p.id],
  }));
  const itemsOf = (g: (typeof groups)[number]) => [...g.sections.flatMap((s) => s.items), ...(g.dod?.items ?? [])];
  const all = groups.flatMap(itemsOf);
  const done = countDone(state, all);

  const copy = async () => {
    const ok = await copyText(toMarkdown(locale, groups, state));
    setCopied(t(locale, ok ? 'tools.copied' : 'tools.copyError'));
  };

  return (
    <div className="bcc-tool bcc-tracker">
      <div className="bcc-progress">
        <progress max={all.length} value={done} aria-label={t(locale, 'tracker.checklist')} />
        <span>{fmt(t(locale, 'tracker.progress'), { done, total: all.length })}</span>
      </div>
      {groups.map((g) => {
        const items = itemsOf(g);
        const n = countDone(state, items);
        return (
          <details key={g.id} className="bcc-phase" data-phase={g.id} data-complete={n === items.length || undefined}>
            <summary>
              <span className="bcc-phase__title">{g.title}</span>
              <span className="bcc-phase__count">{fmt(t(locale, 'tracker.progress'), { done: n, total: items.length })}</span>
            </summary>
            {g.sections.map((s) => (
              <section key={s.id}>
                <h3>
                  {s.phase} · {s.title}
                </h3>
                <CheckList items={s.items} state={state} />
              </section>
            ))}
            {g.dod && (
              <section className="bcc-dod">
                <h3>{g.dod.title}</h3>
                <CheckList items={g.dod.items} state={state} />
              </section>
            )}
            <p>
              <a href={g.href}>{t(locale, 'tracker.openPhase')} →</a>
            </p>
          </details>
        );
      })}
      <div className="bcc-row">
        <button type="button" className="bcc-btn" onClick={copy}>
          {t(locale, 'tracker.copyMd')}
        </button>
        {copied && <span role="status">{copied}</span>}
      </div>
      <DataControls locale={locale} />
    </div>
  );
}

function toMarkdown(
  locale: Locale,
  groups: { title: string; sections: ChecklistSection[]; dod?: { title: string; items: ToolItem[] } }[],
  state: State,
): string {
  const box = (i: ToolItem) => `- [${state.checks[i.id] ? 'x' : ' '}] ${i.text}`;
  const out = [`## ${t(locale, 'tracker.checklist')}`, ''];
  for (const g of groups) {
    for (const s of g.sections) out.push(`### ${s.phase} · ${s.title}`, '', ...s.items.map(box), '');
    if (g.dod) out.push(`### ${g.dod.title}`, '', ...g.dod.items.map(box), '');
  }
  return out.join('\n');
}
