# 1. Style guide

How the values were obtained:

- **Live**: `getComputedStyle` / `getBoundingClientRect` on the test-mode Dashboard
  (English, 1920×903 viewport, DPR 1). These are exact. Raw dump: `../reference/raw/computed-styles.json`.
- **Ref**: sampled from `../reference/pdf/reference-payments-2048x1568.png`. That image is
  scaled **≈ 1.375×** (derived from three independent anchors: the 16 px checkbox renders at 22 px,
  the 28 px H1 cap height renders at 27 px, the table row pitch is 50.1 px), so the source
  viewport was **≈ 1490 × 1140 CSS px**. Ref values are ±1 px and colors are anti-aliased
  samples; when Ref and Live agree within a visually indistinguishable margin I use Live.

All tokens are published once as CSS custom properties (`packages/design-tokens`) and consumed by
both apps. Names below are the final token names.

---

## 1.1 Color

### Text

| Token | Value | Usage | Source |
| --- | --- | --- | --- |
| `--color-text-default` | `#353A44` | Body text, amounts, table cells, H1 | Ref (`#353943`), matches Stripe's previous text color |
| `--color-text-secondary` | `#596171` | Currency code, description, inactive tabs, labels, pill text, section labels | Ref (`#5A6170`) |
| `--color-text-subdued` | `#687385` | Placeholders, `—` empty cells, row "⋯" icon | Ref |
| `--color-text-disabled` | `#95A4BA` | Disabled items | Live |
| `--color-text-brand` | `#533AFD` | Active nav item, active tab, links (`Get started`, `View docs`) | Live (Ref `#4F3BF3`) |
| `--color-text-on-brand` | `#FFFFFF` | Primary button label | Live |
| `--color-text-button` | `#273951` | Secondary button label (Live) | Live |

### Surfaces and borders

| Token | Value | Usage | Source |
| --- | --- | --- | --- |
| `--color-bg-page` | `#FFFFFF` | Page, table, sidebar | Live/Ref |
| `--color-bg-offset` | `#F5F6F8` | Search input, announcement banner, active nav item, hovered row, skeleton | Ref (Live uses `#F4F7FA`) |
| `--color-border-default` | `#D8DEE4` | Status cards, secondary buttons, checkbox ring | Ref (`#D9DEE3`) |
| `--color-border-subtle` | `#EBEEF1` | Table row dividers, tabs bottom rule, sidebar right edge | Ref (`#E8EBEE`/`#ECEEF1`) |
| `--color-border-dashed` | `#E6E9EC` | Dashed filter pills, dashed empty boxes (detail page) | Ref |
| `--color-brand` | `#635BFF` | Primary button, active status card border, active tab underline, focus ring | Ref (`#655DF6`) |
| `--color-brand-hover` | `#5851EA` | Primary button hover | Unverified, confirm on live hover |
| `--color-focus-ring` | `rgba(99, 91, 255, 0.36)` | `box-shadow: 0 0 0 4px` focus halo | Unverified, confirm with keyboard focus on live |
| `--color-overlay` | `rgba(53, 58, 68, 0.4)` | Mobile nav backdrop | Unverified, confirm on live < 1040 px |

### Status badges

Badge colors are taken from Live (exact) and checked against Ref samples.

| Variant | Background | Border | Text / icon | Used by statuses |
| --- | --- | --- | --- | --- |
| `success` | `#EAFCDD` | `#A8F170` | `#217005` | Succeeded |
| `danger` | `#FEF4F6` | `#FBD3DC` | `#C0123C` | Failed, Blocked |
| `warning` | `#FDF8C9` | `#FBD992` | `#B13600` | Dispute needs response ("N days to respond"), Early fraud warning |
| `neutral` | `#F4F7FA` | `#D4DEE9` | `#50617A` | Pending, Refunded, Partial refund, Canceled, Incomplete, Uncaptured |
| `info` | `#E2FBFE` | `#A0E6F2` | `#045AD0` | Reserved, not in reference (unverified) |

### Top bar (live sandbox only)

`#0E3359` banner, 44 px tall. The reference has no sandbox banner; the clone does **not**
render it. Kept here only for completeness.

---

## 1.2 Typography

Font stack (no web fonts, no `font-display` concerns):

```css
--font-family-ui: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
  sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
--font-family-mono: "Source Code Pro", Menlo, Monaco, monospace;
```

`-webkit-font-smoothing: antialiased` on `body` (Stripe does this on macOS).
`font-variant-numeric: tabular-nums` on amounts, dates, last-4 and IDs.

| Token | Size / line-height | Weight | Color | Usage |
| --- | --- | --- | --- | --- |
| `--text-display` | 28 / 36 | 700 | default | Page title "Transactions"; detail amount `R$ 49.90` (currency code same size, 400, secondary, `margin-left: 3px`) |
| `--text-heading` | 20 / 28 | 700 | default | Detail page section titles (Recent activity, Payment breakdown, Details…) |
| `--text-subheading` | 16 / 24 | 600 | default | Payment breakdown rows |
| `--text-body` | 14 / 20 | 400 | default | Table cells, nav items, inputs, banner |
| `--text-body-strong` | 14 / 20 | 600 | default | Amount value, active tab, buttons, status-card labels, key-value labels (700 on detail page) |
| `--text-label` | 12 / 20 | 600 | default | Table header cells ("Amount", "Payment method"…) |
| `--text-caption` | 12 / 16 | 400 | secondary | Section headings in sidebar ("Shortcuts", "Products"), pagination summary |
| `--text-badge` | 12 / 16 | 400 (Live) / 500 (Ref look) | variant | Status badges. Verify weight in the overlay pass |
| `--text-mono` | 12 / 20 | 400 | secondary | Payment ID chip `pi_3UdA…` |

Letter spacing is `normal` everywhere.

---

## 1.3 Spacing, sizing and layout

4 px base. Observed gap/padding values: `2, 4, 6, 8, 12, 16, 20, 24, 28, 32, 40, 48`.

```css
--space-1: 4px;  --space-1-5: 6px; --space-2: 8px;  --space-3: 12px;
--space-4: 16px; --space-5: 20px;  --space-6: 24px; --space-7: 28px;
--space-8: 32px; --space-10: 40px; --space-12: 48px;
```

### Payments list: layout (Ref, CSS px at the ≈1490 px reference viewport)

| Element | Measurement |
| --- | --- |
| Sidebar | ~235 px wide, right border 1 px `--color-border-subtle`; Live: 240 px, `padding: 0 20px 48px`, section gap 28 px |
| Sidebar nav item | 30 px tall, radius 6 px, icon 16 px + gap 6–8 px; active = `--color-bg-offset` background + brand text 600 |
| Content column | starts at x ≈ 275 (sidebar + 40 px gutter); Live: `padding: 0 40px 0 280px` |
| Top bar / search | search input ≈ 564 × 36 px, `--color-bg-offset`, radius 6 px, starts at y ≈ 9.5 |
| H1 "Transactions" | cap top at y ≈ 82; 28/36 bold |
| Tabs | 36 px tall, `padding: 8px 12px` (first tab flush left), active underline 2 px brand; bottom rule 1 px subtle at y ≈ 149 |
| Announcement banner | ≈ 36 px tall, full content width, `--color-bg-offset`, radius 6 px, y ≈ 174; "✦ New" tag, message, `Get started` link + vertical divider + `✕` |
| Status cards row | 6 cards, equal width (`grid-template-columns: repeat(6, 1fr)`, gap ≈ 8 px), height ≈ 44 px, radius 6 px, 1 px default border; active card 2 px brand border, brand label |
| Filter pills row | y ≈ 290, pills 24 px tall, radius 9999 px, 1 px **dashed** `--color-border-dashed`, `⊕` icon 12 px, 12/16 600 secondary; right side `Export` + `Edit columns` secondary buttons (28 px tall) |
| Table header | 36 px tall, bottom divider; checkbox column ≈ 40 px |
| Table row | **36 px** tall (pitch 36.4 px incl. divider), divider 1 px subtle |
| Footer | "Viewing 1–20 of over 10,000 results" left; `Previous` / `Next` small buttons right; 32 px area |

### Payments list: live measurements (exact, for components shared with the new layout)

| Element | Value |
| --- | --- |
| Page title block | H1 at y = 120 (16 px below top bar), actions right-aligned |
| Secondary button | height 28, `padding: 4px 8px`, radius 6, `box-shadow: 0 0 0 1px #D4DEE9`, label 14/20 600 |
| Icon-only button | 28 × 28 |
| Row | 44 px; header 40 px; checkbox 14 × 14 |
| Badge | height 20, `padding: 1px 6px`, radius 4, 1 px border |
| ID chip | mono 12/20, offset background, radius 4, copy icon 12 px |
| Pagination nav | `padding: 8px 0`, gap 8 px |

### Payment details: layout (Live, 1920 px viewport)

| Element | Value |
| --- | --- |
| Page container | `max-width: 1280px`, centered in the content area (x 433 → 1713 at 1920) |
| Columns | main 948 px + gap 48 px + aside 284 px (`grid-template-columns: minmax(0,1fr) 284px; column-gap: 48px`) |
| Breadcrumb | "Transactions" link 14/20 600 brand, above the title |
| Title row | amount 28/36 700 + currency 28/36 400 secondary + badge; subtitle "Charged to {email}" with brand link |
| Header actions | `Refund` (icon + label) secondary button + `⋯` icon button, top-right |
| Section | title 20/28 700, ~16 px to content, ~48 px between sections, dividers 1 px subtle |
| Key/value (aside) | label 14/20 700, value 14/20 400, 16 px between pairs |
| Dashed empty box | 1 px dashed `--color-border-dashed`, radius 6, centered 14/20 secondary text |

---

## 1.4 Radii

| Token | Value | Usage |
| --- | --- | --- |
| `--radius-xs` | 2px | Small inline tags |
| `--radius-sm` | 4px | Badges, checkbox, ID chip |
| `--radius-md` | 6px | Buttons, inputs, nav items, cards, banner |
| `--radius-lg` | 8px | Popovers, menus |
| `--radius-xl` | 12px | Dialogs |
| `--radius-pill` | 9999px | Filter pills, avatar |

## 1.5 Elevation

| Token | Value | Usage |
| --- | --- | --- |
| `--shadow-ring` | `0 0 0 1px var(--color-border-default)` | Secondary button, input |
| `--shadow-control` | `0 0 0 1px #D4DEE9, 0 1px 1px rgba(0,0,0,.12), 0 2px 5px rgba(48,49,61,.08)` | Checkbox, raised control |
| `--shadow-popover` | `0 5px 15px rgba(0,0,0,.12), 0 15px 35px rgba(48,49,61,.08)` | Filter popover, menus, date picker |
| `--shadow-tooltip` | `0 0 20px rgba(0,0,0,.1)` | Tooltip (dark slate tooltip ≈ `#3C4F69`, white 12/16 text, radius 4, ≈ 4 × 8 padding; measure exactly in the overlay pass) |
| `--shadow-focus` | `0 0 0 4px var(--color-focus-ring)` | Keyboard focus (`:focus-visible` only) |
| Row divider | `inset 0 -1px 0 var(--color-border-subtle)` | Table cells (Stripe uses an inset shadow, not a border) |

## 1.6 Motion

Fast and subtle, matching the live product (durations below are a starting point to tune against the live UI). Popovers fade + 4 px translate, 150 ms
`cubic-bezier(0.2, 0, 0, 1)`. Row hover background, no transition. Tooltip delay 300 ms in,
0 ms out. Every animation is disabled under `prefers-reduced-motion: reduce`.

## 1.7 Iconography

- Stripe's 16 px (navigation, top bar, filter) and 12 px (button, inline) glyph sets, all
  `fill="currentColor"`, extracted as SVG into `../reference/icons/` (40 files).
- Card brands (32 × 32 viewBox, rendered at 24 × 16 with radius 2): Visa and Mastercard
  extracted. Amex, Discover, Apple Pay, Google Pay and Link (green "▶" mark) are needed for the
  reference rows and must be redrawn as SVG at the same size from the official brand marks.
- Status badge icons (12 px, from the reference): Succeeded `✓`, Failed `✕`, Canceled `✕`,
  Blocked `⊖`, Refunded `↩`, Pending clock.
- Icons ship as an icon registry package (`packages/icons`): typed name union, so a typo is a
  compile error.

## 1.8 Breakpoints and responsive behavior

Read from the live stylesheets (media queries ranked by rule count) and confirmed by resizing:

| Token | Query | Behavior observed |
| --- | --- | --- |
| `xs` | `< 490px` | Header actions collapse to `⋯` + `+` icon buttons; search becomes an icon in the top bar; banner stacks (text, then link below) |
| `sm` | `≥ 490px` | Single-column page, content padding 20 px |
| `md` | `768–1039.9px` | Sidebar hidden behind a hamburger ("Toggle navigation menu") in the top bar; top bar shows account name; status filters scroll horizontally with a `→` affordance; table scrolls horizontally |
| `lg` | `≥ 1040px` | Fixed 240 px sidebar, content padding `0 40px 0 280px` |
| `xl` | `≥ 1440px` | Same as `lg`, wider table; the reference image sits just above this edge (≈ 1490) |

Other rules: table never wraps cells (`white-space: nowrap`), it scrolls inside its own container,
with a right-edge fade and sticky trailing `⋯` column as in the reference. Status cards switch from
a 6-column grid to a horizontal scroller below `lg`.

## 1.9 Interaction states

| State | Spec |
| --- | --- |
| Row hover | `--color-bg-offset` background on the whole row; trailing actions (`Refund`, `Send receipt`, `⋯`) appear (Live) |
| Clickable row | Cursor pointer; the row is a link to `/payments/:id` (cells keep their own controls) |
| Button hover | Background `#F5F6F8` (secondary), `--color-brand-hover` (primary) |
| Focus | `:focus-visible` → `--shadow-focus`; never removed without replacement |
| Disabled | 50% opacity on controls, `--color-text-disabled` on labels |
| Sort | Header label becomes interactive; arrow indicator ▲/▼ 8 px after the label; multi-sort shows order index (1, 2) |
| Tooltip | Dark tooltip above the trigger, 4 px offset: "Copy to clipboard" → "Copied!" on the ID chip; relative time ("3 hours ago") on the date cell |
| Selected checkbox | Brand fill, white check |

## 1.10 Content (labels, verbatim)

Payments list (reference): `Transactions` · tabs `Payments`, `Payouts`, `Top-ups`,
`Collected fees`, `Transfers`, `All activity` · `Create payment`, `Analyze` · banner `New`,
`Rule Attributes are now in Sigma and Data Pipeline for better fraud insights.`, `Get started` ·
status cards `All`, `Succeeded`, `Refunded`, `Disputed`, `Failed`, `Uncaptured` · pills
`Date and time`, `Amount`, `Currency`, `Status`, `Payment method`, `More filters` · `Export`,
`Edit columns` · columns `Amount`, `Payment method`, `Description`, `Customer`, `Date`,
`Refunded date`, `Decline reason` · footer `Viewing 1–20 of over 10,000 results`, `Previous`,
`Next` · sidebar `Home`, `Balances`, `Transactions`, `Customers`, `Product catalog`,
`Shortcuts`, `Payments analytics`, `Reports`, `Sigma`, `Radar`, `Products`, `Connect`,
`Payments`, `Billing`, `Reporting`, `More`, `Developers` · top bar `Search`,
`Test mode has moved.`, `Show me`.

Filter popovers (live): `Date and time` → operators `is in the last`, `is equal to`,
`is between`, `is on or after`, `is before or on`, units `hours`, `days`, `months`, `Apply` ·
`Amount` → `is equal to`, `is between`, `is greater than`, `is less than` · `Status` → checkbox
list (see data model) · `Payment method` → select.

Empty state (live): **`No results`** / `No results match your criteria` + `Clear all` button,
inside an offset-background box replacing the table.

Detail page (live): `Transactions` breadcrumb, `Charged to`, `Refund`, `Recent activity`,
`Add note`, `Payment authorized`, `Payment started`, `Payment breakdown`, `Payment amount`,
`Stripe processing fees`, `Learn more`, `Net amount`, `Payment method`, `Expires`,
`Enabled payment methods`, `Tax calculation`, `No tax rate applied.`, `Risk analysis`,
`Risk factors`, `Risk scores`, `Related payments`, `No related payments in the last 6 months`,
`Related objects`, `Latest charge`, `Receipt history`, `View receipt`, `Send receipt`,
`No receipts sent`, `Events`, `Logs`, `Details`, `Payment ID`, `Risk level`, `Normal`,
`View docs`, `Description`, `Edit`, `Statement descriptor`, `Funds available`,
`View balances`, `Last updated`, `Customer`, `ID`, `Name`, `Email`, `Phone`, `Country`,
`Metadata`, `No metadata`.
