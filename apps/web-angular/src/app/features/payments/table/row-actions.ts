import { Clipboard } from '@angular/cdk/clipboard';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import type { Payment } from '@stripe-clone/domain';
import { Icon } from '../../../ui/icon';

/** Trailing `⋯` menu of a row (sticky on the right edge of the table), built on CDK Menu. */
@Component({
  selector: 'app-row-actions',
  imports: [CdkMenu, CdkMenuItem, CdkMenuTrigger, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <button
      type="button"
      class="icon-button icon-button--sm"
      aria-label="More actions"
      [cdkMenuTriggerFor]="menu"
      (click)="$event.stopPropagation()"
    >
      <svg appIcon="more-horizontal" [size]="12"></svg>
    </button>
    <ng-template #menu>
      <div class="popover popover--in-pane menu" cdkMenu [attr.aria-label]="'Actions for payment ' + payment().id">
        <button type="button" class="menu__item" cdkMenuItem (cdkMenuItemTriggered)="open()">View payment details</button>
        <button type="button" class="menu__item" cdkMenuItem (cdkMenuItemTriggered)="copy(payment().id)">Copy payment ID</button>
        <button type="button" class="menu__item" cdkMenuItem (cdkMenuItemTriggered)="copy(payment().customer.email)">
          Copy customer email
        </button>
        <div class="menu__divider" role="separator"></div>
        <button type="button" class="menu__item" cdkMenuItem (cdkMenuItemTriggered)="viewCustomer()">
          View payments from this customer
        </button>
      </div>
    </ng-template>
  `,
})
export class RowActions {
  readonly payment = input.required<Payment>();
  private readonly router = inject(Router);
  private readonly clipboard = inject(Clipboard);

  protected open(): void {
    void this.router.navigate(['/payments', this.payment().id]);
  }

  protected copy(text: string): void {
    this.clipboard.copy(text);
  }

  protected viewCustomer(): void {
    void this.router.navigate(['/payments'], { queryParams: { q: this.payment().customer.email } });
  }
}
