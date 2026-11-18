import { toMajorUnits } from '../currency';
import { addDays, endOfDay, fromIsoDay, startOfDay } from '../dates';
import { STATUS_META } from '../status';
import type { Payment, PaymentStatus } from '../types';
import { isSearchFilterKey, type SearchFilterKey } from './catalog';

/**
 * The Dashboard search language, applied to payments:
 *
 *   free text            jenny  4242  "Subscription update"
 *   filters              status:failed  last4:4242  email:jenny@  currency:eur
 *   ranges and compares  amount:>149.99  amount:10..20  date:<2026/11/01  date:2026/11/01..2026/11/18
 *   relative dates       date:today  date:yesterday  date:"last week"
 *   negation             -status:refunded
 *
 * Every term must match (AND). Unknown `key:` prefixes are treated as text.
 */

export interface SearchTerm {
  /** `null` for free text. */
  field: SearchFilterKey | null;
  value: string;
  negated: boolean;
}

/** Splits a query into tokens, keeping quoted phrases (and `key:"a b"`) together. */
export function tokenizeSearch(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let quoted = false;
  for (const char of input) {
    if (char === '"') {
      quoted = !quoted;
      current += char;
    } else if (/\s/.test(char) && !quoted) {
      if (current) tokens.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (current) tokens.push(current);
  return tokens;
}

const unquote = (value: string) => value.replace(/^"(.*)"$/, '$1').replace(/"/g, '');

/** Parses a raw query into terms. Empty values (`status:`) are ignored. */
export function parseSearch(input: string): SearchTerm[] {
  const terms: SearchTerm[] = [];
  for (const token of tokenizeSearch(input.trim())) {
    const negated = token.length > 1 && token.startsWith('-');
    const body = negated ? token.slice(1) : token;
    const match = /^([a-z_0-9]+):(.*)$/i.exec(body);
    const key = match?.[1]?.toLowerCase();
    if (match && key && isSearchFilterKey(key)) {
      const value = unquote(match[2] ?? '').trim();
      if (value) terms.push({ field: key, value, negated });
    } else {
      const value = unquote(body).trim();
      if (value) terms.push({ field: null, value, negated });
    }
  }
  return terms;
}

// ---------------------------------------------------------------------------
// Value helpers
// ---------------------------------------------------------------------------

type Comparison =
  | { kind: 'eq'; value: number }
  | { kind: 'gt'; value: number }
  | { kind: 'lt'; value: number }
  | { kind: 'range'; from: number; to: number };

/** `>5`, `<5`, `5..10` (also `…`), or `5`. Returns null when a side isn't parseable. */
function parseComparison(raw: string, parse: (value: string) => number | null): Comparison | null {
  const range = raw.split(/\.\.|…/);
  if (range.length === 2) {
    const from = parse(range[0] ?? '');
    const to = parse(range[1] ?? '');
    return from === null || to === null ? null : { kind: 'range', from: Math.min(from, to), to: Math.max(from, to) };
  }
  if (raw.startsWith('>')) {
    const value = parse(raw.slice(1));
    return value === null ? null : { kind: 'gt', value };
  }
  if (raw.startsWith('<')) {
    const value = parse(raw.slice(1));
    return value === null ? null : { kind: 'lt', value };
  }
  const value = parse(raw);
  return value === null ? null : { kind: 'eq', value };
}

const parseAmount = (value: string): number | null => {
  const cleaned = value.replace(/[$€£¥,\s]|R\$/g, '');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  return Number(cleaned);
};

/** Day keywords and absolute dates (YYYY/MM/DD, YYYY-MM-DD, MM/DD/YYYY) as local midnight. */
function parseDay(value: string, now: Date): Date | null {
  const text = value.trim().toLowerCase();
  if (text === 'today') return startOfDay(now);
  if (text === 'yesterday') return startOfDay(addDays(now, -1));
  const iso = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/.exec(text);
  if (iso) return fromIsoDay(`${iso[1]}-${iso[2]?.padStart(2, '0')}-${iso[3]?.padStart(2, '0')}`);
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  if (us) return fromIsoDay(`${us[3]}-${us[1]?.padStart(2, '0')}-${us[2]?.padStart(2, '0')}`);
  return null;
}

/** Resolves a date term to an inclusive [from, to] window in epoch ms. */
function dateWindow(raw: string, now: Date): { from: number; to: number } | null {
  const text = raw.trim().toLowerCase();
  if (text === 'last week') return { from: startOfDay(addDays(now, -6)).getTime(), to: endOfDay(now).getTime() };
  if (text === 'last month') return { from: startOfDay(addDays(now, -29)).getTime(), to: endOfDay(now).getTime() };
  const comparison = parseComparison(text, (value) => parseDay(value, now)?.getTime() ?? null);
  if (!comparison) return null;
  const DAY_END = 24 * 60 * 60 * 1000 - 1;
  switch (comparison.kind) {
    case 'eq':
      return { from: comparison.value, to: comparison.value + DAY_END };
    case 'gt':
      return { from: comparison.value + DAY_END + 1, to: Number.POSITIVE_INFINITY };
    case 'lt':
      return { from: Number.NEGATIVE_INFINITY, to: comparison.value - 1 };
    case 'range':
      return { from: comparison.from, to: comparison.to + DAY_END };
  }
}

function compare(value: number, comparison: Comparison): boolean {
  switch (comparison.kind) {
    case 'eq':
      return Math.abs(value - comparison.value) < 0.005;
    case 'gt':
      return value > comparison.value;
    case 'lt':
      return value < comparison.value;
    case 'range':
      return value >= comparison.from && value <= comparison.to;
  }
}

/** Accepts ids (`partially_refunded`), labels (`Partial refund`) and common spellings (`cancelled`). */
function statusMatches(status: PaymentStatus, raw: string): boolean {
  const value = raw.toLowerCase().replace(/[\s-]+/g, '_');
  const aliases: Record<string, PaymentStatus> = { cancelled: 'canceled', partial_refund: 'partially_refunded', paid: 'succeeded' };
  return status === (aliases[value] ?? value) || STATUS_META[status].label.toLowerCase().replace(/\s+/g, '_') === value;
}

function typeMatches(payment: Payment, raw: string): boolean {
  const value = raw.toLowerCase();
  const method = payment.paymentMethod;
  if (value === 'card') return method.type === 'card' || method.type === 'wallet';
  if (value === 'ach' || value === 'ach_debit' || value === 'us_bank_account') return method.type === 'ach_debit';
  if (value === 'wallet') return method.type === 'wallet';
  return method.wallet === value;
}

function brandMatches(payment: Payment, raw: string): boolean {
  const value = raw.toLowerCase().replace(/[\s_]+/g, '');
  const brand = payment.paymentMethod.brand;
  if (!brand) return false;
  return brand === value || (brand === 'amex' && value === 'americanexpress');
}

/** Free text looks in the most logical fields, like the Dashboard's default search. */
function textMatches(payment: Payment, raw: string): boolean {
  const term = raw.toLowerCase();
  const id = payment.id.toLowerCase();
  if (/^\d{1,4}$/.test(term)) return payment.paymentMethod.last4.includes(term) || id.includes(term);
  const amount = parseAmount(term);
  if (amount !== null && term.includes('.')) {
    return Math.abs(toMajorUnits(payment.amount, payment.currency) - amount) < 0.005;
  }
  return (
    id.includes(term) ||
    id.replace(/^pi_/, '').includes(term) ||
    payment.customer.email.toLowerCase().includes(term) ||
    (payment.customer.name?.toLowerCase().includes(term) ?? false) ||
    payment.description.toLowerCase().includes(term)
  );
}

function termMatches(payment: Payment, term: SearchTerm, now: Date): boolean {
  const value = term.value;
  switch (term.field) {
    case null:
      return textMatches(payment, value);
    case 'is':
      return ['payment', 'payments', 'charge', 'payment_intent'].includes(value.toLowerCase());
    case 'last4':
      return payment.paymentMethod.last4.startsWith(value);
    case 'email':
      return payment.customer.email.toLowerCase().includes(value.toLowerCase());
    case 'name':
      return payment.customer.name?.toLowerCase().includes(value.toLowerCase()) ?? false;
    case 'status':
      return statusMatches(payment.status, value);
    case 'currency':
      return payment.currency === value.toLowerCase();
    case 'brand':
      return brandMatches(payment, value);
    case 'type':
      return typeMatches(payment, value);
    case 'amount': {
      const comparison = parseComparison(value, parseAmount);
      return comparison ? compare(toMajorUnits(payment.amount, payment.currency), comparison) : false;
    }
    case 'date':
    case 'created': {
      const window = dateWindow(value, now);
      if (!window) return false;
      const created = Date.parse(payment.created);
      return created >= window.from && created <= window.to;
    }
    case 'profile':
      // Public business profiles are not payments.
      return false;
  }
}

/** True when the payment matches every term (an empty query matches everything). */
export function matchesSearchTerms(payment: Payment, terms: readonly SearchTerm[], now: Date = new Date()): boolean {
  return terms.every((term) => termMatches(payment, term, now) !== term.negated);
}

/** Convenience wrapper: parse and match in one call. */
export function matchesSearch(payment: Payment, search: string, now: Date = new Date()): boolean {
  return matchesSearchTerms(payment, parseSearch(search), now);
}

/** Top matches for the search dropdown: newest first, at most `limit`. */
export function searchPayments(payments: readonly Payment[], search: string, limit = 8, now: Date = new Date()): Payment[] {
  const terms = parseSearch(search);
  if (!terms.length) return [];
  const results: Payment[] = [];
  for (const payment of [...payments].sort((a, b) => Date.parse(b.created) - Date.parse(a.created))) {
    if (matchesSearchTerms(payment, terms, now)) results.push(payment);
    if (results.length === limit) break;
  }
  return results;
}
