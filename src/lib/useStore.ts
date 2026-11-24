import { useSyncExternalStore } from 'react';
import { getServerState, getState, setState, subscribe, type State } from './store';

/**
 * React binding for the tools store. During hydration React renders the server snapshot
 * (the empty default state), then re-renders with what this browser has saved.
 */
export function useStore(): [State, (update: (s: State) => State) => void] {
  const state = useSyncExternalStore(subscribe, getState, getServerState);
  return [state, setState];
}

/** True once the component runs in the browser with the saved state loaded. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
