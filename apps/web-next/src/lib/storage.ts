/**
 * `localStorage` helpers for small UI preferences (banner dismissed, visible
 * columns). Storage can be unavailable (private mode, blocked cookies), so
 * every access is guarded and falls back to the default.
 */
export function readPreference<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writePreference<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Preferences are a convenience; failing to persist them is not an error.
  }
}
