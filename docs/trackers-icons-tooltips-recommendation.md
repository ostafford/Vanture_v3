# Trackers header: Icons + tooltips recommendation (detailed plan)

## Overview

Use **chevron icons** (e.g. ‹ › or ← →) for Previous/Next at **all viewport widths**, with **tooltips** ("Previous period", "Next period") for meaning. This removes the 900px label swap, keeps one consistent layout rule, and matches patterns used in calendar, banking, and dashboard apps.

---

## Why this recommendation

### 1. Eliminates the 900px label swap

**Current behaviour:** At 769–900px the buttons show `<` and `>`; above 900px they show "Previous" and "Next". Resizing across 900px changes only the labels, which users reported as confusing and inconsistent.

**With icons + tooltips:** The same icon is shown at every width. No second breakpoint and no label change on resize. Layout and controls stay visually stable.

### 2. Single, predictable layout rule

**Current:** Two breakpoints (768px layout, 900px labels) create three bands (≤768, 769–900, >900) and two different label sets.

**With icons + tooltips:** One rule: "period nav is always icon + tooltip." Layout can still switch at 768px (e.g. two-row on mobile), but the **controls themselves** (icon, tooltip, order) do not change. Fewer mental models for users and less branching in code.

### 3. Accessibility and clarity

- **Tooltips** provide the same meaning as the current text labels ("Previous period", "Next period") for hover/focus.
- **aria-label** already exists on the buttons; it should match the tooltip text so screen readers get a consistent, descriptive name.
- Icons are a compact, language-neutral cue; tooltips and aria-labels carry the full meaning. This is the same pattern as the existing "Add" button (plus icon + "Add tracker" tooltip).

### 4. Alignment with existing Add button

The Trackers header already uses **icon + tooltip** for Add (plus icon, tooltip "Add tracker"). Using the same pattern for Previous/Next makes the header consistent: all three actions are icon + tooltip, with no mix of text-vs-icon that changes by width.

### 5. Industry and product patterns

- **Calendar / agenda:** Google Calendar, Outlook, Apple Calendar use chevrons (‹ › or ← →) for previous/next period; tooltips or visible labels like "Previous month" appear on hover or in the bar. Same control set across desktop and mobile.
- **Banking / spending:** Many bank and budgeting apps use icon-only period navigation in headers with tooltips or a single "December 2024" style label; the nav stays compact and stable when the window is resized.
- **Dashboards and data tools:** Tableau, Metabase, and similar use icon nav for time/period with tooltips. One layout and one representation of the control across breakpoints.

Common thread: **one visual representation (icon) + tooltip for explanation**, rather than switching between text and symbol at different widths.

---

## What changes (implementation outline)

### Code

1. **TrackersSection.tsx**
   - Remove dependency on `TRACKER_COMPACT_NAV_MEDIA_QUERY` and `useCompactNav`.
   - For both mobile and desktop branches, render **only** icon buttons for Previous/Next (e.g. `mdi-chevron-left` / `mdi-chevron-right` or `mdi-arrow-left` / `mdi-arrow-right` from the existing MDI set).
   - Wrap each button in `OverlayTrigger` with a `Tooltip`: "Previous period" and "Next period".
   - Keep existing `aria-label="Previous period"` and `aria-label="Next period"` (or align with tooltip text).
   - Keep click handlers and `disabled` logic unchanged.

2. **constants.ts**
   - Option A: Remove `TRACKER_COMPACT_NAV_MAX_PX` and `TRACKER_COMPACT_NAV_MEDIA_QUERY` if no other code uses them (grep first).
   - Option B: Leave constants in place but unused until a later cleanup; TrackersSection simply stops using them.

3. **Imports**
   - In TrackersSection, remove `TRACKER_COMPACT_NAV_MEDIA_QUERY` and `useCompactNav` usage; keep `OverlayTrigger` and `Tooltip` (already used for Add).

### Behaviour after change

- **≤768px (mobile):** Two-row layout unchanged. Row 2: two icon buttons (‹ ›) with tooltips "Previous period" / "Next period". No "Previous"/"Next" text.
- **>768px (desktop):** Single row unchanged. Right side: icon Previous, icon Next, Add (icon). All three icon + tooltip. No 900px switch.

Result: one representation for period nav at every width; no label swap; same information via tooltips and aria-labels.

---

## Icon choice

- **Chevrons:** `mdi-chevron-left`, `mdi-chevron-right` — strong convention for "previous/next" in calendars and lists.
- **Arrows:** `mdi-arrow-left`, `mdi-arrow-right` — also common and clear.

Recommend **chevrons** to match calendar/period semantics and to differentiate from "back" navigation (often arrows). Use the same icon set (MDI) already used for the chart icon and Add plus.

---

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Users miss that icons are clickable | Buttons keep same size/variant (outline-secondary, sm). Tooltip on hover/focus clarifies. |
| Touch: no hover for tooltip | aria-label is announced by screen readers; on first tap the action still works. Optional: show short "Previous period" on long-press or use a visible label only on the smallest breakpoint if testing shows confusion. |
| Visual similarity to other icons | Chevrons are distinct from Add (plus). Order (Previous, Next, Add) and grouping (nav group vs Add) stay the same. |

---

## Summary

- **Recommendation:** Period nav as **icons + tooltips** at all widths; remove the 900px compact-nav text/symbol swap.
- **Why:** Consistent behaviour on resize, one layout rule for the controls, matches Add and common patterns (calendars, banking, dashboards), preserves accessibility via tooltips and aria-labels.
- **Scope:** TrackersSection + optional removal of `TRACKER_COMPACT_NAV_*` constants; no change to period logic or other sections.
