# Phase 11: Chart UI — Translucent Backgrounds and Gradient Flow — Audit Checklist

**Status:** Phase 11 implemented. All requirements below are implemented; see the Implementation column for file references.

Source: [09_Development_Phases.md](09_Development_Phases.md), Phase 11 plan.

## What changed, why, and how

**What:** Savers and Weekly Insights bar charts now use translucent fills (via `fillOpacity`) and optional stroke for definition, aligned with the Purple React chart-js reference. Weekly Insights uses a 3-color gradient palette; Savers uses theme tokens for Saved and Remaining segments.

**Why:** The charts previously used solid purple (`var(--vantura-primary)`) only. The BalanceCard uses a gradient (`linear-gradient(to right, #da8cff, #9a55ff)`), and the user wanted the charts to continue that flow with translucent bars like the Purple React reference.

**How:**

- **index.css:** Added `--vantura-chart-opacity: 0.3` in both light and dark theme blocks as a single source of truth for chart translucency.
- **InsightsSection.tsx:** Added `CHART_PALETTE` constant (`#da8cff`, `#b66dff`, `#9a55ff`); chartData includes `fill` and `stroke` per entry (cycling through palette); Bar uses `fillOpacity={0.3}` and `strokeWidth={1}`.
- **SaversSection.tsx:** Saved Bar uses `fill="var(--vantura-primary)"`, `fillOpacity={0.3}`, `stroke="var(--vantura-primary)"`, `strokeWidth={1}`; Remaining Bar uses `fill="var(--vantura-border)"`, `fillOpacity={0.5}`, `stroke="var(--vantura-border)"`, `strokeWidth={1}`.

## Phase 11 Requirements

| # | Requirement | Status | Implementation |
|---|-------------|--------|----------------|
| P11-1 | Chart opacity token in CSS | OK | `src/index.css`: --vantura-chart-opacity: 0.3 in light and dark blocks |
| P11-2 | Savers bar chart: translucent Saved and Remaining | OK | `src/components/dashboard/SaversSection.tsx`: Bar fillOpacity, stroke, strokeWidth |
| P11-3 | Weekly Insights bar chart: gradient palette, translucent | OK | `src/components/dashboard/InsightsSection.tsx`: CHART_PALETTE, fill/stroke functions, fillOpacity |
| P11-4 | Theme-aware (light and dark) | OK | Uses var(--vantura-primary), var(--vantura-border) which are theme tokens |
| P11-5 | Documentation | OK | This file; 09_Development_Phases.md Phase 11 subsection |

## Documentation

| # | Requirement | Status | Implementation |
|---|-------------|--------|----------------|
| DOC1 | Phase11_Checklist.md | OK | This file |
| DOC2 | 09_Development_Phases.md Phase 11 | OK | Phase 11 subsection with bullets and link to Phase11_Checklist.md |
