'use client';

import { Suspense, useState, type ReactNode } from 'react';
import { Spinner } from '@/components/ui/feedback';
import { Icon } from '@/components/ui/icon';
import { Popover } from '@/components/ui/popover';

interface FilterPillProps {
  label: string;
  /** Summary of the applied value; when present the pill renders in its active style. */
  summary?: string | null;
  onClear: () => void;
  /** Panel content; receives `close` so Apply can dismiss the popover. */
  children: (close: () => void) => ReactNode;
}

/**
 * Dashboard filter pill. Empty: dashed outline with `⊕`. Applied: solid
 * outline, an `✕` to clear, and the value summary in brand color.
 */
export function FilterPill({ label, summary, onClear, children }: FilterPillProps) {
  const [open, setOpen] = useState(false);
  const active = Boolean(summary);
  return (
    <span className="filter-pill" data-active={active}>
      {active ? (
        <button type="button" className="filter-pill__clear" aria-label={`Clear ${label} filter`} onClick={onClear}>
          <Icon name="status-cross" size={12} />
        </button>
      ) : null}
      <Popover
        open={open}
        onOpenChange={setOpen}
        label={`${label} filter`}
        trigger={(props) => (
          <button type="button" className="filter-pill__trigger" aria-haspopup="dialog" {...props}>
            {active ? null : <Icon name="plus-circle" size={12} />}
            <span>{label}</span>
            {active ? (
              <>
                <span className="filter-pill__divider" aria-hidden="true" />
                <span className="filter-pill__value">{summary}</span>
                <Icon name="chevron-down" size={8} />
              </>
            ) : null}
          </button>
        )}
      >
        {/* Panels are code-split; suspend locally instead of blanking the table. */}
        <Suspense fallback={<PanelLoading />}>{children(() => setOpen(false))}</Suspense>
      </Popover>
    </span>
  );
}

interface FilterPanelProps {
  title: string;
  onApply: () => void;
  applyDisabled?: boolean;
  children: ReactNode;
}

/** Shared popover layout: title, body and a full-width primary "Apply". */
export function FilterPanel({ title, onApply, applyDisabled, children }: FilterPanelProps) {
  return (
    <form
      className="filter-panel"
      onSubmit={(event) => {
        event.preventDefault();
        if (!applyDisabled) onApply();
      }}
    >
      <div className="filter-panel__header">
        <span className="filter-panel__title">Filter by {title.toLowerCase()}</span>
      </div>
      <div className="filter-panel__body">{children}</div>
      <div className="filter-panel__footer">
        <button type="submit" className="button button--primary button--block" disabled={applyDisabled}>
          Apply
        </button>
      </div>
    </form>
  );
}

function PanelLoading() {
  return (
    <div className="filter-panel detail-section__loading">
      <Spinner label="Loading filter" />
    </div>
  );
}
