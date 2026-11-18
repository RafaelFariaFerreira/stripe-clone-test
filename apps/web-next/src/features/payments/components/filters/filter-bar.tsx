'use client';

import {
  CURRENCIES,
  CURRENCY_LABEL,
  hasActiveFilters,
  PAYMENT_METHOD_TYPE_LABEL,
  PAYMENT_METHOD_TYPES,
  STATUS_FILTER_OPTIONS,
  STATUS_META,
  summarizeAmountFilter,
  summarizeCurrencies,
  summarizeDateFilter,
  summarizeMethods,
  summarizeStatuses,
  type PaymentsQuery,
} from '@stripe-clone/domain';
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import { Icon } from '@/components/ui/icon';
import { Menu, MenuItem, MenuLabel } from '@/components/ui/menu';
import { FilterPill } from './filter-pill';

// Popover bodies are code-split: they load the first time a pill is opened.
const DateFilterPanel = dynamic(() => import('./date-filter-panel'));
const AmountFilterPanel = dynamic(() => import('./amount-filter-panel'));
const ChecklistFilterPanel = dynamic(() => import('./checklist-filter-panel')) as ComponentType<{
  title: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  value: readonly string[];
  onApply: (value: string[]) => void;
}>;

const STATUS_OPTIONS = STATUS_FILTER_OPTIONS.map((status) => ({ value: status, label: STATUS_META[status].label }));
const METHOD_OPTIONS = PAYMENT_METHOD_TYPES.map((method) => ({ value: method, label: PAYMENT_METHOD_TYPE_LABEL[method] }));
const CURRENCY_OPTIONS = CURRENCIES.map((currency) => ({ value: currency, label: CURRENCY_LABEL[currency] }));

interface FilterBarProps {
  query: PaymentsQuery;
  setQuery: (patch: Partial<PaymentsQuery>) => void;
  onClearAll: () => void;
}

/** Row of filter pills, in the reference order. */
export function FilterBar({ query, setQuery, onClearAll }: FilterBarProps) {
  const focusSearch = () => document.getElementById('global-search')?.focus();
  return (
    <div className="filter-bar" role="group" aria-label="Filters">
      <FilterPill label="Date and time" summary={query.date && summarizeDateFilter(query.date)} onClear={() => setQuery({ date: null })}>
        {(close) => (
          <DateFilterPanel
            value={query.date}
            onApply={(date) => {
              setQuery({ date });
              close();
            }}
          />
        )}
      </FilterPill>

      <FilterPill label="Amount" summary={query.amount && summarizeAmountFilter(query.amount)} onClear={() => setQuery({ amount: null })}>
        {(close) => (
          <AmountFilterPanel
            value={query.amount}
            onApply={(amount) => {
              setQuery({ amount });
              close();
            }}
          />
        )}
      </FilterPill>

      <FilterPill label="Currency" summary={query.currencies.length ? summarizeCurrencies(query.currencies) : null} onClear={() => setQuery({ currencies: [] })}>
        {(close) => (
          <ChecklistFilterPanel
            title="Currency"
            options={CURRENCY_OPTIONS}
            value={query.currencies}
            onApply={(currencies) => {
              setQuery({ currencies: currencies as PaymentsQuery['currencies'] });
              close();
            }}
          />
        )}
      </FilterPill>

      <FilterPill label="Status" summary={query.statuses.length ? summarizeStatuses(query.statuses) : null} onClear={() => setQuery({ statuses: [] })}>
        {(close) => (
          <ChecklistFilterPanel
            title="Status"
            options={STATUS_OPTIONS}
            value={query.statuses}
            onApply={(statuses) => {
              setQuery({ statuses: statuses as PaymentsQuery['statuses'] });
              close();
            }}
          />
        )}
      </FilterPill>

      <FilterPill label="Payment method" summary={query.methods.length ? summarizeMethods(query.methods) : null} onClear={() => setQuery({ methods: [] })}>
        {(close) => (
          <ChecklistFilterPanel
            title="Payment method"
            options={METHOD_OPTIONS}
            value={query.methods}
            onApply={(methods) => {
              setQuery({ methods: methods as PaymentsQuery['methods'] });
              close();
            }}
          />
        )}
      </FilterPill>

      <Menu
        label="More filters"
        placement="bottom-start"
        trigger={(props) => (
          <span className="filter-pill">
            <button type="button" className="filter-pill__trigger" {...props}>
              <Icon name="plus-circle" size={12} />
              <span>More filters</span>
            </button>
          </span>
        )}
      >
        <MenuLabel>Search the table by</MenuLabel>
        <MenuItem onSelect={focusSearch}>Payment ID</MenuItem>
        <MenuItem onSelect={focusSearch}>Customer email</MenuItem>
        <MenuItem onSelect={focusSearch}>Card last 4 digits</MenuItem>
      </Menu>

      {hasActiveFilters(query) || query.search ? (
        <button type="button" className="clear-filters" onClick={onClearAll}>
          Clear filters
        </button>
      ) : null}
    </div>
  );
}
