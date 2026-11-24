import { fmt, t, type Locale } from '~/lib/i18n';
import { useStore } from '~/lib/useStore';
import type { ToolItem } from '~/data/tools';
import { CheckList } from './parts/CheckList';
import { Inline } from './parts/Inline';

interface List {
  title: string;
  items: ToolItem[];
}
interface Props {
  locale: Locale;
  context: { start: List; during: List; end: List };
  t12Href: string;
}

export const BUDGET = 200_000;
/** Zone boundaries from T12: under 100k, 100–150k, 150–200k, over 200k. */
export const THRESHOLDS = [100_000, 150_000, 200_000];
const MAX = 250_000;

export function zoneOf(tokens: number): number {
  const i = THRESHOLDS.findIndex((limit) => tokens < limit);
  return i === -1 ? THRESHOLDS.length : i;
}

/** Context meter: enter the tokens in use and see which T12 zone you are in and what to do. */
export default function ContextMeter({ locale, context, t12Href }: Props) {
  const [state, setState] = useStore();
  const tokens = state.tokens;
  const setTokens = (n: number) => setState((s) => ({ ...s, tokens: Math.min(MAX, Math.max(0, Math.round(n) || 0)) }));
  const zone = zoneOf(tokens);
  const zones = context.during.items.slice(0, THRESHOLDS.length + 1);
  const tips = context.during.items.slice(THRESHOLDS.length + 1);
  const pct = Math.round((tokens / BUDGET) * 100);
  const clear = () =>
    setState((s) => {
      const checks = { ...s.checks };
      for (const i of [...context.start.items, ...context.end.items]) delete checks[i.id];
      return { ...s, checks };
    });

  return (
    <div className="bcc-tool bcc-ctx" data-zone={zone}>
      <label className="bcc-field">
        <span>{t(locale, 'ctx.tokens')}</span>
        <div className="bcc-ctx__inputs">
          <input
            type="number"
            min={0}
            max={MAX}
            step={1000}
            value={tokens}
            onChange={(e) => setTokens(Number(e.target.value))}
            className="bcc-ctx__number"
          />
          <input
            type="range"
            min={0}
            max={MAX}
            step={5000}
            value={tokens}
            onChange={(e) => setTokens(Number(e.target.value))}
            aria-label={t(locale, 'ctx.tokens')}
          />
        </div>
      </label>

      <div className="bcc-ctx__bar" aria-hidden="true">
        {THRESHOLDS.map((limit) => (
          <span key={limit} className="bcc-ctx__tick" style={{ left: `${(limit / MAX) * 100}%` }} />
        ))}
        <span className="bcc-ctx__fill" style={{ width: `${(tokens / MAX) * 100}%` }} />
      </div>
      <p className="bcc-muted">{fmt(t(locale, 'ctx.budget'), { pct })}</p>

      <h2>{t(locale, 'ctx.zone')}</h2>
      <ol className="bcc-zones">
        {zones.map((z, i) => (
          <li key={z.id} className={`bcc-zone bcc-zone--${i}`} aria-current={i === zone ? 'true' : undefined}>
            <Inline text={z.text} />
          </li>
        ))}
      </ol>
      {tips.map((tip) => (
        <p key={tip.id}>
          <Inline text={tip.text} />
        </p>
      ))}

      <h2>{context.start.title}</h2>
      <CheckList items={context.start.items} state={state} />
      <h2>{context.end.title}</h2>
      <CheckList items={context.end.items} state={state} />
      <div className="bcc-row">
        <button type="button" className="bcc-btn bcc-btn--small" onClick={clear}>
          {t(locale, 'ctx.clear')}
        </button>
      </div>
      <p className="bcc-muted">
        <a href={t12Href}>{t(locale, 'ctx.fromT12')}</a>
      </p>
    </div>
  );
}
