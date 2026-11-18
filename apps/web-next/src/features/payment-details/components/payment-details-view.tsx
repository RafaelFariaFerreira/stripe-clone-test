'use client';

import {
  CARD_BRAND_LABEL,
  describePaymentMethod,
  formatEventTimestamp,
  formatFullDate,
  formatMoney,
  formatMoneyWithCode,
  formatTableDate,
  CURRENCY_LABEL,
  type Payment,
  type PaymentDetails,
} from '@stripe-clone/domain';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button, IconButton } from '@/components/ui/button';
import { Spinner, Skeleton } from '@/components/ui/feedback';
import { Icon } from '@/components/ui/icon';
import { Tooltip } from '@/components/ui/tooltip';
import { usePaymentDetails, usePayments } from '@/features/payments/api/queries';
import { CardLast4, CopyableId, PaymentMethodCell } from '@/features/payments/components/table/cells';

/**
 * Payment details page. The list dataset (already cached by the table) renders
 * the header immediately; the heavier details shard loads lazily and each
 * section shows its own spinner meanwhile, like the Dashboard.
 */
export function PaymentDetailsView({ id }: { id: string }) {
  const { payments, status: listStatus } = usePayments();
  const { details, status: detailStatus } = usePaymentDetails(id);
  const payment = payments?.find((item) => item.id === id);

  if (listStatus === 'success' && !payment) return <PaymentNotFound id={id} />;
  if (!payment) return <PaymentDetailsSkeleton />;

  const loading = detailStatus === 'pending';
  const failed = detailStatus === 'error';

  return (
    <article className="detail">
      <DetailHeader payment={payment} />

      <div className="detail-layout">
        <div className="detail-layout__main">
          <Section title="Recent activity" action={<Button>Add note</Button>} loading={loading} failed={failed}>
            {details ? <Timeline details={details} /> : null}
          </Section>

          <Section title="Payment breakdown" loading={loading} failed={failed}>
            {details ? <Breakdown payment={payment} details={details} /> : null}
          </Section>

          <Section title="Payment method" loading={loading} failed={failed}>
            {details ? <PaymentMethodSection payment={payment} details={details} /> : null}
          </Section>

          <Section title="Tax calculation">
            <div className="empty-box empty-box--tall">
              <div>
                <p>No tax rate applied.</p>
                <p>
                  <Icon name="lightbulb" size={12} /> Calculate tax automatically on future invoices using Stripe Tax.{' '}
                  <a className="link" href="#tax">
                    Start now
                  </a>
                </p>
              </div>
            </div>
          </Section>

          <Section title="Risk analysis">
            <nav className="tabs tabs--compact" aria-label="Risk analysis">
              <a className="tabs__tab" aria-current="page" href="#risk-factors">
                Risk factors
              </a>
              <a className="tabs__tab" href="#risk-scores">
                Risk scores
              </a>
            </nav>
            <p className="note" style={{ marginTop: 12 }}>
              Risk insights are only available for live data.
            </p>
          </Section>

          <Section title="Related payments">
            <p className="note note--divided">No related payments in the last 6 months</p>
          </Section>

          <Section title="Related objects" loading={loading} failed={failed}>
            {details ? (
              <dl className="key-value-list">
                <div>
                  <dt className="key-value__label">Latest charge</dt>
                  <dd className="key-value__value">
                    <CopyableId id={details.chargeId} display="full" variant="plain" />
                  </dd>
                </div>
              </dl>
            ) : null}
          </Section>

          <Section
            title="Receipt history"
            action={
              <span style={{ display: 'flex', gap: 8 }}>
                <Button>View receipt</Button>
                <Button>Send receipt</Button>
              </span>
            }
          >
            <div className="empty-box">No receipts sent</div>
          </Section>

          <Section title="Events" loading={loading} failed={failed}>
            {details ? (
              <ul>
                {details.events.map((event) => (
                  <li key={event.id} className="activity-list__item">
                    <span className="activity-list__title">{event.description}</span>
                    <time className="activity-list__time" dateTime={event.at}>
                      {formatEventTimestamp(event.at)}
                    </time>
                  </li>
                ))}
              </ul>
            ) : null}
          </Section>

          <Section title="Logs" loading={loading} failed={failed}>
            {details ? (
              <ul>
                {details.logs.map((log) => (
                  <li key={log.id} className="activity-list__item">
                    <span className="activity-list__title activity-list__title--wide">
                      {log.method} {log.path}
                      <Badge tone={log.status < 300 ? 'neutral' : 'danger'}>{log.status < 300 ? `${log.status} OK` : `${log.status} ERR`}</Badge>
                    </span>
                    <time className="activity-list__time" dateTime={log.at}>
                      {formatEventTimestamp(log.at)}
                    </time>
                  </li>
                ))}
              </ul>
            ) : null}
          </Section>
        </div>

        <aside className="detail-layout__aside" aria-label="Payment summary">
          <Section title="Details" loading={loading} failed={failed}>
            {details ? <DetailsList payment={payment} details={details} /> : null}
          </Section>
          <Section title="Customer">
            <dl className="key-value-list">
              <KeyValue label="ID">
                <a className="link" href="#customer">
                  {payment.customer.id}
                </a>
              </KeyValue>
              <KeyValue label="Name">{payment.customer.name ?? '-'}</KeyValue>
              <KeyValue label="Description">-</KeyValue>
              <KeyValue label="Email">
                <CopyableId id={payment.customer.email} display="full" variant="plain" />
              </KeyValue>
              <KeyValue label="Phone">-</KeyValue>
              <KeyValue label="Country">{details?.origin ?? '-'}</KeyValue>
            </dl>
          </Section>
          <Section title="Metadata" action={<IconButton icon="edit" label="Edit metadata" outlined size="sm" />} loading={loading} failed={failed}>
            {details ? (
              Object.keys(details.metadata).length ? (
                <dl className="key-value-list">
                  {Object.entries(details.metadata).map(([key, value]) => (
                    <KeyValue key={key} label={key}>
                      {value}
                    </KeyValue>
                  ))}
                </dl>
              ) : (
                <div className="empty-box empty-box--tall">No metadata</div>
              )
            ) : null}
          </Section>
        </aside>
      </div>
    </article>
  );
}

function DetailHeader({ payment }: { payment: Payment }) {
  return (
    <header className="detail-header">
      <div>
        <Link href="/payments" className="detail-header__breadcrumb">
          Transactions
        </Link>
        <h1 className="detail-header__title">
          <span className="tabular-nums">{formatMoney(payment.amount, payment.currency)}</span>
          <span className="detail-header__currency">{CURRENCY_LABEL[payment.currency]}</span>
          <StatusBadge status={payment.status} />
        </h1>
        <p className="detail-header__subtitle">
          Charged to{' '}
          <Link className="link" href={`/payments?q=${encodeURIComponent(payment.customer.email)}`}>
            {payment.customer.email}
          </Link>
        </p>
      </div>
      <div className="detail-header__actions">
        <Button icon="refund" disabled={payment.status !== 'succeeded' && payment.status !== 'partially_refunded'}>
          Refund
        </Button>
        <IconButton icon="more-horizontal" label="More actions" outlined />
      </div>
    </header>
  );
}

interface SectionProps {
  title: string;
  action?: ReactNode;
  loading?: boolean;
  failed?: boolean;
  children: ReactNode;
}

function Section({ title, action, loading = false, failed = false, children }: SectionProps) {
  const headingId = `section-${title.toLowerCase().replaceAll(' ', '-')}`;
  return (
    <section aria-labelledby={headingId} aria-busy={loading || undefined}>
      <div className="detail-section__header">
        <h2 id={headingId} className="detail-section__title">
          {title}
        </h2>
        {action}
      </div>
      <div className="detail-section__body">
        {failed ? (
          <p className="note">This section couldn&apos;t be loaded.</p>
        ) : loading ? (
          <div className="detail-section__loading">
            <Spinner label={`Loading ${title.toLowerCase()}`} />
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

function Timeline({ details }: { details: PaymentDetails }) {
  return (
    <ol>
      {details.timeline.map((entry) => (
        <li key={`${entry.label}-${entry.at}`} className="timeline__item" data-current={entry.current}>
          <span className="timeline__label">{entry.label}</span>
          <Tooltip content={formatFullDate(entry.at)}>
            <time className="timeline__date" dateTime={entry.at} tabIndex={0}>
              {formatTableDate(entry.at)}
            </time>
          </Tooltip>
        </li>
      ))}
    </ol>
  );
}

function Breakdown({ payment, details }: { payment: Payment; details: PaymentDetails }) {
  const { currency } = payment;
  return (
    <div>
      <div className="breakdown__row">
        <span>Payment amount</span>
        <span className="tabular-nums">{formatMoneyWithCode(payment.amount, currency)}</span>
      </div>
      {payment.amountRefunded ? (
        <div className="breakdown__row breakdown__row--fee">
          <span>Refunded</span>
          <span className="tabular-nums">- {formatMoneyWithCode(payment.amountRefunded, currency)}</span>
        </div>
      ) : null}
      <div className="breakdown__row breakdown__row--fee">
        <span className="breakdown__label">
          Stripe processing fees
          <a className="breakdown__learn-more" href="#fees">
            Learn more
          </a>
        </span>
        <span className="tabular-nums">- {formatMoneyWithCode(details.fee, currency)}</span>
      </div>
      <div className="breakdown__row">
        <span>Net amount</span>
        <span className="tabular-nums">{formatMoneyWithCode(details.net, currency)}</span>
      </div>
    </div>
  );
}

function PaymentMethodSection({ payment, details }: { payment: Payment; details: PaymentDetails }) {
  const [expanded, setExpanded] = useState(false);
  const method = payment.paymentMethod;
  return (
    <>
      <div className="disclosure">
        <button type="button" className="disclosure__summary" aria-expanded={expanded} aria-controls="payment-method-details" onClick={() => setExpanded((value) => !value)}>
          <Icon name="chevron-right" size={8} />
          <PaymentMethodCell method={method} />
          {method.expMonth && method.expYear ? (
            <span className="disclosure__meta">
              Expires {new Date(method.expYear, method.expMonth - 1).toLocaleString('en-US', { month: 'short' })} {method.expYear}
            </span>
          ) : null}
        </button>
        {expanded ? (
          <div id="payment-method-details" className="disclosure__content">
            <dl className="key-value-list key-value-list--grid">
              <GridRow label="ID">{details.paymentMethodId}</GridRow>
              <GridRow label="Type">{describePaymentMethod(method)}</GridRow>
              <GridRow label="Number">
                <CardLast4 last4={method.last4} />
              </GridRow>
              <GridRow label="Fingerprint">{details.fingerprint}</GridRow>
              {method.expMonth && method.expYear ? (
                <GridRow label="Expires">
                  {String(method.expMonth).padStart(2, '0')} / {method.expYear}
                </GridRow>
              ) : null}
              <GridRow label="Issuer">{details.issuer}</GridRow>
              <GridRow label="Origin">{details.origin}</GridRow>
              <GridRow label="CVC check">{details.cvcCheck}</GridRow>
            </dl>
          </div>
        ) : null}
      </div>
      <div className="enabled-methods">
        <p className="enabled-methods__label">Enabled payment methods</p>
        <div className="enabled-methods__list">
          <span className="enabled-methods__item" title="Cards">
            <Icon name="card-generic" size={16} label="Cards" />
          </span>
          <span className="enabled-methods__item" title="Link">
            <Icon name="wallet-link" size={16} label="Link" />
          </span>
        </div>
      </div>
    </>
  );
}

function DetailsList({ payment, details }: { payment: Payment; details: PaymentDetails }) {
  return (
    <dl className="key-value-list">
      <KeyValue label="Payment ID">
        <CopyableId id={payment.id} display="full" variant="plain" />
      </KeyValue>
      <KeyValue label="Payment method">
        <span className="payment-method">
          {payment.paymentMethod.brand ? CARD_BRAND_LABEL[payment.paymentMethod.brand] : payment.paymentMethod.bankName}
          <CardLast4 last4={payment.paymentMethod.last4} />
        </span>
      </KeyValue>
      <KeyValue label="Risk level">
        <span className="key-value__stack">
          <Badge tone={details.riskLevel === 'normal' ? 'success' : details.riskLevel === 'elevated' ? 'warning' : 'danger'}>
            {details.riskLevel === 'normal' ? 'Normal' : details.riskLevel === 'elevated' ? 'Elevated' : 'Highest'}
          </Badge>
          <a className="link" href="#risk-docs">
            View docs
          </a>
        </span>
      </KeyValue>
      <KeyValue label="Description">
        {payment.description}
        <a className="link" href="#edit-description">
          Edit <Icon name="edit" size={12} />
        </a>
      </KeyValue>
      <KeyValue label="Statement descriptor">{details.statementDescriptor}</KeyValue>
      {details.fundsAvailableAt ? (
        <KeyValue label="Funds available">
          <span className="key-value__stack">
            <time className="timeline__date" dateTime={details.fundsAvailableAt}>
              {formatTableDate(details.fundsAvailableAt)}
            </time>
            <a className="link" href="#balances">
              View balances
            </a>
          </span>
        </KeyValue>
      ) : null}
      <KeyValue label="Last updated">
        <time className="timeline__date" dateTime={details.updatedAt}>
          {formatTableDate(details.updatedAt)}
        </time>
      </KeyValue>
    </dl>
  );
}

function KeyValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="key-value__label">{label}</dt>
      <dd className="key-value__value">{children}</dd>
    </div>
  );
}

function GridRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="key-value__label">{label}</dt>
      <dd className="key-value__value">{children}</dd>
    </>
  );
}

/** Mirrors the live loading capture: header placeholders + a spinner per section. */
export function PaymentDetailsSkeleton() {
  return (
    <article className="detail" aria-busy="true" aria-label="Loading payment">
      <div className="detail-header">
        <div>
          <Link href="/payments" className="detail-header__breadcrumb">
            Transactions
          </Link>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', height: 36 }}>
            <Skeleton width={160} height={24} />
          </div>
          <Skeleton width={220} />
        </div>
      </div>
      <div className="detail-layout">
        <div className="detail-layout__main">
          {['Recent activity', 'Payment breakdown', 'Payment method'].map((title) => (
            <section key={title}>
              <h2 className="detail-section__title">{title}</h2>
              <div className="detail-section__body detail-section__loading">
                <Spinner />
              </div>
            </section>
          ))}
        </div>
        <div className="detail-layout__aside">
          {['Details', 'Customer', 'Metadata'].map((title) => (
            <section key={title}>
              <h2 className="detail-section__title">{title}</h2>
              <div className="detail-section__body detail-section__loading">
                <Spinner />
              </div>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}

function PaymentNotFound({ id }: { id: string }) {
  return (
    <div className="not-found" role="alert">
      <h1 className="not-found__title">No such payment</h1>
      <p className="not-found__text">
        We couldn&apos;t find a payment with ID <code>{id}</code>. It may have been removed or the link is incorrect.
      </p>
      <Link href="/payments" className="button button--secondary">
        Back to payments
      </Link>
    </div>
  );
}
