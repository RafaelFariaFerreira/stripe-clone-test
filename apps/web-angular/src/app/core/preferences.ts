import { signal, type Signal } from '@angular/core';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

/**
 * A UI preference persisted in `localStorage` (dismissed banner, visible
 * columns). Storage can be unavailable, so reads fall back to the default and
 * failed writes are ignored.
 */
export function preference<T>(key: string, fallback: T): Signal<T> & { set(value: T): void } {
  const state = signal<T>(read(key, fallback));
  const setter = (value: T) => {
    state.set(value);
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Preferences are a convenience; failing to persist them is not an error.
    }
  };
  return Object.assign(state.asReadonly(), { set: setter });
}
