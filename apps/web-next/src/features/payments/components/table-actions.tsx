'use client';

import { paymentsToCsv, type Payment } from '@stripe-clone/domain';
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Icon } from '@/components/ui/icon';
import { Popover } from '@/components/ui/popover';
import { COLUMNS, type ColumnId } from '../columns';

/** Downloads the current filtered + sorted view (all pages) as CSV. */
function downloadCsv(rows: readonly Payment[]) {
  const blob = new Blob([paymentsToCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

interface TableActionsProps {
  rows: readonly Payment[];
  visibleColumns: ReadonlySet<ColumnId>;
  onVisibleColumnsChange: (next: Set<ColumnId>) => void;
}

/** `Export` and `Edit columns`, right-aligned in the filter toolbar. */
export function TableActions({ rows, visibleColumns, onVisibleColumnsChange }: TableActionsProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="filter-toolbar__actions">
      <button type="button" className="button button--secondary" disabled={rows.length === 0} onClick={() => downloadCsv(rows)}>
        <Icon name="export" size={12} />
        <span>Export</span>
      </button>
      <Popover
        open={open}
        onOpenChange={setOpen}
        placement="bottom-end"
        label="Edit columns"
        trigger={(props) => (
          <button type="button" className="button button--secondary" aria-haspopup="dialog" {...props}>
            <Icon name="gear" size={12} />
            <span>Edit columns</span>
          </button>
        )}
      >
        <div className="filter-panel">
          <div className="filter-panel__header">
            <span className="filter-panel__title">Columns</span>
          </div>
          <div className="filter-panel__body">
            {COLUMNS.filter((column) => column.hideable).map((column) => (
              <label key={column.id} className="check-option">
                <Checkbox
                  checked={visibleColumns.has(column.id)}
                  onChange={() => {
                    const next = new Set(visibleColumns);
                    if (next.has(column.id)) next.delete(column.id);
                    else next.add(column.id);
                    onVisibleColumnsChange(next);
                  }}
                />
                <span className="check-option__label">{column.name}</span>
              </label>
            ))}
          </div>
        </div>
      </Popover>
    </div>
  );
}
