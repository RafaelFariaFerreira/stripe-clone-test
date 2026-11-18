import { describe, expect, it } from 'vitest';
import {
  applyQuery,
  DEFAULT_QUERY,
  detailShardOf,
  DETAIL_SHARD_COUNT,
  formatMoney,
  formatRelativeTime,
  formatTableDate,
  matchesSearch,
  parseQuery,
  paymentsToCsv,
  rebaseDataset,
  serializeQuery,
  shortenId,
  sortPayments,
  toggleSort,
  type Payment,
  type PaymentsQuery,
} from './index';

const NOW = new Date('2026-11-18T15:00:00');

function payment(overrides: Partial<Payment> & Pick<Payment, 'id'>): Payment {
  return {
    amount: 1000,
    currency: 'usd',
    status: 'succeeded',
    paymentMethod: { type: 'card', brand: 'visa', last4: '4242' },
    description: 'Subscription update',
    customer: { id: 'cus_1', name: null, email: 'someone@example.com' },
    created: NOW.toISOString(),
    refundedAt: null,
    amountRefunded: 0,
    declineReason: null,
    disputeDueBy: null,
    ...overrides,
  };
}

const query = (overrides: Partial<PaymentsQuery> = {}): PaymentsQuery => ({ ...DEFAULT_QUERY, ...overrides });

describe('formatMoney', () => {
  it('formats like the Dashboard table', () => {
    expect(formatMoney(988, 'usd')).toBe('$9.88');
    expect(formatMoney(1599, 'gbp')).toBe('£15.99');
    expect(formatMoney(9999, 'brl')).toBe('R$ 99.99');
    expect(formatMoney(123456, 'usd')).toBe('$1,234.56');
  });

  it('handles zero-decimal currencies', () => {
    expect(formatMoney(1500, 'jpy')).toBe('¥1,500');
  });
});

describe('dates', () => {
  it('omits the year for the current year', () => {
    expect(formatTableDate('2026-08-16T17:03:00', NOW)).toBe('Aug 16, 5:03 PM');
    expect(formatTableDate('2025-08-16T17:03:00', NOW)).toBe('Aug 16, 2025, 5:03 PM');
  });

  it('describes relative time', () => {
    expect(formatRelativeTime(new Date(NOW.getTime() - 20_000).toISOString(), NOW)).toBe('just now');
    expect(formatRelativeTime(new Date(NOW.getTime() - 3 * 3_600_000).toISOString(), NOW)).toBe('3 hours ago');
    expect(formatRelativeTime(new Date(NOW.getTime() - 86_400_000).toISOString(), NOW)).toBe('yesterday');
  });
});

describe('shortenId', () => {
  it('keeps the prefix and both ends', () => {
    expect(shortenId('pi_3UdA4wL2cI6mqjNa0fxt9wsQ')).toBe('pi_3UdA…9wsQ');
    expect(shortenId('pi_short')).toBe('pi_short');
  });
});

describe('search', () => {
  const row = payment({
    id: 'pi_3UdA4wL2cI6mqjNa0fxt9wsQ',
    customer: { id: 'c', name: 'Ada Lovelace', email: 'ada@example.com' },
    paymentMethod: { type: 'card', brand: 'visa', last4: '0002' },
  });

  it.each([
    ['pi_3UdA4w', true],
    ['3uda4w', true],
    ['ADA@EXAMPLE', true],
    ['0002', true],
    ['lovelace', true],
    ['9999', false],
    ['bob@', false],
  ])('matches %s → %s', (term, expected) => {
    expect(matchesSearch(row, term)).toBe(expected);
  });
});

describe('applyQuery', () => {
  const rows: Payment[] = [
    payment({ id: 'pi_a', amount: 500, status: 'failed', created: '2026-11-18T09:00:00' }),
    payment({ id: 'pi_b', amount: 5000, status: 'succeeded', created: '2026-11-10T09:00:00', currency: 'gbp' }),
    payment({ id: 'pi_c', amount: 2500, status: 'refunded', created: '2026-10-01T09:00:00' }),
    payment({
      id: 'pi_d',
      amount: 9900,
      status: 'succeeded',
      created: '2026-11-17T09:00:00',
      paymentMethod: { type: 'wallet', wallet: 'apple_pay', brand: 'visa', last4: '1111' },
    }),
  ];
  const ids = (q: PaymentsQuery) => applyQuery(rows, q, NOW).rows.map((row) => row.id);

  it('defaults to newest first', () => {
    expect(ids(query())).toEqual(['pi_a', 'pi_d', 'pi_b', 'pi_c']);
  });

  it('applies date presets', () => {
    expect(ids(query({ date: { preset: 'today' } }))).toEqual(['pi_a']);
    expect(ids(query({ date: { preset: 'last_7_days' } }))).toEqual(['pi_a', 'pi_d']);
    expect(ids(query({ date: { preset: 'last_30_days' } }))).toEqual(['pi_a', 'pi_d', 'pi_b']);
    expect(ids(query({ date: { preset: 'custom', from: '2026-10-01', to: '2026-10-01' } }))).toEqual(['pi_c']);
  });

  it('combines the view card with the status filter', () => {
    expect(ids(query({ view: 'succeeded' }))).toEqual(['pi_d', 'pi_b']);
    expect(ids(query({ view: 'succeeded', statuses: ['failed'] }))).toEqual([]);
    expect(ids(query({ statuses: ['failed', 'refunded'] }))).toEqual(['pi_a', 'pi_c']);
  });

  it('filters by amount range, currency and method', () => {
    expect(ids(query({ amount: { operator: 'between', value: 20, valueTo: 60 } }))).toEqual(['pi_b', 'pi_c']);
    expect(ids(query({ amount: { operator: 'gt', value: 50 } }))).toEqual(['pi_d']);
    expect(ids(query({ currencies: ['gbp'] }))).toEqual(['pi_b']);
    expect(ids(query({ methods: ['wallet'] }))).toEqual(['pi_d']);
  });

  it('paginates and clamps the page', () => {
    const many = Array.from({ length: 60 }, (_, i) => payment({ id: `pi_${String(i).padStart(3, '0')}` }));
    const result = applyQuery(many, query({ page: 9, pageSize: 25 }), NOW);
    expect(result).toMatchObject({ page: 3, pageCount: 3, total: 60, rangeStart: 51, rangeEnd: 60 });
  });
});

describe('sorting', () => {
  const rows = [
    payment({ id: 'pi_1', amount: 100, status: 'failed', created: '2026-11-01T00:00:00' }),
    payment({ id: 'pi_2', amount: 300, status: 'succeeded', created: '2026-11-03T00:00:00' }),
    payment({ id: 'pi_3', amount: 300, status: 'pending', created: '2026-11-02T00:00:00' }),
  ];

  it('sorts by multiple columns in priority order', () => {
    const sorted = sortPayments(rows, [
      { column: 'amount', direction: 'desc' },
      { column: 'status', direction: 'asc' },
    ]);
    expect(sorted.map((row) => row.id)).toEqual(['pi_3', 'pi_2', 'pi_1']);
  });

  it('orders mixed currencies by approximate value', () => {
    const mixed = [
      payment({ id: 'pi_jpy', amount: 2980, currency: 'jpy' }),
      payment({ id: 'pi_usd', amount: 17900, currency: 'usd' }),
      payment({ id: 'pi_gbp', amount: 1599, currency: 'gbp' }),
    ];
    expect(sortPayments(mixed, [{ column: 'amount', direction: 'desc' }]).map((row) => row.id)).toEqual(['pi_usd', 'pi_gbp', 'pi_jpy']);
  });

  it('cycles desc → asc → none and supports additive clicks', () => {
    let rules = toggleSort([], 'amount');
    expect(rules).toEqual([{ column: 'amount', direction: 'desc' }]);
    rules = toggleSort(rules, 'amount');
    expect(rules).toEqual([{ column: 'amount', direction: 'asc' }]);
    rules = toggleSort(rules, 'created', true);
    expect(rules).toEqual([
      { column: 'amount', direction: 'asc' },
      { column: 'created', direction: 'desc' },
    ]);
    expect(toggleSort(toggleSort(rules, 'created', true), 'created', true)).toEqual([
      { column: 'amount', direction: 'asc' },
    ]);
  });
});

describe('URL state', () => {
  it('round-trips every field', () => {
    const original = query({
      view: 'failed',
      search: 'ada@',
      date: { preset: 'custom', from: '2026-11-01', to: '2026-11-18' },
      amount: { operator: 'between', value: 10, valueTo: 100 },
      currencies: ['usd', 'brl'],
      statuses: ['failed', 'blocked'],
      methods: ['card'],
      sort: [
        { column: 'created', direction: 'desc' },
        { column: 'amount', direction: 'asc' },
      ],
      page: 3,
      pageSize: 50,
    });
    const params = new URLSearchParams(serializeQuery(original));
    expect(parseQuery(params)).toEqual(original);
  });

  it('omits defaults and ignores garbage', () => {
    expect(serializeQuery(query())).toEqual({});
    const parsed = parseQuery(new URLSearchParams('view=nope&status=failed,bogus&size=7&page=-2&amount=gt:abc'));
    expect(parsed).toEqual(query({ statuses: ['failed'] }));
  });
});

describe('dataset helpers', () => {
  it('rebases timestamps relative to now', () => {
    const [row] = rebaseDataset(
      { version: 1, anchor: '2026-01-01T00:00:00.000Z', payments: [payment({ id: 'pi_x', created: '2025-12-31T23:00:00.000Z' })] },
      new Date('2026-06-01T00:00:00.000Z'),
    );
    expect(row?.created).toBe('2026-05-31T23:00:00.000Z');
  });

  it('spreads ids across shards deterministically', () => {
    const shard = detailShardOf('pi_3UdA4wL2cI6mqjNa0fxt9wsQ');
    expect(shard).toBe(detailShardOf('pi_3UdA4wL2cI6mqjNa0fxt9wsQ'));
    expect(shard).toBeGreaterThanOrEqual(0);
    expect(shard).toBeLessThan(DETAIL_SHARD_COUNT);
  });

  it('exports CSV with escaping and formula protection', () => {
    const csv = paymentsToCsv([payment({ id: 'pi_1', description: '=HYPERLINK("x"), "quoted"' })]);
    const [, line] = csv.split('\r\n');
    expect(line).toContain(`"'=HYPERLINK(""x""), ""quoted"""`);
    expect(line?.startsWith('pi_1,')).toBe(true);
  });
});
