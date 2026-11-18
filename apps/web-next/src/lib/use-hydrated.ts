'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * `false` during the server render and the hydration pass, `true` afterwards.
 * Data restored from the persisted cache can be available before hydration;
 * gating on this keeps the first client render identical to the server HTML.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
