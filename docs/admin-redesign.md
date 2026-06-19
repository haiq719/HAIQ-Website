# Admin Dashboard Redesign

A full visual revamp of the HAIQ admin app so every page matches the look and
feel of the Order Detail page: dark cocoa cards, amber/gold accents, serif
headings, professional Lucide icons, and subtle anime.js motion. Functionality
is unchanged — this was a visual + consistency pass only.

## Design language

| Token        | Value      | Use                                   |
|--------------|------------|---------------------------------------|
| ink          | `#1A0A00`  | darkest surface / button text on gold |
| surface      | `#2A1200`  | card / panel background               |
| panel        | `#0E0600`  | app background / sidebar              |
| border       | `#3D2000`  | hairline borders                      |
| primary/amber| `#B8752A`  | buttons, links, icons, active state   |
| secondary/tan| `#D4A574`  | hover / secondary accent              |
| accent/gold  | `#E8C88A`  | headings & highlights                 |
| muted        | `#8C7355`  | subdued text                          |
| light/cream  | `#F2EAD8`  | primary text                          |
| success      | `#4ade80`  | paid / delivered / approved           |
| danger       | `#f87171`  | cancelled / failed / rejected         |

## Foundation changes

- **`tailwind.config.js`** — added the semantic aliases (`primary`, `secondary`,
  `accent`, `dark`, `light`) that were referenced across the app but never
  defined, so `bg-primary`, `text-light`, `text-dark`, etc. now actually render.
- **`src/index.css`** — deduped and expanded the admin component classes:
  `.admin-card` (+ `.admin-card-hover`), `.admin-input` (focus ring + custom
  select chevron), `.admin-btn-primary` / `.admin-btn-secondary`, `.admin-pill`,
  `.admin-scroll` (themed scrollbar), and a global `prefers-reduced-motion`
  guard.
- **`src/components/shared/ui.jsx`** (new) — shared primitives used everywhere:
  `PageHeader`, `Card`, `SectionHeader`, `Pill`, `EmptyState`, `Skeleton`,
  `PageShell` (wrapper that runs a staggered entrance on its children).
- **`src/lib/anim.js`** — anime.js v4 helpers: `useEntrance` (staggered fade +
  rise), `useCountUp` (number tween), `usePop` (modal / card pop-in). All respect
  reduced-motion.
- **`src/components/shared/StatusBadge.jsx`** — one pill style with a Lucide icon
  for every order, payment, review, and loyalty status.
- **`src/components/shared/Button.jsx`** — rounded corners + icon gap.

## Pages revamped

Every page now uses `PageShell` + `PageHeader`, `Card`, shared `StatusBadge` /
`Pill`, Lucide icons, and the entrance animation:

- **Dashboard** — animated count-up stat cards (done in the prior pass).
- **Analytics** — count-up KPIs, legible zone bars, reliable product images.
- **Orders** — search/filter card, status pills, cancel modal with pop-in.
- **Order Detail** — the reference design (status stepper, payment card).
- **Products** — table + product modal, stock/flags as pills, image fallbacks.
- **Reviews** — moderation cards with star ratings and approve/reject.
- **Messages** — responsive inbox (single-pane on mobile), branded email reply.
- **Loyalty** — application review modal, dispatch workflow.
- **Newsletter** — subscribers table, campaign composer, WhatsApp invite.
- **Special Days** — date-range pricing windows with active toggles.
- **Delivery Zones** — fee table with add/edit modal.
- **Login** — polished card with iconed inputs and a pop-in entrance.
- **Layout / nav** — rounded active nav states, route-change page transition.

## Emoji → icon replacements

All generic glyphs/emojis were replaced with clearly identifiable Lucide icons:

| Was            | Now (Lucide)                         | Where                |
|----------------|--------------------------------------|----------------------|
| `💌`           | `Mail`                               | Messages type label  |
| `↻`            | `RefreshCw`                          | Messages refresh     |
| `×` / `x`      | `X`                                  | modal / panel close  |
| `✓` / `✗`      | `CheckCheck` / `CheckCircle2` / `AlertTriangle` | replies, results |
| `★`            | `Star`                               | product ratings      |
| `● / ○`        | `CheckCircle2` / `CircleOff` / `Eye` / `EyeOff` | active toggles |
| `⚠`            | `AlertTriangle`                      | campaign warnings    |
| `+`            | `Plus`                               | add buttons          |

## Responsiveness & accessibility

- Tables scroll horizontally inside cards on small screens (`min-w` + `admin-scroll`).
- Messages collapses to a single pane on mobile with a back arrow.
- Filters and forms wrap with `flex-wrap` / responsive grids.
- All motion is gated behind `prefers-reduced-motion: reduce`.
- Icons pair with text labels so meaning is unambiguous.

## Notes

- `src/components/shared/Sidebar.jsx` is unused (dead code) — the real nav lives
  in `AdminLayout.jsx`. Left untouched.
- anime.js v4 (`animejs`) added as an admin dependency.
