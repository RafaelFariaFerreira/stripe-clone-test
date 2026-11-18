/**
 * Component catalog rendered by `/styleguide`.
 *
 * Every component exists in both apps with the same name, inputs and CSS
 * classes. This file is the human-readable contract; when a component changes,
 * update its entry here in the same pull request.
 */

export interface PropDoc {
  name: string;
  type: string;
  description: string;
}

export interface ComponentDoc {
  /** Anchor id; also the key of the live demo in `demos.tsx`. */
  id: string;
  name: string;
  group: 'Primitives' | 'Payments' | 'States' | 'Details';
  summary: string;
  react: { importPath: string; usage: string };
  angular: { selector: string; usage: string };
  classes: string[];
  states: string[];
  props: PropDoc[];
  a11y: string;
}

export const COMPONENTS: readonly ComponentDoc[] = [
  {
    id: 'button',
    name: 'Button / IconButton',
    group: 'Primitives',
    summary: 'Text and icon buttons in the Dashboard sizes: 28px (md) and 26px (sm). Primary is reserved for the main page action.',
    react: {
      importPath: "import { Button, IconButton } from '@/components/ui/button';",
      usage: '<Button variant="primary" icon="plus">Create payment</Button>\n<IconButton icon="more-horizontal" label="More actions" />',
    },
    angular: {
      selector: 'button.button / button.icon-button',
      usage: '<button class="button button--primary"><svg appIcon="plus"></svg><span>Create payment</span></button>',
    },
    classes: [
      '.button',
      '.button--primary',
      '.button--secondary',
      '.button--ghost',
      '.button--sm',
      '.icon-button',
      '.icon-button--sm',
      '.icon-button--outlined',
    ],
    states: ['default', 'hover', 'active', 'focus-visible', 'disabled'],
    props: [
      { name: 'variant', type: "'primary' | 'secondary' | 'ghost'", description: 'Visual weight. Defaults to secondary.' },
      { name: 'size', type: "'sm' | 'md'", description: 'md = 28px, sm = 26px (pagination).' },
      { name: 'icon', type: 'IconName', description: 'Optional 12px leading glyph.' },
      { name: 'label', type: 'string', description: 'IconButton only, required: becomes the aria-label.' },
    ],
    a11y: 'Icon-only buttons must have a label. Focus ring uses --shadow-focus and only appears for keyboard focus.',
  },
  {
    id: 'badge',
    name: 'Badge / StatusBadge',
    group: 'Primitives',
    summary:
      'Compact 20px status pill with a 1px border. StatusBadge maps a payment status to its label, tone and icon from the domain catalog (STATUS_META), so colors are never hard-coded.',
    react: {
      importPath: "import { Badge, StatusBadge } from '@/components/ui/badge';",
      usage: '<StatusBadge status="succeeded" />\n<Badge tone="neutral">200 OK</Badge>',
    },
    angular: { selector: 'app-status-badge, app-badge', usage: '<app-status-badge [status]="payment.status" />' },
    classes: ['.badge', '.badge--success', '.badge--danger', '.badge--warning', '.badge--neutral', '.badge--plain'],
    states: ['success', 'danger', 'warning', 'neutral'],
    props: [
      { name: 'status', type: 'PaymentStatus', description: 'StatusBadge: one of the 10 statuses.' },
      { name: 'tone', type: "'success' | 'danger' | 'warning' | 'neutral'", description: 'Badge: color triplet from the tokens.' },
      { name: 'icon', type: 'IconName', description: 'Badge: optional trailing 12px glyph.' },
    ],
    a11y: 'Status is conveyed by the text label, never by color alone.',
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    group: 'Primitives',
    summary:
      'Native checkbox restyled with .checkbox. Disabled rows (statuses that cannot be selected) render the grey fill seen in the reference.',
    react: {
      importPath: "import { Checkbox } from '@/components/ui/checkbox';",
      usage: '<Checkbox checked={all} indeterminate={some} aria-label="Select all" />',
    },
    angular: {
      selector: 'input.checkbox[appIndeterminate]',
      usage: '<input type="checkbox" class="checkbox" [appIndeterminate]="some" />',
    },
    classes: ['.checkbox'],
    states: ['unchecked', 'checked', 'indeterminate', 'disabled', 'focus-visible'],
    props: [{ name: 'indeterminate', type: 'boolean', description: 'Mixed state for "select all".' }],
    a11y: 'Always pass an aria-label or wrap in a <label>.',
  },
  {
    id: 'tooltip',
    name: 'Tooltip',
    group: 'Primitives',
    summary:
      'Dark tooltip that opens on hover (300ms delay) and on keyboard focus, closes immediately. Positioned by Floating UI (React) and the CDK overlay (Angular).',
    react: {
      importPath: "import { Tooltip } from '@/components/ui/tooltip';",
      usage: '<Tooltip content="Copy to clipboard">\n  <button>…</button>\n</Tooltip>',
    },
    angular: { selector: '[appTooltip]', usage: '<button appTooltip="Copy to clipboard" [appTooltipDelay]="150">…</button>' },
    classes: ['.tooltip', '.tooltip--in-pane'],
    states: ['hidden', 'visible'],
    props: [
      { name: 'content / appTooltip', type: 'ReactNode / string', description: 'Tooltip text; can change while open ("Copied!").' },
      { name: 'delay', type: 'number', description: 'Open delay in ms (default 300).' },
    ],
    a11y: 'Linked with aria-describedby. The trigger must be focusable.',
  },
  {
    id: 'menu',
    name: 'Menu',
    group: 'Primitives',
    summary: 'Action menu used by the row ⋯ button and "More filters". Roving focus with arrow keys, Escape and outside click close it.',
    react: {
      importPath: "import { Menu, MenuItem, MenuDivider, MenuLabel } from '@/components/ui/menu';",
      usage:
        '<Menu label="Actions" trigger={(props) => <button {...props}>⋯</button>}>\n  <MenuItem onSelect={open}>View payment details</MenuItem>\n</Menu>',
    },
    angular: {
      selector: '[cdkMenuTriggerFor] + [cdkMenu]',
      usage:
        '<button [cdkMenuTriggerFor]="menu">⋯</button>\n<ng-template #menu><div cdkMenu class="popover popover--in-pane menu">…</div></ng-template>',
    },
    classes: ['.popover', '.menu', '.menu__item', '.menu__label', '.menu__divider'],
    states: ['closed', 'open', 'item hover/focus', 'item disabled'],
    props: [
      { name: 'trigger', type: '(props) => ReactNode', description: 'Render prop; spread the props on the clickable element.' },
      { name: 'label', type: 'string', description: 'Accessible name of the menu.' },
    ],
    a11y: 'role="menu" / "menuitem"; focus returns to the trigger on close.',
  },
  {
    id: 'icons',
    name: 'Icon / BrandMark',
    group: 'Primitives',
    summary:
      'Icons come from the typed registry in @stripe-clone/icons (generated from SVG files). Glyphs inherit currentColor; card and wallet marks keep their own colors.',
    react: {
      importPath: "import { Icon, BrandMark } from '@/components/ui/icon';",
      usage: '<Icon name="search" size={12} />\n<BrandMark name="card-visa" label="Visa" />',
    },
    angular: { selector: 'svg[appIcon], svg[appBrandMark]', usage: '<svg appIcon="search" [size]="12"></svg>' },
    classes: ['.icon', '.icon--8 … .icon--20', '.brand-mark'],
    states: ['decorative (aria-hidden)', 'labelled (role="img")'],
    props: [
      { name: 'name', type: 'IconName', description: 'Typed union: a misspelled icon is a compile error.' },
      { name: 'size', type: '8 | 12 | 14 | 16 | 20', description: '12 for inline/buttons, 16 for navigation.' },
      { name: 'label', type: 'string', description: 'Only for meaningful icons.' },
    ],
    a11y: 'Decorative by default. Add a label when the icon is the only content.',
  },
  {
    id: 'filter-pill',
    name: 'FilterPill + FilterPanel',
    group: 'Payments',
    summary:
      'Dashed pill with ⊕ when empty; solid with an ✕ and a brand summary when applied. Opens a popover whose body is code-split (next/dynamic / @defer) and applies on "Apply".',
    react: {
      importPath: "import { FilterPill, FilterPanel } from '@/features/payments/components/filters/filter-pill';",
      usage:
        '<FilterPill label="Status" summary={summary} onClear={clear}>\n  {(close) => <StatusPanel onApply={(v) => { apply(v); close(); }} />}\n</FilterPill>',
    },
    angular: {
      selector: 'app-filter-pill',
      usage:
        '<app-filter-pill label="Status" [summary]="summary()" (cleared)="clear()">\n  <ng-template let-close>@defer { <app-checklist-filter-panel … /> }</ng-template>\n</app-filter-pill>',
    },
    classes: [
      '.filter-pill',
      '.filter-pill__trigger',
      '.filter-pill__clear',
      '.filter-pill__value',
      '.filter-panel',
      '.check-option',
      '.segmented',
    ],
    states: ['empty (dashed)', 'hover', 'open', 'applied (solid + summary)'],
    props: [
      { name: 'label', type: 'string', description: 'Verbatim reference label ("Date and time", "Amount"…).' },
      { name: 'summary', type: 'string | null', description: 'Applied value summary from the domain summarize* helpers.' },
      { name: 'onClear / (cleared)', type: '() => void', description: 'Clears just this filter.' },
    ],
    a11y: 'role="dialog" popover, focus moves inside and returns to the pill; Escape closes.',
  },
  {
    id: 'status-cards',
    name: 'StatusCards',
    group: 'Payments',
    summary:
      'Quick views above the table (All, Succeeded, Refunded, Disputed, Failed, Uncaptured). Single-select, combines with the Status filter.',
    react: {
      importPath: "import { StatusCards } from '@/features/payments/components/status-cards';",
      usage: '<StatusCards active={query.view} onSelect={(view) => setQuery({ view })} />',
    },
    angular: {
      selector: 'app-status-cards',
      usage: '<app-status-cards [active]="query().view" (selected)="setQuery({ view: $event })" />',
    },
    classes: ['.status-cards', '.status-card'],
    states: ['default', 'hover', 'selected (brand border + label)', 'focus-visible'],
    props: [
      { name: 'active', type: 'PaymentsView', description: 'Selected view id.' },
      { name: 'onSelect / (selected)', type: '(view) => void', description: 'Writes the view to the URL.' },
    ],
    a11y: 'role="tablist" with aria-selected; scrolls horizontally below 1040px.',
  },
  {
    id: 'tabs-banner',
    name: 'Tabs & Announcement banner',
    group: 'Payments',
    summary:
      'Underlined link tabs (2px brand underline) and the dismissible "New" announcement, whose dismissal is remembered in localStorage.',
    react: {
      importPath: "import { AnnouncementBanner } from '@/features/payments/components/announcement-banner';",
      usage: '<nav className="tabs">…</nav>\n<AnnouncementBanner />',
    },
    angular: { selector: 'app-payments-header, app-announcement-banner', usage: '<app-payments-header />\n<app-announcement-banner />' },
    classes: ['.tabs', '.tabs__tab', '.banner', '.banner__tag', '.banner__message', '.banner__actions'],
    states: ['tab default / hover / current', 'banner visible / dismissed'],
    props: [],
    a11y: 'Current tab uses aria-current="page".',
  },
  {
    id: 'cells',
    name: 'Table cells',
    group: 'Payments',
    summary:
      'Reusable cells: CopyableId (shortened id + copy), PaymentMethodCell (wallet + brand marks right-aligned, then •••• 4242), CreatedCell (date + relative time tooltip).',
    react: {
      importPath: "import { CopyableId, PaymentMethodCell, CreatedCell } from '@/features/payments/components/table/cells';",
      usage: '<CopyableId id={payment.id} />\n<PaymentMethodCell method={payment.paymentMethod} />\n<CreatedCell iso={payment.created} />',
    },
    angular: {
      selector: 'app-copyable-id, app-payment-method-cell, app-created-cell',
      usage: '<app-copyable-id [id]="payment.id" />\n<app-payment-method-cell [method]="payment.paymentMethod" />',
    },
    classes: ['.copyable-id', '.copyable-id--plain', '.payment-method', '.payment-method__marks', '.brand-mark', '.card-last4'],
    states: ['copy: idle / hover "Copy to clipboard" / "Copied!"', 'date: tooltip with relative + full date'],
    props: [
      { name: 'display', type: "'short' | 'full'", description: 'CopyableId: pi_3UdA…9wsQ or the full id. Always copies the full id.' },
      { name: 'variant', type: "'chip' | 'plain'", description: 'CopyableId: mono chip (table) or inline text (details).' },
    ],
    a11y: 'Relative time is also rendered for screen readers; copy result is announced via aria-live.',
  },
  {
    id: 'table',
    name: 'PaymentsTable',
    group: 'Payments',
    summary:
      'Real <table> with 36px header and rows, fixed column widths measured on the reference, multi-column sort (Shift+click), selectable rows, sticky ⋯ column and row click → details.',
    react: {
      importPath: "import { PaymentsTable } from '@/features/payments/components/table/payments-table';",
      usage:
        '<PaymentsTable rows={page.rows} visibleColumns={columns} sort={query.sort}\n  onSort={onSort} selected={selected} onSelectedChange={setSelected} />',
    },
    angular: {
      selector: 'app-payments-table',
      usage: '<app-payments-table [rows]="rows" [visibleColumns]="cols" [sort]="sort" (sorted)="onSort($event)" />',
    },
    classes: [
      '.table-scroll',
      '.data-table',
      '.data-table__head-cell',
      '.data-table__cell',
      '.data-table__row',
      '.sort-button',
      '.cell-*',
      '.col-*',
    ],
    states: ['row hover', 'row selected', 'header sort idle / asc / desc / priority', 'overflowing (sticky shadow)'],
    props: [
      { name: 'rows', type: 'Payment[]', description: 'Current page from applyQuery().' },
      { name: 'visibleColumns', type: 'Set<ColumnId>', description: 'From "Edit columns" (persisted).' },
      { name: 'sort', type: 'SortRule[]', description: 'Ordered rules; first is primary.' },
    ],
    a11y: 'aria-sort on headers, sortable headers are buttons, the amount cell holds the keyboard link to details.',
  },
  {
    id: 'pagination',
    name: 'Pagination',
    group: 'Payments',
    summary: '"Viewing 1–25 of 600 results" with bold numbers, rows-per-page select (25/50/100) and small Previous / Next buttons.',
    react: {
      importPath: "import { Pagination } from '@/features/payments/components/pagination';",
      usage: '<Pagination result={result} pageSize={25} onPageChange={…} onPageSizeChange={…} />',
    },
    angular: { selector: 'app-pagination', usage: '<app-pagination [result]="result()" [pageSize]="25" (pageChange)="…" />' },
    classes: ['.pagination', '.pagination__summary', '.pagination__controls', '.select--sm', '.button--sm'],
    states: ['first page (Previous disabled)', 'last page (Next disabled)'],
    props: [{ name: 'result', type: 'QueryResult', description: 'page, pageCount, total, rangeStart, rangeEnd.' }],
    a11y: 'nav landmark; the summary is aria-live="polite".',
  },
  {
    id: 'states',
    name: 'Empty, error and loading states',
    group: 'States',
    summary:
      'Empty state copy is verbatim from the Dashboard. Loading placeholders reserve the final layout (same columns and 36px rows) so nothing shifts when data arrives.',
    react: {
      importPath: "import { EmptyResults, LoadError } from '@/features/payments/components/states';",
      usage: '<EmptyResults onClear={clearFilters} />\n<LoadError onRetry={refetch} />\n<PaymentsTableSkeleton rows={10} />',
    },
    angular: {
      selector: 'app-empty-results, app-load-error, app-payments-table-skeleton',
      usage: '<app-empty-results (clearAll)="clearFilters()" />',
    },
    classes: ['.state-box', '.skeleton', '.spinner'],
    states: ['empty', 'error', 'loading (skeleton / spinner)'],
    props: [],
    a11y: 'Empty uses role="status", errors role="alert", loading regions aria-busy.',
  },
  {
    id: 'details',
    name: 'Details building blocks',
    group: 'Details',
    summary:
      'Sections of the payment details page: section header (20px bold), timeline, key/value lists, dashed empty boxes and activity rows.',
    react: {
      importPath: "import { PaymentDetailsView } from '@/features/payment-details/components/payment-details-view';",
      usage: '<dl className="key-value-list">…</dl>\n<div className="empty-box">No metadata</div>',
    },
    angular: { selector: 'app-detail-section', usage: '<app-detail-section title="Events" [loading]="loading()">…</app-detail-section>' },
    classes: [
      '.detail-section__title',
      '.timeline__item',
      '.key-value-list',
      '.key-value__label',
      '.empty-box',
      '.activity-list__item',
      '.breakdown__row',
    ],
    states: ['section loading (spinner)', 'section error', 'timeline current item'],
    props: [],
    a11y: 'Each section is labelled by its heading; aria-busy while loading.',
  },
];

/** Rules every contribution follows; shown at the end of the style guide. */
export const CONTRIBUTING_RULES: readonly string[] = [
  'Use tokens only. No raw hex, px shadows or font sizes in component CSS: add a token in packages/styles/src/tokens.css first.',
  'One markup contract, two frameworks. A component ships in React and Angular with the same name, inputs and CSS classes.',
  'Keep logic in @stripe-clone/domain. Filtering, sorting, formatting and URL state are pure functions with unit tests.',
  'Copy labels verbatim from the reference. Content is reviewed side by side with it.',
  'Every interactive element is keyboard reachable, has an accessible name and a visible :focus-visible ring.',
  'Build every state: hover, focus, disabled, loading, empty and error. Loading must reserve the final size.',
  'Update this catalog and run pnpm test, pnpm e2e, pnpm typecheck and pnpm lint before opening a pull request.',
];
