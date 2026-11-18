# 4. Roadmap, acceptance and QA

Deadline from the brief: **Friday, November 20, 2026, end of day (Brasília time)**.
Next.js is the graded deliverable; Angular is built on the same packages right after.

## 4.1 Milestones

| # | Milestone | Output | Done when |
| --- | --- | --- | --- |
| M0 | Workspace | pnpm + Turborepo, shared tsconfig, lint, CI skeleton, both apps boot | `pnpm dev` runs both apps; CI green |
| M1 | Foundations | `design-tokens`, `styles` base, `icons` registry (incl. redrawn Amex, Discover, Apple Pay, Google Pay, Link), `domain` types + formatters | Token page renders; Vitest covers formatters |
| M2 | Mock data | Seeded generator, `payments.json` (600) + detail fixtures | Distribution test passes (statuses, currencies, methods, "today" rows) |
| M3 | Query engine | `applyQuery`, URL parse/serialize, counts | 100% branch coverage on filter/sort/paginate |
| M4 | Next: shell + table | AppShell, PageHeader, Tabs, Banner, StatusFilterCards, PaymentsTable with all columns, pagination, sorting | Overlay diff on the reference ≤ 1% mismatch at 1490 px |
| M5 | Next: filters + search | All popovers, pills applied state, search, Clear all, empty/loading/error states | All required filter specs pass |
| M6 | Next: details page | Route, sections, prefetch, loading/not-found | Detail overlay vs live capture |
| M7 | Next: polish + nice-to-haves | Responsive (490/768/1040/1440), CSV export, Edit columns, URL sharing, a11y audit | Lighthouse a11y ≥ 95, axe clean |
| M8 | Deploy + README | Railway URL, repository README with screenshots | Public URL works from a clean browser |
| M9 | Angular | Same features on the same packages | Shared Playwright suite passes against both apps |

## 4.2 Acceptance criteria traceability

| Requirement (brief) | Where it is satisfied | Verified by |
| --- | --- | --- |
| Payment ID, shortened, copy to clipboard | `PaymentIdCell` → `CopyableId` (`pi_3UdA…wsQ`, tooltip "Copy to clipboard" → "Copied!") | e2e: clipboard contains full ID |
| Customer | `CustomerCell` (email; name in `title`) | e2e |
| Amount formatted with its currency | `Money` + currency code; JPY/zero-decimal aware | unit (Intl per currency) |
| Status badge: Succeeded, Pending, Failed, Refunded | `StatusBadge` (+ Canceled, Blocked, Uncaptured, Disputed, Partial refund from the reference) | unit + visual |
| Payment method: brand + last 4 | `PaymentMethodCell` (wallet mark + brand mark + `•••• 4242`) | visual |
| Created: date/time, relative time tooltip | `CreatedCell` → `DateTime` + `Tooltip` ("2 hours ago") | e2e hover/focus |
| Sorting on date, amount, status (single or multi) | `SortableHeaderCell`, Shift+click multi-sort, stable comparator chain | unit + e2e |
| Pagination 25 / 50 / 100 | `TablePagination` + `PageSizeSelect`, client-side | e2e |
| Date range with presets Today, 7 days, 30 days, Custom | `DateFilterPopover` + `DateRangeCalendar` | unit (boundaries, timezones) + e2e |
| Status multi-select | `StatusFilterPopover` | e2e |
| Payment method multi-select (Card, ACH, Wallet) | `PaymentMethodFilterPopover` | e2e |
| Amount range | `AmountFilterPopover` (`is between`, plus eq/gt/lt) | unit + e2e |
| Text search: payment ID, email, last 4 | `GlobalSearch` → `query.search` | unit + e2e |
| Mock data 300–1,000 rows, realistic, several currencies, mixed statuses | `packages/mock-data` (600 rows, 7 currencies) | distribution test |
| Match Stripe's look; copy labels, icons, assets | Tokens from live + reference; labels verbatim (01 §1.10); icons from live DOM | overlay diff + label snapshot test |
| Empty and loading states (added requirement) | 03 §3.5 | visual + e2e (`?status=…` with no match; throttled network) |
| Cache what is possible; lazy load data | 03 §3.3–3.4 | network panel checks in e2e (single dataset request, detail prefetch on hover) |
| Clean, typed, organized, documented | 03 §3.9 | CI lint/typecheck, README per package |

Nice-to-haves covered: sidebar (#1), top bar with search + account menu (#2), details route with
timeline and metadata (#3), filters in the URL (#4), column visibility/reorder (#5), CSV export (#6).

## 4.3 Open decisions (with recommendation)

| Topic | Options | Recommendation |
| --- | --- | --- |
| Column header for the creation time | Reference says **"Date"**; brief bullet says "Created" | Use **"Date"** (reviewers compare labels to the reference; the brief describes the data, not the label) |
| Payment ID column position | Reference image crops before an ID column; live Dashboard shows `ID` as the last column | Last column before `⋯`, label **"ID"** (live label), shortened chip |
| Customer column | Reference: "Customer" (email) | Keep "Customer" with email, as in the reference |
| "Pending" status | Not visible in the reference rows | Neutral badge with clock icon, label "Pending" |
| Text search location | Reference has only the global top-bar "Search" | Top-bar search filters the table while on Payments (placeholder "Search"); no extra input, so the hierarchy stays identical |
| Live sandbox banner and setup guide | Present in live test mode, absent in reference | Not rendered |

## 4.4 Pixel-perfect QA process

1. **Overlay calibration (M4)**: Playwright opens the Next app at **1489 × 1140, DPR 2**, takes a
   screenshot, downsamples to 2048 px wide (×1.375 overall), and diffs it against
   `reference-payments-2048x1568.png` with `pixelmatch`. A side-by-side + diff PNG is written to
   `test-results/visual/`. Fix spacing until the structural mismatch is < 1% (anti-aliasing and
   font rasterization excluded with a 0.1 threshold and a mask over avatars).
2. **Font note**: the reference was rendered with SF Pro on macOS. The diff baseline is run on
   macOS (CI `macos-latest` runner) so the system font matches. On Linux/Windows the app uses that
   platform's system font by design; those runs check layout boxes, not glyphs.
3. **Live parity checks**: for states the image does not show (popovers, tooltips, hover row,
   empty, loading, detail page), compare against `../reference/screenshots/` at 1920 px and against
   the live DOM metrics in `raw/computed-styles.json` (element boxes are asserted with
   `boundingBox()` ± 1 px).
4. **Responsive**: snapshots at 390, 506, 768, 1024, 1040, 1440, 1490 and 1920 px wide.
5. **Exact 1920 × 1080 live captures**: if more reference shots are needed, run the capture spec
   (`packages/test-utils/capture-live.spec.ts`) with a saved Stripe session
   (`storageState`), which sets the viewport to exactly 1920 × 1080 regardless of the window
   manager.
6. **Review checklist before delivery**, mirroring the brief's review: hierarchy (every element,
   right order), fidelity (sizes, spacing, padding, borders, radius), features, content (labels
   verbatim), code (typed, organized, documented).
