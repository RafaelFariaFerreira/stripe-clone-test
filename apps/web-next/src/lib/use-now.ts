'use client';

import { useEffect, useReducer } from 'react';

/**
 * Re-renders the caller every `intervalMs` while `enabled`, and returns the
 * current time. Used by relative-time tooltips so "2 minutes ago" stays
 * truthful while visible.
 */
export function useNow(intervalMs = 60_000, enabled = true): Date {
  const [, tick] = useReducer((count: number) => count + 1, 0);
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
  return new Date();
}
