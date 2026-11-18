'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { writePreference } from './storage';

const EVENT = 'stripe-clone:preference';

function subscribe(listener: () => void) {
  window.addEventListener(EVENT, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * A persisted UI preference backed by `localStorage`, read through
 * `useSyncExternalStore` so the server render (default value) and the client
 * render agree, and every component using the same key stays in sync.
 */
export function usePreference<T>(key: string, fallback: T): [T, (value: T) => void] {
  // Snapshots must be stable between calls, so compare raw strings and parse once.
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => null,
  );
  const value = useMemo<T>(() => {
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
    // `fallback` is intentionally excluded: callers pass literals.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);

  const setValue = useCallback(
    (next: T) => {
      writePreference(key, next);
      window.dispatchEvent(new Event(EVENT));
    },
    [key],
  );

  return [value, setValue];
}
