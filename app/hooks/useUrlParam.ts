'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * A single query-string parameter, as React state backed by the URL.
 *
 * Using the URL rather than component state buys three things for free:
 *  - Sharing a spot works, because the link already carries it.
 *  - The phone's back gesture closes the open sheet instead of leaving the app.
 *  - No `useEffect` + `setState` on mount, so no double render and no hydration
 *    mismatch — `useSyncExternalStore` is given an explicit server snapshot.
 */

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Covers the back/forward buttons; pushState below notifies us directly.
  window.addEventListener('popstate', emit);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('popstate', emit);
  };
}

// getSnapshot runs during render and must be referentially stable, so the parsed
// value is cached against the raw search string it came from.
let cachedSearch: string | null = null;
let cachedParams: URLSearchParams = new URLSearchParams();

function currentParams(): URLSearchParams {
  const search = window.location.search;
  if (search !== cachedSearch) {
    cachedSearch = search;
    cachedParams = new URLSearchParams(search);
  }
  return cachedParams;
}

export function useUrlParam(name: string): [string | null, (value: string | null) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => currentParams().get(name),
    () => null // Server and first client render agree: nothing selected.
  );

  const setValue = useCallback(
    (next: string | null) => {
      const url = new URL(window.location.href);

      if (next === null) {
        if (!url.searchParams.has(name)) return;
        url.searchParams.delete(name);
        // Replace, so closing a sheet does not pile up history entries.
        window.history.replaceState(window.history.state, '', url);
      } else {
        if (url.searchParams.get(name) === next) return;
        url.searchParams.set(name, next);
        // Push, so the back gesture closes the sheet.
        window.history.pushState(window.history.state, '', url);
      }

      emit(); // history.pushState/replaceState never fire popstate.
    },
    [name]
  );

  return [value, setValue];
}
