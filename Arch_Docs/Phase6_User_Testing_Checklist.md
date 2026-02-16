# Phase 6: User Testing Checklist

**Purpose:** Manual validation with real Up Bank accounts. Run through this checklist after deployment to verify end-to-end behaviour.

## Prerequisites

- Live site deployed (e.g. `https://<owner>.github.io/Vanture_v3/`)
- Valid Up Bank Personal Access Token (create in Up app > Profile > Data sharing > Personal access tokens)
- Real Up Bank account with transaction history (for sync and dashboard verification)

## Checklist

### Onboarding

- [ ] Complete onboarding step 1 (Welcome) — click Get Started
- [ ] Create passphrase (step 2) — min 8 chars, confirm matches; Continue
- [ ] Enter valid Up Bank PAT (step 3) — token validates; Continue
- [ ] Set payday schedule (step 4) — Frequency, Day, Next payday date; Continue
- [ ] Initial sync (step 5) — progress bar shows "Fetched N transactions…"; completes
- [ ] Complete (step 6) — "All set", tips visible; Go to Dashboard

### Unlock

- [ ] Close app (or open in new incognito/private window)
- [ ] Reopen app — Unlock screen shown
- [ ] Enter correct passphrase — unlocks, Dashboard loads
- [ ] Wrong passphrase — shows error; does not unlock

### Sync

- [ ] Click Sync in navbar — spinner shows "Syncing…"; button disabled
- [ ] Sync completes — "Last synced" label updates
- [ ] Sync error (e.g. invalid token after revoke) — error message shown; does not crash

### Dashboard

- [ ] Balance card — Available and Spendable displayed; tooltip for reserved amount
- [ ] Savers section — list of saver accounts; progress bars; Edit opens modal
- [ ] Insights section — Money In, Money Out, Categories breakdown
- [ ] Trackers section — create tracker; progress, days left, transaction list
- [ ] Upcoming section — add upcoming charge; grouped Next pay / Later

### Transactions

- [ ] Navigate to Transactions — full list loads; date grouping
- [ ] Filters — date range, category, amount, search; URL params update
- [ ] Sort — Date, Amount, Merchant; list reorders
- [ ] Pagination — "Load more" loads next page; "Showing N of M" correct

### PWA

- [ ] Install on device (Add to Home Screen / Install app)
- [ ] Standalone mode — app opens in standalone window
- [ ] Offline — after install, limited offline behaviour (cached shell)

### Theme

- [ ] Toggle light/dark — theme switches; persists across reload
- [ ] No theme flash on reload — neutral loading until theme applied

### Error Cases

- [ ] Invalid token — onboarding step 3 shows error; does not proceed
- [ ] Network failure during sync — error message; retry works when online
- [ ] Storage quota (if applicable) — banner "Storage is almost full" or similar

## Sign-off

| Tester | Date | Notes |
|--------|------|-------|
|        |      |       |
