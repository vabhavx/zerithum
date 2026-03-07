# Zerithum Design System & Style Guide

**Reference aesthetic:** Paradigm AI — editorial, restrained, typographically serious.
**Mandatory reading before touching any UI component.**

---

## 0. The Core Principle

Every pixel must communicate **trust, precision, and control**. Zerithum is used by creators managing real money. The interface must feel like Bloomberg Terminal meets Stripe Dashboard — never like a SaaS startup template.

**If a design element does not serve a functional purpose, remove it.**

---

## 1. Color System

### Design Mode: Light-First

The app is a **light-theme application**. Dark mode exists as a variant. Never design dark-first.

The landing page (`Landing.jsx`) is the only surface that uses a full dark-black background (`#000000` / `zinc-950`). This is intentional — it creates contrast between the marketing surface and the authenticated product.

### Zerithum Design Token Reference

All colors must use CSS variables. Never hardcode hex values for structural colors.

```
/* Background hierarchy — light theme */
--z-bg-0: #FFFFFF       → Cards, modals, elevated surfaces
--z-bg-1: #F9FAFB       → Page background
--z-bg-2: #F3F4F6       → Metric tiles, inset areas, table rows (alternate)
--z-bg-3: #E5E7EB       → Deepest inset, skeleton shimmer base

/* Borders */
--z-border-1: #E5E7EB   → Default card/section border
--z-border-2: #D1D5DB   → Hover state border

/* Text hierarchy */
--z-text-1: #111827     → Primary headings, values, critical info
--z-text-2: #374151     → Body text, labels, secondary info
--z-text-3: #6B7280     → Captions, metadata, placeholder text

/* Brand accent — blue (trust signal) */
--z-accent: #2563EB     → Links, active nav, primary interactive
--z-accent-hover: #1D4ED8
--z-accent-light: #EFF6FF  → Accent background tint
--z-accent-muted: #BFDBFE  → Accent border tint

/* Semantic */
--z-success: #059669    → Matched, reconciled, confirmed
--z-warn: #D97706       → Pending, needs review
--z-danger: #DC2626     → Discrepancy, error, risk
```

### Tailwind Palette Usage Rules

| Usage | Correct | Wrong |
|---|---|---|
| Page background | `bg-[var(--z-bg-1)]` | `bg-gray-50` |
| Card background | `bg-[var(--z-bg-0)]` | `bg-white` |
| Primary text | `text-[var(--z-text-1)]` | `text-gray-900` |
| Secondary text | `text-[var(--z-text-2)]` | `text-gray-600` |
| Muted/caption text | `text-[var(--z-text-3)]` | `text-gray-400` |
| Accent CTA | `bg-[var(--z-accent)]` | `bg-blue-600` |
| Success status | `text-[var(--z-success)]` | `text-green-500` |

### Landing Page (Dark Surface) Color Usage

The landing page exclusively uses the `zinc-*` Tailwind scale for dark surfaces:
- Hero/nav background: `bg-zinc-950` / `#09090b`
- Card dark: `bg-zinc-900`
- Border dark: `border-zinc-800`
- Text primary dark: `text-white`
- Text secondary dark: `text-zinc-400`
- Text muted dark: `text-zinc-500`

Footer of the landing page breaks to white (`bg-white`, `text-zinc-900`) — a deliberate alternating rhythm (dark hero → white footer).

### Status Colors — Financial Context

```
Reconciled / Matched   → --z-success (#059669)     bg: --z-success-light (#ECFDF5)
Pending / In Review    → --z-warn (#D97706)         bg: --z-warn-light (#FFFBEB)
Discrepancy / Error    → --z-danger (#DC2626)       bg: --z-danger-light (#FEF2F2)
Info / Syncing         → --z-accent (#2563EB)       bg: --z-accent-light (#EFF6FF)
```

Never use color alone to communicate status — always pair with an icon or label text.

---

## 2. Typography

### Typeface Stack

```css
/* UI / Body */
font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;

/* Editorial / Headings (landing page, marketing, hero) */
font-family: 'Libre Baskerville', serif;

/* Financial / Numeric data */
font-family: 'SF Mono', 'Berkeley Mono', Consolas, 'Courier New', monospace;
font-variant-numeric: tabular-nums;
```

### Type Scale — App (Authenticated Product)

| Element | Size | Weight | Token |
|---|---|---|---|
| Page heading (H1) | 1.5rem / 24px | 600 | `text-2xl font-semibold` |
| Section heading (H2) | 1.125rem / 18px | 600 | `text-lg font-semibold` |
| Card heading (H3) | 0.9375rem / 15px | 600 | `text-[15px] font-semibold` |
| Label / UI text | 0.875rem / 14px | 500 | `text-sm font-medium` |
| Body / paragraph | 0.9375rem / 15px | 400 | `text-[15px]` |
| Caption / metadata | 0.8125rem / 13px | 400 | `text-[13px]` |
| Microcopy | 0.6875rem / 11px | 400 | `text-[11px]` |
| Section label (uppercase) | 0.6875rem / 11px | 600, UPPERCASE | `z-section-label` |
| KPI / Metric value | 1.625rem / 26px–28px | 600 | `text-[26px] font-semibold font-mono-financial` |

### Type Scale — Landing Page (Dark Marketing)

| Element | Size | Weight | Note |
|---|---|---|---|
| Hero H1 | 5rem–7rem (80–112px) | 700 | Libre Baskerville serif |
| Section H2 | 2.5rem–3.5rem (40–56px) | 700 | Libre Baskerville serif |
| Feature H3 | 1.125rem–1.375rem | 500–600 | Inter sans-serif |
| Body text | 1rem–1.125rem | 400 | Inter sans-serif |
| Nav / Labels | 0.875rem | 500 | Inter, slightly compact |
| Footer captions | 0.75rem | 400–500, UPPERCASE, mono | `font-mono uppercase tracking-wider` |

### Typography Rules

1. **App headings never exceed 24px** — we are a data tool, not a marketing page. Restraint is professional.
2. **All monetary values use `font-mono-financial`** — tabular numerals, no reflow.
3. **Section labels use the `z-section-label` class** — `11px, 600 weight, uppercase, tracked`.
4. **No bold on serif landing headings** — the size carries the visual weight.
5. **Letter-spacing on headings:** `-0.025em` for H1, `-0.01em` for H2. This is already in global CSS — do not override.
6. **Line height:** `1.25` for display headings, `1.6` for body copy.
7. **Never use `font-black` (900) or `font-extrabold` (800)** on anything except extreme decorative contexts on the landing page.

---

## 3. Layout & Grid

### Authenticated App Layout

- **Sidebar navigation** + **main content area** — standard app shell.
- Maximum content width within main: no explicit cap, fills available space with padding.
- Content padding: `px-6 py-6` (desktop), `px-4 py-4` (mobile).
- Cards and sections are separated by vertical spacing, not explicit dividers.

### Page Structure Pattern

Every authenticated page follows this structure:
```
Page Root (bg-[var(--z-bg-1)])
  └── Page Header
        └── H1 label (text-[var(--z-text-1)])
        └── Subtitle / description (text-[var(--z-text-3)])
        └── Action buttons (right-aligned)
  └── Metrics Strip (KPI tiles, top row)
  └── Primary Content Area
        └── Tables / Charts / Cards
  └── Secondary Panels (drawers, detail views)
```

### Landing Page Structure

Sections alternate deliberately between **full-bleed dark** and **full-bleed light**:
```
Hero          → Full-bleed dark  (#000 / zinc-950)
ProductShowcase → Full-bleed dark (inline content cards)
HowItWorks    → Full-bleed dark
AccuracySection → Full-bleed dark
SecuritySection → Full-bleed dark
Footer        → Full-bleed white (bg-white, text-zinc-900)
```

Content is contained within:
- Landing: `max-w-6xl mx-auto px-4` or `max-w-7xl mx-auto px-6`
- Auth app: Full available width within sidebar layout

### Grid Rules

- KPI top row: `grid-cols-2 md:grid-cols-4` (4 tiles)
- Feature cards: `grid-cols-1 md:grid-cols-2` or `grid-cols-1 md:grid-cols-3`
- Table layout: Full width, `z-table-wrap` for horizontal scroll on mobile
- **Never use more than 4 columns** in a data grid on the main surface
- Section dividers: `1px solid` hairline borders — `border-[var(--z-border-1)]`

---

## 4. Component Patterns

### Cards

Three tiers, each maps to a CSS class:

```
.z-card          → Standard card: white bg, 1px border, shadow-sm, hover elevates
.z-card-flat     → No shadow, no border, off-white bg (z-bg-1) — table rows, insets
.z-card-elevated → White bg, 1px border, shadow-md — modals, drawers, featured content
```

Rules:
- Border radius: `rounded-xl` (0.75rem) — consistent across all cards.
- Cards never use `box-shadow` that competes with the border. Use shadow OR border emphasis, not both heavily.
- Hover state: border darkens from `--z-border-1` → `--z-border-2`, shadow elevates one tier.
- No gradients inside cards. No colored card backgrounds unless it's a status state.

### Buttons

```
Primary (on light bg):
  bg-[var(--z-accent)] text-white
  hover:bg-[var(--z-accent-hover)]
  rounded-md px-4 py-2 text-sm font-medium

Primary (landing dark bg):
  bg-white text-zinc-900
  hover:bg-zinc-200
  rounded-full px-8 h-12

Secondary / Outline (light bg):
  bg-transparent border border-[var(--z-border-2)] text-[var(--z-text-1)]
  hover:bg-[var(--z-bg-2)]

Secondary (landing dark bg):
  bg-transparent border border-zinc-700 text-zinc-300
  hover:text-white hover:bg-white/10
  rounded-full

Destructive:
  bg-[var(--z-danger)] text-white
  hover:bg-red-700

Ghost / Icon-only:
  bg-transparent text-[var(--z-text-3)]
  hover:bg-[var(--z-bg-2)] hover:text-[var(--z-text-1)]
```

Rules:
- Landing page CTAs: always `rounded-full` (pill shape).
- App CTAs: always `rounded-md` (6–8px radius, matches `--radius`).
- **No gradient backgrounds on buttons.**
- **Never use a colored background button inside a table row** — use ghost or outline only.
- Arrow CTAs (`→ label`): inline arrow appended to link text — a Paradigm signature pattern.

### Tables

```
Structure:
  <table className="w-full text-sm">
    <thead>
      <tr className="border-b border-[var(--z-border-1)]">
        <th className="z-section-label text-left py-3 px-4">COLUMN</th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-[var(--z-border-1)] hover:bg-[var(--z-bg-2)]">
        <td className="py-3 px-4 text-[var(--z-text-1)]">Value</td>
      </tr>
    </tbody>
  </table>
```

Rules:
- Column headers: `z-section-label` — uppercase, 11px, 600 weight, `--z-text-3`.
- Row hover: `hover:bg-[var(--z-bg-2)]` — never use color hover on financial rows.
- Row dividers: `1px solid --z-border-1` — hairline only.
- Status columns: always include an icon. Colored dot + label text, never color-only.
- Numeric columns: right-aligned, `font-mono-financial`.
- Wrap all tables in `z-table-wrap` for mobile horizontal scroll.

### Status Badges / Pills

```
Matched / Success:
  bg-[var(--z-success-light)] text-[var(--z-success)]
  border border-[var(--z-success)]/20
  rounded-full text-[11px] font-semibold px-2 py-0.5

Discrepancy / Danger:
  bg-[var(--z-danger-light)] text-[var(--z-danger)]
  border border-[var(--z-danger)]/20

Pending / Warning:
  bg-[var(--z-warn-light)] text-[var(--z-warn)]
  border border-[var(--z-warn)]/20

Info / Neutral:
  bg-[var(--z-accent-light)] text-[var(--z-accent)]
  border border-[var(--z-accent-muted)]
```

Category/Filter pills (landing page, tag chips):
```
  outlined pill: border border-zinc-700 text-zinc-400 rounded-full px-3 py-1 text-xs
```

### Forms & Inputs

```
Input:
  border border-[var(--z-border-2)] rounded-md px-3 py-2
  text-sm text-[var(--z-text-1)] bg-[var(--z-bg-0)]
  placeholder:text-[var(--z-text-3)]
  focus:ring-2 focus:ring-[var(--z-accent)] focus:border-transparent
  transition-colors duration-150

Label:
  text-[12px] font-medium uppercase tracking-wide text-[var(--z-text-3)]
  (z-section-label class)

Select:
  Same as input + appearance-none with chevron icon overlay
```

Rules:
- **Never use underline-only inputs** (the Paradigm editorial style). In a financial app, boxed inputs with clear borders are mandatory for trust and clarity.
- Labels always above the input, never floating.
- Error state: `border-[var(--z-danger)]` + error message below in `text-[11px] text-[var(--z-danger)]`.
- Required fields do not use `*` asterisks — validate on submit and show inline errors.

### Navigation (Sidebar)

```
Sidebar background: bg-[var(--z-bg-0)] border-r border-[var(--z-border-1)]
Nav item default: text-[var(--z-text-3)] hover:text-[var(--z-text-1)] hover:bg-[var(--z-bg-2)]
Nav item active:  text-[var(--z-accent)] bg-[var(--z-accent-light)] font-medium
Nav section label: z-section-label — uppercase, spaced, muted
```

### Navigation (Landing)

```
Nav bar: fixed top-0, transparent → bg-zinc-950/80 backdrop-blur-md on scroll
Logo: font-serif font-bold text-xl text-white (wordmark only, no colored icon)
Nav links: text-zinc-400 hover:text-white text-sm font-medium
CTAs: Sign in (ghost) + Sign up (white pill button)
Mobile: hamburger icon → full-bleed dark overlay with stacked links
```

### KPI / Metric Tiles

See `KpiTile.jsx` and `SummaryCard.jsx` as the canonical reference.

Required anatomy of every KPI tile:
1. **Label** — `z-section-label`, uppercase
2. **Value** — `text-[26px]–[28px] font-semibold font-mono-financial text-[var(--z-text-1)]`
3. **Trend indicator** — icon + delta string, colored by direction
4. **Source** — `text-[11px] text-[var(--z-text-3)]` — what data feeds this number
5. **Last updated** — `text-[10px] text-[var(--z-text-3)] opacity-70`
6. **Disclosure trigger** — `?` icon that opens a panel explaining the formula

Never show a metric without its source attribution. This is a financial system — every number must be traceable.

### Loading States

- **Skeletons over spinners.** Use `animate-pulse` divs matching the shape of the content.
- Shimmer class: `shimmer` — uses `--z-bg-2` with `subtle-pulse` animation.
- Full-page loading: `LoadingScreen` component — already built.
- Never show raw `null` or `undefined`. Every async value has a loading skeleton.

### Empty States

Every table, list, and data surface must have an empty state. Pattern:
```
<div className="flex flex-col items-center justify-center py-16 text-center">
  <Icon className="w-10 h-10 text-[var(--z-text-3)] mb-4" />
  <p className="text-sm font-medium text-[var(--z-text-2)] mb-1">No [items] yet</p>
  <p className="text-[13px] text-[var(--z-text-3)]">Descriptive explanation of next action.</p>
  <Button variant="outline" className="mt-4">Primary CTA</Button>
</div>
```

### Error States

- Never expose raw Supabase/API error messages to the user.
- Map errors to human-readable, actionable messages.
- Error pattern within a card:
```
border-[var(--z-danger)]/30 bg-[var(--z-danger-light)]
text-[var(--z-danger)] text-sm
AlertTriangle icon + message + retry/dismiss button
```

---

## 5. Motion & Animation

### Principles

- **Motion must inform, not decorate.** Every animation must have a reason.
- Duration: `150ms` for micro-interactions (hover, focus), `200ms–300ms` for transitions, `400ms–500ms` for entrances.
- Easing: `ease-out` for entrances, `ease-in` for exits, `ease` for transitions.
- Never animate layout properties (width, height) on frequently re-rendered components.

### Approved Patterns

```
Hover transitions:    transition-colors duration-150
Card elevation:       transition: box-shadow 0.2s ease, border-color 0.2s ease
Page/section entrances: Framer Motion, from { opacity: 0, y: 20 } → { opacity: 1, y: 0 }
Landing hero text:    SplitText with GSAP, chars animate from { opacity: 0, y: 40 }
Scroll reveals:       ScrollReveal component (intersection observer)
Accordion:            tailwindcss-animate accordion-down/up (already in config)
```

### Prohibited

- No `bounce` or `elastic` easings.
- No persistent looping animations on financial data (except status dots like "System Operational").
- No entrance animations faster than 150ms (imperceptible) or slower than 600ms (feels broken).
- No parallax on the app shell — only acceptable on landing page hero.

---

## 6. Icons

- Icon library: **Lucide React** exclusively. No mixing of icon sets.
- Default size within UI: `w-4 h-4` (16px).
- Within icon containers (avatar-style): `w-4 h-4` inside a `w-9 h-9 rounded-lg` container.
- Nav icons: `w-5 h-5`.
- Status icons in tables: `w-3.5 h-3.5` inline with text.
- Empty state icons: `w-10 h-10`.
- Icons always inherit text color. Only set explicit icon color for semantic status signals.

---

## 7. Shadows

Zerithum shadows are deliberately restrained — almost imperceptible, used for depth cues only.

```
--z-shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.03)               → Barely there
--z-shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.06) ...           → Default card
--z-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.07) ...        → Hover card, dropdown
--z-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.08) ...      → Modal, drawer
```

Rules:
- **No `shadow-xl` or `shadow-2xl`** in the app shell — reserved for landing page dramatic moments.
- Never combine a heavy shadow with a colored border.
- Dropdowns and popovers: `shadow-md` + `border border-[var(--z-border-1)]`.

---

## 8. Spacing System

Follow Tailwind's default spacing scale. Critical conventions:

| Context | Spacing |
|---|---|
| Card internal padding | `p-5` (20px) |
| Table cell padding | `px-4 py-3` |
| Section gap (vertical) | `gap-6` or `space-y-6` |
| KPI tile grid gap | `gap-4` |
| Form field gap | `space-y-4` |
| Icon-to-label gap | `gap-2` or `gap-2.5` |
| Page horizontal padding | `px-6` (desktop), `px-4` (mobile) |
| Sidebar width | fixed (defined by layout component) |

---

## 9. Responsive Breakpoints

```
Mobile-first. Use Tailwind breakpoint prefixes:
  sm:   640px  — small mobile → landscape
  md:   768px  — tablet
  lg:   1024px — desktop
  xl:   1280px — wide desktop
```

Rules:
- The authenticated app sidebar collapses on mobile.
- Tables wrap with `z-table-wrap` — horizontal scroll, not column collapse.
- KPI grid: `grid-cols-2 md:grid-cols-4`.
- Landing sections: single column mobile → multi-column desktop.
- **Touch targets: minimum `min-h-[36px]`** on interactive elements for mobile. Inputs force `font-size: 16px` on mobile to prevent iOS auto-zoom.

---

## 10. Do Not Patterns

These are hard prohibitions. They will be corrected on sight.

| Anti-Pattern | Reason |
|---|---|
| Gradient button backgrounds | Feels promotional, not financial-grade |
| Colored card backgrounds (non-semantic) | Noise, not signal |
| Emoji in UI labels | Unprofessional in a financial context |
| Multiple font weights fighting on one surface | Destroys hierarchy |
| `text-xs` without `font-medium` | Too light, unreadable at small sizes |
| Placeholder text as label | Never acceptable — always use a real label |
| Toast for critical errors | Toasts are for low-stakes confirmations only — use inline error states |
| Shadow + heavy colored border on same element | Overcrowded depth |
| Hardcoded hex colors for structural palette | Breaks theming, brittle |
| Tailwind `gray-*` scale for text | Use `--z-text-*` tokens — they're semantically correct |
| Any animation on financial values during load | Use skeleton, not number roll-up |
| Rounded corners > `rounded-xl` (0.75rem) inside app | Landing page only may use `rounded-2xl` |
| `overflow-hidden` on entire page sections | Breaks sticky positioning and scroll behavior |
| `position: fixed` elements without `z-index` discipline | Creates stacking context chaos |

---

## 11. Zerithum-Specific Patterns

### Financial Number Rendering

```jsx
// Correct — always use integer cents, format at display layer
const formatCurrency = (cents) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
}).format(cents / 100);

// Correct class for all monetary values
className="font-mono-financial text-[var(--z-text-1)]"

// Never
className="font-mono text-gray-900"
```

### Platform Color Coding

Each revenue platform has a consistent accent. When referencing a platform visually:
- YouTube: `#FF0000` (red)
- Spotify: `#1DB954` (green)
- Patreon: `#FF424D` (coral)
- Stripe: `#635BFF` (purple)
- Twitch: `#9146FF` (purple)
- Default/Unknown: `--z-accent` (blue)

These are used only for small accent dots, icons, or border-left indicators — never as full backgrounds.

### Trust Signals — Required on Every Data Surface

Every page that displays financial data must include:
1. **Source attribution** — where the data comes from (platform + sync timestamp)
2. **Last updated timestamp** — human-readable (e.g., "Updated 2 hours ago")
3. **Status indicator** — is the data fresh, stale, or failed?
4. **Disclosure mechanism** — how the metric is calculated (DisclosurePanel `?` trigger)

These are non-negotiable. A number without a source is not trustworthy.

### Section Label Pattern

Section labels separate content groups. Use consistently:
```jsx
<p className="z-section-label mb-3">RECONCILIATION STATUS</p>
```

### Inline Metadata Row

Below tables and cards, attribution metadata:
```jsx
<div className="flex items-center gap-1.5 mt-3">
  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
  <span className="text-[11px] text-[var(--z-text-3)]">
    Synced from YouTube · Last updated 14 min ago
  </span>
</div>
```

---

## 12. File & Component Conventions

```
src/
  pages/           → Full-page route components. One file per route.
  components/
    dashboard/     → Dashboard-specific: KpiTile, SummaryCard, RevenueTrendChart
    transactions/  → TransactionsTable, FilterBar, BulkActionBar, RowDrawer
    expense/       → ExpensesTable, ExpenseModal, AddExpenseDialog
    autopsy/       → AnomalyList, EvidenceTable, AutopsyEventCard
    landing/       → HeroSection, Footer, ProductShowcase, SecuritySection
    platform/      → PlatformCard, SyncHistoryRow
    security/      → OTPVerification, DisconnectPlatformModal
    shared/        → Cross-cutting: SuccessConfetti, MotivationalQuote
    ui/            → Primitives: button, toast, label, chart (shadcn + custom)
  hooks/           → TanStack Query hooks, custom hooks
  lib/             → Auth, query-client, utils, performance, analytics
  utils/           → Pure utility functions (csvExport, etc.)
```

Component naming:
- PascalCase for all components
- Descriptive: `KpiTile`, not `Card` — `FilterBar`, not `Bar`
- Suffix `-Row` for table row components
- Suffix `-Modal` for overlays requiring backdrop
- Suffix `-Drawer` for slide-in panels
- Suffix `-Panel` for collapsible/expandable sections

---

*This style guide is a living document. When adding new components, validate against Section 10 (Do Not Patterns) before committing.*
