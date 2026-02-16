6. Sync Strategy
6.1 Initial Sync (First Time)
When user completes onboarding (passphrase already set) and enters API token:
```javascript
async function performInitialSync(apiToken, passphrase) {
  // 1. Validate API token
  const isValid = await validateUpBankToken(apiToken);
  if (!isValid) throw new Error('Invalid API token');
  
  // 2. Derive key from passphrase (e.g. PBKDF2 with stored salt), encrypt token, store encrypted token only. Never store passphrase or raw key.
  const key = deriveKeyFromPassphrase(passphrase, salt);
  const encrypted = encryptToken(apiToken, key);
  await db.execute(`
    INSERT OR REPLACE INTO app_settings (key, value)
    VALUES ('api_token_encrypted', ?)
  `, [encrypted]);
  
  // 3. Fetch all accounts
  const accounts = await fetchUpBankAccounts(apiToken);
  await upsertAccounts(accounts);
  
  // 4. Fetch all transactions (batched)
  await syncTransactionsInBatches(apiToken, null, (progress) => {
    updateProgressBar(progress); // Update UI
  });
  
  // 5. Fetch categories
  const categories = await fetchUpBankCategories(apiToken);
  await upsertCategories(categories);
  
  // 6. Identify and setup savers
  const saverAccounts = accounts.filter(acc => acc.accountType === 'SAVER');
  await setupSavers(saverAccounts);
  
  // 7. Update last sync timestamp
  await db.execute(`
    INSERT OR REPLACE INTO app_settings (key, value)
    VALUES ('last_sync', ?)
  `, [new Date().toISOString()]);
  
  // 8. Mark onboarding complete
  await db.execute(`
    INSERT OR REPLACE INTO app_settings (key, value)
    VALUES ('onboarding_complete', '1')
  `);
}
```
**Batch syncing (cursor-based pagination):** The Up API returns `links.next` and `links.prev` (full URLs with `page[after]` / `page[before]`). Do not use a page number. Follow the `response.links.next` URL for the next page until `links.next` is null. Use `page[size]` (e.g. 100) on the initial request. Apply a 1s delay between requests for rate limiting (~60 requests/min).
```javascript
async function syncTransactionsInBatches(apiToken, sinceDate, progressCallback) {
  let nextUrl = buildTransactionsUrl(sinceDate, 100); // page[size]=100
  let totalFetched = 0;
  
  while (nextUrl) {
    const response = await fetchUpBankTransactionsByUrl(apiToken, nextUrl);
    await upsertTransactions(response.data);
    totalFetched += response.data.length;
    progressCallback({ fetched: totalFetched, hasMore: response.links.next !== null });
    nextUrl = response.links.next;
    await sleep(1000); // Rate limiting
  }
}
```

6.2 Subsequent Syncs
When user clicks "Sync" button (user must have unlocked the app with passphrase first):
```javascript
async function performSync(passphrase) {
  // 1. Get last sync timestamp
  const lastSync = await db.execute(`
    SELECT value FROM app_settings WHERE key = 'last_sync'
  `);
  
  const sinceDate = lastSync[0]?.value || null;
  
  // 2. Derive key from passphrase, decrypt stored token. Do not store decrypted token or passphrase in memory beyond this session.
  const key = deriveKeyFromPassphrase(passphrase, salt);
  const encryptedToken = await db.execute(`
    SELECT value FROM app_settings WHERE key = 'api_token_encrypted'
  `);
  const apiToken = decryptToken(encryptedToken[0].value, key);
  
  // 3. Fetch new accounts (quick)
  const accounts = await fetchUpBankAccounts(apiToken);
  await upsertAccounts(accounts);
  
  // 4. Fetch new transactions only (since last sync)
  await syncTransactionsInBatches(apiToken, sinceDate, (progress) => {
    updateProgressBar(progress);
  });
  
  // 5. Update savers
  const saverAccounts = accounts.filter(acc => acc.accountType === 'SAVER');
  await updateSavers(saverAccounts);
  
  // 6. Update last sync timestamp
  await db.execute(`
    INSERT OR REPLACE INTO app_settings (key, value)
    VALUES ('last_sync', ?)
  `, [new Date().toISOString()]);
  
  // 7. Recalculate derived data
  // recalculateTrackers: advance last_reset_date / next_reset_date for trackers where current time has passed next reset (for PAYDAY frequency use app_settings: payday_frequency, payday_day, next_payday).
  // recalculateSpendable: reserved amount is derived on read from upcoming_charges and payday settings; no separate stored cache unless explicitly added.
  await recalculateTrackers();
}
```

---

### **6.3 Up Bank API Endpoints**

**Authentication:**
```
Authorization: Bearer {token}
```

**Endpoints:**
```
GET /api/v1/accounts
GET /api/v1/accounts/{id}
GET /api/v1/transactions?page[size]=100&filter[since]=2024-01-01T00:00:00Z
GET /api/v1/categories
GET /api/v1/categories/{id}
Transaction Response Structure (see [Up API Transactions](https://developer.up.com.au/)):
```json
{
  "data": {
    "type": "transactions",
    "id": "xxx",
    "attributes": {
      "status": "SETTLED",
      "rawText": "ALDI",
      "description": "ALDI Cheltenham",
      "message": null,
      "isCategorizable": true,
      "roundUp": null,
      "amount": {
        "currencyCode": "AUD",
        "value": "-43.00",
        "valueInBaseUnits": -4300
      },
      "foreignAmount": null,
      "settledAt": "2024-02-12T12:30:00Z",
      "createdAt": "2024-02-12T12:30:00Z"
    },
    "relationships": {
      "account": { "data": { "id": "xxx" } },
      "category": { "data": { "id": "groceries" } },
      "parentCategory": { "data": { "id": "good-life" } },
      "transferAccount": { "data": null }
    }
  }
}
```
**Round-up detection:** Use the Up API attribute `attributes.roundUp`. When `roundUp !== null`, treat the transaction as a round-up. Use `roundUp.amount` (documented as negative in the API) for the round-up value. Do not infer from rawText or description.

**Saver goals:** Saver goal amount, target date, and monthly transfer are not clearly present in the Accounts list response at [Up API](https://developer.up.com.au/). Implementations must confirm whether these come from another endpoint or are app-only (user-defined in Vantura). Document the decision once known.

**Implementation notes (Phase 2):** Saver rows are created/updated from Up Bank accounts with `accountType === 'SAVER'`. Only `id`, `displayName`, and `balance` (current_balance) are mapped from the API. Goal amount, target date, and monthly transfer are left null (app-defined in a future phase if not provided by the API).

**Implementation (complete):** Initial sync: `performInitialSync(apiToken, progressCallback)` in `src/services/sync.ts`; subsequent sync: `performSync(apiToken, progressCallback)`. Transaction batching: `fetchAllTransactions(token, sinceDate, progressCallback)` in `src/api/upBank.ts` (page size 100, cursor via `links.next`, 1s delay between requests). Saver setup: `setupSavers(accounts)` / `updateSavers(accounts)` in `src/services/sync.ts` map only id, displayName, balance for SAVER accounts.
