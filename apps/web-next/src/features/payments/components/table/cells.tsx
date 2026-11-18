'use client';

import {
  CARD_BRAND_LABEL,
  describePaymentMethod,
  formatFullDate,
  formatRelativeTime,
  formatTableDate,
  shortenId,
  WALLET_LABEL,
  type CardBrand,
  type PaymentMethod,
  type WalletType,
} from '@stripe-clone/domain';
import type { IconName } from '@stripe-clone/icons';
import { useState } from 'react';
import { BrandMark, Icon } from '@/components/ui/icon';
import { Tooltip } from '@/components/ui/tooltip';
import { useCopyToClipboard } from '@/lib/use-copy-to-clipboard';
import { useNow } from '@/lib/use-now';

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

/** Wallet mark (if any) + card brand mark, right-aligned, then `•••• 4242`. */
export function PaymentMethodCell({ method, compact = false }: { method: PaymentMethod; compact?: boolean }) {
  // Compact (search results): a single mark, the wallet when there is one, like the Dashboard.
  const showBrand = !(compact && method.wallet);
  return (
    <span className="payment-method" title={describePaymentMethod(method)}>
      <span className="payment-method__marks">
        {method.wallet ? <BrandMark name={WALLET_ICON[method.wallet]} label={WALLET_LABEL[method.wallet]} /> : null}
        {!showBrand ? null : method.brand ? (
          <BrandMark name={BRAND_ICON[method.brand]} label={CARD_BRAND_LABEL[method.brand]} />
        ) : (
          <span className="brand-mark brand-mark--bank" role="img" aria-label={method.bankName ?? 'Bank account'}>
            <Icon name="bank" size={12} />
          </span>
        )}
      </span>
      <CardLast4 last4={method.last4} />
    </span>
  );
}

export function CardLast4({ last4 }: { last4: string }) {
  return (
    <span className="card-last4">
      <span className="card-last4__dots" aria-hidden="true">
        ••••
      </span>
      <span className="sr-only">ending in </span>
      {last4}
    </span>
  );
}

/**
 * Creation date (`Aug 16, 5:03 PM`) with the relative time in a tooltip.
 * The relative time is also present for screen readers, which don't hover.
 */
export function CreatedCell({ iso }: { iso: string }) {
  const [open, setOpen] = useState(false);
  const now = useNow(30_000, open);
  return (
    <Tooltip content={`${formatRelativeTime(iso, now)} · ${formatFullDate(iso)}`} onOpenChange={setOpen}>
      <time dateTime={iso}>
        {formatTableDate(iso)}
        <span className="sr-only">, {formatRelativeTime(iso)}</span>
      </time>
    </Tooltip>
  );
}

/** Formatted date or the Dashboard's em dash placeholder. */
export function OptionalDate({ iso }: { iso: string | null }) {
  return iso ? <time dateTime={iso}>{formatTableDate(iso)}</time> : <EmptyValue />;
}

export function EmptyValue() {
  return (
    <span className="cell-empty" aria-label="None">
      —
    </span>
  );
}

interface CopyableIdProps {
  id: string;
  /** `short` truncates the middle (`pi_3UdA…9wsQ`); the full id is always copied. */
  display?: 'short' | 'full';
  variant?: 'chip' | 'plain';
}

/** Monospace id chip with copy-to-clipboard and "Copied!" feedback. */
export function CopyableId({ id, display = 'short', variant = 'chip' }: CopyableIdProps) {
  const { copied, copy } = useCopyToClipboard();
  return (
    <Tooltip content={copied ? 'Copied!' : 'Copy to clipboard'} delay={150}>
      <button
        type="button"
        className={variant === 'plain' ? 'copyable-id copyable-id--plain' : 'copyable-id'}
        aria-label={`Copy payment ID ${id}`}
        onClick={(event) => {
          event.stopPropagation();
          void copy(id);
        }}
      >
        <span>{display === 'short' ? shortenId(id) : id}</span>
        <Icon name="copy" size={12} />
        <span className="sr-only" aria-live="polite">
          {copied ? 'Copied' : ''}
        </span>
      </button>
    </Tooltip>
  );
}
