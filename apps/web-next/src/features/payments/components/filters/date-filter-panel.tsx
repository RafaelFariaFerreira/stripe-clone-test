'use client';

import { addDays, toIsoDay, type DateFilter, type DatePreset } from '@stripe-clone/domain';
import { useState } from 'react';
import { FilterPanel } from './filter-pill';

const PRESETS: ReadonlyArray<{ id: DatePreset; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'last_7_days', label: '7 days' },
  { id: 'last_30_days', label: '30 days' },
  { id: 'custom', label: 'Custom' },
];

interface DateFilterPanelProps {
  value: DateFilter | null;
  onApply: (value: DateFilter) => void;
}

/** Presets (Today, 7 days, 30 days) plus an inclusive custom day range. */
export default function DateFilterPanel({ value, onApply }: DateFilterPanelProps) {
  const today = toIsoDay(new Date());
  const [preset, setPreset] = useState<DatePreset>(value?.preset ?? 'last_7_days');
  const [from, setFrom] = useState(value?.preset === 'custom' ? value.from : toIsoDay(addDays(new Date(), -6)));
  const [to, setTo] = useState(value?.preset === 'custom' ? value.to : today);
  const invalid = preset === 'custom' && (!from || !to || from > to);

  return (
    <FilterPanel
      title="Date and time"
      applyDisabled={invalid}
      onApply={() => onApply(preset === 'custom' ? { preset, from, to } : { preset })}
    >
      <div className="segmented" role="group" aria-label="Date range preset">
        {PRESETS.map((option) => (
          <button
            key={option.id}
            type="button"
            className="segmented__option"
            aria-pressed={preset === option.id}
            onClick={() => setPreset(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {preset === 'custom' ? (
        <div className="filter-panel__row">
          <div>
            <label className="field-label" htmlFor="date-from">
              From
            </label>
            <input id="date-from" className="input" type="date" value={from} max={today} onChange={(event) => setFrom(event.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="date-to">
              To
            </label>
            <input id="date-to" className="input" type="date" value={to} max={today} onChange={(event) => setTo(event.target.value)} />
          </div>
        </div>
      ) : null}
      {invalid ? <p className="filter-panel__error">The start date must be before the end date.</p> : null}
    </FilterPanel>
  );
}
