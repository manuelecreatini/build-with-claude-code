/**
 * Visitor state for the interactive tools. Lives only in this browser's localStorage: nothing is
 * sent anywhere. Every read and write is wrapped in try/catch because storage can be missing or
 * blocked (private windows, strict privacy settings); the tools then work for the current visit.
 *
 * The state is plain JSON so it can be exported to a file and imported on another computer.
 */

export const STORE_KEY = 'bcc:v1';
export const EXPORT_TAG = 'build-with-claude-code';

export const PROJECT_TYPES = ['landing', 'internal', 'saas', 'marketplace'] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];
export const OSES = ['windows', 'macos', 'linux'] as const;
export type Os = (typeof OSES)[number];

export interface Project {
  name: string;
  idea: string;
  type: ProjectType | '';
  mobile: boolean;
  ai: boolean;
  os: Os | '';
}

/** Build loop companion: the build phase in progress and where you are in the 8 steps. */
export interface Loop {
  bp: number;
  title: string;
  /** 0 = preflight, 1–8 = the steps. */
  step: number;
  gates: { G5: boolean; G6: boolean };
  history: { bp: number; title: string; closed: string }[];
}

export interface State {
  version: 1;
  project: Project;
  /** Checked items (checklist, Definition of Done, T12 lists), keyed by item id. */
  checks: Record<string, boolean>;
  /** Template placeholder values, keyed by the placeholder text (e.g. "<Product name>"). */
  values: Record<string, string>;
  loop: Loop;
  /** Context meter: the last token count entered. */
  tokens: number;
  updatedAt: string;
}

export function defaultState(): State {
  return {
    version: 1,
    project: { name: '', idea: '', type: '', mobile: false, ai: false, os: '' },
    checks: {},
    values: {},
    loop: { bp: 1, title: '', step: 0, gates: { G5: false, G6: false }, history: [] },
    tokens: 0,
    updatedAt: '',
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, max = 2000) => (typeof v === 'string' ? v.slice(0, max) : '');
const int = (v: unknown, min: number, max: number, dflt: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : dflt;
const oneOf = <T extends string>(v: unknown, list: readonly T[]): T | '' => (list.includes(v as T) ? (v as T) : '');

/** Accepts anything (old versions, hand-edited files) and returns a valid State. */
export function normalize(raw: unknown): State {
  const d = defaultState();
  if (!isObj(raw)) return d;
  const p = isObj(raw.project) ? raw.project : {};
  const l = isObj(raw.loop) ? raw.loop : {};
  const g = isObj(l.gates) ? l.gates : {};
  const checks: Record<string, boolean> = {};
  if (isObj(raw.checks)) for (const [k, v] of Object.entries(raw.checks)) if (v === true) checks[k.slice(0, 64)] = true;
  const values: Record<string, string> = {};
  if (isObj(raw.values)) for (const [k, v] of Object.entries(raw.values)) if (typeof v === 'string') values[k.slice(0, 300)] = v.slice(0, 5000);
  const history = Array.isArray(l.history)
    ? l.history.filter(isObj).slice(0, 200).map((h) => ({ bp: int(h.bp, 1, 999, 1), title: str(h.title, 200), closed: str(h.closed, 40) }))
    : [];
  return {
    version: 1,
    project: {
      name: str(p.name, 200),
      idea: str(p.idea, 1000),
      type: oneOf(p.type, PROJECT_TYPES),
      mobile: p.mobile === true,
      ai: p.ai === true,
      os: oneOf(p.os, OSES),
    },
    checks,
    values,
    loop: {
      bp: int(l.bp, 1, 999, 1),
      title: str(l.title, 200),
      step: int(l.step, 0, 8, 0),
      gates: { G5: g.G5 === true, G6: g.G6 === true },
      history,
    },
    tokens: int(raw.tokens, 0, 2_000_000, 0),
    updatedAt: str(raw.updatedAt, 40),
  };
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function storage(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function load(s: StorageLike | null = storage()): State {
  try {
    const text = s?.getItem(STORE_KEY);
    return text ? normalize(JSON.parse(text)) : defaultState();
  } catch {
    return defaultState();
  }
}

export function save(state: State, s: StorageLike | null = storage()): boolean {
  try {
    if (!s) return false;
    s.setItem(STORE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/** The file a visitor downloads: the state plus a tag so imports can recognise it. */
export function exportState(state: State): string {
  return JSON.stringify({ app: EXPORT_TAG, ...state }, null, 2);
}

/** Parses an exported file. Throws if it is not JSON or not one of our exports. */
export function importState(text: string): State {
  const raw: unknown = JSON.parse(text);
  if (!isObj(raw) || raw.app !== EXPORT_TAG) throw new Error('not-an-export');
  return normalize(raw);
}

// ---------------------------------------------------------------------------
// Shared in-page store: every island on the page sees the same state, and other tabs
// pick up changes through the `storage` event.
// ---------------------------------------------------------------------------

const SERVER_STATE = defaultState();
let cache: State | null = null;
const listeners = new Set<() => void>();

export const getServerState = () => SERVER_STATE;

export function getState(): State {
  if (!cache) cache = load();
  return cache;
}

export function setState(update: (s: State) => State): void {
  cache = { ...update(getState()), updatedAt: new Date().toISOString() };
  save(cache);
  listeners.forEach((l) => l());
}

export function replaceState(next: State): void {
  setState(() => next);
}

export function resetState(): void {
  try {
    storage()?.removeItem(STORE_KEY);
  } catch {
    /* storage blocked: the in-memory reset below still applies */
  }
  cache = defaultState();
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORE_KEY && e.key !== null) return;
    cache = load();
    listener();
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}
