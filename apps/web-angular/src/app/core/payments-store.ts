import { Injectable, computed, inject, resource } from '@angular/core';
import { rebaseDataset, type Payment } from '@stripe-clone/domain';
import { PaymentsRepository } from './payments-repository';

/**
 * Timestamps are rebased once per page load, so every component agrees on
 * "now" and relative times don't jump between renders.
 */
export const SESSION_NOW = new Date();

/**
 * App-wide payments state. The dataset `resource` lives in a root service, so
 * it is fetched once and survives navigation between the list and details.
 */
@Injectable({ providedIn: 'root' })
export class PaymentsStore {
  private readonly repository = inject(PaymentsRepository);

  private readonly dataset = resource({ loader: () => this.repository.loadDataset() });

  /** Every payment, rebased to the current session; `undefined` while loading. */
  readonly payments = computed<Payment[] | undefined>(() => {
    const data = this.dataset.hasValue() ? this.dataset.value() : undefined;
    return data ? rebaseDataset(data, SESSION_NOW) : undefined;
  });

  readonly anchor = computed(() => (this.dataset.hasValue() ? this.dataset.value().anchor : undefined));
  readonly isLoading = this.dataset.isLoading;
  readonly hasError = computed(() => this.dataset.status() === 'error');

  /** Lookup table for the details page header. */
  private readonly byId = computed(() => new Map((this.payments() ?? []).map((payment) => [payment.id, payment])));

  find(id: string): Payment | undefined {
    return this.byId().get(id);
  }

  reload(): void {
    this.dataset.reload();
  }

  prefetchDetails(id: string): void {
    this.repository.prefetchDetails(id);
  }
}
