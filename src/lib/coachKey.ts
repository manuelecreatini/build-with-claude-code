/**
 * Storage for the AI coach's Anthropic API key and settings.
 *
 * The key is kept apart from the tools state (`bcc:v1`) on purpose: it never appears in a progress
 * export, and "Reset everything" in the tools does not touch it. By default it lives in
 * sessionStorage (gone when the tab closes); the visitor can opt in to localStorage ("remember on
 * this device"). It is only ever read by the coach, which sends it to api.anthropic.com and nowhere
 * else. Never log it.
 */

export const KEY_STORAGE = 'bcc:coach-key';
export const SETTINGS_STORAGE = 'bcc:coach-settings';

type Area = 'local' | 'session';

function area(which: Area): Storage | undefined {
  try {
    return which === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return undefined;
  }
}

function read(which: Area, key: string): string | null {
  try {
    return area(which)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function write(which: Area, key: string, value: string | null): void {
  try {
    const s = area(which);
    if (!s) return;
    if (value === null) s.removeItem(key);
    else s.setItem(key, value);
  } catch {
    // Storage blocked or full: the key then lives only in memory for this visit.
  }
}

/** A light shape check, so an obvious paste mistake is caught before any request. */
export function looksLikeKey(key: string): boolean {
  return /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(key.trim());
}

/** Last four characters, for showing which key is saved without revealing it. */
export function maskKey(key: string): string {
  const k = key.trim();
  return k.length > 4 ? `…${k.slice(-4)}` : '…';
}

export interface StoredKey {
  key: string;
  /** true when the key is in localStorage (survives closing the browser). */
  remember: boolean;
}

export function loadKey(): StoredKey | null {
  const local = read('local', KEY_STORAGE);
  if (local) return { key: local, remember: true };
  const session = read('session', KEY_STORAGE);
  if (session) return { key: session, remember: false };
  return null;
}

/** Saves the key in exactly one place and removes it from the other. */
export function saveKey(key: string, remember: boolean): void {
  const k = key.trim();
  write(remember ? 'local' : 'session', KEY_STORAGE, k);
  write(remember ? 'session' : 'local', KEY_STORAGE, null);
}

export function clearKey(): void {
  write('local', KEY_STORAGE, null);
  write('session', KEY_STORAGE, null);
}

export interface CoachSettings {
  model: string;
  /** Send the project details from the start wizard and the build loop with each question. */
  shareProject: boolean;
}

export function loadSettings(fallbackModel: string, models: readonly string[]): CoachSettings {
  const dflt = { model: fallbackModel, shareProject: true };
  const raw = read('local', SETTINGS_STORAGE);
  if (!raw) return dflt;
  try {
    const v = JSON.parse(raw) as Partial<CoachSettings>;
    return {
      model: typeof v.model === 'string' && models.includes(v.model) ? v.model : fallbackModel,
      shareProject: typeof v.shareProject === 'boolean' ? v.shareProject : true,
    };
  } catch {
    return dflt;
  }
}

export function saveSettings(s: CoachSettings): void {
  write('local', SETTINGS_STORAGE, JSON.stringify(s));
}
