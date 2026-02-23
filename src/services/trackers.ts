/**
 * Trackers: CRUD and progress (spent in period per 05_Calculation_logic 5.1).
 */

import { getDb, getAppSetting, schedulePersist } from '@/db'

export type TrackerResetFrequency =
  | 'WEEKLY'
  | 'FORTNIGHTLY'
  | 'MONTHLY'
  | 'PAYDAY'

export interface TrackerRow {
  id: number
  name: string
  budget_amount: number
  reset_frequency: string
  reset_day: number | null
  last_reset_date: string
  next_reset_date: string
}

export interface TrackerWithProgress extends TrackerRow {
  spent: number
  remaining: number
  daysLeft: number
  progress: number
}

function daysBetween(dateStrA: string, dateStrB: string): number {
  const norm = (s: string) => (s.length >= 10 ? s.slice(0, 10) : s)
  const a = new Date(norm(dateStrA) + 'T12:00:00Z').getTime()
  const b = new Date(norm(dateStrB) + 'T12:00:00Z').getTime()
  if (Number.isNaN(a) || Number.isNaN(b)) return 0
  return Math.round((b - a) / (24 * 60 * 60 * 1000))
}

/**
 * Spent in current period (cents). 5.1: tracker_categories + transactions, display date
 * (COALESCE(created_at, settled_at)) in [last_reset, next_reset), amount < 0, not round-up.
 */
export function getTrackerSpent(trackerId: number): number {
  const db = getDb()
  if (!db) return 0
  const stmt = db.prepare(
    `SELECT COALESCE(SUM(ABS(t.amount)), 0) as spent
     FROM transactions t
     INNER JOIN tracker_categories tc ON t.category_id = tc.category_id
     WHERE tc.tracker_id = ?
       AND COALESCE(t.created_at, t.settled_at) >= (SELECT last_reset_date FROM trackers WHERE id = ?)
       AND COALESCE(t.created_at, t.settled_at) < (SELECT next_reset_date FROM trackers WHERE id = ?)
       AND t.amount < 0 AND t.transfer_account_id IS NULL`
  )
  stmt.bind([trackerId, trackerId, trackerId])
  stmt.step()
  const row = stmt.get()
  stmt.free()
  return row ? Number(row[0]) : 0
}

/**
 * All active trackers with spent, remaining, daysLeft, progress.
 */
export function getTrackersWithProgress(): TrackerWithProgress[] {
  const db = getDb()
  if (!db) return []
  const stmt = db.prepare(
    `SELECT id, name, budget_amount, reset_frequency, reset_day, last_reset_date, next_reset_date
     FROM trackers WHERE is_active = 1 ORDER BY name`
  )
  const list: TrackerWithProgress[] = []
  const today = new Date().toISOString().slice(0, 10)
  while (stmt.step()) {
    const row = stmt.get() as [
      number,
      string,
      number,
      string,
      number | null,
      string,
      string,
    ]
    const id = row[0]
    const budget_amount = row[2]
    const next_reset_date = row[6]
    const spent = getTrackerSpent(id)
    const remaining = Math.max(0, budget_amount - spent)
    const daysLeft = Math.max(0, daysBetween(today, next_reset_date))
    const progress = budget_amount > 0 ? (spent / budget_amount) * 100 : 0
    list.push({
      id: row[0],
      name: row[1],
      budget_amount: row[2],
      reset_frequency: row[3],
      reset_day: row[4],
      last_reset_date: row[5],
      next_reset_date: row[6],
      spent,
      remaining,
      daysLeft,
      progress,
    })
  }
  stmt.free()
  return list
}

/**
 * Transactions in current period for a tracker (for list in UI). Uses display date
 * (created_at with fallback to settled_at) for period and ordering. Returns status for Held/Settled.
 */
export function getTrackerTransactionsInPeriod(trackerId: number): Array<{
  id: string
  description: string
  created_at: string | null
  settled_at: string | null
  amount: number
  status: string
}> {
  const db = getDb()
  if (!db) return []
  const stmt = db.prepare(
    `SELECT t.id, t.description, t.created_at, t.settled_at, t.amount, t.status
     FROM transactions t
     INNER JOIN tracker_categories tc ON t.category_id = tc.category_id
     WHERE tc.tracker_id = ?
       AND COALESCE(t.created_at, t.settled_at) >= (SELECT last_reset_date FROM trackers WHERE id = ?)
       AND COALESCE(t.created_at, t.settled_at) < (SELECT next_reset_date FROM trackers WHERE id = ?)
       AND t.amount < 0 AND t.transfer_account_id IS NULL
     ORDER BY COALESCE(t.created_at, t.settled_at) DESC LIMIT 20`
  )
  stmt.bind([trackerId, trackerId, trackerId])
  const list: Array<{
    id: string
    description: string
    created_at: string | null
    settled_at: string | null
    amount: number
    status: string
  }> = []
  while (stmt.step()) {
    const row = stmt.get() as [
      string,
      string,
      string | null,
      string | null,
      number,
      string,
    ]
    list.push({
      id: row[0],
      description: row[1],
      created_at: row[2],
      settled_at: row[3],
      amount: row[4],
      status: row[5],
    })
  }
  stmt.free()
  return list
}

/**
 * UTC weekday for reset_day: 1=Mon..7=Sun maps to getUTCDay() 1..6,0.
 */
function resetDayToUTCDay(resetDay: number): number {
  return resetDay === 7 ? 0 : resetDay
}

/**
 * Start of the current period (inclusive). Used so tracker shows full period from reset day, not from creation day.
 */
function getLastResetDate(
  frequency: TrackerResetFrequency,
  resetDay: number,
  fromDate: string
): string {
  const from = new Date(fromDate + 'T12:00:00Z')
  if (frequency === 'PAYDAY') {
    return fromDate
  }
  if (frequency === 'WEEKLY') {
    const targetUTCDay = resetDayToUTCDay(resetDay)
    const currentUTCDay = from.getUTCDay()
    const daysBack = (currentUTCDay - targetUTCDay + 7) % 7
    const last = new Date(from)
    last.setUTCDate(last.getUTCDate() - daysBack)
    return last.toISOString().slice(0, 10)
  }
  if (frequency === 'FORTNIGHTLY') {
    const targetUTCDay = resetDayToUTCDay(resetDay)
    const currentUTCDay = from.getUTCDay()
    const daysBack = (currentUTCDay - targetUTCDay + 7) % 7
    const lastWeekday = new Date(from)
    lastWeekday.setUTCDate(lastWeekday.getUTCDate() - daysBack)
    const candidate = lastWeekday.toISOString().slice(0, 10)
    const daysSince = daysBetween(candidate, fromDate)
    const periodsSince = Math.floor(daysSince / 14)
    const last = new Date(candidate + 'T12:00:00Z')
    last.setUTCDate(last.getUTCDate() + 14 * periodsSince)
    return last.toISOString().slice(0, 10)
  }
  if (frequency === 'MONTHLY') {
    const d = new Date(from)
    const dayOfMonth = d.getUTCDate()
    if (dayOfMonth >= resetDay) {
      d.setUTCDate(resetDay)
    } else {
      d.setUTCMonth(d.getUTCMonth() - 1)
      d.setUTCDate(Math.min(resetDay, 28))
    }
    return d.toISOString().slice(0, 10)
  }
  return fromDate
}

function getNextResetDate(
  frequency: TrackerResetFrequency,
  resetDay: number,
  fromDate: string
): string {
  const from = new Date(fromDate + 'T12:00:00Z')
  if (frequency === 'PAYDAY') {
    const nextPayday = getAppSetting('next_payday')
    return nextPayday ?? from.toISOString().slice(0, 10)
  }
  let next: Date
  if (frequency === 'WEEKLY') {
    const targetUTCDay = resetDayToUTCDay(resetDay)
    const currentUTCDay = from.getUTCDay()
    const daysUntilNext = (targetUTCDay - currentUTCDay + 7) % 7 || 7
    next = new Date(from)
    next.setUTCDate(next.getUTCDate() + daysUntilNext)
  } else if (frequency === 'FORTNIGHTLY') {
    next = new Date(from)
    next.setUTCDate(next.getUTCDate() + 14)
  } else if (frequency === 'MONTHLY') {
    next = new Date(from)
    next.setUTCMonth(next.getUTCMonth() + 1)
    if (resetDay >= 1 && resetDay <= 31) next.setUTCDate(resetDay)
  } else {
    next = from
  }
  return next.toISOString().slice(0, 10)
}

/**
 * Create tracker and set start_date, last_reset_date, next_reset_date.
 * For PAYDAY use app_settings next_payday; for others use period start (e.g. last Monday) so the tracker shows the full frequency window.
 */
export function createTracker(
  name: string,
  budgetAmountCents: number,
  resetFrequency: TrackerResetFrequency,
  resetDay: number,
  categoryIds: string[]
): number {
  const db = getDb()
  if (!db) throw new Error('Database not ready')
  const now = new Date().toISOString()
  const today = now.slice(0, 10)
  let lastReset: string
  let nextReset: string
  if (resetFrequency === 'PAYDAY') {
    const nextPayday = getAppSetting('next_payday')
    nextReset = nextPayday ?? today
    lastReset = today
  } else {
    lastReset = getLastResetDate(resetFrequency, resetDay, today)
    nextReset = getNextResetDate(resetFrequency, resetDay, lastReset)
  }
  db.run(
    `INSERT INTO trackers (name, budget_amount, reset_frequency, reset_day, start_date, last_reset_date, next_reset_date, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    [
      name,
      budgetAmountCents,
      resetFrequency,
      resetDay,
      today,
      lastReset,
      nextReset,
      now,
    ]
  )
  const result = db.exec('SELECT last_insert_rowid()')
  const id = (result[0]?.values?.[0]?.[0] as number) ?? 0
  for (const catId of categoryIds) {
    db.run(
      `INSERT INTO tracker_categories (tracker_id, category_id) VALUES (?, ?)`,
      [id, catId]
    )
  }
  schedulePersist()
  return id
}

/**
 * Update tracker name, budget, frequency, reset_day, categories.
 */
export function updateTracker(
  id: number,
  name: string,
  budgetAmountCents: number,
  resetFrequency: TrackerResetFrequency,
  resetDay: number,
  categoryIds: string[]
): void {
  const db = getDb()
  if (!db) throw new Error('Database not ready')
  db.run(
    `UPDATE trackers SET name = ?, budget_amount = ?, reset_frequency = ?, reset_day = ? WHERE id = ?`,
    [name, budgetAmountCents, resetFrequency, resetDay, id]
  )
  db.run(`DELETE FROM tracker_categories WHERE tracker_id = ?`, [id])
  for (const catId of categoryIds) {
    db.run(
      `INSERT INTO tracker_categories (tracker_id, category_id) VALUES (?, ?)`,
      [id, catId]
    )
  }
  schedulePersist()
}

/**
 * Soft-deactivate tracker.
 */
export function deleteTracker(id: number): void {
  const db = getDb()
  if (!db) throw new Error('Database not ready')
  db.run(`UPDATE trackers SET is_active = 0 WHERE id = ?`, [id])
  schedulePersist()
}

/**
 * Category IDs linked to a tracker (for edit form).
 */
export function getTrackerCategoryIds(trackerId: number): string[] {
  const db = getDb()
  if (!db) return []
  const stmt = db.prepare(
    `SELECT category_id FROM tracker_categories WHERE tracker_id = ?`
  )
  stmt.bind([trackerId])
  const ids: string[] = []
  while (stmt.step()) {
    ids.push(String(stmt.get()[0]))
  }
  stmt.free()
  return ids
}
