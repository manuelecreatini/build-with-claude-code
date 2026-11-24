/**
 * Browser side of the guide preferences: keeps the <html> attributes in sync with the store and
 * lets controls (header switcher, customize panel, tool-choice callouts) read and change them.
 */
import { defaultPrefs, normalizePrefs, prefsAttributes, type Prefs } from './prefs';
import { getState, setState, subscribe } from './store';

export function getPrefs(): Prefs {
  return getState().prefs;
}

/** Sets the data-* attributes on <html> and opens or folds the explanation panels for the level. */
export function applyPrefs(p: Prefs = getPrefs()): void {
  const html = document.documentElement;
  for (const [k, v] of Object.entries(prefsAttributes(p))) html.setAttribute(k, v);
  // Guided level: open every "Under the hood" panel. Remember which ones we opened, so switching
  // back folds only those and leaves the ones the visitor opened by hand.
  for (const d of document.querySelectorAll<HTMLDetailsElement>('details.bcc-hood')) {
    if (p.level === 'guided' && !d.open) {
      d.open = true;
      d.dataset.autoOpen = '';
    } else if (p.level !== 'guided' && 'autoOpen' in d.dataset) {
      d.open = false;
      delete d.dataset.autoOpen;
    }
  }
}

export function updatePrefs(change: (p: Prefs) => Prefs): void {
  setState((s) => ({ ...s, prefs: normalizePrefs(change(s.prefs)) }));
}

export function resetPrefs(): void {
  updatePrefs(() => defaultPrefs());
}

/** Calls `cb` now and after every change, in this tab or another one. */
export function onPrefs(cb: (p: Prefs) => void): void {
  cb(getPrefs());
  subscribe(() => cb(getPrefs()));
}

let started = false;
/** Wires the store to the page once, however many controls call it. */
export function startPrefs(): void {
  if (started) return;
  started = true;
  onPrefs(applyPrefs);
}
