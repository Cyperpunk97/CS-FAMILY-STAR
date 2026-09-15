'use client';

import { useCallback, useEffect, useMemo } from 'react';
import {
  DEFAULT_LOCALE,
  directionOf,
  isLocale,
  translate,
  type Locale,
  type MessageKey,
  type MessageValues,
} from '@/lib/i18n';
import { createLocalStore, useLocalStore } from './useLocalStore';

/**
 * The chosen language, persisted per browser.
 *
 * This deliberately uses the same `createLocalStore` primitive as favourites and the
 * student name rather than a React context. The store gives a distinct server
 * snapshot, so server HTML and the first client render always agree — with a context
 * seeded from localStorage in an effect, every page would render English first and
 * then flip, which is exactly the hydration flash this codebase already avoids
 * elsewhere.
 */
const localeStore = createLocalStore<Locale>({
  key: 'fue_locale',
  fallback: DEFAULT_LOCALE,
  parse: (raw) => (isLocale(raw) ? raw : DEFAULT_LOCALE),
  serialize: (value) => value,
});

export function useLocale() {
  const locale = useLocalStore(localeStore);

  const setLocale = useCallback((next: Locale) => {
    localeStore.set(next);
  }, []);

  const toggleLocale = useCallback(() => {
    localeStore.set(localeStore.getSnapshot() === 'ar' ? 'en' : 'ar');
  }, []);

  return { locale, setLocale, toggleLocale, direction: directionOf(locale) };
}

/**
 * Returns a bound `t(key, values)`.
 *
 * Memoised on locale so passing `t` into a child's dependency array does not
 * re-run effects on every render.
 */
export function useTranslate() {
  const { locale } = useLocale();

  return useMemo(() => {
    const t = (key: MessageKey, values?: MessageValues) => translate(locale, key, values);
    return { t, locale };
  }, [locale]);
}

/**
 * Keeps `<html lang>` and `<html dir>` in step with the chosen locale.
 *
 * The document element is owned by the server-rendered layout, so this writes to it
 * directly rather than through React. Without the `dir` flip, Arabic renders as
 * left-aligned RTL text, which is worse than not translating at all.
 */
export function useDocumentLocale(): void {
  const { locale, direction } = useLocale();

  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = direction;
  }, [locale, direction]);
}
