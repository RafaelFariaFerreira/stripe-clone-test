/**
 * Generates the mock Payments dataset.
 *
 *   pnpm --filter @stripe-clone/mock-data generate
 *
 * Output (committed, so builds never depend on randomness):
 *   data/payments.json        list dataset (what the table needs)
 *   data/details/<n>.json     per-payment details, sharded and loaded lazily
 *
 * The generator is seeded: the same SEED always produces byte-identical files,
 * which keeps screenshots and tests stable. Timestamps are generated against a
 * fixed ANCHOR and rebased to "now" by the apps at load time.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DETAIL_SHARD_COUNT,
  detailShardOf,
  formatMoney,
  type CardBrand,
  type CurrencyCode,
  type Customer,
  type Payment,
  type PaymentDetails,
  type PaymentDetailsShard,
  type PaymentMethod,
  type PaymentsDataset,
  type PaymentStatus,
  type WalletType,
} from '@stripe-clone/domain';

const SEED = 20261120;
const COUNT = 600;
const DATASET_VERSION = 1;
const ANCHOR = '2026-11-18T19:00:00.000Z';
/** Fake account fragment embedded in every object id, like real Stripe ids. */
const ACCOUNT = 'Rt8vB2wQjK';

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');

// ---------------------------------------------------------------------------
// Seeded randomness (mulberry32): tiny, fast and good enough for mock data.
// ---------------------------------------------------------------------------

let state = SEED;
function random(): number {
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const int = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
const chance = (probability: number) => random() < probability;

function pick<T>(items: readonly T[]): T {
  const item = items[Math.floor(random() * items.length)];
  if (item === undefined) throw new Error('pick() called with an empty list');
  return item;
}

/** Picks a key with probability proportional to its weight. */
function weighted<T extends string>(weights: Readonly<Record<T, number>>): T {
  const entries = Object.entries(weights) as [T, number][];
  let roll = random() * entries.reduce((sum, [, weight]) => sum + weight, 0);
  for (const [key, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return key;
  }
  return entries[entries.length - 1]![0];
}

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const token = (length: number) => Array.from({ length }, () => pick([...BASE62])).join('');

/** `pi_3UdA4wRt8vB2wQjK0fxt9wsQ`-style ids. */
const objectId = (prefix: string, lead: string) => `${prefix}_${lead}${token(4)}${ACCOUNT}${token(1)}${token(8)}`;

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

const FIRST_NAMES = [
  'olivia',
  'liam',
  'emma',
  'noah',
  'ava',
  'mateo',
  'sofia',
  'lucas',
  'isabella',
  'ethan',
  'mia',
  'gabriel',
  'amelia',
  'leo',
  'harper',
  'theo',
  'chloe',
  'daniel',
  'laura',
  'marcus',
  'priya',
  'kenji',
  'aisha',
  'diego',
  'hannah',
  'omar',
  'julia',
  'samuel',
  'nina',
  'victor',
  'grace',
  'felipe',
  'claire',
  'arjun',
  'beatriz',
  'jordan',
  'maya',
  'tomas',
  'elena',
  'kofi',
  'ines',
] as const;

const LAST_NAMES = [
  'smith',
  'johnson',
  'garcia',
  'silva',
  'santos',
  'miller',
  'davis',
  'martinez',
  'lopez',
  'clark',
  'walker',
  'young',
  'king',
  'wright',
  'scott',
  'green',
  'baker',
  'adams',
  'nelson',
  'carter',
  'mitchell',
  'perez',
  'roberts',
  'turner',
  'phillips',
  'campbell',
  'parker',
  'evans',
  'edwards',
  'collins',
  'stewart',
  'morris',
  'rogers',
  'reed',
  'cook',
  'morgan',
  'bell',
  'murphy',
  'bailey',
] as const;

const EMAIL_DOMAINS = {
  'gmail.com': 50,
  'yahoo.com': 9,
  'outlook.com': 9,
  'icloud.com': 8,
  'hotmail.com': 5,
  'hotmail.co.uk': 4,
  'proton.me': 3,
  'example.org': 4,
  'northwind.io': 4,
  'acmelabs.co': 4,
} as const;

const DESCRIPTIONS = {
  'Subscription update': 70,
  'Subscription creation': 14,
  'Payment for Invoice': 10,
  'One-time purchase': 6,
} as const;

/** Realistic subscription price points per currency (major units). */
const PRICE_POINTS: Readonly<Record<CurrencyCode, readonly number[]>> = {
  usd: [4.07, 8.99, 9.88, 9.99, 10.98, 11.99, 13.18, 15.38, 19.99, 20.93, 21.98, 24.99, 29.99, 49, 99, 149],
  gbp: [7.99, 9.99, 15.99, 19.99, 34.99, 49.99],
  eur: [9.99, 14.99, 19.99, 29.99, 39, 79],
  brl: [29.9, 49.9, 99.99, 149.9, 189.99, 249.9],
  cad: [12.99, 19.99, 24.99, 39.99],
  aud: [14.99, 29.99, 44.99],
  jpy: [980, 1500, 2980, 4980, 9800],
};

const CURRENCY_WEIGHTS = { usd: 55, gbp: 12, eur: 12, brl: 10, cad: 5, aud: 3, jpy: 3 } as const;

const STATUS_WEIGHTS = {
  succeeded: 62,
  failed: 14,
  refunded: 7,
  partially_refunded: 2,
  pending: 3,
  canceled: 4,
  uncaptured: 2,
  blocked: 2,
  disputed: 2,
  incomplete: 2,
} as const satisfies Record<PaymentStatus, number>;

const DECLINE_REASONS = {
  'Insufficient funds': 34,
  'Do not honor': 20,
  'Transaction not allowed': 14,
  'Generic decline': 12,
  'Expired card': 8,
  'Incorrect CVC': 7,
  'Processing error': 5,
} as const;

const BANKS = ['Chase', 'Bank of America', 'Wells Fargo', 'Citibank', 'US Bank', 'Capital One'] as const;

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

function buildCustomers(count: number): Customer[] {
  const used = new Set<string>();
  const customers: Customer[] = [];
  while (customers.length < count) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const local = pick([
      `${first}.${last}`,
      `${first}${last}`,
      `${first[0]}${last}`,
      `${first}${int(1, 99)}`,
      `${first}.${last}${int(10, 2005)}`,
      `${last}.${first}`,
    ]);
    const email = `${local}@${weighted(EMAIL_DOMAINS)}`;
    if (used.has(email)) continue;
    used.add(email);
    const capitalize = (value: string) => value[0]!.toUpperCase() + value.slice(1);
    customers.push({
      id: `cus_${token(14)}`,
      name: chance(0.3) ? `${capitalize(first)} ${capitalize(last)}` : null,
      email,
    });
  }
  return customers;
}

function buildPaymentMethod(currency: CurrencyCode): PaymentMethod {
  const last4 = String(int(0, 9999)).padStart(4, '0');
  const exp = { expMonth: int(1, 12), expYear: int(2026, 2031) };
  const family = currency === 'usd' ? weighted({ card: 76, wallet: 14, ach_debit: 10 }) : weighted({ card: 84, wallet: 16 });
  if (family === 'ach_debit') {
    return { type: 'ach_debit', bankName: pick(BANKS), last4 };
  }
  const brand: CardBrand = weighted({ visa: 56, mastercard: 30, amex: 9, discover: 5 });
  if (family === 'wallet') {
    const wallet: WalletType = weighted({ link: 55, apple_pay: 30, google_pay: 15 });
    return { type: 'wallet', wallet, brand, last4, ...exp };
  }
  return { type: 'card', brand, last4, ...exp };
}

function buildAmount(currency: CurrencyCode): number {
  const exponent = currency === 'jpy' ? 1 : 100;
  // Mostly plan prices, sometimes a prorated or custom amount.
  const major = chance(0.82)
    ? pick(PRICE_POINTS[currency])
    : Math.max(1, Math.round(random() * (currency === 'jpy' ? 12000 : 180) * 100) / 100);
  return Math.round(major * exponent);
}

/**
 * Creation times: the newest payments are minutes apart (like the reference),
 * older ones spread over ~120 days and clustered in business hours.
 */
function buildCreatedTimes(count: number): number[] {
  const anchor = Date.parse(ANCHOR);
  const times: number[] = [];
  let cursor = anchor - int(1, 4) * 60_000;
  for (let i = 0; i < count; i += 1) {
    const gapMinutes = i < 40 ? int(2, 35) : i < 150 ? int(20, 240) : int(60, 600);
    cursor -= gapMinutes * 60_000;
    const date = new Date(cursor);
    // Push overnight (UTC 04:00–11:00) payments into the afternoon.
    if (date.getUTCHours() >= 4 && date.getUTCHours() < 11 && chance(0.7)) {
      date.setUTCHours(int(13, 22));
    }
    times.push(Math.min(date.getTime(), anchor - 60_000));
  }
  return times.sort((a, b) => b - a);
}

function buildPayment(customers: Customer[], created: number): Payment {
  const currency = weighted(CURRENCY_WEIGHTS);
  const paymentMethod = buildPaymentMethod(currency);
  let status: PaymentStatus = weighted(STATUS_WEIGHTS);
  // ACH debits take days to settle, so a good share of them are pending.
  if (paymentMethod.type === 'ach_debit' && status === 'succeeded' && chance(0.35)) status = 'pending';
  const amount = buildAmount(currency);
  const refundedAt =
    status === 'refunded' || status === 'partially_refunded'
      ? new Date(Math.min(created + int(1, 72) * 3_600_000, Date.parse(ANCHOR))).toISOString()
      : null;
  const amountRefunded = status === 'refunded' ? amount : status === 'partially_refunded' ? Math.round(amount * pick([0.25, 0.5])) : 0;

  return {
    id: objectId('pi', '3'),
    amount,
    currency,
    status,
    paymentMethod,
    description: weighted(DESCRIPTIONS),
    customer: pick(customers),
    created: new Date(created).toISOString(),
    refundedAt,
    amountRefunded,
    declineReason: status === 'failed' ? weighted(DECLINE_REASONS) : null,
    disputeDueBy: status === 'disputed' ? new Date(created + int(5, 14) * 86_400_000).toISOString() : null,
  };
}

const FEE_FIXED: Readonly<Record<CurrencyCode, number>> = {
  usd: 30,
  gbp: 20,
  eur: 25,
  brl: 39,
  cad: 30,
  aud: 30,
  jpy: 0,
};

function buildDetails(payment: Payment): PaymentDetails {
  const created = Date.parse(payment.created);
  const at = (offsetSeconds: number) => new Date(created + offsetSeconds * 1000).toISOString();
  const money = formatMoney(payment.amount, payment.currency).replace(' ', '');
  const chargeId = objectId('ch', '3');
  const collected = ['succeeded', 'refunded', 'partially_refunded', 'disputed'].includes(payment.status);
  const fee = collected ? Math.round(payment.amount * 0.029) + FEE_FIXED[payment.currency] : 0;

  const timeline: { label: string; at: string }[] = [{ label: 'Payment started', at: at(0) }];
  const events = [{ description: `A new payment ${payment.id} for ${money} was created`, at: at(0) }];
  const logs: PaymentDetails['logs'] = [];

  switch (payment.status) {
    case 'succeeded':
    case 'refunded':
    case 'partially_refunded':
    case 'disputed':
      timeline.push({ label: 'Payment authorized', at: at(1) }, { label: 'Payment succeeded', at: at(2) });
      events.push(
        { description: `${chargeId} was charged ${money}`, at: at(1) },
        { description: `The payment ${payment.id} for ${money} has succeeded`, at: at(1) },
        { description: `A ${money} payment for ${chargeId} was updated`, at: at(4) },
      );
      logs.push({ id: `req_${token(14)}`, method: 'POST', path: '/v1/payment_intents', status: 200, at: at(1) });
      break;
    case 'failed':
    case 'blocked':
      timeline.push({ label: payment.status === 'blocked' ? 'Payment blocked' : 'Payment failed', at: at(1) });
      events.push({ description: `The payment ${payment.id} for ${money} has failed`, at: at(1) });
      logs.push({ id: `req_${token(14)}`, method: 'POST', path: '/v1/payment_intents', status: 402, at: at(1) });
      break;
    case 'canceled':
      timeline.push({ label: 'Payment canceled', at: at(int(60, 3600)) });
      events.push({ description: `The payment ${payment.id} for ${money} was canceled`, at: at(60) });
      logs.push({ id: `req_${token(14)}`, method: 'POST', path: `/v1/payment_intents/${payment.id}/cancel`, status: 200, at: at(60) });
      break;
    case 'uncaptured':
      timeline.push({ label: 'Payment authorized', at: at(1) });
      events.push({ description: `The payment ${payment.id} for ${money} requires capture`, at: at(1) });
      logs.push({ id: `req_${token(14)}`, method: 'POST', path: '/v1/payment_intents', status: 200, at: at(1) });
      break;
    case 'pending':
      timeline.push({ label: 'Payment processing', at: at(1) });
      events.push({ description: `The payment ${payment.id} for ${money} is processing`, at: at(1) });
      logs.push({ id: `req_${token(14)}`, method: 'POST', path: '/v1/payment_intents', status: 200, at: at(1) });
      break;
    case 'incomplete':
      logs.push({ id: `req_${token(14)}`, method: 'POST', path: '/v1/payment_intents', status: 200, at: at(0) });
      break;
  }

  if (payment.refundedAt) {
    const refunded = formatMoney(payment.amountRefunded, payment.currency).replace(' ', '');
    timeline.push({ label: payment.status === 'refunded' ? 'Payment refunded' : 'Payment partially refunded', at: payment.refundedAt });
    events.push({ description: `A ${refunded} refund was issued for ${chargeId}`, at: payment.refundedAt });
    logs.push({ id: `req_${token(14)}`, method: 'POST', path: '/v1/refunds', status: 200, at: payment.refundedAt });
  }
  if (payment.status === 'disputed') {
    timeline.push({ label: 'Dispute opened', at: at(int(2, 10) * 86_400) });
    events.push({ description: `A dispute was opened for ${chargeId}`, at: at(2 * 86_400) });
  }

  const ordered = [...timeline].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const riskScore = payment.status === 'blocked' ? int(76, 99) : int(2, 64);

  return {
    paymentId: payment.id,
    chargeId,
    paymentMethodId: objectId('pm', '1'),
    fingerprint: token(16),
    fee,
    net: payment.amount - fee - payment.amountRefunded,
    riskLevel: riskScore > 75 ? 'highest' : riskScore > 55 ? 'elevated' : 'normal',
    riskScore,
    statementDescriptor: 'CRAMLY.AI',
    fundsAvailableAt: collected ? new Date(created + 7 * 86_400_000).toISOString() : null,
    updatedAt: ordered[0]?.at ?? at(0),
    issuer:
      payment.paymentMethod.type === 'ach_debit'
        ? (payment.paymentMethod.bankName ?? 'Bank')
        : pick(['JPMorgan Chase Bank, N.A.', 'Capital One, N.A.', 'Barclays Bank PLC', 'Itaú Unibanco S.A.', 'Wells Fargo Bank']),
    origin: { usd: 'United States', gbp: 'United Kingdom', eur: 'Germany', brl: 'Brazil', cad: 'Canada', aud: 'Australia', jpy: 'Japan' }[
      payment.currency
    ],
    cvcCheck: payment.paymentMethod.type === 'ach_debit' ? 'Unavailable' : payment.declineReason === 'Incorrect CVC' ? 'Failed' : 'Passed',
    timeline: ordered.map((entry, index) => ({ ...entry, current: index === 0 })),
    events: events.map((event) => ({ id: `evt_${token(24)}`, ...event })).sort((a, b) => Date.parse(b.at) - Date.parse(a.at)),
    logs: logs.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)),
    metadata: chance(0.35) ? { plan: pick(['starter', 'pro', 'team']), source: pick(['web', 'ios', 'android']) } : {},
  };
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const customers = buildCustomers(420);
const payments = buildCreatedTimes(COUNT).map((created) => buildPayment(customers, created));

const dataset: PaymentsDataset = { version: DATASET_VERSION, anchor: ANCHOR, payments };
const shards: PaymentDetailsShard[] = Array.from({ length: DETAIL_SHARD_COUNT }, () => ({}));
for (const payment of payments) {
  shards[detailShardOf(payment.id)]![payment.id] = buildDetails(payment);
}

rmSync(DATA_DIR, { recursive: true, force: true });
mkdirSync(join(DATA_DIR, 'details'), { recursive: true });
writeFileSync(join(DATA_DIR, 'payments.json'), JSON.stringify(dataset));
shards.forEach((shard, index) => writeFileSync(join(DATA_DIR, 'details', `${index}.json`), JSON.stringify(shard)));

const tally = payments.reduce<Record<string, number>>((acc, payment) => {
  acc[payment.status] = (acc[payment.status] ?? 0) + 1;
  return acc;
}, {});
console.log(`Generated ${payments.length} payments, ${DETAIL_SHARD_COUNT} detail shards.`, tally);
