import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import {
  CARD_BRAND_LABEL,
  describePaymentMethod,
  formatFullDate,
  formatRelativeTime,
  formatTableDate,
  WALLET_LABEL,
  type CardBrand,
  type PaymentMethod,
  type WalletType,
} from '@stripe-clone/domain';
import type { IconName } from '@stripe-clone/icons';
import { BrandMark, Icon } from '../../../ui/icon';
import { Tooltip } from '../../../ui/tooltip';

const BRAND_ICON: Readonly<Record<CardBrand, IconName>> = {
  visa: 'card-visa',
  mastercard: 'card-mastercard',
  amex: 'card-amex',
  discover: 'card-discover',
};

const WALLET_ICON: Readonly<Record<WalletType, IconName>> = {
  apple_pay: 'wallet-apple-pay',
  google_pay: 'wallet-google-pay',
  link: 'wallet-link',
};

/** `•••• 4242`, with "ending in" for screen readers. */
@Component({
  selector: 'app-card-last4',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<span class="card-last4"
    ><span class="card-last4__dots" aria-hidden="true">••••</span><span class="sr-only">ending in </span>{{ last4() }}</span
  >`,
})
export class CardLast4 {
  readonly last4 = input.required<string>();
}

/** Wallet mark (if any) + card brand mark, right-aligned, then `•••• 4242`. */
@Component({
  selector: 'app-payment-method-cell',
  imports: [BrandMark, CardLast4, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <span class="payment-method" [title]="description()">
      <span class="payment-method__marks">
        @if (method().wallet; as wallet) {
          <svg [appBrandMark]="walletIcon[wallet]" [label]="walletLabel[wallet]"></svg>
        }
        @if (method().brand; as brand) {
          <svg [appBrandMark]="brandIcon[brand]" [label]="brandLabel[brand]"></svg>
        } @else {
          <span class="brand-mark brand-mark--bank" role="img" [attr.aria-label]="method().bankName ?? 'Bank account'">
            <svg appIcon="bank" [size]="12"></svg>
          </span>
        }
      </span>
      <app-card-last4 [last4]="method().last4" />
    </span>
  `,
})
export class PaymentMethodCell {
  readonly method = input.required<PaymentMethod>();
  protected readonly description = computed(() => describePaymentMethod(this.method()));
  protected readonly brandIcon = BRAND_ICON;
  protected readonly brandLabel = CARD_BRAND_LABEL;
  protected readonly walletIcon = WALLET_ICON;
  protected readonly walletLabel = WALLET_LABEL;
}

/**
 * Creation date (`Aug 16, 5:03 PM`) with the relative time in a tooltip.
 * The relative time is also present for screen readers, which don't hover.
 */
@Component({
  selector: 'app-created-cell',
  imports: [Tooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <time [attr.datetime]="iso()" [appTooltip]="tooltip()" [appTooltipBeforeShow]="refresh">
      {{ label() }}<span class="sr-only">, {{ relative() }}</span>
    </time>
  `,
})
export class CreatedCell {
  readonly iso = input.required<string>();

  /** Bumped right before the tooltip opens so the relative time is current. */
  private readonly now = signal(new Date());
  protected readonly refresh = () => this.now.set(new Date());

  protected readonly label = computed(() => formatTableDate(this.iso()));
  protected readonly relative = computed(() => formatRelativeTime(this.iso(), this.now()));
  protected readonly tooltip = computed(() => `${this.relative()} · ${formatFullDate(this.iso())}`);
}
