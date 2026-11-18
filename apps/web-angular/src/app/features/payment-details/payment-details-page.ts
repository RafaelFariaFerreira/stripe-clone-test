import { KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CARD_BRAND_LABEL,
  CURRENCY_LABEL,
  describePaymentMethod,
  formatEventTimestamp,
  formatFullDate,
  formatMoney,
  formatMoneyWithCode,
  formatTableDate,
  rebaseDetails,
  type PaymentDetails,
} from '@stripe-clone/domain';
import { PaymentsRepository } from '../../core/payments-repository';
import { PaymentsStore, SESSION_NOW } from '../../core/payments-store';
import { Badge, StatusBadge } from '../../ui/badge';
import { CopyableId } from '../../ui/copyable-id';
import { Skeleton, Spinner } from '../../ui/feedback';
import { Icon } from '../../ui/icon';
import { Tooltip } from '../../ui/tooltip';
import { CardLast4, PaymentMethodCell } from '../payments/table/cells';
import { DetailSection } from './detail-section';

/**
 * Payment details route (`/payments/:id`, bound with `withComponentInputBinding`).
 * The list dataset (already cached) renders the header immediately; the
 * details shard loads lazily and each section shows its own spinner meanwhile,
 * like the Dashboard. Sections below the fold are deferred until visible.
 */
@Component({
  selector: 'app-payment-details-page',
  imports: [
    Badge,
    CardLast4,
    CopyableId,
    DetailSection,
    Icon,
    KeyValuePipe,
    PaymentMethodCell,
    RouterLink,
    Skeleton,
    Spinner,
    StatusBadge,
    Tooltip,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment-details-page.html',
})
export class PaymentDetailsPage {
  /** Route param, bound by the router. */
  readonly id = input.required<string>();

  private readonly store = inject(PaymentsStore);
  private readonly repository = inject(PaymentsRepository);

  protected readonly payment = computed(() => this.store.find(this.id()));
  protected readonly listLoaded = computed(() => Boolean(this.store.payments()));

  private readonly detailsResource = resource({
    params: () => this.id(),
    loader: ({ params }) => this.repository.loadDetails(params),
  });

  /** Details rebased to the session; `undefined` while loading, `null` when unknown. */
  protected readonly details = computed<PaymentDetails | null | undefined>(() => {
    const anchor = this.store.anchor();
    if (!this.detailsResource.hasValue() || !anchor) return undefined;
    const record = this.detailsResource.value();
    return record ? rebaseDetails(record, anchor, SESSION_NOW) : null;
  });
  protected readonly detailsLoading = computed(() => this.details() === undefined && this.detailsResource.status() !== 'error');
  protected readonly detailsFailed = computed(() => this.detailsResource.status() === 'error');

  protected readonly methodExpanded = signal(false);

  protected readonly currencyLabel = CURRENCY_LABEL;
  protected readonly brandLabel = CARD_BRAND_LABEL;
  protected readonly formatMoney = formatMoney;
  protected readonly formatMoneyWithCode = formatMoneyWithCode;
  protected readonly formatTableDate = formatTableDate;
  protected readonly formatFullDate = formatFullDate;
  protected readonly formatEventTimestamp = formatEventTimestamp;
  protected readonly describePaymentMethod = describePaymentMethod;

  protected readonly canRefund = computed(() => {
    const status = this.payment()?.status;
    return status === 'succeeded' || status === 'partially_refunded';
  });

  protected readonly expires = computed(() => {
    const method = this.payment()?.paymentMethod;
    if (!method?.expMonth || !method.expYear) return null;
    const month = new Date(method.expYear, method.expMonth - 1).toLocaleString('en-US', { month: 'short' });
    return { label: `Expires ${month} ${method.expYear}`, numeric: `${String(method.expMonth).padStart(2, '0')} / ${method.expYear}` };
  });

  protected readonly riskBadge = computed(() => {
    switch (this.details()?.riskLevel) {
      case 'elevated':
        return { tone: 'warning', label: 'Elevated' } as const;
      case 'highest':
        return { tone: 'danger', label: 'Highest' } as const;
      default:
        return { tone: 'success', label: 'Normal' } as const;
    }
  });

  protected hasMetadata(details: PaymentDetails): boolean {
    return Object.keys(details.metadata).length > 0;
  }
}
