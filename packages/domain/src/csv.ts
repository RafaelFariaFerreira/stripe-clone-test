import { CURRENCY_LABEL, toMajorUnits } from './currency';
import { describePaymentMethod } from './payment-method';
import { STATUS_META } from './status';
import type { Payment } from './types';

/** Columns written by "Export", in the order a spreadsheet user expects. */
const CSV_HEADERS = [
  'id',
  'Created date (UTC)',
  'Amount',
  'Currency',
  'Status',
  'Payment method',
  'Card last 4',
  'Description',
  'Customer email',
  'Customer name',
  'Refunded date (UTC)',
  'Amount refunded',
  'Decline reason',
] as const;

/** Quotes a value when needed (RFC 4180) and neutralises spreadsheet formula injection. */
function escapeCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

/** Serialises the current filtered + sorted view into CSV text. */
export function paymentsToCsv(payments: readonly Payment[]): string {
  const lines = payments.map((payment) =>
    [
      payment.id,
      payment.created,
      toMajorUnits(payment.amount, payment.currency).toFixed(payment.currency === 'jpy' ? 0 : 2),
      CURRENCY_LABEL[payment.currency],
      STATUS_META[payment.status].label,
      describePaymentMethod(payment.paymentMethod),
      payment.paymentMethod.last4,
      payment.description,
      payment.customer.email,
      payment.customer.name ?? '',
      payment.refundedAt ?? '',
      toMajorUnits(payment.amountRefunded, payment.currency).toFixed(payment.currency === 'jpy' ? 0 : 2),
      payment.declineReason ?? '',
    ]
      .map(escapeCell)
      .join(','),
  );
  return [CSV_HEADERS.join(','), ...lines].join('\r\n');
}
