/**
 * Date helpers. All formatting is `en-US` in the viewer's local time zone, which
 * is what the Dashboard does. Functions take an optional `now` so tests are
 * deterministic.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const shortDate = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const shortDateWithYear = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const numericDateTime = new Intl.DateTimeFormat('en-US', {
  year: '2-digit',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
});

const fullDateTime = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  timeZoneName: 'short',
});

const calendarDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const relative = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });

/**
 * Table format: `Aug 16, 5:03 PM`. The year is added only when it differs
 * from the current one (`Aug 16, 2025, 5:03 PM`), mirroring the Dashboard.
 */
export function formatTableDate(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const formatter = date.getFullYear() === now.getFullYear() ? shortDate : shortDateWithYear;
  return formatter.format(date);
}

/** Events and logs format: `11/18/26, 2:43:22 PM`. */
export function formatEventTimestamp(iso: string): string {
  return numericDateTime.format(new Date(iso));
}

/** Long, unambiguous format used inside tooltips: `Wed, Nov 18, 2026, 2:43:22 PM GMT-3`. */
export function formatFullDate(iso: string): string {
  return fullDateTime.format(new Date(iso));
}

/** `Nov 18, 2026`: used by the date filter summary and the calendar. */
export function formatCalendarDay(date: Date): string {
  return calendarDay.format(date);
}

/**
 * Relative time for the "Created" tooltip: `just now`, `5 minutes ago`,
 * `3 hours ago`, `yesterday`, `2 months ago`.
 */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const diff = new Date(iso).getTime() - now.getTime();
  const abs = Math.abs(diff);
  if (abs < MINUTE) return 'just now';
  if (abs < HOUR) return relative.format(Math.round(diff / MINUTE), 'minute');
  if (abs < DAY) return relative.format(Math.round(diff / HOUR), 'hour');
  if (abs < 30 * DAY) return relative.format(Math.round(diff / DAY), 'day');
  if (abs < 365 * DAY) return relative.format(Math.round(diff / (30 * DAY)), 'month');
  return relative.format(Math.round(diff / (365 * DAY)), 'year');
}

/** Local midnight of the given date. */
export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Last millisecond of the given local day. */
export function endOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

/** Adds (or subtracts) whole days, keeping the local wall-clock time. */
export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** `YYYY-MM-DD` in local time, the format used by date inputs and the URL. */
export function toIsoDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parses `YYYY-MM-DD` as a local date. Returns `null` for malformed input. */
export function fromIsoDay(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return Number.isNaN(date.getTime()) || toIsoDay(date) !== value ? null : date;
}
