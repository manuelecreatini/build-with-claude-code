import { useEffect, useRef, useState } from 'react';
import { fmt, t, type Locale } from '~/lib/i18n';
import { OSES, PROJECT_TYPES, type Os, type Project } from '~/lib/store';
import { useHydrated, useStore } from '~/lib/useStore';
import { planFor, wizardContent } from '~/data/wizard';
import { pathFor } from '~/lib/paths';
import { Inline } from './parts/Inline';

interface Props {
  locale: Locale;
  links: { f0: string; templates: string; tracker: string };
}

const TOTAL = 4;
/** Starlight keeps the chosen tab of synced tabs here; the F0 install section uses syncKey "os". */
const OS_TAB_KEY = 'starlight-synced-tabs__os';

/** Start-your-build wizard: three questions, then a starting plan built from the playbook's tables. */
export default function Wizard({ locale, links }: Props) {
  const [state, setState] = useStore();
  const hydrated = useHydrated();
  const [step, setStep] = useState(0);
  const [error, setError] = useState(false);
  const jumped = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const c = wizardContent[locale];
  const p = state.project;

  // A returning visitor who already answered everything goes straight to the plan.
  useEffect(() => {
    if (!hydrated || jumped.current) return;
    jumped.current = true;
    if (p.type && p.os) setStep(TOTAL - 1);
  }, [hydrated, p.type, p.os]);

  const update = (patch: Partial<Project>) =>
    setState((s) => {
      const values = { ...s.values };
      // Keep the template builder in sync with the product name, unless the visitor changed it there.
      if (patch.name !== undefined)
        for (const key of ['<Product name>', '<Product>'])
          if (!values[key] || values[key] === s.project.name) values[key] = patch.name;
      return { ...s, project: { ...s.project, ...patch }, values };
    });

  const go = (n: number) => {
    if (n > step && ((step === 1 && !p.type) || (step === 2 && !p.os))) return setError(true);
    setError(false);
    if (n === TOTAL - 1 && p.os) {
      try {
        localStorage.setItem(OS_TAB_KEY, c.os[p.os]);
      } catch {
        /* storage blocked: the F0 page just opens on its default tab */
      }
    }
    setStep(n);
    requestAnimationFrame(() => heading.current?.focus());
  };

  const titles = [t(locale, 'wizard.q.name'), t(locale, 'wizard.q.type'), t(locale, 'wizard.q.os'), t(locale, 'wizard.plan')];

  return (
    <div className="bcc-tool bcc-wizard">
      <p className="bcc-wizard__step">{fmt(t(locale, 'wizard.step'), { n: step + 1, total: TOTAL })}</p>
      <h2 ref={heading} tabIndex={-1}>
        {titles[step]}
      </h2>

      {step === 0 && (
        <div className="bcc-field-group">
          <label className="bcc-field">
            <span>{t(locale, 'wizard.name')}</span>
            <input type="text" value={p.name} maxLength={200} onChange={(e) => update({ name: e.target.value })} />
          </label>
          <label className="bcc-field">
            <span>{t(locale, 'wizard.idea')}</span>
            <textarea rows={2} value={p.idea} maxLength={1000} onChange={(e) => update({ idea: e.target.value })} />
          </label>
        </div>
      )}

      {step === 1 && (
        <>
          <fieldset className="bcc-choices">
            <legend className="sr-only">{titles[1]}</legend>
            {PROJECT_TYPES.map((type) => (
              <label key={type} className="bcc-choice">
                <input type="radio" name="bcc-type" checked={p.type === type} onChange={() => update({ type })} />
                <span>
                  <strong>{c.types[type].label}</strong>
                  <small>{c.types[type].note}</small>
                </span>
              </label>
            ))}
          </fieldset>
          <fieldset className="bcc-choices bcc-choices--inline">
            <legend>{t(locale, 'wizard.extras')}</legend>
            <label>
              <input type="checkbox" checked={p.mobile} onChange={(e) => update({ mobile: e.target.checked })} /> {t(locale, 'wizard.mobile')}
            </label>
            <label>
              <input type="checkbox" checked={p.ai} onChange={(e) => update({ ai: e.target.checked })} /> {t(locale, 'wizard.ai')}
            </label>
          </fieldset>
        </>
      )}

      {step === 2 && (
        <fieldset className="bcc-choices bcc-choices--inline">
          <legend className="sr-only">{titles[2]}</legend>
          {OSES.map((os: Os) => (
            <label key={os} className="bcc-choice">
              <input type="radio" name="bcc-os" checked={p.os === os} onChange={() => update({ os })} />
              <span>
                <strong>{c.os[os]}</strong>
              </span>
            </label>
          ))}
        </fieldset>
      )}

      {step === 3 && p.type && <Plan locale={locale} project={p} links={links} />}

      {error && (
        <p className="bcc-error" role="alert">
          {t(locale, 'wizard.required')}
        </p>
      )}

      <div className="bcc-row">
        {step > 0 && (
          <button type="button" className="bcc-btn" onClick={() => go(step - 1)}>
            ← {t(locale, 'wizard.back')}
          </button>
        )}
        {step < TOTAL - 1 ? (
          <button type="button" className="bcc-btn bcc-btn--primary" onClick={() => go(step + 1)}>
            {t(locale, 'wizard.next')} →
          </button>
        ) : (
          <button type="button" className="bcc-btn" onClick={() => go(0)}>
            {t(locale, 'wizard.restart')}
          </button>
        )}
      </div>
    </div>
  );
}

function Plan({ locale, project, links }: { locale: Locale; project: Project; links: Props['links'] }) {
  const c = wizardContent[locale];
  if (!project.type) return null;
  const plan = planFor(project.type, project.mobile, project.ai);
  const type = c.types[project.type];
  const src = (k: keyof typeof c.sources) => (
    <a className="bcc-plan__src" href={pathFor(locale, c.sources[k][0], c.sources[k][1])}>
      {t(locale, 'tools.source')} →
    </a>
  );

  return (
    <div className="bcc-plan">
      {project.name && (
        <p className="bcc-plan__name">
          <strong>{project.name}</strong>
          {project.idea && <> — {project.idea}</>}
        </p>
      )}
      <p>{t(locale, 'wizard.planIntro')}</p>

      <h3>{t(locale, 'wizard.phases')}</h3>
      <p>
        <strong className="bcc-plan__big">{type.phases}</strong> {type.label}. {type.note} {src('phases')}
      </p>

      <h3>{t(locale, 'wizard.discovery')}</h3>
      <p>
        <Inline text={c.discovery[plan.discovery]} /> {src('discovery')}
      </p>

      <h3>{t(locale, 'wizard.stack')}</h3>
      <dl className="bcc-plan__stack">
        {plan.stack.map((k) => (
          <div key={k}>
            <dt>{c.stack[k].need}</dt>
            <dd>
              {c.stack[k].pick}
              {k === 'web' && project.type === 'landing' && c.stack.web.alt && <small> · {c.stack.web.alt}</small>}
            </dd>
          </div>
        ))}
      </dl>
      <p>{src('stack')}</p>

      <h3>{t(locale, 'wizard.tests')}</h3>
      {plan.tests.map((k) => (
        <div key={k} className="bcc-plan__tests">
          <p>
            <strong>{c.tests[k].label}:</strong> <Inline text={c.tests[k].minimum} />
          </p>
          <p>
            <em>{t(locale, 'wizard.recommended')}:</em> <Inline text={c.tests[k].recommended} />
          </p>
        </div>
      ))}
      <p>{src('tests')}</p>

      <h3>{t(locale, 'wizard.nextTitle')}</h3>
      <ol className="bcc-plan__next">
        <li>
          <a href={links.f0}>{t(locale, 'wizard.toF0')}</a>
          {project.os && <small> {fmt(t(locale, 'wizard.osNote'), { os: c.os[project.os] })}</small>}
        </li>
        <li>
          <a href={links.templates}>{t(locale, 'wizard.toTemplates')}</a>
        </li>
        <li>
          <a href={links.tracker}>{t(locale, 'wizard.toTracker')}</a>
        </li>
      </ol>
    </div>
  );
}
