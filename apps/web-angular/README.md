# web-angular

Angular (standalone components, signals, zoneless change detection) + TypeScript implementation of the
Stripe Dashboard **Payments** screen and the **Payment details** page. It renders the same markup classes
as the Next.js app from the shared `@stripe-clone/styles`, and reuses the shared domain, icons and mock data.

```bash
pnpm --filter web-angular dev        # http://localhost:4200 (copies mock data into public/data first)
pnpm --filter web-angular build      # production build (dist/web-angular)
pnpm --filter web-angular typecheck
```

## Structure

```
src/app/
├── app.config.ts / app.routes.ts   Router (lazy routes, input binding, preloading), HttpClient (fetch), zoneless
├── core/                           PaymentsRepository (HTTP + IndexedDB), PaymentsStore (resource + signals),
│                                   injectPaymentsQuery (URL state), preference (localStorage signal)
├── ui/                             Icon, BrandMark, Badge/StatusBadge, Tooltip (CDK overlay), CopyableId,
│                                   Indeterminate checkbox, HorizontalOverflow, Spinner/Skeleton
├── layout/                         AppShell, Sidebar, Topbar, GlobalSearch, navigation config
└── features/
    ├── payments/                   Page, header/banner, status cards, filters, table, pagination, states
    └── payment-details/            Details page, DetailSection
```

## Angular-specific choices

- **Signals end to end.** `resource()` loads the dataset in a root service; filtering, sorting and paging are
  `computed()` over the URL-derived query, so the table re-renders only what changed (`OnPush` everywhere,
  no Zone.js).
- **URL as state.** `injectPaymentsQuery` reads `queryParamMap` as a signal and writes with `replaceUrl`,
  using the same parser/serializer as the Next.js app.
- **Overlays from the CDK.** Filter popovers use `cdkConnectedOverlay` + `cdkTrapFocus`, the row and
  "More filters" menus use CDK Menu (roving focus, typeahead), tooltips use `createOverlayRef`.
- **Lazy loading.** Routes use `loadComponent`; each filter panel lives in a `@defer` block so its code is
  fetched the first time the pill opens; the Events/Logs sections of the details page are deferred until
  they scroll into view; details are loaded per shard and prefetched on row hover.
- **Caching.** In-memory promises per resource, IndexedDB persistence (`idb-keyval`, versioned keys) and
  HTTP caching of the static `/data/*` files.
- **Strict compiler.** `strict`, `noUncheckedIndexedAccess`, `strictTemplates` and extended diagnostics as
  errors.
