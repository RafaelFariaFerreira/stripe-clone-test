'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { FilterPanel } from './filter-pill';

interface ChecklistFilterPanelProps<T extends string> {
  title: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: readonly T[];
  onApply: (value: T[]) => void;
}

/**
 * Multi-select filter (Status, Payment method, Currency). Applying with nothing
 * checked clears the filter.
 */
export default function ChecklistFilterPanel<T extends string>({ title, options, value, onApply }: ChecklistFilterPanelProps<T>) {
  const [draft, setDraft] = useState<Set<T>>(() => new Set(value));
  const toggle = (option: T) =>
    setDraft((current) => {
      const next = new Set(current);
      if (next.has(option)) next.delete(option);
      else next.add(option);
      return next;
    });

  return (
    <FilterPanel title={title} onApply={() => onApply(options.map((option) => option.value).filter((option) => draft.has(option)))}>
      <fieldset className="filter-panel__options" style={{ border: 0, minInlineSize: 0 }}>
        <legend className="sr-only">{title}</legend>
        {options.map((option) => (
          <label key={option.value} className="check-option">
            <Checkbox checked={draft.has(option.value)} onChange={() => toggle(option.value)} />
            <span className="check-option__label">{option.label}</span>
          </label>
        ))}
      </fieldset>
    </FilterPanel>
  );
}
