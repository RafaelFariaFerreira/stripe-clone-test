'use client';

import {
  PAYMENT_TYPE_FLAGS,
  readSearchFilterPanel,
  SEARCH_AMOUNT_OPERATORS,
  SEARCH_DATE_OPERATORS,
  type PaymentTypeFlag,
  type SearchAmountOperator,
  type SearchDateOperator,
  type SearchDateUnit,
  type SearchFilterPanel,
} from '@stripe-clone/domain';
import { useState, type ReactNode } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Icon } from '@/components/ui/icon';

const FLAG_LABEL: Readonly<Record<PaymentTypeFlag, string>> = {
  captured: 'Captured',
  disputed: 'Disputed',
  paid: 'Paid',
  refunded: 'Refunded',
};

interface FiltersPanelProps {
  query: string;
  /** Writes the panel into the query (`Done`) or clears it (`Clear`). */
  onApply: (panel: SearchFilterPanel) => void;
  onClear: () => void;
}

/**
 * The Dashboard's search "Filters" popover: Type (object + payment flags),
 * Date and Amount. Each section is enabled by its checkbox; Done writes the
 * result back into the query text as `is:` / `date:` / `amount:` terms.
 */
export function FiltersPanel({ query, onApply, onClear }: FiltersPanelProps) {
  const [panel, setPanel] = useState<SearchFilterPanel>(() => readSearchFilterPanel(query));
  const patch = <K extends keyof SearchFilterPanel>(key: K, value: Partial<SearchFilterPanel[K]>) =>
    setPanel((current) => ({ ...current, [key]: { ...current[key], ...value } }));

  return (
    <div className="filters-panel">
      <div className="filters-panel__header">
        <button type="button" className="button button--secondary button--sm" onClick={onClear}>
          Clear
        </button>
        <span className="filters-panel__title">Filters</span>
        <button type="button" className="button button--primary button--sm" onClick={() => onApply(panel)}>
          Done
        </button>
      </div>

      <Section label="Type" enabled={panel.type.enabled} onToggle={(enabled) => patch('type', { enabled })}>
        <select className="select" aria-label="Object type" value="payment" onChange={() => undefined}>
          <option value="payment">Payment</option>
        </select>
        <div className="filters-panel__flags">
          {PAYMENT_TYPE_FLAGS.map((flag) => (
            <label key={flag} className="filters-panel__flag">
              <Checkbox
                checked={panel.type.flags.includes(flag)}
                onChange={() =>
                  patch('type', {
                    flags: panel.type.flags.includes(flag) ? panel.type.flags.filter((item) => item !== flag) : [...panel.type.flags, flag],
                  })
                }
              />
              {FLAG_LABEL[flag]}
            </label>
          ))}
        </div>
      </Section>

      <Section label="Date" enabled={panel.date.enabled} onToggle={(enabled) => patch('date', { enabled })}>
        <select
          className="select"
          aria-label="Comparison type"
          value={panel.date.operator}
          onChange={(event) => patch('date', { operator: event.target.value as SearchDateOperator })}
        >
          {SEARCH_DATE_OPERATORS.map((operator) => (
            <option key={operator.id} value={operator.id}>
              {operator.label}
            </option>
          ))}
        </select>
        <div className="filters-panel__row">
          <Icon name="arrow-right" size={12} />
          {panel.date.operator === 'last' ? (
            <>
              <input
                className="input"
                type="number"
                min="1"
                aria-label="Filter value"
                value={panel.date.amount || ''}
                onChange={(event) => patch('date', { amount: Number(event.target.value) })}
              />
              <select
                className="select"
                aria-label="Unit select"
                value={panel.date.unit}
                onChange={(event) => patch('date', { unit: event.target.value as SearchDateUnit })}
              >
                <option value="hours">hours</option>
                <option value="days">days</option>
                <option value="months">months</option>
              </select>
            </>
          ) : panel.date.operator === 'before' ? (
            <input
              className="input"
              type="date"
              aria-label="Date"
              value={panel.date.to}
              onChange={(event) => patch('date', { to: event.target.value })}
            />
          ) : (
            <input
              className="input"
              type="date"
              aria-label={panel.date.operator === 'between' ? 'Start date' : 'Date'}
              value={panel.date.from}
              onChange={(event) => patch('date', { from: event.target.value })}
            />
          )}
        </div>
        {panel.date.operator === 'between' ? (
          <div className="filters-panel__row">
            <Icon name="arrow-right" size={12} />
            <input
              className="input"
              type="date"
              aria-label="End date"
              value={panel.date.to}
              onChange={(event) => patch('date', { to: event.target.value })}
            />
          </div>
        ) : null}
      </Section>

      <Section label="Amount" enabled={panel.amount.enabled} onToggle={(enabled) => patch('amount', { enabled })}>
        <select
          className="select"
          aria-label="Amount comparison"
          value={panel.amount.operator}
          onChange={(event) => patch('amount', { operator: event.target.value as SearchAmountOperator })}
        >
          {SEARCH_AMOUNT_OPERATORS.map((operator) => (
            <option key={operator.id} value={operator.id}>
              {operator.label}
            </option>
          ))}
        </select>
        <div className="filters-panel__row">
          <Icon name="arrow-right" size={12} />
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            aria-label={panel.amount.operator === 'between' ? 'Minimum amount' : 'Amount'}
            value={panel.amount.value}
            onChange={(event) => patch('amount', { value: event.target.value })}
          />
          {panel.amount.operator === 'between' ? (
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              aria-label="Maximum amount"
              value={panel.amount.valueTo}
              onChange={(event) => patch('amount', { valueTo: event.target.value })}
            />
          ) : null}
        </div>
      </Section>
    </div>
  );
}

function Section({
  label,
  enabled,
  onToggle,
  children,
}: {
  label: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div className="filters-panel__section">
      <label className="filters-panel__toggle">
        <Checkbox checked={enabled} onChange={(event) => onToggle(event.target.checked)} />
        {label}
      </label>
      {enabled ? <div className="filters-panel__body">{children}</div> : null}
    </div>
  );
}
