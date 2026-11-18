# web-next

Next.js (App Router) + TypeScript implementation of the Stripe Dashboard **Payments** screen and the
**Payment details** page. Shares its design system, icons, mock data and domain logic with the
Angular app through the workspace packages.

```bash
pnpm --filter web-next dev        # http://localhost:3000 (copies mock data into public/data first)
pnpm --filter web-next build      # production build
pnpm --filter web-next typecheck
pnpm --filter web-next lint
```

## Structure

```
src/
├── app/                         Routes (server components): layout, /payments, /payments/[id]
├── components/
│   ├── layout/                  App shell: sidebar, top bar, global search, navigation config
│   └── ui/                      Primitives: Button, IconButton, Badge, Checkbox, Tooltip, Popover, Menu, Icon…
├── features/
│   ├── payments/
│   │   ├── api/                 Repository (HTTP) + TanStack Query hooks and keys
│   │   ├── hooks/               URL-backed query state (usePaymentsQuery)
│   │   ├── components/          Header, status cards, filters, table, pagination, states
│   │   └── columns.ts           Column model shared by header, cells and "Edit columns"
│   └── payment-details/         Details page view, sections and skeleton
└── lib/                         Query provider (IndexedDB persistence), hooks, utilities
```

## Rendering and data

- **Static shell, streamed data.** With Cache Components, the sidebar, top bar, page header, tabs and
  banner are prerendered. The URL-driven table is a client island inside `<Suspense>`; the details route
  awaits `params` inside `<Suspense>` so its skeleton is part of the static shell.
- **State in the URL.** Filters, view card, search, sort, page and page size are parsed and written with
  the shared `parseQuery` / `serializeQuery` from `@stripe-clone/domain`, so every view is a shareable link.
- **Caching.**
  - HTTP: `/data/*` is served with `Cache-Control: max-age=3600, stale-while-revalidate`.
  - Memory: TanStack Query keeps the dataset and detail shards for the session (`staleTime: Infinity`).
  - Persistence: the query cache is persisted to IndexedDB (`idb-keyval`), so repeat visits render
    instantly; a cache buster invalidates it when the data format changes.
  - Preferences (dismissed banner, visible columns) use `localStorage` through `useSyncExternalStore`.
- **Lazy loading.** Filter popover bodies are code-split (`next/dynamic`) with a local Suspense boundary;
  payment details are loaded from one of 16 shards only when needed, and prefetched when the pointer
  rests on a row (together with the route).
- **Hydration safety.** Data restored from IndexedDB can exist before hydration; `useHydrated` keeps
  the first client render identical to the server HTML.

## Accessibility

Real table semantics with `aria-sort`, keyboard-reachable row links, tooltips on hover and focus,
focus-managed popovers and menus (Floating UI), visible `:focus-visible` rings, `/` to focus search,
Shift+click / Shift+Enter for multi-column sorting.
