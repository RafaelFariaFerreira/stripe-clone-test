'use client';

import type { AmountFilter, AmountOperator } from '@stripe-clone/domain';
import { useState } from 'react';
import { Icon } from '@/components/ui/icon';
import { FilterPanel } from './filter-pill';

const OPERATORS: ReadonlyArray<{ id: AmountOperator; label: string }> = [
  { id: 'eq', label: 'is equal to' },
  { id: 'between', label: 'is between' },
  { id: 'gt', label: 'is greater than' },
  { id: 'lt', label: 'is less than' },
];

const toNumber = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));

/** Amount filter with the Dashboard's operators; values are in major units. */
export default function AmountFilterPanel({ value, onApply }: { value: AmountFilter | null; onApply: (value: AmountFilter) => void }) {
  const [operator, setOperator] = useState<AmountOperator>(value?.operator ?? 'between');
  const [first, setFirst] = useState(value ? String(value.value) : '');
  const [second, setSecond] = useState(value?.operator === 'between' ? String(value.valueTo) : '');

  const a = toNumber(first);
  const b = toNumber(second);
  const invalid = Number.isNaN(a) || a < 0 || (operator === 'between' && (Number.isNaN(b) || b < 0));

  return (
    <FilterPanel
      title="Amount"
      applyDisabled={invalid}
      onApply={() => onApply(operator === 'between' ? { operator, value: Math.min(a, b), valueTo: Math.max(a, b) } : { operator, value: a })}
    >
      <label className="sr-only" htmlFor="amount-operator">
        Condition
      </label>
      <select id="amount-operator" className="select" value={operator} onChange={(event) => setOperator(event.target.value as AmountOperator)}>
        {OPERATORS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="input-group">
        <Icon name="arrow-right" size={12} />
        <input
          className="input"
          inputMode="decimal"
          type="number"
          min="0"
          step="0.01"
          placeholder={operator === 'between' ? 'Min' : '0.00'}
          aria-label={operator === 'between' ? 'Minimum amount' : 'Amount'}
          value={first}
          onChange={(event) => setFirst(event.target.value)}
        />
        {operator === 'between' ? (
          <input
            className="input"
            inputMode="decimal"
            type="number"
            min="0"
            step="0.01"
            placeholder="Max"
            aria-label="Maximum amount"
            value={second}
            onChange={(event) => setSecond(event.target.value)}
          />
        ) : null}
      </div>
      <p className="filter-panel__hint">Compared in each payment&apos;s own currency.</p>
    </FilterPanel>
  );
}
