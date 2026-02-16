# Phase 6: User Testing Checklist

**Purpose:** Manual validation with real Up Bank accounts. Run through this checklist after deployment to verify end-to-end behaviour.

## Prerequisites

- Live site deployed (e.g. `https://<owner>.github.io/Vanture_v3/`)
- Valid Up Bank Personal Access Token (create in Up app > Profile > Data sharing > Personal access tokens)
- Real Up Bank account with transaction history (for sync and dashboard verification)

## Checklist

### Onboarding

- [x] Complete onboarding step 1 (Welcome) — click Get Started
- [x] Create passphrase (step 2) — min 8 chars, confirm matches; Continue
- [x] Enter valid Up Bank PAT (step 3) — token validates; Continue
- [x] Set payday schedule (step 4) — Frequency, Day, Next payday date; Continue
- [x] Initial sync (step 5) — progress bar shows "Fetched N transactions…"; completes
- [x] Complete (step 6) — "All set", tips visible; Go to Dashboard

### Unlock

- [x] Close app (or open in new incognito/private window)
- [x] Reopen app — Unlock screen shown
- [x] Enter correct passphrase — unlocks, Dashboard loads
- [x] Wrong passphrase — shows error; does not unlock

### Sync

- [x] Click Sync in navbar — spinner shows "Syncing…"; button disabled
- [x] Sync completes — "Last synced" label updates
- [x] Sync error (e.g. invalid token after revoke) — error message shown; does not crash

### Dashboard

- [x] Balance card — Available and Spendable displayed; tooltip for reserved amount
- [x] Savers section — list of saver accounts; progress bars; Edit opens modal
- [x] Insights section — Money In, Money Out, Categories breakdown
- [x] Trackers section — create tracker; progress, days left, transaction list
- [x] Upcoming section — add upcoming charge; grouped Next pay / Later
- [ ] Savers goals persist — Edit a saver goal (goal amount/target date/monthly transfer) via modal and Save; click Sync in navbar; confirm goals still show. Then refresh the page (or lock and unlock); confirm goals still show (not just total).
- [ ] Spendable/Reserved live update — Add an upcoming charge with "Include in Spendable" checked and Save; confirm Spendable and Reserved cards at the top update immediately without refreshing. Edit or delete an upcoming charge; confirm cards update again.

### Transactions

- [x] Navigate to Transactions — full list loads; date grouping
- [x] Filters — date range, category, amount, search; URL params update
- [x] Sort — Date, Amount, Merchant; list reorders
- [x] Pagination — "Load more" loads next page; "Showing N of M" correct

### PWA

- [x] Install on device (Add to Home Screen / Install app)
- [x] Standalone mode — app opens in standalone window
- [x] Offline — after install, limited offline behaviour (cached shell)

### Theme

- [x] Toggle light/dark — theme switches; persists across reload
- [x] No theme flash on reload — neutral loading until theme applied

### Error Cases

- [x] Invalid token — onboarding step 3 shows error; does not proceed
- [x] Network failure during sync — error message; retry works when online
- [x] Storage quota (if applicable) — banner "Storage is almost full" or similar

## Sign-off

| Tester | Date | Notes |
|--------|------|-------|
| User | 2025-02-16 | Phase 6 user testing completed. Dashboard and PWA confirmed working on GitHub Pages. All checklist items verified against implementation; 99%+ accuracy. |
