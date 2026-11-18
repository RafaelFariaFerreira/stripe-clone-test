import type { CardBrand, PaymentMethod, PaymentMethodType, WalletType } from './types';

export const PAYMENT_METHOD_TYPE_LABEL: Readonly<Record<PaymentMethodType, string>> = {
  card: 'Card',
  ach_debit: 'ACH Direct Debit',
  wallet: 'Wallet',
};

export const PAYMENT_METHOD_TYPES = Object.keys(PAYMENT_METHOD_TYPE_LABEL) as PaymentMethodType[];

export const CARD_BRAND_LABEL: Readonly<Record<CardBrand, string>> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
};

export const WALLET_LABEL: Readonly<Record<WalletType, string>> = {
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
  link: 'Link',
};

/** `Visa credit card`, `Apple Pay (Visa)`, `ACH Direct Debit`: used in titles and CSV export. */
export function describePaymentMethod(method: PaymentMethod): string {
  if (method.type === 'ach_debit') {
    return method.bankName ? `${method.bankName} bank account` : PAYMENT_METHOD_TYPE_LABEL.ach_debit;
  }
  const brand = method.brand ? CARD_BRAND_LABEL[method.brand] : 'Card';
  if (method.type === 'wallet' && method.wallet) {
    return `${WALLET_LABEL[method.wallet]} (${brand})`;
  }
  return `${brand} credit card`;
}
