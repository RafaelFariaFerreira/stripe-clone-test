# 3. Architecture

## 3.1 Repository layout (pnpm workspaces + Turborepo)

```
stripe-clone/
├── apps/
│   ├── web-next/                 Next.js (App Router) + React + TypeScript
│   └── web-angular/              Angular (standalone components, signals, zoneless) + TypeScript
├── packages/
│   ├── design-tokens/            tokens.css (custom properties) + tokens.ts (typed mirror) + base.css (reset, font stack)
│   ├── icons/                    SVG sources + generated typed registry (IconName union)
│   ├── domain/                   types, status map, formatters, query parser, filter/sort/paginate (pure TS, no framework)
│   ├── mock-data/                seeded generator script + generated payments.json (600 rows) + per-payment detail fixtures
│   ├── styles/                   component CSS shared by both apps (BEM-like class names, consume tokens only)
│   └── test-utils/               shared Playwright specs (run against both apps), visual-diff helpers
├── docs/                         planning (this folder) + reference captures
├── turbo.json · pnpm-workspace.yaml · tsconfig.base.json · .editorconfig · .nvmrc
└── README.md                     how to run, deploy links, screenshots
```

Versions at planning time (pin exact versions when scaffolding): Next.js 16.4, React 19.3,
Angular 22.3 (+ CDK 22.3), TypeScript 7.0, TanStack Query 5.108, TanStack Table 9.3, nuqs 2.10,
Vitest 5.1, Playwright 1.65, Turborepo 2.11, pnpm 12.

### Why this split

- **Pixel parity across frameworks**: both apps render the same markup classes from
  `packages/styles`, so a fix to spacing is made once. Framework code only owns behavior.
- **Logic is tested once**: filtering, sorting, pagination, money and date formatting, and URL
  (de)serialization live in `packages/domain` with exhaustive Vitest unit tests.
- **Styling approach**: plain CSS with custom properties and cascade layers
  (`@layer reset, tokens, components, utilities`). No utility framework: pixel-perfect work
  needs exact, inspectable values, and the same CSS must work in React and Angular. Next imports
  the shared CSS globally; Angular includes it in `styles` (component styles use
  `ViewEncapsulation.None` only for the shared classes).

## 3.2 Data layer

### Mock data

- `packages/mock-data/scripts/generate.ts` builds **600 payments** with a seeded PRNG
  (deterministic, so screenshots and tests are stable). Output: `payments.json` (list fields only,
  ≈ 120 KB gzip ≈ 25 KB) and `details/{id}.json` (timeline, events, logs, breakdown, customer).
- Realism rules:
  - Currencies and weights: USD 55%, GBP 12%, EUR 12%, BRL 10%, CAD 5%, AUD 3%, JPY 3%
    (JPY has no minor unit). Amounts follow per-currency price points like real subscriptions
    ($4.07–$189.99, "x.99" endings, some odd values from prorations).
  - Statuses: Succeeded 62%, Failed 14% (with decline reasons: Insufficient funds, Do not honor,
    Transaction not allowed, Expired card, Incorrect CVC, Processing error), Refunded 7%, Partial
    refund 2%, Pending 5%, Canceled 4%, Uncaptured 2%, Blocked 2%, Disputed 2%.
  - Payment methods: Card 80% (Visa 55, Mastercard 30, Amex 10, Discover 5), Wallet 12% (Apple
    Pay, Google Pay, Link, always backed by a card brand + last 4, as in the reference), ACH 8%
    (bank name + last 4).
  - Created: spread over the last 120 days with business-hour clustering, **including today**,
    so the "Today" preset is never empty. Dates are generated relative to a fixed anchor and
    shifted to "now" at load time, so relative times stay plausible on any day.
  - Customers: ~420 distinct, realistic emails at generic domains, ~30% with names.
  - Description: "Subscription update" dominant (as in the reference), plus "Subscription
    creation", "Payment for Invoice", "One-time purchase".

### Service boundary

Both apps talk to the data through one interface, so the mock can later be replaced by an API:

```ts
interface PaymentsRepository {
  list(): Promise<PaymentListItem[]>;              // whole dataset, cached; query runs client-side
  get(id: string): Promise<PaymentDetails | null>; // fetched lazily per detail page
}
```

- **Next.js**: `app/api/payments/route.ts` and `app/api/payments/[id]/route.ts` serve the JSON
  (static, `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`). Both are
  statically generated at build time and served as plain files with long-lived cache headers.
- **Angular**: the JSON files are copied to `assets/data/` and fetched with `HttpClient`
  (`provideHttpClient(withFetch())`).

### Query execution

`applyQuery(rows, query) → { rows, total, counts }` in `packages/domain`:

1. Filter (view card → status set; search across `id`, `customer.email`, `last4`,
   case-insensitive, `pi_` prefix optional; date; amount compared in major units; currency;
   status; payment method).
2. Sort (stable multi-column: comparator chain; status sorts by a fixed lifecycle order).
3. Paginate.

`counts` per view card are computed from the same filtered set minus the view, so the cards
always reflect the other active filters. The function is memoized on `(datasetVersion, queryKey)`;
600–1,000 rows filter in < 2 ms, so no worker is needed (a `useDeferredValue` / signal
debounce keeps typing smooth anyway).

## 3.3 Caching strategy ("cache everything possible")

| Layer | What | How |
| --- | --- | --- |
| HTTP / CDN | `payments.json`, `details/*.json`, icons, CSS, JS | Immutable hashed assets (`max-age=31536000, immutable`); data with `max-age=3600, stale-while-revalidate` |
| In-memory query cache | Dataset and each viewed detail | Next: TanStack Query (`staleTime: 5 min`, `gcTime: 30 min`). Angular: `PaymentsStore` service with signals + `shareReplay({ bufferSize: 1, refCount: false })`, keyed map for details |
| Persisted cache | Dataset between visits | TanStack Query `persistQueryClient` to IndexedDB (Next); same via a small `IdbCache` wrapper (Angular). Versioned key: a dataset version bump busts it |
| Derived data | Filtered/sorted result per query | Memoized selector (`useMemo` / `computed()`) |
| Prefetch | Detail page | Prefetch `details/{id}.json` on row hover/focus (150 ms intent delay) and on viewport idle for the first 5 rows; Next also prefetches the route |
| UI preferences | Banner dismissed, column visibility/order, page size | `localStorage` (try/catch, safe defaults) |
| Back navigation | Returning from details keeps the exact list state | Filters in the URL + cached dataset = instant render; scroll position restored |

## 3.4 Lazy loading

| What | Next.js | Angular |
| --- | --- | --- |
| Payment details route | Own route segment (`app/payments/[id]/page.tsx`), code-split automatically | `loadComponent` route |
| Filter popover bodies | `next/dynamic` per popover, preloaded on pill hover | `@defer (on interaction; prefetch on hover)` |
| Date range calendar (Custom) | `next/dynamic` | `@defer` |
| CSV export | dynamic `import()` on click | dynamic `import()` on click |
| Column settings (drag & drop) | `next/dynamic` | `@defer` |
| Detail data | Fetched only on the detail route (Suspense boundary per section) | `resource()` / `httpResource()` per section with `@defer` for below-the-fold sections (Events, Logs) |
| Long tables | 100-row pages render plainly; row virtualization **not** needed at this size (keeps exact Stripe row DOM) | same |

## 3.5 Loading, empty and error states

| Screen | Loading | Empty | Error |
| --- | --- | --- | --- |
| List: first load | Header, tabs, cards and pills render immediately; status-card counts show skeleton bars; table shows `TableSkeleton` (8 rows, same 36 px height, shimmer blocks sized like real content) | n/a | `TableErrorState` with "Retry" |
| List: filters → no rows | n/a | Live copy: **"No results"** / "No results match your criteria" + `Clear all` (offset box) | n/a |
| List: empty dataset | n/a | "No payments yet" state with "Create payment" (not shown in reference, styled like live empty boxes) | n/a |
| Details | Per-section `Spinner` exactly like the live capture; header skeleton (amount + badge bars) | Dashed `EmptyBox` per section (Tax, Receipts, Metadata, Related payments) as live | `DetailNotFound` for unknown IDs, error boundary with Retry |
| Account switcher | Skeleton bars (live capture) | — | — |

Next uses `loading.tsx` + Suspense; Angular uses `@if (store.status() === 'loading')` and `@defer`
placeholders. Skeletons never shift layout: they reserve the final dimensions (CLS ≈ 0).

## 3.6 Next.js app (`apps/web-next`)

```
src/
├── app/
│   ├── layout.tsx                  AppShell, providers (QueryClient, Tooltip provider)
│   ├── page.tsx                    redirect → /payments
│   ├── payments/
│   │   ├── page.tsx                Server Component shell; reads searchParams for first render
│   │   ├── loading.tsx             TableSkeleton
│   │   └── [id]/
│   │       ├── page.tsx            Details (generateStaticParams for all mock IDs)
│   │       ├── loading.tsx         DetailSkeleton
│   │       └── not-found.tsx       DetailNotFound
│   └── api/payments/…              static JSON route handlers
├── components/ui/                  primitives (2.2)
├── components/layout/              shell (2.3)
├── features/payments-list/         list feature (2.4): components, hooks (usePaymentsQuery, useUrlQuery)
├── features/payment-details/       details feature (2.5)
└── lib/                            query client, repository adapter, clipboard, analytics-free
```

- Server Components for static chrome (sidebar, header, tabs); Client Components only where
  interaction exists (table, filters, tooltips). Keeps JS small.
- URL state through `nuqs` with parsers from `packages/domain`.
- Popovers and tooltips positioned with Floating UI.

## 3.7 Angular app (`apps/web-angular`)

```
src/app/
├── app.config.ts                   provideRouter(withComponentInputBinding(), withViewTransitions()),
│                                   provideHttpClient(withFetch()), provideZonelessChangeDetection()
├── app.routes.ts                   '' → payments list; 'payments/:id' → loadComponent(details)
├── core/                           PaymentsRepository (HTTP), PaymentsStore (signals), UrlQuerySync, IdbCache
├── ui/                             primitives (2.2) as standalone components, OnPush everywhere
├── layout/                         shell (2.3)
├── features/payments-list/         list feature (2.4)
└── features/payment-details/       details feature (2.5)
```

- State: `PaymentsStore` exposes `query = signal<PaymentsQuery>()`, `rows = computed(() =>
  applyQuery(dataset(), query()))`. URL ↔ query sync in one service.
- Overlays (popover, menu, tooltip) built on `@angular/cdk/overlay` and `cdk/a11y` (focus trap,
  live announcer), styled with the shared classes.
- Same component names and inputs as React (`<app-status-badge [status]="…">`).

## 3.8 Accessibility (both apps)

- Real `<table>` semantics, `<caption class="sr-only">Payments</caption>`, `scope="col"`,
  `aria-sort` on sortable headers, header sort buttons are `<button>`s.
- Row navigation: the description/amount cell holds the link; checkboxes and the ID copy
  button stay independently focusable (no nested interactive elements).
- Popovers: `role="dialog"` with labelled title, focus moves in and returns to the pill; `Esc`.
- Tooltips appear on focus too; copy confirmation announced through a polite live region.
- Status is never conveyed by color alone (label + icon). Contrast ≥ 4.5:1 checked for every
  badge tone.
- Keyboard: `/` focuses search (as in Stripe), `Shift+click` / `Shift+Enter` for multi-sort.

## 3.9 Code quality and documentation

- `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`; no `any`.
- ESLint (typescript-eslint, react, @angular-eslint) + Prettier + Stylelint (forbids raw hex
  outside the tokens package and magic px values outside an allow-list).
- Every exported function/component has a short TSDoc comment explaining **why**, not what.
- Each package and app has a README: purpose, public API, how to run, design decisions.
- Conventional commits; CI (GitHub Actions): typecheck → lint → unit → e2e → visual diff →
  build both apps; deploys on Railway (one service per app).
