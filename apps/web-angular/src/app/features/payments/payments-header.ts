import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Icon } from '../../ui/icon';
import { preference } from '../../core/preferences';

/** "Transactions" title with primary actions, and the section tabs. */
@Component({
  selector: 'app-payments-header',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div class="page-header">
      <h1 class="page-header__title">Transactions</h1>
      <div class="page-header__actions">
        <button type="button" class="button button--primary">
          <svg appIcon="plus" [size]="12"></svg>
          <span class="button__label">Create payment</span>
        </button>
        <button type="button" class="button button--secondary">
          <svg appIcon="analyze" [size]="12"></svg>
          <span class="button__label">Analyze</span>
        </button>
      </div>
    </div>
    <nav class="tabs" aria-label="Transactions">
      @for (tab of tabs; track tab) {
        <a class="tabs__tab" [href]="tab === 'Payments' ? '/payments' : '#'" [attr.aria-current]="tab === 'Payments' ? 'page' : null">{{
          tab
        }}</a>
      }
    </nav>
  `,
})
export class PaymentsHeader {
  protected readonly tabs = ['Payments', 'Payouts', 'Top-ups', 'Collected fees', 'Transfers', 'All activity'] as const;
}

/** "New" announcement above the status cards; dismissal is remembered per browser. */
@Component({
  selector: 'app-announcement-banner',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    @if (!dismissed()) {
      <section class="banner" aria-label="Announcement">
        <span class="banner__tag"><svg appIcon="sparkle" [size]="12"></svg>New</span>
        <p class="banner__message">Rule Attributes are now in Sigma and Data Pipeline for better fraud insights.</p>
        <div class="banner__actions">
          <a class="link" href="#get-started">Get started</a>
          <span class="vertical-divider" aria-hidden="true"></span>
          <button
            type="button"
            class="icon-button icon-button--sm banner__close"
            aria-label="Dismiss announcement"
            (click)="dismissed.set(true)"
          >
            <svg appIcon="close" [size]="12"></svg>
          </button>
        </div>
      </section>
    }
  `,
})
export class AnnouncementBanner {
  protected readonly dismissed = preference('payments.banner.rule-attributes.dismissed', false);
}
