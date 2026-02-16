# Phase 12: User-Selectable Accent Color — Audit Checklist

**Status:** Phase 12 implemented. All requirements below are implemented; see the Implementation column for file references.

Source: [09_Development_Phases.md](09_Development_Phases.md), Phase 12 plan.

## What changed, why, and how

**What:** Users can choose an accent color from a predefined list (Purple, Blue, Teal, Green, Amber, Rose) in Settings. The choice persists across lock and reload. The accent affects `--vantura-primary`, `--vantura-primary-gradient`, `--vantura-sidebar-active-color` and all UI that uses them: BalanceCard, Sync button, charts, sidebar active state, Bootstrap primary overrides.

**Why:** User feedback requested the ability to customize the accent color; default remains purple for consistency with the Purple React design.

**How:**

- **accentPalettes.ts:** Defines `AccentId` and `ACCENT_PALETTES` with primary, gradient, and chart palette for each color.
- **accentStore.ts:** Zustand store with `accent`, `hydrateFromDb`, `setAccent`; persists to `app_settings.accent_color`.
- **App.tsx:** Calls `accentStore.hydrateFromDb()` during boot; subscribes to accent and sets `document.documentElement.setAttribute('data-accent', accent)`.
- **index.css:** Added `[data-accent='X']` blocks for each color overriding --vantura-primary, --vantura-primary-gradient, --vantura-sidebar-active-color; replaced hardcoded #9a55ff in .btn-primary:hover with var(--vantura-primary).
- **Settings.tsx:** New Appearance card with row of color swatches; click to select, persists via accentStore.setAccent.
- **InsightsSection.tsx:** Uses `ACCENT_PALETTES[accent].chartPalette` for chart bar colors instead of hardcoded purple palette.

## Phase 12 Requirements

| # | Requirement | Status | Implementation |
|---|-------------|--------|----------------|
| P12-1 | Accent palette config with 6 colors | OK | `src/lib/accentPalettes.ts` |
| P12-2 | Accent store with persist and hydrate | OK | `src/stores/accentStore.ts` |
| P12-3 | data-accent applied on document, boot and on change | OK | `src/App.tsx` |
| P12-4 | CSS overrides for each accent | OK | `src/index.css` [data-accent='X'] blocks |
| P12-5 | Settings Appearance section with color swatches | OK | `src/pages/Settings.tsx` |
| P12-6 | Charts use accent palette | OK | `src/components/dashboard/InsightsSection.tsx`; SaversSection uses var(--vantura-primary) |
| P12-7 | Default purple; persists across lock/reload | OK | accentStore default; app_settings.accent_color |
| P12-8 | Documentation | OK | This file; 09_Development_Phases.md; 03_Database_Schema.md |

## Documentation

| # | Requirement | Status | Implementation |
|---|-------------|--------|----------------|
| DOC1 | Phase12_Checklist.md | OK | This file |
| DOC2 | 09_Development_Phases.md Phase 12 | OK | Phase 12 subsection with bullets and link to Phase12_Checklist.md |
| DOC3 | 03_Database_Schema.md accent_color key | OK | app_settings keys list |
