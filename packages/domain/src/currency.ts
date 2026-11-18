import type { CurrencyCode } from './types';

/**
 * Number of decimal places of each currency's minor unit.
 * Zero-decimal currencies (JPY) store whole units, exactly like Stripe.
 */
export const CURRENCY_EXPONENT: Readonly<Record<CurrencyCode, number>> = {
  usd: 2,
  gbp: 2,
  eur: 2,
  brl: 2,
  cad: 2,
  aud: 2,
  jpy: 0,
};

/** Display names used by the Currency filter. */
export const CURRENCY_LABEL: Readonly<Record<CurrencyCode, string>> = {
  usd: 'USD',
  gbp: 'GBP',
  eur: 'EUR',
  brl: 'BRL',
  cad: 'CAD',
  aud: 'AUD',
  jpy: 'JPY',
};

export const CURRENCIES = Object.keys(CURRENCY_EXPONENT) as CurrencyCode[];

/**
 * Approximate USD value of one major unit, used only to order mixed-currency
 * amounts sensibly (so ¥2,980 sorts near $20, not above $179). These are fixed
 * reference rates for the mock data, not live FX.
 */
export const APPROX_USD_RATE: Readonly<Record<CurrencyCode, number>> = {
  usd: 1,
  gbp: 1.27,
  eur: 1.08,
  brl: 0.19,
  cad: 0.73,
  aud: 0.66,
  jpy: 0.0067,
};

/** Approximate USD equivalent of a minor-unit amount (sorting only). */
export function toApproxUsd(amount: number, currency: CurrencyCode): number {
  return toMajorUnits(amount, currency) * APPROX_USD_RATE[currency];
}

/** Converts a minor-unit integer (e.g. 988) into major units (9.88). */
export function toMajorUnits(amount: number, currency: CurrencyCode): number {
  return amount / 10 ** CURRENCY_EXPONENT[currency];
}

/** Converts a user-entered major-unit value (9.88) into minor units (988). */
export function toMinorUnits(value: number, currency: CurrencyCode): number {
  return Math.round(value * 10 ** CURRENCY_EXPONENT[currency]);
}

const formatterCache = new Map<CurrencyCode, Intl.NumberFormat>();

function getFormatter(currency: CurrencyCode): Intl.NumberFormat {
  let formatter = formatterCache.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      currencyDisplay: 'narrowSymbol',
    });
    formatterCache.set(currency, formatter);
  }
  return formatter;
}

/**
 * Formats an amount the way the Stripe Dashboard does in the Payments table:
 * the narrow currency symbol followed by the value (`$9.88`, `£15.99`).
 * Multi-character symbols are separated by a space (`R$ 99.99`), as in the
 * reference screenshot. The ISO code is rendered separately by the UI.
 */
export function formatMoney(amount: number, currency: CurrencyCode): string {
  const parts = getFormatter(currency).formatToParts(toMajorUnits(amount, currency));
  const symbol = parts.find((part) => part.type === 'currency')?.value ?? '';
  const sign = parts.some((part) => part.type === 'minusSign') ? '-' : '';
  const number = parts
    .filter((part) => part.type !== 'currency' && part.type !== 'minusSign' && part.type !== 'literal')
    .map((part) => part.value)
    .join('');
  const separator = symbol.length > 1 ? ' ' : '';
  return `${sign}${symbol}${separator}${number}`;
}

/** `R$ 49.90 BRL`: amount followed by its ISO code, used on the details page. */
export function formatMoneyWithCode(amount: number, currency: CurrencyCode): string {
  return `${formatMoney(amount, currency)} ${CURRENCY_LABEL[currency]}`;
}
