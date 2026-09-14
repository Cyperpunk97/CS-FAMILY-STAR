'use client';

import { useCallback } from 'react';
import { createLocalStore, useLocalStore } from './useLocalStore';

const EMPTY: ReadonlySet<string> = new Set();

/** Module-level so every component shares one store and stays in sync. */
const favoritesStore = createLocalStore<ReadonlySet<string>>({
  key: 'fue_favourite_spots',
  fallback: EMPTY,
  parse: (raw) => {
    if (!raw) return EMPTY;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return EMPTY;
      return new Set(parsed.filter((id): id is string => typeof id === 'string'));
    } catch {
      return EMPTY; // Corrupt JSON — behave as if nothing was saved.
    }
  },
  serialize: (value) => JSON.stringify([...value]),
});

/** Saved spots, persisted per browser and synced across open tabs. */
export function useFavorites() {
  const favorites = useLocalStore(favoritesStore);

  const toggle = useCallback((id: string) => {
    const next = new Set(favoritesStore.getSnapshot());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    favoritesStore.set(next);
  }, []);

  return { favorites, toggle };
}
