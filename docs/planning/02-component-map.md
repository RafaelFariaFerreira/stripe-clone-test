# 2. Component map

Every component below exists **twice with the same name, props and states**: a React component
in `apps/web-next` and a standalone Angular component in `apps/web-angular`. Both render the
same class names from the same token CSS, so they look identical.

Legend: **Repeats** = how many times it appears on the two screens (why it deserves to be a
component). **States** = states that must be built and tested.

## 2.1 Repetition analysis

| Repeating element | Where | Count (reference) | Becomes |
| --- | --- | --- | --- |
| Sidebar link (icon + label, optional chevron) | Sidebar | 16 | `SidebarNavItem` |
| Sidebar section heading | Sidebar | 2 ("Shortcuts", "Products") | `SidebarSection` |
| Icon button (round/square, 16 px glyph) | Top bar, toolbars, row actions | 10+ | `IconButton` |
| Text/secondary button | Page header, toolbar, pagination, detail page | 8+ | `Button` (`primary` / `secondary`, `sm` / `md`) |
| Underlined tab | Page tabs, detail "Risk factors / Risk scores" | 8 | `Tabs` + `Tab` |
| Status card (label + count) | Status cards row | 6 | `StatusFilterCard` |
| Dashed filter pill with `⊕` | Filter bar | 6 | `FilterPill` |
| Filter popover (header with back, body, `Apply`) | Every pill | 6 | `FilterPopover` shell + one body per filter |
| Status badge | Every row, detail header, risk level | 20 per page | `StatusBadge` / `Badge` |
| Card-brand / wallet mark | Every row, detail page | 20+ | `PaymentMethodIcon` |
| `•••• 4242` | Every row, detail page | 20+ | `CardLast4` |
| Money (bold value + secondary code) | Every row, breakdown | 20+ | `Money` |
| Date with tooltip | Every row, timeline, aside | 20+ | `DateTime` (+ `Tooltip`) |
| Copyable ID chip | ID column, detail aside, related objects | 20+ | `CopyableId` |
| Row `⋯` menu | Every row | 20 | `RowActionsMenu` |
| Empty cell `—` | Many cells | many | `EmptyValue` |
| Section with title + optional action | Detail page | 12 | `DetailSection` |
| Label/value pair | Detail aside, payment method details | 20+ | `KeyValueList` / `KeyValue` |
| Dashed empty box | Tax, receipts, metadata | 3 | `EmptyBox` |
| Event/log row (text + timestamp) | Events, Logs | 5 | `ActivityListItem` |
| Spinner / skeleton block | Loading states | many | `Spinner`, `Skeleton` |

## 2.2 Primitives (`ui/`)

| Component | Key props | States | Notes |
| --- | --- | --- | --- |
| `Button` | `variant: 'primary' \| 'secondary'`, `size: 'sm' \| 'md'`, `icon?`, `iconPosition?`, `loading?`, `as?: 'a'` | default, hover, active, focus-visible, disabled, loading | `md` = 28 px tall, `padding: 4px 8px`, radius 6 |
| `IconButton` | `icon`, `label` (required, becomes `aria-label`), `size` | same as Button | Always has a tooltip from `label` |
| `Badge` | `tone: 'success' \| 'danger' \| 'warning' \| 'neutral' \| 'info'`, `icon?` | — | 20 px, `padding: 1px 6px`, radius 4 |
| `Checkbox` | `checked`, `indeterminate`, `onChange`, `label` (sr-only allowed) | unchecked, checked, indeterminate, disabled, focus | 14 px Live / 16 px Ref, check marks from `icons/checkbox-*.svg` |
| `Tooltip` | `content`, `placement`, `delay` | hidden, visible | Opens on hover **and** focus; `aria-describedby` |
| `Popover` | `open`, `onOpenChange`, `anchor`, `placement` | closed, open | Focus trap, `Esc` closes and returns focus, outside click closes |
| `Menu` / `MenuItem` | items, `onSelect` | — | Arrow-key navigation, typeahead |
| `Select` | `options`, `value`, `onChange` | — | Stripe-style select (chevron, 28 px), list with checkmark on selected (see `04-filter-date-operators.png`) |
| `TextInput` / `NumberInput` | `value`, `prefix?` (`→` arrow, currency), `placeholder` | default, focus, invalid, disabled | |
| `SearchInput` | `value`, `onChange`, `placeholder="Search"` | idle, focused, has value (clear ✕) | Debounced 150 ms |
| `DatePicker` / `DateRangeCalendar` | `range`, `onChange`, `min`, `max` | — | Used by the `Custom` date preset; lazy loaded |
| `Tabs` / `Tab` | `items`, `activeId`, `href?` | active, inactive, hover, focus | Link tabs (`<a>`); underline 2 px brand |
| `Skeleton` | `width`, `height`, `radius` | — | `--color-bg-offset` block with shimmer |
| `Spinner` | `size: 16 \| 20` | — | Thin ring, as on the detail page loading |
| `Divider` | `orientation` | — | |
| `Icon` | `name: IconName`, `size: 12 \| 16` | — | Typed registry from `packages/icons` |
| `VisuallyHidden` | — | — | Accessible labels |

## 2.3 App shell (`layout/`)

```
AppShell
├── Sidebar                                  (≥1040 px fixed; <1040 px off-canvas drawer)
│   ├── AccountSwitcher                      logo square + "cramly.ai" + chevron  (menu: nice-to-have)
│   ├── SidebarSection (no title)
│   │   └── SidebarNavItem × 5               Home, Balances, Transactions*, Customers, Product catalog
│   ├── SidebarSection "Shortcuts"
│   │   └── SidebarNavItem × 4               Payments analytics, Reports, Sigma, Radar
│   ├── SidebarSection "Products"
│   │   └── SidebarNavGroup × 5              Connect, Payments, Billing, Reporting, More (collapsible ▾)
│   └── SidebarFooter → SidebarNavItem       Developers
├── TopBar
│   ├── MobileNavToggle                      (<1040 px)
│   ├── GlobalSearch                         drives the table's text search on the Payments page
│   ├── TestModeNotice                       "Test mode has moved."  "Show me"
│   ├── AppsShortcut                         apps icon in a pill
│   └── IconButton × 4                       Help, Notifications (dot), Settings, Create (+, brand)
└── <page outlet>
```

| Component | Props | States |
| --- | --- | --- |
| `SidebarNavItem` | `icon`, `label`, `href`, `active`, `trailing?` (chevron / pin) | default, hover, active, focus |
| `SidebarNavGroup` | `icon`, `label`, `children`, `defaultOpen` | collapsed, expanded |
| `MobileNavDrawer` | `open`, `onClose` | closed, open (backdrop, focus trap, `Esc`) |
| `AccountMenu` | account name, items | closed, open (nice-to-have #2) |

## 2.4 Payments list page (`features/payments-list/`)

```
PaymentsPage
├── PageHeader
│   ├── PageTitle "Transactions"
│   └── PageActions → Button(primary, + "Create payment") · Button(secondary, "Analyze")
├── Tabs  Payments* · Payouts · Top-ups · Collected fees · Transfers · All activity
├── AnnouncementBanner  "New" tag · message · "Get started" · dismiss ✕   (dismissal cached in localStorage)
├── StatusFilterCards
│   └── StatusFilterCard × 6  All* · Succeeded · Refunded · Disputed · Failed · Uncaptured
├── FilterToolbar
│   ├── FilterBar
│   │   ├── FilterPill "Date and time"   → DateFilterPopover
│   │   ├── FilterPill "Amount"          → AmountFilterPopover
│   │   ├── FilterPill "Currency"        → CurrencyFilterPopover
│   │   ├── FilterPill "Status"          → StatusFilterPopover (multi-select)
│   │   ├── FilterPill "Payment method"  → PaymentMethodFilterPopover (multi-select)
│   │   ├── FilterPill "More filters"    → MoreFiltersMenu (Customer, Card brand, Last 4 digits…)
│   │   └── ClearFiltersButton           (visible when ≥1 filter active)
│   └── TableActions → Button(secondary, "Export") · Button(secondary, "Edit columns")
├── PaymentsTable
│   ├── TableHead → SelectAllCheckbox · SortableHeaderCell × n
│   ├── TableBody
│   │   └── PaymentRow × pageSize
│   │       ├── RowCheckbox
│   │       ├── AmountCell          Money (bold) + currency code (secondary)
│   │       ├── StatusCell          StatusBadge
│   │       ├── PaymentMethodCell   WalletMark? + CardBrandMark + CardLast4
│   │       ├── DescriptionCell
│   │       ├── CustomerCell        email (name on hover/title)
│   │       ├── CreatedCell         DateTime + Tooltip(relative time)
│   │       ├── RefundedDateCell    DateTime | EmptyValue
│   │       ├── DeclineReasonCell   text (truncated) | EmptyValue
│   │       ├── PaymentIdCell       CopyableId (shortened "pi_3UdA…wsQ")
│   │       └── RowActionsMenu      ⋯ (sticky right)
│   ├── TableSkeleton               loading state (same row height, 8 shimmer rows)
│   ├── TableEmptyState             "No results" / "No results match your criteria" / "Clear all"
│   └── TableErrorState             "Something went wrong" + Retry
└── TablePagination
    ├── ResultsSummary   "Viewing 1–25 of 600 results"
    ├── PageSizeSelect   25 · 50 · 100
    └── Button(sm) "Previous" · Button(sm) "Next"
```

### Feature components: contracts

| Component | Props (TypeScript names) | States / behavior |
| --- | --- | --- |
| `StatusFilterCard` | `label`, `count?`, `active`, `onSelect` | default, hover, active (2 px brand border, brand label), focus. Acts as a single-select "view" (`role="tab"`); combines with the Status pill filter |
| `FilterPill` | `label`, `value?: string` (summary when applied, e.g. "Status: Succeeded, Failed"), `onClear` | empty (dashed, `⊕`), applied (solid border, brand summary, `✕` clears), open |
| `FilterPopover` | `title`, `onApply`, `onBack?`, `children` | Shared shell: header (`‹` back + title), body, full-width primary `Apply` |
| `DateFilterPopover` | `value: DateFilter`, `onApply` | Presets **Today · Last 7 days · Last 30 days · Custom**, plus Stripe operators (`is in the last N hours/days/months`, `is equal to`, `is between`, `is on or after`, `is before or on`). Custom opens `DateRangeCalendar` |
| `AmountFilterPopover` | `value: AmountFilter`, `onApply` | `is equal to` / `is between` / `is greater than` / `is less than`, inputs in major units |
| `StatusFilterPopover` | `value: PaymentStatus[]`, `onApply` | Checkbox list, scrollable, with search when > 10 items |
| `PaymentMethodFilterPopover` | `value: PaymentMethodType[]`, `onApply` | Checkbox list: Card, ACH Direct Debit, Wallet (Apple Pay, Google Pay, Link) |
| `SortableHeaderCell` | `column`, `sort: SortState`, `onSort(column, { additive })` | unsorted, asc, desc; Shift+click adds a secondary sort; `aria-sort` |
| `StatusBadge` | `status: PaymentStatus`, `meta?` (e.g. dispute due date) | Maps status → tone, icon and label (single source in `domain/status.ts`) |
| `PaymentMethodIcon` | `method: PaymentMethod` | Brand marks + wallet mark; `aria-label="Visa"` |
| `Money` | `amount: number` (minor units), `currency`, `showCode?`, `emphasis?` | `Intl.NumberFormat` with the currency's minor-unit exponent (JPY = 0) |
| `DateTime` | `value: string (ISO)`, `format: 'table' \| 'timeline' \| 'event'`, `relativeTooltip?` | "Aug 16, 5:03 PM"; tooltip "2 hours ago" refreshed every minute while visible |
| `CopyableId` | `id`, `display?: 'full' \| 'short'` | idle, hover (tooltip "Copy to clipboard"), copied (tooltip "Copied!", 1.5 s), error fallback (select text) |
| `RowActionsMenu` | `payment` | Items: `Refund payment`, `Send receipt`, `Copy payment ID`, `View payment details` |
| `TablePagination` | `page`, `pageSize`, `total`, `onPageChange`, `onPageSizeChange` | Previous disabled on page 1; Next disabled on last page |
| `ColumnSettingsMenu` (Edit columns) | `columns`, `visible`, `order`, `onChange` | Toggle visibility; drag to reorder (nice-to-have #5) |
| `ExportButton` | current filtered + sorted rows | Generates CSV client-side (nice-to-have #6), lazy-loads the CSV util |

## 2.5 Payment details page (`features/payment-details/`)

```
PaymentDetailsPage
├── DetailHeader
│   ├── Breadcrumb "Transactions" (link back, restores list filters from URL)
│   ├── TitleRow  Money(display) + currency + StatusBadge
│   ├── Subtitle  "Charged to" + customer email link
│   └── HeaderActions → Button(secondary, ↩ "Refund") · IconButton(⋯)
├── DetailLayout (main | aside)
│   ├── main
│   │   ├── DetailSection "Recent activity" [Button "Add note"]   → Timeline → TimelineItem × n
│   │   ├── DetailSection "Payment breakdown"                     → BreakdownTable (amount, fees, net)
│   │   ├── DetailSection "Payment method"                        → PaymentMethodDisclosure (expand → KeyValueList)
│   │   │                                                            + EnabledPaymentMethods
│   │   ├── DetailSection "Tax calculation"                       → EmptyBox
│   │   ├── DetailSection "Risk analysis"                         → Tabs (Risk factors / Risk scores) + note
│   │   ├── DetailSection "Related payments"                      → EmptyValue row
│   │   ├── DetailSection "Related objects"                       → KeyValue + CopyableId
│   │   ├── DetailSection "Receipt history" [View receipt, Send receipt] → EmptyBox
│   │   ├── DetailSection "Events"                                → ActivityList → ActivityListItem × n
│   │   └── DetailSection "Logs"                                  → ActivityList (method + path + status badge)
│   └── aside
│       ├── DetailSection "Details"   → KeyValueList (Payment ID, Payment method, Risk level, Description, …)
│       ├── DetailSection "Customer"  → KeyValueList (ID, Name, Description, Email, Phone, Country)
│       └── DetailSection "Metadata" [IconButton ✎] → EmptyBox "No metadata"
├── DetailSkeleton       per-section Spinner (matches live loading capture `13-payment-detail-loading.jpg`)
└── DetailNotFound       "No such payment" + back link
```

| Component | Props | Notes |
| --- | --- | --- |
| `Timeline` / `TimelineItem` | `items: { label, at, state: 'done' \| 'current' }[]` | Dot + 1 px connector; date underlined dotted, tooltip with full timestamp |
| `BreakdownTable` | `amount`, `fee`, `net`, `currency` | 16/24 600 rows, fee prefixed with "- " |
| `KeyValueList` / `KeyValue` | `items: { label, value: ReactNode }[]` | Label 700, value 400; `-` placeholder |
| `EmptyBox` | `children` | Dashed 1 px, radius 6, centered secondary text |
| `ActivityListItem` | `title`, `timestamp`, `badge?` | Title 14/20 600 wraps at ~230 px like the live page |

## 2.6 Shared state model (framework-agnostic, `packages/domain`)

```ts
type PaymentStatus =
  | 'succeeded' | 'pending' | 'failed' | 'refunded' | 'partially_refunded'
  | 'canceled' | 'blocked' | 'uncaptured' | 'incomplete' | 'disputed';

type PaymentMethodType = 'card' | 'ach_debit' | 'wallet';
type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover';
type WalletType = 'apple_pay' | 'google_pay' | 'link';

interface PaymentMethod { type: PaymentMethodType; brand?: CardBrand; wallet?: WalletType;
  last4: string; bankName?: string; expMonth?: number; expYear?: number; }

interface Payment {
  id: string;                 // "pi_3UdA4wL2cI6mqjNa0fxt9wsQ"
  amount: number;             // minor units
  currency: CurrencyCode;     // 'usd' | 'gbp' | 'brl' | 'eur' | 'cad' | 'aud' | 'jpy' | …
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  description: string;
  customer: { id: string; name: string | null; email: string };
  created: string;            // ISO 8601, UTC
  refundedAt: string | null;
  declineReason: string | null;   // "Insufficient funds", "Do not honor", "Transaction not allowed"…
  disputeDueBy: string | null;
}

interface PaymentsQuery {
  view: 'all' | 'succeeded' | 'refunded' | 'disputed' | 'failed' | 'uncaptured';
  search: string;                          // payment ID, email or last 4
  date: DateFilter | null;                 // preset 'today' | 'last_7_days' | 'last_30_days' | custom range | Stripe operators
  amount: AmountFilter | null;             // eq | between | gt | lt (major units, any currency)
  currency: CurrencyCode[];
  status: PaymentStatus[];
  paymentMethod: PaymentMethodType[];
  sort: { column: 'created' | 'amount' | 'status' | 'customer'; direction: 'asc' | 'desc' }[];
  page: number;
  pageSize: 25 | 50 | 100;
}
```

The query is the **only** UI state for the list. It is serialized to the URL
(`?status=succeeded,failed&amount=gt:50&sort=-created,amount&page=2&size=50`) so links are
shareable (nice-to-have #4) and both apps parse it with the same `parseQuery` / `serializeQuery`.
