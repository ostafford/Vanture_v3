9. Development Phases

**Phase 2 (Onboarding & Sync)** has been audited and marked complete; see [Phase2_Checklist.md](Phase2_Checklist.md) for requirement-to-implementation mapping and [README.md](../README.md) for a short summary.

**Phase 3 (Core Features)** has been audited and marked complete; see [Phase3_Checklist.md](Phase3_Checklist.md) for requirement-to-implementation mapping and [README.md](../README.md) for a short summary. Post-audit refinements (2025-02-16): Savers goals persist across sync/refresh; Spendable and Reserved update live when upcoming charges change — see Phase3_Checklist.md.

**Phase 4 (Transactions & Filtering)** has been audited and marked complete; see [Phase4_Checklist.md](Phase4_Checklist.md) for requirement-to-implementation mapping and [README.md](../README.md) for a short summary.

**Phase 5 (Polish & Testing)** has been audited and marked complete (audit 2025-02-16: 28/28 requirements verified, 100% accuracy); see [Phase5_Checklist.md](Phase5_Checklist.md) for requirement-to-implementation mapping and [README.md](../README.md) for a short summary.

**Phase 6 (Deployment)** has been audited and marked complete; see [Phase6_Checklist.md](Phase6_Checklist.md) for requirement-to-implementation mapping and [README.md](../README.md) for a short summary.

**Phase 7 (Settings completion)** has been audited and marked complete; see [Phase7_Checklist.md](Phase7_Checklist.md) for requirement-to-implementation mapping.

Phase 1: Foundation (Week 1-2)

✅ Setup Vite + React + Bootstrap project
✅ Implement SQLite (sql.js) with IndexedDB persistence (load DB from IndexedDB on startup; persist DB to IndexedDB after writes)
✅ Create database schema and initialization
✅ Setup Zustand state management
✅ Implement theme toggle (dark/light)
✅ Create basic layout (sidebar, navbar, main content)

Phase 2: Onboarding & Sync (Week 3-4) — **Complete**

✅ Build onboarding wizard (6 steps) — `src/pages/Onboarding.tsx` (steps 1–6, STEPS=6)
✅ Passphrase creation, API token validation, and passphrase-derived encryption (token encrypted with key from passphrase; passphrase never stored) — `Onboarding.tsx` (steps 2–3), `src/lib/crypto.ts`, `src/api/upBank.ts` (validateUpBankToken), `src/stores/sessionStore.ts` (token in memory only)
✅ Unlock (passphrase) flow on app open — `src/pages/Unlock.tsx`; gated in `src/App.tsx` when onboarding complete and session not unlocked
✅ Initial sync with progress bar — `src/services/sync.ts` (performInitialSync), progress UI in `Onboarding.tsx` step 5
✅ Subsequent sync (incremental) — `src/services/sync.ts` (performSync), `src/layout/Navbar.tsx` (Sync button, last synced label, error display)
✅ Up Bank API integration (accounts, transactions, categories) — `src/api/upBank.ts` (fetchAccounts, fetchAllTransactions, fetchCategories); cursor pagination, 1s delay, 429 handling

Phase 3: Core Features (Week 5-7) — **Complete**

✅ Dashboard layout (3-column) — `src/pages/Dashboard.tsx` (SaversSection, InsightsSection, TrackersSection in Row); `src/components/BalanceCard.tsx`; `src/layout/Navbar.tsx`
✅ Spendable balance calculation (with prorated upcoming) — `src/services/balance.ts` (calculateReservedAmount, getReservedAmount, getSpendableBalance per 05_Calculation_logic 5.2); BalanceCard
✅ Trackers (create, edit, multi-category) — `src/services/trackers.ts`, `src/components/dashboard/TrackersSection.tsx`; progress, days left, transaction list; `sync.ts` recalculateTrackers
✅ Savers (list, progress, goal tracking) — `src/services/savers.ts`, `src/components/dashboard/SaversSection.tsx`; user-defined goals via updateSaverGoals
✅ Weekly insights — `src/services/insights.ts` (getWeekRange, getWeeklyInsights, getWeeklyCategoryBreakdown), `src/components/dashboard/InsightsSection.tsx`
✅ Upcoming transactions (manual entry) — `src/services/upcoming.ts`, `src/components/dashboard/UpcomingSection.tsx`; grouped Next pay / Later, reserved amount

Phase 4: Transactions & Filtering (Week 8) — **Complete**

✅ Transaction list page — `src/pages/Transactions.tsx`, route `/transactions`, `src/layout/Sidebar.tsx`
✅ Filters (date, category, amount, search) — `src/services/transactions.ts` (getFilteredTransactions, buildWhereClause), URL search params
✅ Round-up display (linked to parent) — getRoundUpsByParentIds, DateGroup in Transactions.tsx; sync leaves round_up_parent_id null (API does not provide)
✅ Transaction grouping by date — getTransactionsGroupedByDate, DateGroup
✅ Sorting (Date, Amount, Merchant) — TransactionSort, orderByClause, sort dropdown in Transactions.tsx

Phase 5: Polish & Testing (Week 9-10) — **Complete**

✅ Responsive design (13"-27" screens) — Layout.tsx viewport auto-collapse; 07_UI_UX_Design.md 7.2.1; index.css
✅ Error handling and edge cases — ErrorBoundary, DB init + persist banner, empty states, invalid filter handling
✅ Loading states and skeletons — Navbar sync spinner; app boot placeholder; see Phase5_Checklist.md
✅ Performance optimization (large transaction sets) — Transactions pagination (50/page, Load more); idx_transactions_round_up_parent_id; sql.js evaluation in 02_Technical_Stack
✅ PWA setup (service worker, installable) — vite-plugin-pwa, manifest, index.html meta; README GitHub Pages base

Phase 6: Deployment (Week 11) — **Complete**

**Phase 6** has been audited and marked complete; see [Phase6_Checklist.md](Phase6_Checklist.md) for requirement-to-implementation mapping and [README.md](../README.md) for a short summary.

✅ Build production bundle — `package.json` build script; `vite.config.ts` base: '/Vanture_v3/'; post-build 404.html copy
✅ Deploy to GitHub Pages — `.github/workflows/deploy.yml`; Settings > Pages > Source: "GitHub Actions"
✅ Documentation (README, setup guide) — README Deployment, Setup, Phase 6; [Phase6_Checklist.md](Phase6_Checklist.md), [Phase6_User_Testing_Checklist.md](Phase6_User_Testing_Checklist.md)
✅ User testing with real Up Bank accounts — [Phase6_User_Testing_Checklist.md](Phase6_User_Testing_Checklist.md)

Phase 7: Settings Completion — **Complete**

**Phase 7** has been audited and marked complete; see [Phase7_Checklist.md](Phase7_Checklist.md) for requirement-to-implementation mapping.

✅ Clear all data — Settings page "Clear all data" with confirmation modal; `src/db/index.ts` `closeDb()`, `deleteDatabase()`; session lock + reload to Onboarding
✅ Re-sync — Settings "Re-sync now" button; same incremental sync as Navbar; Last synced and error state
✅ Settings UI — Data section (Card) with Re-sync and Clear all data; React-Bootstrap Modal for destructive confirm
✅ Documentation — [Phase7_Checklist.md](Phase7_Checklist.md); 08_Security.md implementation ref for clear-all-data

Phase 9: API Token Management — **Complete**

**Phase 9** has been implemented; see [Phase9_Checklist.md](Phase9_Checklist.md) for requirement-to-implementation mapping.

✅ Update API token in Settings — Passphrase + new token; verify passphrase (decrypt current token), validate new token with Up Bank, re-encrypt and replace stored token only; no data loss (`src/pages/Settings.tsx`: API token section, Update API token modal and submit flow)
✅ 401 from Up Bank surfaced with guidance — `src/api/upBank.ts` `UpBankUnauthorizedError` and `SYNC_401_MESSAGE`; Settings and Navbar sync show "Your API token may have expired. Update it in Settings." when sync fails with 401
✅ Documentation — [Phase9_Checklist.md](Phase9_Checklist.md); 08_Security.md subsection for Update API token

Phase 10: Dark theme card and surface fix — **Complete**

**Phase 10** has been implemented; see [Phase10_Checklist.md](Phase10_Checklist.md) for requirement-to-implementation mapping. Cards, modals, and form controls now use theme surface tokens so dark mode shows consistent dark backgrounds; see Phase10_Checklist.md for what, why, and how.

✅ Cards and card headers use --vantura-surface in both themes — `src/index.css`: .card and .card .card-header; Savers, Trackers, Insights, Upcoming, Settings, Transactions cards now dark in dark mode
✅ Modals use theme surface and borders — `src/index.css`: .modal-content, .modal-header, .modal-footer
✅ Dashboard tooltips/surfaces theme-aware — `src/index.css`: .bg-surface utility; `src/components/dashboard/SaversSection.tsx`: chart tooltip uses .bg-surface
✅ .text-muted and form controls use theme variables — `src/index.css`: .text-muted, .form-control, .form-select
✅ Documentation — [Phase10_Checklist.md](Phase10_Checklist.md); 09_Development_Phases.md Phase 10 subsection

Phase 11: Chart UI — Translucent backgrounds and gradient flow — **Complete**

**Phase 11** has been implemented; see [Phase11_Checklist.md](Phase11_Checklist.md) for requirement-to-implementation mapping. Savers and Weekly Insights bar charts now use translucent fills (fillOpacity) and stroke for definition, aligned with Purple React chart-js style and the BalanceCard gradient flow.

✅ Chart opacity token — `src/index.css`: --vantura-chart-opacity: 0.3
✅ Savers bar chart: translucent Saved and Remaining — `src/components/dashboard/SaversSection.tsx`: fillOpacity, stroke, strokeWidth on Bar components
✅ Weekly Insights bar chart: gradient palette, translucent — `src/components/dashboard/InsightsSection.tsx`: CHART_PALETTE (#da8cff, #b66dff, #9a55ff), fill/stroke functions, fillOpacity
✅ Theme-aware (light and dark) — Uses var(--vantura-primary), var(--vantura-border)
✅ Documentation — [Phase11_Checklist.md](Phase11_Checklist.md); 09_Development_Phases.md Phase 11 subsection
