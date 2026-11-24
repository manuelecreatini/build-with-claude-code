import { t, type Locale } from '~/lib/i18n';
import type { Loop } from '~/lib/store';
import { useStore } from '~/lib/useStore';

export interface LoopStep {
  /** 0 = preflight, 1–8 = the steps of the loop. */
  n: number;
  title: string;
  href: string;
}
interface Props {
  locale: Locale;
  steps: LoopStep[];
  contextHref: string;
}

/** The step that holds a gate: Claude stops there until the human says yes. */
export const GATE_AT: Record<number, keyof Loop['gates']> = { 1: 'G5', 6: 'G6' };
export const LAST_STEP = 8;

/** Pure transition used by the island and the unit tests: returns null when a gate blocks. */
export function advance(loop: Loop, today = new Date().toISOString().slice(0, 10)): Loop | null {
  const gate = GATE_AT[loop.step];
  if (gate && !loop.gates[gate]) return null;
  if (loop.step < LAST_STEP) return { ...loop, step: loop.step + 1 };
  return {
    bp: loop.bp + 1,
    title: '',
    step: 0,
    gates: { G5: false, G6: false },
    history: [{ bp: loop.bp, title: loop.title, closed: today }, ...loop.history].slice(0, 100),
  };
}

/** Companion for the 8-step build loop of Phase 5: where you are in the current build phase. */
export default function BuildLoop({ locale, steps, contextHref }: Props) {
  const [state, setState] = useStore();
  const loop = state.loop;
  const setLoop = (patch: Partial<Loop>) => setState((s) => ({ ...s, loop: { ...s.loop, ...patch } }));
  const gate = GATE_AT[loop.step];
  const blocked = !!gate && !loop.gates[gate];
  const current = steps.find((s) => s.n === loop.step);

  return (
    <div className="bcc-tool bcc-loop">
      <div className="bcc-field-group bcc-field-group--row">
        <label className="bcc-field bcc-field--narrow">
          <span>{t(locale, 'loop.number')}</span>
          <input
            type="number"
            min={1}
            max={999}
            value={loop.bp}
            onChange={(e) => setLoop({ bp: Math.min(999, Math.max(1, Number(e.target.value) || 1)) })}
          />
        </label>
        <label className="bcc-field">
          <span>{t(locale, 'loop.title')}</span>
          <input type="text" maxLength={200} value={loop.title} onChange={(e) => setLoop({ title: e.target.value })} />
        </label>
      </div>

      <ol className="bcc-steps">
        {steps.map((s) => {
          const status = s.n < loop.step ? 'done' : s.n === loop.step ? 'current' : 'todo';
          return (
            <li key={s.n} className={`bcc-step bcc-step--${status}`} aria-current={status === 'current' ? 'step' : undefined}>
              <span className="bcc-step__mark" aria-hidden="true">
                {status === 'done' ? '✓' : s.n === 0 ? '·' : s.n}
              </span>
              <span className="bcc-step__body">
                <a href={s.href}>{s.title}</a>
                {status === 'current' && <span className="bcc-step__here"> — {t(locale, 'loop.here')}</span>}
                {status === 'done' && <span className="sr-only"> ({t(locale, 'loop.done')})</span>}
              </span>
            </li>
          );
        })}
      </ol>

      {current && (
        <div className="bcc-loop__now">
          <p>
            <strong>
              BP-{String(loop.bp).padStart(2, '0')}
              {loop.title && ` · ${loop.title}`}
            </strong>
            {' — '}
            <a href={current.href}>{t(locale, 'loop.read')} →</a>
          </p>
          {gate && (
            <label className="bcc-loop__gate">
              <input
                type="checkbox"
                checked={loop.gates[gate]}
                onChange={(e) => setLoop({ gates: { ...loop.gates, [gate]: e.target.checked } })}
              />{' '}
              {t(locale, gate === 'G5' ? 'loop.G5' : 'loop.G6')}
            </label>
          )}
          {loop.step === LAST_STEP && (
            <p>
              <a href={contextHref}>{t(locale, 'loop.contextTool')} →</a>
            </p>
          )}
          {blocked && <p className="bcc-muted">{t(locale, 'loop.gateNeeded')}</p>}
          <div className="bcc-row">
            {loop.step > 0 && (
              <button type="button" className="bcc-btn" onClick={() => setLoop({ step: loop.step - 1 })}>
                ← {t(locale, 'loop.back')}
              </button>
            )}
            <button
              type="button"
              className="bcc-btn bcc-btn--primary"
              disabled={blocked}
              onClick={() => setState((s) => {
                const next = advance(s.loop);
                return next ? { ...s, loop: next } : s;
              })}
            >
              {loop.step === LAST_STEP ? t(locale, 'loop.finish') : `${t(locale, 'loop.advance')} →`}
            </button>
          </div>
        </div>
      )}

      {loop.history.length > 0 && (
        <details className="bcc-loop__history">
          <summary>
            {t(locale, 'loop.history')} ({loop.history.length})
          </summary>
          <ul>
            {loop.history.map((h, i) => (
              <li key={`${h.bp}-${i}`}>
                BP-{String(h.bp).padStart(2, '0')}
                {h.title && ` · ${h.title}`} <small>({h.closed})</small>
              </li>
            ))}
          </ul>
        </details>
      )}
      <p className="bcc-muted">{t(locale, 'tools.local')}</p>
    </div>
  );
}
