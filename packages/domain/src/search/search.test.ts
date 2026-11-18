import { describe, expect, it } from 'vitest';
import type { Payment } from '../types';
import {
  applySearchSuggestion,
  buildSearchDropdown,
  clearSearchFilters,
  countSearchFilters,
  emptySearchFilterPanel,
  getSearchSort,
  getSearchSuggestions,
  isUncollected,
  matchesSearch,
  parseSearch,
  readSearchFilterPanel,
  scopeToPayments,
  searchAllPayments,
  searchPayments,
  searchResultsHref,
  searchResultsPage,
  toggleSearchSort,
  tokenizeSearch,
  withSearchSort,
  writeSearchFilterPanel,
} from '../index';

const NOW = new Date('2026-11-18T15:00:00');

function payment(overrides: Partial<Payment> & Pick<Payment, 'id'>): Payment {
  return {
    amount: 1538,
    currency: 'usd',
    status: 'succeeded',
    paymentMethod: { type: 'card', brand: 'visa', last4: '4242' },
    description: 'Subscription update',
    customer: { id: 'cus_1', name: 'Jenny Rosen', email: 'jenny.rosen@example.com' },
    created: '2026-11-18T10:00:00',
    refundedAt: null,
    amountRefunded: 0,
    declineReason: null,
    disputeDueBy: null,
    ...overrides,
  };
}

const row = payment({ id: 'pi_3UdA4wRt8vB2wQjK0fxt9wsQ' });
const match = (query: string, target: Payment = row) => matchesSearch(target, query, NOW);

describe('tokenizer and parser', () => {
  it('keeps quoted phrases and key:"quoted values" together', () => {
    expect(tokenizeSearch('name:"Jenny Rosen" "Subscription update" -status:failed')).toEqual([
      'name:"Jenny Rosen"',
      '"Subscription update"',
      '-status:failed',
    ]);
  });

  it('parses filters, negation and free text; unknown keys become text', () => {
    expect(parseSearch('status:failed -last4:4242 jenny foo:bar status:')).toEqual([
      { field: 'status', value: 'failed', negated: false },
      { field: 'last4', value: '4242', negated: true },
      { field: null, value: 'jenny', negated: false },
      { field: null, value: 'foo:bar', negated: false },
    ]);
  });
});

describe('matching', () => {
  it.each([
    ['last4:4242', true],
    ['last4:42', true],
    ['last4:1111', false],
    ['email:jenny', true],
    ['email:bob', false],
    ['name:"jenny rosen"', true],
    ['status:succeeded', true],
    ['status:failed', false],
    ['-status:failed', true],
    ['currency:USD', true],
    ['brand:visa', true],
    ['type:card', true],
    ['type:ach', false],
    ['is:payment', true],
    ['is:customer', false],
    ['profile:@rocket', false],
    ['amount:15.38', true],
    ['amount:>15', true],
    ['amount:<15', false],
    ['amount:10..20', true],
    ['amount:$15.38', true],
    ['date:today', true],
    ['date:yesterday', false],
    ['date:2026/11/18', true],
    ['created:2026-11-18', true],
    ['date:11/18/2026', true],
    ['date:>2026/11/17', true],
    ['date:<2026/11/18', false],
    ['date:2026/11/01..2026/11/30', true],
    ['date:"last week"', true],
    ['4242', true],
    ['15.38', true],
    ['subscription', true],
    ['"Subscription update"', true],
    ['3uda4w', true],
    ['status:succeeded last4:4242 email:jenny', true],
    ['status:succeeded last4:1111', false],
  ])('%s → %s', (query, expected) => {
    expect(match(query)).toBe(expected);
  });

  it('understands status labels and spellings', () => {
    const partial = payment({ id: 'pi_2', status: 'partially_refunded' });
    expect(match('status:partial_refund', partial)).toBe(true);
    expect(match('status:"Partial refund"', partial)).toBe(true);
    expect(match('status:cancelled', payment({ id: 'pi_3', status: 'canceled' }))).toBe(true);
  });

  it('matches wallets through type and brand', () => {
    const wallet = payment({ id: 'pi_4', paymentMethod: { type: 'wallet', wallet: 'apple_pay', brand: 'mastercard', last4: '0900' } });
    expect(match('type:apple_pay', wallet)).toBe(true);
    expect(match('type:wallet', wallet)).toBe(true);
    expect(match('brand:mastercard', wallet)).toBe(true);
  });

  it('returns the newest matches first, limited', () => {
    const rows = [
      payment({ id: 'pi_a', created: '2026-11-18T08:00:00' }),
      payment({ id: 'pi_b', created: '2026-11-18T12:00:00' }),
      payment({ id: 'pi_c', created: '2026-11-18T10:00:00', status: 'failed' }),
    ];
    expect(searchPayments(rows, 'status:succeeded', 8, NOW).map((item) => item.id)).toEqual(['pi_b', 'pi_a']);
    expect(searchPayments(rows, 'subscription', 1, NOW).map((item) => item.id)).toEqual(['pi_b']);
    expect(searchPayments(rows, '   ', 8, NOW)).toEqual([]);
  });
});

describe('suggestions', () => {
  it('shows the six Dashboard suggestions on an empty input, all filters when expanded', () => {
    expect(getSearchSuggestions('').filters.map((filter) => filter.key)).toEqual(['is', 'last4', 'date', 'email', 'status', 'profile']);
    expect(getSearchSuggestions('', true).filters.length).toBeGreaterThan(6);
  });

  it('completes filter keys and values for the token being typed', () => {
    expect(getSearchSuggestions('jenny sta').filters.map((filter) => filter.key)).toEqual(['status']);
    expect(getSearchSuggestions('status:fa').values.map((value) => value.token)).toEqual(['status:failed']);
    expect(getSearchSuggestions('-status:ref').values.map((value) => value.token)).toEqual(['-status:refunded']);
    expect(getSearchSuggestions('last4:42')).toEqual({ filters: [], values: [] });
  });

  it('applies a completion to the active token', () => {
    expect(applySearchSuggestion('jenny sta', 'status', 'filter')).toBe('jenny status:');
    expect(applySearchSuggestion('', 'last4', 'filter')).toBe('last4:');
    expect(applySearchSuggestion('jenny status:fa', 'status:failed', 'value')).toBe('jenny status:failed ');
  });
});

describe('dropdown model', () => {
  const rows = [payment({ id: 'pi_a' }), payment({ id: 'pi_b', status: 'failed' })];

  it('lists the suggested filters and the "View more filters" footer when empty', () => {
    const model = buildSearchDropdown('', rows, false, NOW);
    expect(model.sections.map((section) => section.heading)).toEqual(['Suggested filters']);
    expect(model.footer).toMatchObject({ kind: 'toggle-filters', expanded: false });
    expect(model.options).toHaveLength(7);
  });

  it('offers "Show only…", completions, live results and "View all results" when typing', () => {
    const model = buildSearchDropdown('status:fa', rows, false, NOW);
    expect(model.options[0]).toMatchObject({ kind: 'apply', query: 'status:fa' });
    expect(model.sections.map((section) => section.heading)).toEqual([null, 'Suggested values', 'Payments']);
    expect(model.footer).toMatchObject({ kind: 'view-all' });

    const results = buildSearchDropdown('status:failed', rows, false, NOW);
    const payments = results.options.filter((option) => option.kind === 'payment');
    expect(payments.map((option) => option.kind === 'payment' && option.payment.id)).toEqual(['pi_b']);
  });
});

describe('search results page', () => {
  const rows = [
    payment({ id: 'pi_low', amount: 500, created: '2026-11-18T09:00:00' }),
    payment({ id: 'pi_high', amount: 9900, created: '2026-11-10T09:00:00' }),
    payment({ id: 'pi_failed', amount: 2000, status: 'failed', created: '2026-11-17T09:00:00' }),
    payment({ id: 'pi_refunded', amount: 3000, status: 'refunded', created: '2026-10-01T09:00:00' }),
  ];
  const ids = (query: string) => searchAllPayments(rows, query, NOW).map((row) => row.id);

  it('writes and reads the sort term', () => {
    expect(withSearchSort('status:failed', 'amount_desc')).toBe('status:failed sort:-amount');
    expect(withSearchSort('status:failed sort:-amount', 'relevance')).toBe('status:failed');
    expect(getSearchSort('x sort:created')).toBe('oldest');
    expect(toggleSearchSort('x sort:-amount', 'amount')).toBe('x sort:amount');
    expect(ids('is:payment sort:-amount')).toEqual(['pi_high', 'pi_refunded', 'pi_failed', 'pi_low']);
    expect(ids('is:payment sort:created')).toEqual(['pi_refunded', 'pi_high', 'pi_failed', 'pi_low']);
  });

  it('supports the Type flags', () => {
    expect(ids('is:payment is:paid')).toEqual(['pi_low', 'pi_high']);
    expect(ids('is:refunded')).toEqual(['pi_refunded']);
    expect(ids('is:captured sort:-amount')).toEqual(['pi_high', 'pi_refunded', 'pi_low']);
    expect(ids('is:customer')).toEqual([]);
    expect(ids('sort:-amount')).toEqual([]);
  });

  it('round-trips the Filters panel through the query', () => {
    const panel = emptySearchFilterPanel();
    panel.type = { enabled: true, flags: ['paid'] };
    panel.date = { ...panel.date, enabled: true, operator: 'last', amount: 30, unit: 'days' };
    panel.amount = { enabled: true, operator: 'between', value: '10', valueTo: '20' };
    const query = writeSearchFilterPanel('status:failed sort:-amount', panel, NOW);
    expect(query).toBe('status:failed is:payment is:paid date:10/19/2026..today amount:10..20 sort:-amount');
    expect(countSearchFilters(query)).toBe(3);

    const read = readSearchFilterPanel(query, NOW);
    expect(read.type).toEqual({ enabled: true, flags: ['paid'] });
    expect(read.date).toMatchObject({ enabled: true, operator: 'last', amount: 30, unit: 'days' });
    expect(read.amount).toMatchObject({ enabled: true, operator: 'between', value: '10', valueTo: '20' });

    expect(clearSearchFilters(query)).toBe('status:failed sort:-amount');
    expect(
      writeSearchFilterPanel(
        'jenny',
        { ...emptySearchFilterPanel(), date: { ...panel.date, enabled: false, operator: 'before', to: '2026-11-17' } },
        NOW,
      ),
    ).toBe('jenny');
    const before = writeSearchFilterPanel(
      'jenny',
      { ...emptySearchFilterPanel(), date: { ...panel.date, enabled: true, operator: 'before', to: '2026-11-17' } },
      NOW,
    );
    expect(before).toBe('jenny date:<11/18/2026');
    expect(readSearchFilterPanel(before, NOW).date).toMatchObject({ operator: 'before', to: '2026-11-17' });
  });

  it('scopes "Show only payment results" to payments and builds links', () => {
    expect(scopeToPayments('status:failed')).toBe('status:failed is:payment');
    expect(scopeToPayments('status:failed is:payment')).toBe('status:failed is:payment');
    expect(searchResultsHref('status:failed is:payment')).toBe('/search?query=status%3Afailed%20is%3Apayment');
    expect(buildSearchDropdown('status:failed', rows, false, NOW).options[0]).toMatchObject({
      kind: 'apply',
      target: 'status:failed is:payment',
    });
  });

  it('paginates results and flags uncollected payments', () => {
    expect(searchResultsPage(rows, 'is:payment', 1, NOW)).toMatchObject({ total: 4, rangeStart: 1, rangeEnd: 4 });
    expect(isUncollected(rows[2]!)).toBe(true);
    expect(isUncollected(rows[0]!)).toBe(false);
  });
});
