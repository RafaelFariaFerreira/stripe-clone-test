# Stripe Payments clone: planning

Planning package for a portfolio rebuild of two Stripe Dashboard screens, implemented twice
(Next.js + TypeScript and Angular + TypeScript) from one shared design system and domain layer.

| Screen                                  | Live reference (test mode)        |
| --------------------------------------- | --------------------------------- |
| Payments list (Transactions → Payments) | `/test/payments`                  |
| Payment details                         | `/test/payments/:paymentIntentId` |

These documents were written before the build and remain the source of truth for it; the implementation lives in `apps/` and `packages/`.

## Documents

| #   | Document                                                 | What it answers                                                                |
| --- | -------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1   | [Style guide](./01-style-guide.md)                       | Colors, typography, spacing, radii, shadows, icons, breakpoints, state styling |
| 2   | [Component map](./02-component-map.md)                   | Which elements repeat, the component tree for both screens, props and states   |
| 3   | [Architecture](./03-architecture.md)                     | Monorepo layout, shared packages, data, caching, lazy loading, URL state, a11y |
| 4   | [Roadmap and acceptance](./04-roadmap-and-acceptance.md) | Milestones, acceptance-criteria traceability, QA and visual-regression process |

Reference material lives in [`../reference`](../reference):

- `pdf/reference-payments-2048x1568.png` is the primary visual target (see "Reference strategy").
- `screenshots/` holds captures of the live test-mode Dashboard at a 1920px-wide viewport,
  including filter popovers, hover states, the detail page, loading, empty and responsive states.
- `icons/` holds SVG icons extracted from the live DOM.
- `raw/computed-styles.json` is the computed-style dump the tokens were derived from.

## Key decisions

1. **The PDF image is the visual target.** The brief's reference (Stripe Dashboard,
   Payments, ~1490 CSS px wide) shows an older layout than today's test-mode Dashboard:
   wide status cards, dashed filter pills with "⊕", `Export` / `Edit columns` buttons,
   badges with icons, `Previous` / `Next` pagination. I rebuild **that structure**, and use
   the live Dashboard only for exact measurements, behaviors and states the image cannot show
   (popovers, tooltips, hover, loading, empty, responsive).
2. **System font stack, no web font.** Exactly what Stripe ships:
   `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
   (+ emoji fonts). macOS users see SF Pro like the reference; other platforms see their native
   UI font. Visual-regression baselines are therefore per platform.
3. **English UI**, labels copied verbatim from the reference.
4. **Responsive like the original**, using Stripe's own breakpoints (490 / 768 / 1040 / 1440 px),
   read from the live stylesheets.
5. **One design system, two frameworks.** Tokens, icons, mock data, domain logic (filter, sort,
   paginate, formatting) are framework-agnostic packages; each app only owns its components.
6. **Next.js ships first** (brief prefers it; deadline: Friday, Nov 20, 2026, end of day,
   Brasília time). Angular follows on the same packages.
