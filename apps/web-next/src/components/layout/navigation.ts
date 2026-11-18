import type { IconName } from '@stripe-clone/icons';

/** Sidebar entries, verbatim from the reference screenshot. */
export interface NavEntry {
  label: string;
  icon: IconName;
  href?: string;
  /** Collapsible product group (shown with a chevron). */
  children?: ReadonlyArray<{ label: string; href?: string }>;
}

export interface NavSection {
  title?: string;
  items: readonly NavEntry[];
}

export const NAVIGATION: readonly NavSection[] = [
  {
    items: [
      { label: 'Home', icon: 'nav-home' },
      { label: 'Balances', icon: 'nav-balances' },
      { label: 'Transactions', icon: 'nav-transactions', href: '/payments' },
      { label: 'Customers', icon: 'nav-customers' },
      { label: 'Product catalog', icon: 'nav-product-catalog' },
    ],
  },
  {
    title: 'Shortcuts',
    items: [
      { label: 'Payments analytics', icon: 'nav-pin' },
      { label: 'Reports', icon: 'nav-clock' },
      { label: 'Sigma', icon: 'nav-clock' },
      { label: 'Radar', icon: 'nav-clock' },
    ],
  },
  {
    title: 'Products',
    items: [
      { label: 'Connect', icon: 'nav-connect', children: [{ label: 'Overview' }, { label: 'Connected accounts' }] },
      {
        label: 'Payments',
        icon: 'nav-payments',
        children: [{ label: 'Transactions', href: '/payments' }, { label: 'Disputes' }, { label: 'Radar' }, { label: 'Payment Links' }],
      },
      { label: 'Billing', icon: 'nav-billing', children: [{ label: 'Subscriptions' }, { label: 'Invoices' }, { label: 'Customer portal' }] },
      { label: 'Reporting', icon: 'nav-reporting', children: [{ label: 'Reports' }, { label: 'Sigma' }] },
      { label: 'More', icon: 'nav-more', children: [{ label: 'Tax' }, { label: 'Identity' }, { label: 'Atlas' }] },
    ],
  },
];

/** Account shown in the switcher, as in the reference. */
export const ACCOUNT = { name: 'cramly.ai', logoText: 'Cramly' } as const;
