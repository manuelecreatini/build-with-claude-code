import { useEffect, useId, useRef, useState } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import { fmt, t, type Locale, type UiKey } from '~/lib/i18n';
import { useStore } from '~/lib/useStore';
import {
  API_BASE_URL,
  DEFAULT_MODEL,
  MAX_QUESTIONS,
  MODEL_IDS,
  MODELS,
  QUESTION_LIMIT,
  answerText,
  buildRequest,
  echoContent,
  errorKind,
  pageTextFromHtml,
  projectSummary,
  servedByFallback,
  systemBlocks,
  type CoachErrorKind,
  type PageContext,
} from '~/lib/coach';
import { clearKey, loadKey, loadSettings, looksLikeKey, maskKey, saveKey, saveSettings, type CoachSettings, type StoredKey } from '~/lib/coachKey';
import { Markdown } from './parts/Markdown';

interface PageOption {
  slug: string;
  title: string;
  path: string;
}
interface Props {
  locale: Locale;
  /** The fixed system prompt (role, rules, site map), built at build time. */
  base: string;
  pages: PageOption[];
}

interface Turn {
  role: 'user' | 'assistant';
  text: string;
  meta?: string;
  fallback?: boolean;
  cutOff?: boolean;
}

type PageStatus = 'idle' | 'loading' | 'ready' | 'error';
type BetaStream = ReturnType<Anthropic['beta']['messages']['stream']>;

const ERROR_KEYS: Record<Exclude<CoachErrorKind, 'aborted'>, UiKey> = {
  auth: 'coach.err.auth',
  rate: 'coach.err.rate',
  bad: 'coach.err.bad',
  billing: 'coach.err.billing',
  connection: 'coach.err.connection',
  api: 'coach.err.api',
  unknown: 'coach.err.unknown',
};

/** The message an SDK error carries, without anything from the request (so never the key). */
function errorDetail(e: unknown): string {
  if (e instanceof Anthropic.APIError) {
    const body = e.error as { error?: { message?: unknown } } | undefined;
    const msg = body?.error?.message;
    if (typeof msg === 'string') return msg;
  }
  return e instanceof Error ? e.message : String(e);
}

/**
 * AI coach: questions about the playbook, answered by Claude with the visitor's own API key.
 * The browser talks to api.anthropic.com directly; this site never sees the key or the chat.
 */
export default function Coach({ locale, base, pages }: Props) {
  const id = useId();
  const [state] = useStore();
  const [ready, setReady] = useState(false);
  const [stored, setStored] = useState<StoredKey | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [remember, setRemember] = useState(false);
  const [keyError, setKeyError] = useState(false);
  const [settings, setSettings] = useState<CoachSettings>({ model: DEFAULT_MODEL, shareProject: true });
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [pageSlug, setPageSlug] = useState('');
  const [page, setPage] = useState<PageContext | null>(null);
  const [pageStatus, setPageStatus] = useState<PageStatus>('idle');

  const [question, setQuestion] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [history, setHistory] = useState<Anthropic.Beta.BetaMessageParam[]>([]);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState('');
  const [error, setError] = useState<string | null>(null);

  const systemRef = useRef<Anthropic.Beta.BetaTextBlockParam[] | null>(null);
  const streamRef = useRef<BetaStream | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Browser-only state is read after hydration.
  useEffect(() => {
    const k = loadKey();
    setStored(k);
    setRemember(k?.remember ?? false);
    setSettingsOpen(!k);
    setSettings(loadSettings(DEFAULT_MODEL, MODEL_IDS));
    const wanted = new URLSearchParams(window.location.search).get('page');
    if (wanted && pages.some((p) => p.slug === wanted)) setPageSlug(wanted);
    setReady(true);
    return () => streamRef.current?.abort();
  }, [pages]);

  // Load the chosen page's text from this site.
  useEffect(() => {
    const opt = pages.find((p) => p.slug === pageSlug);
    if (!opt) {
      setPage(null);
      setPageStatus('idle');
      return;
    }
    const ctrl = new AbortController();
    setPageStatus('loading');
    fetch(opt.path, { signal: ctrl.signal, credentials: 'same-origin' })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((html) => {
        const { text } = pageTextFromHtml(html);
        if (!text) throw new Error('empty');
        setPage({ title: opt.title, path: opt.path, text });
        setPageStatus('ready');
      })
      .catch(() => {
        if (ctrl.signal.aborted) return;
        setPage(null);
        setPageStatus('error');
      });
    return () => ctrl.abort();
  }, [pageSlug, pages]);

  const started = history.length > 0;
  const asked = turns.filter((x) => x.role === 'user').length;
  const atLimit = asked >= MAX_QUESTIONS;
  const canSend = ready && !!stored && !busy && !atLimit && pageStatus !== 'loading' && question.trim().length > 0;

  const updateSettings = (next: Partial<CoachSettings>) => {
    const s = { ...settings, ...next };
    setSettings(s);
    saveSettings(s);
  };

  const onSaveKey = () => {
    const k = keyInput.trim();
    if (!looksLikeKey(k)) {
      setKeyError(true);
      return;
    }
    saveKey(k, remember);
    setStored({ key: k, remember });
    setKeyInput('');
    setKeyError(false);
    setSettingsOpen(false);
  };

  const onRemoveKey = () => {
    clearKey();
    setStored(null);
    setSettingsOpen(true);
  };

  const onRememberChange = (value: boolean) => {
    setRemember(value);
    // Moving an already saved key between this tab and this device.
    if (stored) {
      saveKey(stored.key, value);
      setStored({ key: stored.key, remember: value });
    }
  };

  const newConversation = () => {
    streamRef.current?.abort();
    systemRef.current = null;
    setHistory([]);
    setTurns([]);
    setError(null);
    setLive('');
    inputRef.current?.focus();
  };

  const send = async () => {
    if (!canSend || !stored) return;
    const q = question.trim().slice(0, QUESTION_LIMIT);
    const firstTurn = history.length === 0;
    if (firstTurn || !systemRef.current) {
      const project = settings.shareProject ? projectSummary(state) : '';
      systemRef.current = systemBlocks(base, { project: project || undefined, page });
    }
    const system = systemRef.current;
    const messages: Anthropic.Beta.BetaMessageParam[] = [...history, { role: 'user', content: q }];

    setTurns((ts) => [...ts, { role: 'user', text: q }]);
    setQuestion('');
    setError(null);
    setLive('');
    setBusy(true);

    const undo = (message: string | null) => {
      setTurns((ts) => ts.slice(0, -1));
      setQuestion(q);
      setError(message);
      if (firstTurn) systemRef.current = null;
    };

    try {
      const client = new Anthropic({
        apiKey: stored.key,
        baseURL: API_BASE_URL,
        dangerouslyAllowBrowser: true,
        logLevel: 'off',
      });
      const stream = client.beta.messages.stream(buildRequest(settings.model, system, messages));
      streamRef.current = stream;
      stream.on('text', (delta) => setLive((s) => s + delta));
      const msg = await stream.finalMessage();

      if (msg.stop_reason === 'refusal') {
        const why = msg.stop_details?.explanation;
        undo(why ? `${t(locale, 'coach.refusal')} ${fmt(t(locale, 'coach.refusalWhy'), { why })}` : t(locale, 'coach.refusal'));
        return;
      }

      const u = msg.usage;
      const input = u.input_tokens + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0);
      const label = MODELS.find((m) => m.id === msg.model)?.label ?? msg.model;
      setHistory([...messages, { role: 'assistant', content: echoContent(msg.content) }]);
      setTurns((ts) => [
        ...ts,
        {
          role: 'assistant',
          text: answerText(msg.content),
          meta: fmt(t(locale, 'coach.meta'), {
            model: label,
            input: input.toLocaleString(locale),
            output: u.output_tokens.toLocaleString(locale),
          }),
          fallback: servedByFallback(msg),
          cutOff: msg.stop_reason === 'max_tokens',
        },
      ]);
    } catch (e) {
      const kind = errorKind(e);
      undo(kind === 'aborted' ? null : fmt(t(locale, ERROR_KEYS[kind]), { msg: errorDetail(e) }));
    } finally {
      streamRef.current = null;
      setBusy(false);
      setLive('');
    }
  };

  const modelInfo = MODELS.find((m) => m.id === settings.model) ?? MODELS[0];

  return (
    <div className="bcc-tool bcc-coach" data-hydrated={ready ? '' : undefined}>
      <details className="bcc-coach__settings" open={settingsOpen} onToggle={(e) => setSettingsOpen(e.currentTarget.open)}>
        <summary>
          {t(locale, 'coach.settings')}
          {stored && <span className="bcc-muted"> · {modelInfo.label} · {maskKey(stored.key)}</span>}
        </summary>

        <p className="bcc-coach__privacy">{t(locale, 'coach.privacy')}</p>

        <div className="bcc-field">
          <label htmlFor={`${id}-key`}>{t(locale, 'coach.key')}</label>
          {stored ? (
            <div className="bcc-row">
              <span>{fmt(t(locale, stored.remember ? 'coach.keyLocal' : 'coach.keySession'), { mask: maskKey(stored.key) })}</span>
              <button type="button" className="bcc-btn bcc-btn--small bcc-btn--danger" onClick={onRemoveKey}>
                {t(locale, 'coach.removeKey')}
              </button>
            </div>
          ) : (
            <form
              className="bcc-row"
              onSubmit={(e) => {
                e.preventDefault();
                onSaveKey();
              }}
            >
              <input
                id={`${id}-key`}
                type="password"
                autoComplete="off"
                spellCheck={false}
                placeholder="sk-ant-…"
                value={keyInput}
                aria-invalid={keyError || undefined}
                aria-describedby={`${id}-keyhelp`}
                onChange={(e) => {
                  setKeyInput(e.target.value);
                  setKeyError(false);
                }}
              />
              <button type="submit" className="bcc-btn bcc-btn--primary" disabled={!keyInput.trim()}>
                {t(locale, 'coach.saveKey')}
              </button>
            </form>
          )}
          {keyError && (
            <p className="bcc-error" role="alert">
              {t(locale, 'coach.keyInvalid')}
            </p>
          )}
          <p id={`${id}-keyhelp`} className="bcc-muted">
            {t(locale, 'coach.keyHelp')}
          </p>
          <label className="bcc-check">
            <input type="checkbox" checked={remember} onChange={(e) => onRememberChange(e.target.checked)} />
            {t(locale, 'coach.remember')}
          </label>
        </div>

        <div className="bcc-field">
          <label htmlFor={`${id}-model`}>{t(locale, 'coach.model')}</label>
          <select id={`${id}-model`} value={settings.model} disabled={started || busy} onChange={(e) => updateSettings({ model: e.target.value })}>
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} ({m.price} {t(locale, 'coach.price')})
              </option>
            ))}
          </select>
          {modelInfo.fallback && <p className="bcc-muted">{t(locale, 'coach.fallback')}</p>}
        </div>

        <label className="bcc-check">
          <input type="checkbox" checked={settings.shareProject} disabled={started || busy} onChange={(e) => updateSettings({ shareProject: e.target.checked })} />
          {t(locale, 'coach.shareProject')}
        </label>
      </details>

      <div className="bcc-field">
        <label htmlFor={`${id}-page`}>{t(locale, 'coach.page')}</label>
        <select id={`${id}-page`} value={pageSlug} disabled={started || busy} onChange={(e) => setPageSlug(e.target.value)}>
          <option value="">{t(locale, 'coach.noPage')}</option>
          {pages.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.title}
            </option>
          ))}
        </select>
        {pageStatus === 'loading' && <p className="bcc-muted">{t(locale, 'coach.pageLoading')}</p>}
        {pageStatus === 'error' && <p className="bcc-error">{t(locale, 'coach.pageError')}</p>}
      </div>
      {started && <p className="bcc-muted">{t(locale, 'coach.locked')}</p>}

      <div className="bcc-coach__log" aria-busy={busy || undefined}>
        {turns.map((turn, i) => (
          <div key={i} className={`bcc-coach__turn bcc-coach__turn--${turn.role}`}>
            <div className="bcc-coach__who">{t(locale, turn.role === 'user' ? 'coach.you' : 'coach.coach')}</div>
            {turn.role === 'user' ? (
              <p className="bcc-coach__q">{turn.text}</p>
            ) : (
              <div className="bcc-coach__a">
                <Markdown text={turn.text} />
                {turn.cutOff && <p className="bcc-coach__note">{t(locale, 'coach.cutOff')}</p>}
                {turn.fallback && <p className="bcc-coach__note">{t(locale, 'coach.fallbackUsed')}</p>}
                {turn.meta && <p className="bcc-coach__meta">{turn.meta}</p>}
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="bcc-coach__turn bcc-coach__turn--assistant">
            <div className="bcc-coach__who">{t(locale, 'coach.coach')}</div>
            <div className="bcc-coach__a">{live ? <Markdown text={live} /> : <p className="bcc-coach__thinking">{t(locale, 'coach.thinking')}</p>}</div>
          </div>
        )}
      </div>

      <p className="sr-only" role="status">
        {busy ? t(locale, 'coach.thinking') : ''}
      </p>
      {error && (
        <p className="bcc-error" role="alert">
          {error}
        </p>
      )}
      {atLimit && <p className="bcc-coach__note">{fmt(t(locale, 'coach.limit'), { n: String(MAX_QUESTIONS) })}</p>}
      {ready && !stored && <p className="bcc-coach__note">{t(locale, 'coach.needKey')}</p>}

      <form
        className="bcc-coach__ask"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <label htmlFor={`${id}-q`}>{t(locale, 'coach.question')}</label>
        <textarea
          id={`${id}-q`}
          ref={inputRef}
          rows={3}
          maxLength={QUESTION_LIMIT}
          placeholder={t(locale, 'coach.placeholder')}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <div className="bcc-row">
          {busy ? (
            <button type="button" className="bcc-btn" onClick={() => streamRef.current?.abort()}>
              {t(locale, 'coach.stop')}
            </button>
          ) : (
            <button type="submit" className="bcc-btn bcc-btn--primary" disabled={!canSend}>
              {t(locale, 'coach.send')}
            </button>
          )}
          {turns.length > 0 && (
            <button type="button" className="bcc-btn" onClick={newConversation} disabled={busy}>
              {t(locale, 'coach.new')}
            </button>
          )}
        </div>
      </form>
      <p className="bcc-muted">{t(locale, 'coach.disclaimer')}</p>
    </div>
  );
}
