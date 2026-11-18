'use client';

import { PAYMENT_VIEWS, type PaymentsView } from '@stripe-clone/domain';

interface StatusCardsProps {
  active: PaymentsView;
  onSelect: (view: PaymentsView) => void;
}

/** Quick views above the table (All, Succeeded, Refunded…), single-select like tabs. */
export function StatusCards({ active, onSelect }: StatusCardsProps) {
  return (
    <div className="status-cards" role="tablist" aria-label="Payment status views">
      {PAYMENT_VIEWS.map((view) => (
        <button
          key={view.id}
          type="button"
          role="tab"
          className="status-card"
          aria-selected={active === view.id}
          onClick={() => onSelect(view.id)}
        >
          {view.label}
        </button>
      ))}
    </div>
  );
}
