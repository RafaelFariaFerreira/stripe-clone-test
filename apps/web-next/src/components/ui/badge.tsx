import { STATUS_META, type PaymentStatus, type StatusIcon } from '@stripe-clone/domain';
import type { IconName } from '@stripe-clone/icons';
import type { ReactNode } from 'react';
import { Icon } from './icon';

const STATUS_ICON: Readonly<Record<StatusIcon, IconName>> = {
  check: 'status-check',
  cross: 'status-cross',
  blocked: 'status-blocked',
  refund: 'status-refund',
  clock: 'status-clock',
  alert: 'status-alert',
};

interface BadgeProps {
  tone: 'success' | 'danger' | 'warning' | 'neutral';
  icon?: IconName;
  children: ReactNode;
}

/** Compact status pill: 20px tall, 1px border, label followed by an optional glyph. */
export function Badge({ tone, icon, children }: BadgeProps) {
  return (
    <span className={`badge badge--${tone}${icon ? '' : ' badge--plain'}`}>
      {children}
      {icon ? <Icon name={icon} size={12} /> : null}
    </span>
  );
}

/** Badge for a payment status; colors, label and icon come from the domain catalog. */
export function StatusBadge({ status }: { status: PaymentStatus }) {
  const meta = STATUS_META[status];
  return (
    <Badge tone={meta.tone} icon={STATUS_ICON[meta.icon]}>
      {meta.label}
    </Badge>
  );
}
