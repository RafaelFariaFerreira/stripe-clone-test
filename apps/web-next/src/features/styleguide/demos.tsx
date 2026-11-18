'use client';

import {
  clearSearchFilters,
  SUGGESTED_SEARCH_FILTERS,
  writeSearchFilterPanel,
  sortPayments,
  STATUS_META,
  toggleSort,
  type Payment,
  type PaymentsView,
  type PaymentStatus,
  type SortRule,
} from '@stripe-clone/domain';
import { useState, type ReactNode } from 'react';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button, IconButton } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton, Spinner } from '@/components/ui/feedback';
import { Icon } from '@/components/ui/icon';
import { Menu, MenuDivider, MenuItem, MenuLabel } from '@/components/ui/menu';
import { Tooltip } from '@/components/ui/tooltip';
import { FilterPanel, FilterPill } from '@/features/payments/components/filters/filter-pill';
import { Pagination } from '@/features/payments/components/pagination';
import { EmptyResults, LoadError } from '@/features/payments/components/states';
import { StatusCards } from '@/features/payments/components/status-cards';
import { CopyableId, CreatedCell, PaymentMethodCell } from '@/features/payments/components/table/cells';
import { PaymentsTable, PaymentsTableSkeleton } from '@/features/payments/components/table/payments-table';
import { DEFAULT_COLUMN_LAYOUT, DEFAULT_VISIBLE_COLUMNS, type ColumnLayout } from '@stripe-clone/domain';
import { FiltersPanel } from '@/features/search/components/filters-panel';
import { useHydrated } from '@/lib/use-hydrated';
import styles from './styleguide.module.css';

const HOUR = 3_600_000;

/** Sample rows shown in the table demo (relative to the viewer's clock). */
function samplePayments(now: number): Payment[] {
  const base = {
    description: 'Subscription update',
    refundedAt: null,
    amountRefunded: 0,
    declineReason: null,
    disputeDueBy: null,
  } as const;
  return [
    {
      ...base,
      id: 'pi_3UdA4wRt8vB2wQjK0fxt9wsQ',
      amount: 2198,
      currency: 'usd',
      status: 'succeeded',
      paymentMethod: { type: 'wallet', wallet: 'link', brand: 'mastercard', last4: '0900' },
      customer: { id: 'cus_1', name: null, email: 'olivia.smith@gmail.com' },
      created: new Date(now - 2 * HOUR).toISOString(),
    },
    {
      ...base,
      id: 'pi_3UdA4vRt8vB2wQjK0qBmQJqv',
      amount: 1999,
      currency: 'usd',
      status: 'failed',
      declineReason: 'Insufficient funds',
      paymentMethod: { type: 'wallet', wallet: 'apple_pay', brand: 'visa', last4: '6745' },
      customer: { id: 'cus_2', name: null, email: 'mateo.silva@outlook.com' },
      created: new Date(now - 5 * HOUR).toISOString(),
    },
    {
      ...base,
      id: 'pi_3UdA4tRt8vB2wQjK0IyikOyV',
      amount: 9999,
      currency: 'brl',
      status: 'refunded',
      amountRefunded: 9999,
      refundedAt: new Date(now - 1 * HOUR).toISOString(),
      paymentMethod: { type: 'card', brand: 'visa', last4: '3641' },
      customer: { id: 'cus_3', name: null, email: 'beatriz.santos@gmail.com' },
      created: new Date(now - 30 * HOUR).toISOString(),
    },
    {
      ...base,
      id: 'pi_3UdA4rRt8vB2wQjK0RmhfvIy',
      amount: 1599,
      currency: 'gbp',
      status: 'pending',
      paymentMethod: { type: 'ach_debit', bankName: 'Chase', last4: '2109' },
      customer: { id: 'cus_4', name: null, email: 'harper.king@hotmail.co.uk' },
      created: new Date(now - 50 * HOUR).toISOString(),
    },
  ];
}

function Row({ children }: { children: ReactNode }) {
  return <div className={styles.demoRow}>{children}</div>;
}

function ButtonDemo() {
  return (
    <>
      <Row>
        <Button variant="primary" icon="plus">
          Create payment
        </Button>
        <Button icon="analyze">Analyze</Button>
        <Button icon="export">Export</Button>
        <Button disabled>Disabled</Button>
        <Button variant="ghost">Ghost</Button>
      </Row>
      <Row>
        <Button size="sm">Previous</Button>
        <Button size="sm">Next</Button>
        <IconButton icon="more-horizontal" label="More actions" />
        <IconButton icon="edit" label="Edit" outlined size="sm" />
        <IconButton icon="top-settings" iconSize={16} label="Settings" />
      </Row>
    </>
  );
}

function BadgeDemo() {
  return (
    <>
      <Row>
        {(Object.keys(STATUS_META) as PaymentStatus[]).map((status) => (
          <StatusBadge key={status} status={status} />
        ))}
      </Row>
      <Row>
        <Badge tone="success">Normal</Badge>
        <Badge tone="warning">Elevated</Badge>
        <Badge tone="danger">402 ERR</Badge>
        <Badge tone="neutral">200 OK</Badge>
      </Row>
    </>
  );
}

function CheckboxDemo() {
  const [checked, setChecked] = useState(true);
  return (
    <Row>
      <label className={styles.inline}>
        <Checkbox checked={false} readOnly /> Unchecked
      </label>
      <label className={styles.inline}>
        <Checkbox checked={checked} onChange={() => setChecked((value) => !value)} /> Checked (toggle me)
      </label>
      <label className={styles.inline}>
        <Checkbox indeterminate checked={false} readOnly /> Indeterminate
      </label>
      <label className={styles.inline}>
        <Checkbox disabled /> Disabled
      </label>
    </Row>
  );
}

function TooltipDemo() {
  return (
    <Row>
      <Tooltip content="Hello from the tooltip">
        <button type="button" className="button button--secondary">
          Hover or focus me
        </button>
      </Tooltip>
      <CopyableId id="pi_3UdA4wRt8vB2wQjK0fxt9wsQ" />
    </Row>
  );
}

function MenuDemo() {
  const [last, setLast] = useState('none yet');
  return (
    <Row>
      <Menu
        label="Example actions"
        placement="bottom-start"
        trigger={(props) => (
          <button type="button" className="button button--secondary" {...props}>
            <Icon name="more-horizontal" size={12} />
            <span>Open menu</span>
          </button>
        )}
      >
        <MenuLabel>Payment</MenuLabel>
        <MenuItem onSelect={() => setLast('View payment details')}>View payment details</MenuItem>
        <MenuItem onSelect={() => setLast('Copy payment ID')}>Copy payment ID</MenuItem>
        <MenuDivider />
        <MenuItem onSelect={() => setLast('Disabled')} disabled>
          Disabled item
        </MenuItem>
      </Menu>
      <span className={styles.muted}>Last action: {last}</span>
    </Row>
  );
}

function IconsDemo({ names }: { names: readonly string[] }) {
  return (
    <div className={styles.iconGrid}>
      {names.map((name) => (
        <figure key={name} className={styles.iconCell}>
          <Icon name={name as Parameters<typeof Icon>[0]['name']} size={16} />
          <figcaption>{name}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function FilterPillDemo() {
  const [statuses, setStatuses] = useState<string[]>(['Failed']);
  return (
    <Row>
      <FilterPill label="Date and time" onClear={() => undefined}>
        {(close) => (
          <FilterPanel title="Date and time" onApply={close}>
            <p className={styles.muted}>Panel content goes here.</p>
          </FilterPanel>
        )}
      </FilterPill>
      <FilterPill label="Status" summary={statuses.length ? statuses.join(', ') : null} onClear={() => setStatuses([])}>
        {(close) => (
          <FilterPanel title="Status" onApply={close}>
            {['Failed', 'Refunded', 'Succeeded'].map((status) => (
              <label key={status} className="check-option">
                <Checkbox
                  checked={statuses.includes(status)}
                  onChange={() =>
                    setStatuses((current) =>
                      current.includes(status) ? current.filter((value) => value !== status) : [...current, status],
                    )
                  }
                />
                <span className="check-option__label">{status}</span>
              </label>
            ))}
          </FilterPanel>
        )}
      </FilterPill>
    </Row>
  );
}

/** Static preview of the search dropdown (the live one is in the top bar of /payments). */
function SearchDemo() {
  return (
    <div className="global-search" style={{ width: 600, maxWidth: '100%', marginBottom: 290 }}>
      <Icon name="search" size={12} />
      <input className="global-search__input" placeholder="Search" aria-label="Search preview" readOnly />
      <div className="search-popover" role="presentation">
        <div className="search-popover__list">
          <div className="search-popover__heading">Suggested filters</div>
          {SUGGESTED_SEARCH_FILTERS.map((filter, index) => (
            <div key={filter.key} className="search-option" aria-selected={index === 1}>
              <div className="search-option__card">
                <span className="search-option__key">{filter.key}:</span>
                <span className="search-option__example">{filter.example}</span>
                <span className="search-option__description">{filter.description}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="search-popover__footer">
          <span className="search-popover__footer-button">View more filters</span>
        </div>
      </div>
    </div>
  );
}

/** Filters panel (interactive, writes the resulting query below) and the results empty state. */
function SearchResultsDemo() {
  // The panel reads the current date: mount it after hydration (it can't run while prerendering).
  return useHydrated() ? <SearchResultsDemoContent /> : <Skeleton width={240} height={120} />;
}

function SearchResultsDemoContent() {
  const [query, setQuery] = useState('status:failed is:payment');
  return (
    <div className={styles.demoRow} style={{ alignItems: 'flex-start', gap: 32 }}>
      <div className="popover popover--in-pane">
        <FiltersPanel
          key={query}
          query={query}
          onApply={(panel) => setQuery(writeSearchFilterPanel(query, panel))}
          onClear={() => setQuery(clearSearchFilters(query))}
        />
      </div>
      <div style={{ display: 'grid', gap: 16, minWidth: 260 }}>
        <p className={styles.muted}>
          Resulting query: <code>{query}</code>
        </p>
        <div className="search-empty" style={{ marginTop: 0 }}>
          <Icon name="search" size={16} />
          <p className="search-empty__title">No search results found</p>
          <p className="search-empty__text">Please try again with a different query or clear your filters</p>
        </div>
      </div>
    </div>
  );
}

function StatusCardsDemo() {
  const [view, setView] = useState<PaymentsView>('all');
  return <StatusCards active={view} onSelect={setView} />;
}

function TabsBannerDemo() {
  return (
    <>
      <nav className="tabs" aria-label="Example tabs">
        {['Payments', 'Payouts', 'Top-ups', 'Collected fees'].map((tab, index) => (
          <a key={tab} href="#tabs-banner" className="tabs__tab" aria-current={index === 0 ? 'page' : undefined}>
            {tab}
          </a>
        ))}
      </nav>
      <section className="banner" aria-label="Example announcement">
        <span className="banner__tag">
          <Icon name="sparkle" size={12} />
          New
        </span>
        <p className="banner__message">Rule Attributes are now in Sigma and Data Pipeline for better fraud insights.</p>
        <div className="banner__actions">
          <a className="link" href="#tabs-banner">
            Get started
          </a>
          <span className="vertical-divider" aria-hidden="true" />
          <IconButton icon="close" label="Dismiss" size="sm" className="banner__close" />
        </div>
      </section>
    </>
  );
}

function CellsDemo() {
  const hydrated = useHydrated();
  return (
    <>
      <Row>
        <CopyableId id="pi_3UdA4wRt8vB2wQjK0fxt9wsQ" />
        <CopyableId id="pi_3UdA4wRt8vB2wQjK0fxt9wsQ" display="full" variant="plain" />
      </Row>
      <Row>
        <PaymentMethodCell method={{ type: 'card', brand: 'visa', last4: '4242' }} />
        <PaymentMethodCell method={{ type: 'wallet', wallet: 'link', brand: 'mastercard', last4: '0900' }} />
        <PaymentMethodCell method={{ type: 'wallet', wallet: 'apple_pay', brand: 'visa', last4: '6745' }} />
        <PaymentMethodCell method={{ type: 'card', brand: 'amex', last4: '1005' }} />
        <PaymentMethodCell method={{ type: 'ach_debit', bankName: 'Chase', last4: '6789' }} />
      </Row>
      {/* Time-dependent demos mount after hydration: the current time can't be read while prerendering. */}
      <Row>{hydrated ? <CreatedSample /> : <Skeleton width={110} />}</Row>
    </>
  );
}

function CreatedSample() {
  const [iso] = useState(() => new Date(Date.now() - 3 * HOUR).toISOString());
  return <CreatedCell iso={iso} />;
}

function TableDemo() {
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <div className="table-scroll">
        <PaymentsTableSkeleton rows={4} />
      </div>
    );
  }
  return <LiveTable />;
}

/** Client-only (see TableDemo): sample rows are relative to the viewer's clock. */
function LiveTable() {
  const [rows] = useState(() => samplePayments(Date.now()));
  const [sort, setSort] = useState<SortRule[]>([]);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [layout, setLayout] = useState<ColumnLayout>(DEFAULT_COLUMN_LAYOUT);
  return (
    <div className="table-scroll" tabIndex={0} role="region" aria-label="Example payments table">
      <PaymentsTable
        rows={sortPayments(rows, sort)}
        visibleColumns={new Set(DEFAULT_VISIBLE_COLUMNS)}
        layout={layout}
        onLayoutChange={setLayout}
        sort={sort}
        onSort={(column, additive) => setSort((rules) => toggleSort(rules, column, additive))}
        selected={selected}
        onSelectedChange={setSelected}
      />
    </div>
  );
}

function PaginationDemo() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<25 | 50 | 100>(25);
  const total = 600;
  const pageCount = Math.ceil(total / pageSize);
  const safePage = Math.min(page, pageCount);
  return (
    <Pagination
      result={{
        page: safePage,
        pageCount,
        total,
        rangeStart: (safePage - 1) * pageSize + 1,
        rangeEnd: Math.min(safePage * pageSize, total),
      }}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={(size) => {
        setPageSize(size);
        setPage(1);
      }}
    />
  );
}

function StatesDemo() {
  return (
    <>
      <EmptyResults onClear={() => undefined} />
      <LoadError onRetry={() => undefined} />
      <Row>
        <Spinner />
        <Skeleton width={120} />
        <Skeleton width={60} height={20} />
      </Row>
      <div className="table-scroll">
        <PaymentsTableSkeleton rows={2} />
      </div>
    </>
  );
}

function DetailsDemo() {
  return (
    <div className={styles.detailsDemo}>
      <section>
        <h3 className="detail-section__title">Recent activity</h3>
        <ol className="detail-section__body">
          <li className="timeline__item" data-current="true">
            <span className="timeline__label">Payment succeeded</span>
            <span className="timeline__date">Nov 18, 2:43 PM</span>
          </li>
          <li className="timeline__item" data-current="false">
            <span className="timeline__label">Payment started</span>
            <span className="timeline__date">Nov 18, 2:43 PM</span>
          </li>
        </ol>
      </section>
      <section>
        <h3 className="detail-section__title">Details</h3>
        <dl className="key-value-list detail-section__body">
          <div>
            <dt className="key-value__label">Statement descriptor</dt>
            <dd className="key-value__value">CRAMLY.AI</dd>
          </div>
          <div>
            <dt className="key-value__label">Risk level</dt>
            <dd className="key-value__value">
              <Badge tone="success">Normal</Badge>
            </dd>
          </div>
        </dl>
      </section>
      <section>
        <h3 className="detail-section__title">Metadata</h3>
        <div className="detail-section__body empty-box empty-box--tall">No metadata</div>
      </section>
    </div>
  );
}

/** Live demo for a catalog entry (keyed by `ComponentDoc.id`). */
export function ComponentDemo({ id, iconNames }: { id: string; iconNames: readonly string[] }) {
  switch (id) {
    case 'button':
      return <ButtonDemo />;
    case 'badge':
      return <BadgeDemo />;
    case 'checkbox':
      return <CheckboxDemo />;
    case 'tooltip':
      return <TooltipDemo />;
    case 'menu':
      return <MenuDemo />;
    case 'icons':
      return <IconsDemo names={iconNames} />;
    case 'filter-pill':
      return <FilterPillDemo />;
    case 'search':
      return <SearchDemo />;
    case 'search-results':
      return <SearchResultsDemo />;
    case 'status-cards':
      return <StatusCardsDemo />;
    case 'tabs-banner':
      return <TabsBannerDemo />;
    case 'cells':
      return <CellsDemo />;
    case 'table':
      return <TableDemo />;
    case 'pagination':
      return <PaginationDemo />;
    case 'states':
      return <StatesDemo />;
    case 'details':
      return <DetailsDemo />;
    default:
      return null;
  }
}
