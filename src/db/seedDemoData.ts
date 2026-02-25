/**
 * Demo mode: seed the database with realistic sample data so the app can be
 * trialled without an Up Bank API token. Used by onboarding "Try with sample data".
 */

import { getDb, setAppSetting, schedulePersist } from '@/db'

const DEMO_ACCOUNT_ID = 'demo-account-main'
const DEMO_SAVER_ID = 'demo-saver-1'
const NOW = new Date().toISOString()

/** Timezone-safe YYYY-MM-DD for the 1st of the current month (UTC). */
function firstOfCurrentMonthUTC(): string {
  const d = new Date()
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth()
  return `${y}-${String(m + 1).padStart(2, '0')}-01`
}

/** Timezone-safe YYYY-MM-DD for the 1st of the next month (UTC). */
function firstOfNextMonthUTC(): string {
  const d = new Date()
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth()
  const next = new Date(Date.UTC(y, m + 1, 1))
  return next.toISOString().slice(0, 10)
}

function run(sql: string, params: (string | number | null)[] = []): void {
  const db = getDb()
  if (!db) throw new Error('Database not ready')
  db.run(sql, params)
  schedulePersist()
}

export function seedDemoData(): void {
  const db = getDb()
  if (!db) throw new Error('Database not ready')

  // Payday defaults: monthly, 15th, next payday in 2 weeks
  const nextPay = new Date()
  nextPay.setDate(nextPay.getDate() + 14)
  const nextPayday = nextPay.toISOString().slice(0, 10)

  setAppSetting('payday_frequency', 'MONTHLY')
  setAppSetting('payday_day', '15')
  setAppSetting('next_payday', nextPayday)
  setAppSetting('last_sync', NOW)
  setAppSetting('onboarding_complete', '1')
  setAppSetting('demo_mode', '1')

  // Accounts: one transactional, one saver
  run(
    `INSERT OR REPLACE INTO accounts (id, display_name, account_type, balance, created_at, updated_at, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [DEMO_ACCOUNT_ID, 'Everyday', 'TRANSACTIONAL', 452300, NOW, NOW, NOW]
  )
  run(
    `INSERT OR REPLACE INTO accounts (id, display_name, account_type, balance, created_at, updated_at, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [DEMO_SAVER_ID, 'Rainy Day', 'SAVER', 125000, NOW, NOW, NOW]
  )

  // Categories (UUID-like; some parent/child for insights)
  const catGroceries = 'demo-cat-groceries'
  const catDining = 'demo-cat-dining'
  const catTransport = 'demo-cat-transport'
  const catSubscriptions = 'demo-cat-subs'
  const catShopping = 'demo-cat-shopping'
  const catParentSpending = 'demo-cat-spending'

  run(
    `INSERT OR REPLACE INTO categories (id, name, parent_id) VALUES (?, ?, ?)`,
    [catParentSpending, 'Spending', null]
  )
  run(
    `INSERT OR REPLACE INTO categories (id, name, parent_id) VALUES (?, ?, ?)`,
    [catGroceries, 'Groceries', catParentSpending]
  )
  run(
    `INSERT OR REPLACE INTO categories (id, name, parent_id) VALUES (?, ?, ?)`,
    [catDining, 'Dining Out', catParentSpending]
  )
  run(
    `INSERT OR REPLACE INTO categories (id, name, parent_id) VALUES (?, ?, ?)`,
    [catTransport, 'Transport', catParentSpending]
  )
  run(
    `INSERT OR REPLACE INTO categories (id, name, parent_id) VALUES (?, ?, ?)`,
    [catSubscriptions, 'Subscriptions', catParentSpending]
  )
  run(
    `INSERT OR REPLACE INTO categories (id, name, parent_id) VALUES (?, ?, ?)`,
    [catShopping, 'Shopping', catParentSpending]
  )

  // Transactions: last ~55 days, mixed categories and amounts (cents, negative = outflow)
  const descriptions: [string, string][] = [
    ['Woolworths', catGroceries],
    ['Coles', catGroceries],
    ['Local Cafe', catDining],
    ['Uber Eats', catDining],
    ['PTV Myki', catTransport],
    ['Shell', catTransport],
    ['Netflix', catSubscriptions],
    ['Spotify', catSubscriptions],
    ['Kmart', catShopping],
    ['Amazon', catShopping],
  ]
  for (let d = 0; d < 55; d++) {
    const date = new Date()
    date.setDate(date.getDate() - d)
    const dateStr = date.toISOString().slice(0, 10)
    const iso = dateStr + 'T12:00:00.000Z'
    const [desc, catId] = descriptions[d % descriptions.length]
    const amount = -((d % 5) + 1) * 1200 - (d % 3) * 500
    run(
      `INSERT OR REPLACE INTO transactions (
        id, account_id, status, raw_text, description, message, is_categorizable,
        category_id, parent_category_id, amount, currency, settled_at, created_at,
        is_round_up, round_up_parent_id, transfer_account_id, transfer_type, synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `demo-tx-${d}`,
        DEMO_ACCOUNT_ID,
        'SETTLED',
        null,
        desc,
        null,
        1,
        catId,
        catParentSpending,
        amount,
        'AUD',
        dateStr,
        iso,
        0,
        null,
        null,
        null,
        NOW,
      ]
    )
  }

  // Saver with goal
  run(
    `INSERT INTO savers (id, name, icon, current_balance, goal_amount, target_date, monthly_transfer, auto_transfer_day, is_goal_based, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       current_balance = excluded.current_balance,
       goal_amount = excluded.goal_amount,
       target_date = excluded.target_date,
       updated_at = excluded.updated_at`,
    [
      DEMO_SAVER_ID,
      'Rainy Day',
      null,
      125000,
      500000,
      new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      20000,
      null,
      1,
      NOW,
      NOW,
    ]
  )

  // Trackers: last_reset_date and next_reset_date for current period (timezone-safe UTC)
  const lastResetStr = firstOfCurrentMonthUTC()
  const nextResetStr = firstOfNextMonthUTC()

  // Idempotency: remove demo trackers so re-seeding does not create duplicates (tracker_categories CASCADE)
  run(`DELETE FROM trackers WHERE name IN ('Groceries', 'Dining & Takeaway')`)

  run(
    `INSERT INTO trackers (name, budget_amount, reset_frequency, reset_day, start_date, last_reset_date, next_reset_date, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    [
      'Groceries',
      80000,
      'MONTHLY',
      1,
      lastResetStr,
      lastResetStr,
      nextResetStr,
      NOW,
    ]
  )
  const tracker1Result = db.exec('SELECT last_insert_rowid()')
  const tracker1Id = (tracker1Result[0]?.values?.[0]?.[0] as number) ?? 1
  run(
    `INSERT OR IGNORE INTO tracker_categories (tracker_id, category_id) VALUES (?, ?)`,
    [tracker1Id, catGroceries]
  )

  run(
    `INSERT INTO trackers (name, budget_amount, reset_frequency, reset_day, start_date, last_reset_date, next_reset_date, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    [
      'Dining & Takeaway',
      30000,
      'MONTHLY',
      1,
      lastResetStr,
      lastResetStr,
      nextResetStr,
      NOW,
    ]
  )
  const tracker2Result = db.exec('SELECT last_insert_rowid()')
  const tracker2Id = (tracker2Result[0]?.values?.[0]?.[0] as number) ?? 2
  run(
    `INSERT OR IGNORE INTO tracker_categories (tracker_id, category_id) VALUES (?, ?)`,
    [tracker2Id, catDining]
  )

  // Upcoming charges (idempotent: delete demo entries first; Rent = first of next month to avoid month overflow)
  run(`DELETE FROM upcoming_charges WHERE name IN ('Netflix', 'Rent')`)

  const nextCharge1 = new Date()
  nextCharge1.setDate(nextCharge1.getDate() + 5)
  const rentNextChargeDate = firstOfNextMonthUTC()

  run(
    `INSERT INTO upcoming_charges (name, amount, frequency, next_charge_date, category_id, is_reserved, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      'Netflix',
      1999,
      'MONTHLY',
      nextCharge1.toISOString().slice(0, 10),
      catSubscriptions,
      1,
      NOW,
    ]
  )
  run(
    `INSERT INTO upcoming_charges (name, amount, frequency, next_charge_date, category_id, is_reserved, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['Rent', 180000, 'MONTHLY', rentNextChargeDate, null, 1, NOW]
  )
}
