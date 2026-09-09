'use client';

import { useSyncExternalStore } from 'react';

/**
 * localStorage as a React external store.
 *
 * The obvious approach — `useState('')` plus a `useEffect` that reads localStorage
 * and calls `setState` — triggers React 19's `set-state-in-effect` rule, and for
 * good reason: it renders once with the wrong value and then immediately re-renders.
 * `useSyncExternalStore` is the primitive built for this. It also gives a distinct
 * server snapshot, so server HTML and the first client render always agree, and it
 * keeps tabs in sync through the `storage` event for free.
 */

type Listener = () => void;

export interface LocalStore<T> {
  subscribe: (listener: Listener) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  set: (value: T) => void;
}

export function createLocalStore<T>(options: {
  key: string;
  /** Runs on the raw string from storage. Must not throw. */
  parse: (raw: string | null) => T;
  serialize: (value: T) => string;
  /** Used on the server and before storage has been read. */
  fallback: T;
}): LocalStore<T> {
  const { key, parse, serialize, fallback } = options;

  const listeners = new Set<Listener>();
  let cachedRaw: string | null = null;
  let cachedValue: T = fallback;
  let primed = false;

  const emit = () => {
    for (const listener of listeners) listener();
  };

  const onStorageEvent = (event: StorageEvent) => {
    if (event.key === key || event.key === null) {
      primed = false;
      emit();
    }
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      window.addEventListener('storage', onStorageEvent);
      return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', onStorageEvent);
      };
    },

    /**
     * Called during render, so it must return a stable reference when nothing has
     * changed — re-parsing into a fresh object every call would loop forever.
     * The raw string is the cache key.
     */
    getSnapshot() {
      let raw: string | null = null;
      try {
        raw = localStorage.getItem(key);
      } catch {
        raw = null; // Private mode or storage disabled.
      }

      if (!primed || raw !== cachedRaw) {
        cachedRaw = raw;
        cachedValue = parse(raw);
        primed = true;
      }
      return cachedValue;
    },

    getServerSnapshot() {
      return fallback;
    },

    set(value) {
      const raw = serialize(value);
      try {
        localStorage.setItem(key, raw);
      } catch {
        // Private mode or a full quota. The value is still cached below, so the UI
        // updates for this session; it just will not survive a reload.
      }
      // Seeding the cache with what we just wrote keeps getSnapshot stable without
      // a redundant parse on the very next render.
      cachedRaw = raw;
      cachedValue = value;
      primed = true;
      emit();
    },
  };
}

export function useLocalStore<T>(store: LocalStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}
