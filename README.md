# Vanture (Vantura)

Desktop-first financial insights app that syncs with Up Bank. Data is stored locally; nothing leaves your device.

## Phase 2: Onboarding & Sync — Implemented

Phase 2 (Onboarding & Sync) is complete and verified. Implemented behaviour:

- **Onboarding wizard (6 steps):** Welcome, passphrase creation, API token (validated and encrypted), payday schedule, initial sync with progress bar, completion. Implemented in `src/pages/Onboarding.tsx`.
- **Encryption & unlock:** API token is encrypted with a key derived from your passphrase (Web Crypto: PBKDF2 100k iterations, AES-GCM 256-bit). Passphrase is never stored. On each app open you see an Unlock screen until you enter the passphrase. See `src/lib/crypto.ts`, `src/pages/Unlock.tsx`, and [Arch_Docs/08_Security.md](Arch_Docs/08_Security.md).
- **Sync:** Initial sync (accounts, transactions, categories, savers) and subsequent incremental sync (since last sync), triggered from the navbar Sync button. Up Bank API integration with cursor-based pagination and rate limiting. See `src/services/sync.ts`, `src/api/upBank.ts`, and [Arch_Docs/06_Sync_Strategy.md](Arch_Docs/06_Sync_Strategy.md).

Detailed Phase 2 requirements and implementation references: [Arch_Docs/09_Development_Phases.md](Arch_Docs/09_Development_Phases.md) (Phase 2 section), [Arch_Docs/Phase2_Checklist.md](Arch_Docs/Phase2_Checklist.md).

## Phase 3: Core Features — Implemented

Phase 3 (Core Features) is complete and verified. Implemented behaviour:

- **Dashboard (3-column):** Left: Savers; Center: Weekly insights; Right: Trackers; Upcoming transactions below. Balance card (Available, Spendable with prorated reserved amount) above; Sync, Last synced, Lock, Theme in navbar.
- **Spendable balance:** Available minus reserved for upcoming charges. Reserved amount uses prorated logic per [Arch_Docs/05_Calculation_logic.md](Arch_Docs/05_Calculation_logic.md) (charges before next payday; monthly/quarterly/yearly prorated). See `src/services/balance.ts`, `src/components/BalanceCard.tsx`.
- **Trackers:** Create and edit trackers with name, budget, reset frequency (Weekly/Fortnightly/Monthly/Payday), multi-category selection. Progress bar, days left, list of transactions in period. See `src/services/trackers.ts`, `src/components/dashboard/TrackersSection.tsx`.
- **Savers:** List saver accounts, balance vs goal, progress bars, user-defined goal amount, target date, monthly transfer. See `src/services/savers.ts`, `src/components/dashboard/SaversSection.tsx`.
- **Weekly insights:** Money In, Money Out, Changes in Savers, Charges count, Payments made; category breakdown with bars. See `src/services/insights.ts`, `src/components/dashboard/InsightsSection.tsx`.
- **Upcoming charges:** Manual entry with name, amount, frequency, next charge date, category, "Include in Spendable". Grouped by Next pay / Later; reserved amount shown. See `src/services/upcoming.ts`, `src/components/dashboard/UpcomingSection.tsx`.

Detailed Phase 3 requirements and implementation references: [Arch_Docs/09_Development_Phases.md](Arch_Docs/09_Development_Phases.md) (Phase 3 section), [Arch_Docs/Phase3_Checklist.md](Arch_Docs/Phase3_Checklist.md).

## Phase 4: Transactions & Filtering — Implemented

Phase 4 (Transactions & Filtering) is complete and verified. Implemented behaviour:

- **Transaction list page:** Full history at `/transactions` with filters, sort, and date grouping. See `src/pages/Transactions.tsx`.
- **Filters:** Date range (from/to), category, amount range (min/max), and search (description/raw text). Filters sync to URL search params.
- **Sorting:** Date (newest first), Amount, or Merchant. See `src/services/transactions.ts` (`orderByClause`).
- **Grouped by date:** Transactions grouped by settlement date with `formatShortDate` headers.
- **Round-ups linked to parent:** When `round_up_parent_id` is set (Up API does not currently provide this), round-ups display under the parent as "Round-up +$X → Account". When null, round-ups appear as standalone rows. See `getRoundUpsByParentIds`, `DateGroup` in Transactions.tsx.

Detailed Phase 4 requirements and implementation references: [Arch_Docs/09_Development_Phases.md](Arch_Docs/09_Development_Phases.md) (Phase 4 section), [Arch_Docs/Phase4_Checklist.md](Arch_Docs/Phase4_Checklist.md).

## Phase 5: Polish & Testing — Complete

Phase 5 (Polish & Testing) is complete. Independent audit (2025-02-16): 28/28 requirements verified in code; 100% accuracy. Implemented behaviour:

- **Responsive (13"-27"):** Viewport targets documented; main content max-width 1400px; sidebar auto-collapses below 1280px. See [Arch_Docs/07_UI_UX_Design.md](Arch_Docs/07_UI_UX_Design.md) 7.2.1, `src/layout/Layout.tsx`, `src/index.css`.
- **Error handling:** Top-level Error Boundary (`src/components/ErrorBoundary.tsx`); DB init failure shows "Could not load app storage" with retry; IndexedDB persist/quota failure shows dismissible banner. Empty states for savers, trackers, upcoming, transactions; invalid date/amount filters normalized. See [Arch_Docs/08_Security.md](Arch_Docs/08_Security.md), `src/stores/persistErrorStore.ts`, `src/layout/Layout.tsx`.
- **Loading states:** Sync button shows spinner and "Syncing…" while syncing; app boot uses placeholder skeleton and "Loading...". See `src/layout/Navbar.tsx`, `src/App.tsx`.
- **Performance:** Transactions list paginated (50 per page, "Load more"); index on `round_up_parent_id`; sql.js remains on main thread (evaluated sufficient for 13"-27" target). See `src/services/transactions.ts`, [Arch_Docs/02_Technical_Stack.md](Arch_Docs/02_Technical_Stack.md), [Arch_Docs/04_Core_Features.md](Arch_Docs/04_Core_Features.md) 4.7.
- **PWA:** Service worker via `vite-plugin-pwa` (Workbox); web app manifest (name, theme_color, display standalone); installable when served over HTTPS. For GitHub Pages, set Vite `base` to your repo path (e.g. `base: '/Vanture_v3/'`) if the app is not at the root. See `vite.config.ts`, `index.html` (theme-color, apple-mobile-web-app meta).

Detailed Phase 5 requirements and implementation references: [Arch_Docs/09_Development_Phases.md](Arch_Docs/09_Development_Phases.md) (Phase 5 section), [Arch_Docs/Phase5_Checklist.md](Arch_Docs/Phase5_Checklist.md).

## Phase 6: Deployment — Implemented

Phase 6 (Deployment) is complete. Implemented behaviour:

- **Production build:** `npm run build` outputs to `dist/` with base `/Vanture_v3/` for GitHub Pages repo-path deployment. Post-build: `dist/index.html` copied to `dist/404.html` for SPA routing on GitHub Pages.
- **GitHub Pages:** GitHub Actions workflow at `.github/workflows/deploy.yml` runs on push to `main`; deploys to `https://<owner>.github.io/Vanture_v3/`. Enable Pages in Settings > Pages > Source: "GitHub Actions".
- **Documentation:** README Deployment and Setup sections; [Arch_Docs/Phase6_Checklist.md](Arch_Docs/Phase6_Checklist.md), [Arch_Docs/Phase6_User_Testing_Checklist.md](Arch_Docs/Phase6_User_Testing_Checklist.md).

Detailed Phase 6 requirements: [Arch_Docs/09_Development_Phases.md](Arch_Docs/09_Development_Phases.md) (Phase 6 section), [Arch_Docs/Phase6_Checklist.md](Arch_Docs/Phase6_Checklist.md).

## Documentation

- [Arch_Docs/01_Overview.md](Arch_Docs/01_Overview.md) — Product overview
- [Arch_Docs/09_Development_Phases.md](Arch_Docs/09_Development_Phases.md) — Development phases and completion status
- [Arch_Docs/06_Sync_Strategy.md](Arch_Docs/06_Sync_Strategy.md) — Sync flows and Up Bank API
- [Arch_Docs/08_Security.md](Arch_Docs/08_Security.md) — Token storage and encryption
- [Arch_Docs/07_UI_UX_Design.md](Arch_Docs/07_UI_UX_Design.md) — Theme, layout, onboarding wizard

## Setup

**Requirements:** Node.js 18+.

```bash
npm install
npm run dev
```

**Build:** `npm run build`.

**Up Bank Personal Access Token:** Create in Up app > Profile > Data sharing > Personal access tokens. You will enter this during onboarding (step 3); it is validated, encrypted with a key derived from your passphrase, and stored locally. Your passphrase is never stored.

**First run:** Onboarding walks through passphrase creation, API token, payday schedule, and initial sync. After onboarding, you see an Unlock screen on each app open until you enter your passphrase.

**Troubleshooting:**

- "Could not load app storage" — IndexedDB failed to initialise; try another browser, clear site data and retry, or check storage quota.
- Sync errors — Verify API token is valid and has required scopes; Up API rate limit (~60/min) may apply; wait a minute and retry.
- Invalid token — Re-onboard: clear site data and start again (passphrase cannot be recovered if forgotten).

## Deployment

**GitHub Pages:** Enable Pages in repo Settings > Pages > Build and deployment > Source: "GitHub Actions". Push to `main` to trigger deploy. Live site: `https://<owner>.github.io/Vanture_v3/`.

**Custom domain at root:** Set `base: '/'` in `vite.config.ts` if deploying to a custom domain at root.

**Local preview:** `npm run preview` (serves at `/`; use `npm run preview -- --base /Vanture_v3/` to mimic production base path).
