# Phase 10: Dark theme card and surface fix — Audit Checklist

**Status:** Phase 10 implemented. All requirements below are implemented; see the Implementation column for file references.

Source: [09_Development_Phases.md](09_Development_Phases.md), Phase 10 plan.

## What changed, why, and how

**What:** Cards (Savers, Trackers, Insights, Upcoming, Settings, Transactions), modals (all app modals), form controls (inputs/selects), muted text (`.text-muted`), and the Savers chart tooltip now use theme CSS variables (`--vantura-surface`, `--vantura-text`, `--vantura-text-secondary`, `--vantura-border`) so they follow the active theme.

**Why:** The theme toggle and dark design tokens (Phase 8) were already applied to the page background, sidebar, and navbar. Bootstrap's Card and Modal components (and one hardcoded `bg-white` in the Savers tooltip) were never overridden to use those tokens, so in dark mode those surfaces stayed white and did not match the Purple React dark reference (dark purple page, dark card/panel backgrounds, white/grey text).

**How:**

- **index.css:** Extended the Phase 8 card block so `.card` and `.card .card-header` set `background-color: var(--vantura-surface)` and `color: var(--vantura-text)` (and header `border-color: var(--vantura-border)`). Added a "Phase 10: Dark theme modal and surfaces" block: `.modal-content`, `.modal-header`, `.modal-footer` for theme surface/borders; `.text-muted` to `var(--vantura-text-secondary)`; `.form-control` and `.form-select` to theme background/border/text; `.bg-surface` utility for reusable theme-aware surfaces.
- **SaversSection.tsx:** Replaced the chart tooltip content's `bg-white` class with `bg-surface` so the tooltip panel uses the theme surface instead of a fixed white background.

## Phase 10 Requirements

| # | Requirement | Status | Implementation |
|---|-------------|--------|----------------|
| P10-1 | Cards use --vantura-surface and --vantura-text in both themes | OK | `src/index.css`: .card and .card .card-header background-color, color; Phase 10 comment in card block |
| P10-2 | Modals use --vantura-surface and theme-aware borders/text | OK | `src/index.css`: .modal-content, .modal-header, .modal-footer under "Phase 10: Dark theme modal and surfaces" |
| P10-3 | No hardcoded light surfaces in dashboard components | OK | `src/components/dashboard/SaversSection.tsx`: tooltip content uses .bg-surface instead of .bg-white |
| P10-4 | .text-muted and form controls theme-aware | OK | `src/index.css`: .text-muted, .form-control, .form-select use --vantura-text-secondary / --vantura-surface / --vantura-border / --vantura-text |
| P10-5 | Documentation | OK | This file; 09_Development_Phases.md Phase 10 subsection |

## Documentation

| # | Requirement | Status | Implementation |
|---|-------------|--------|----------------|
| DOC1 | Phase10_Checklist.md | OK | This file |
| DOC2 | 09_Development_Phases.md Phase 10 | OK | Phase 10 subsection with bullets and link to Phase10_Checklist.md |
