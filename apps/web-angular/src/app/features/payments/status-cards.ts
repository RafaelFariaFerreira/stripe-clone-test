import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PAYMENT_VIEWS, type PaymentsView } from '@stripe-clone/domain';

/** Quick views above the table (All, Succeeded, Refunded…), single-select like tabs. */
@Component({
  selector: 'app-status-cards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div class="status-cards" role="tablist" aria-label="Payment status views">
      @for (view of views; track view.id) {
        <button type="button" role="tab" class="status-card" [attr.aria-selected]="active() === view.id" (click)="selected.emit(view.id)">
          {{ view.label }}
        </button>
      }
    </div>
  `,
})
export class StatusCards {
  readonly active = input.required<PaymentsView>();
  readonly selected = output<PaymentsView>();
  protected readonly views = PAYMENT_VIEWS;
}
