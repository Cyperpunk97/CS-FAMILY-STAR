'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * A single query-string parameter, as React state backed by the URL.
 * Works seamlessly in sandboxed iframes, preview environments, and mobile browsers.
 */
export function useUrlParam(name: string): [string | null, (value: string | null) => void] {
  const [value, setValueState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return new URLSearchParams(window.location.search).get(name);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handlePop = () => {
      try {
        const val = new URLSearchParams(window.location.search).get(name);
        setValueState(val);
      } catch {
        // ignore
      }
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [name]);

  const setValue = useCallback(
    (next: string | null) => {
      setValueState(next);

      try {
        const url = new URL(window.location.href);
        if (next === null) {
          url.searchParams.delete(name);
          const newUrl = url.pathname + (url.search ? url.search : '') + url.hash;
          window.history.replaceState(null, '', newUrl);
        } else {
          url.searchParams.set(name, next);
          const newUrl = url.pathname + url.search + url.hash;
          window.history.pushState(null, '', newUrl);
        }
      } catch {
        // In sandboxed iframes, pushState may be restricted, but React state ensures everything works
      }
    },
    [name]
  );

  return [value, setValue];
}

