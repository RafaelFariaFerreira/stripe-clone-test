'use client';

import type { Payment } from '@stripe-clone/domain';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/icon';
import { Menu, MenuDivider, MenuItem } from '@/components/ui/menu';
import { useCopyToClipboard } from '@/lib/use-copy-to-clipboard';

/** Trailing `⋯` menu of a row (sticky on the right edge of the table). */
export function RowActions({ payment }: { payment: Payment }) {
  const router = useRouter();
  const { copy } = useCopyToClipboard();
  return (
    <Menu
      label={`Actions for payment ${payment.id}`}
      trigger={(props) => (
        <button type="button" className="icon-button icon-button--sm" aria-label="More actions" {...props}>
          <Icon name="more-horizontal" size={12} />
        </button>
      )}
    >
      <MenuItem onSelect={() => router.push(`/payments/${payment.id}`)}>View payment details</MenuItem>
      <MenuItem onSelect={() => void copy(payment.id)}>Copy payment ID</MenuItem>
      <MenuItem onSelect={() => void copy(payment.customer.email)}>Copy customer email</MenuItem>
      <MenuDivider />
      <MenuItem onSelect={() => router.push(`/payments?q=${encodeURIComponent(payment.customer.email)}`)}>
        View payments from this customer
      </MenuItem>
    </Menu>
  );
}
