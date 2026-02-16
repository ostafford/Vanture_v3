/**
 * Weekly insights per 05_Calculation_logic 5.4 and 04_Core_Features 4.5.
 */

import { getDb } from '@/db'

export interface WeekRange {
  start: Date
  end: Date
  startStr: string
  endStr: string
}

/**
 * Week Monday–Sunday in local time. Optional weekOffset: 0 = current week, -1 = previous week, etc.
 * startStr/endStr are full ISO for SQL (settled_at comparison); start/end are local Date objects for display.
 */
export function getWeekRange(weekOffset?: number): WeekRange {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  if (weekOffset !== undefined && weekOffset !== 0) {
    const days = weekOffset * 7
    monday.setDate(monday.getDate() + days)
    sunday.setDate(sunday.getDate() + days)
  }
  monday.setHours(0, 0, 0, 0)
  const endOfSundayLocal = new Date(sunday)
  endOfSundayLocal.setHours(23, 59, 59, 999)
  return {
    start: monday,
    end: endOfSundayLocal,
    startStr: monday.toISOString(),
    endStr: endOfSundayLocal.toISOString(),
  }
}

export interface WeeklyInsightsData {
  moneyIn: number
  moneyOut: number
  saverChanges: number
  charges: number
  payments: number
}

export function getWeeklyInsights(weekRange?: WeekRange): WeeklyInsightsData {
  const db = getDb()
  if (!db) return { moneyIn: 0, moneyOut: 0, saverChanges: 0, charges: 0, payments: 0 }
  const { startStr, endStr } = weekRange ?? getWeekRange()

  const runOne = (sql: string, params: (string | number)[]): number => {
    const stmt = db.prepare(sql)
    stmt.bind(params)
    stmt.step()
    const row = stmt.get()
    stmt.free()
    return row ? Number(row[0]) : 0
  }

  const moneyIn = runOne(
    `SELECT COALESCE(SUM(amount), 0) FROM transactions
     WHERE amount > 0 AND settled_at >= ? AND settled_at <= ?`,
    [startStr, endStr]
  )
  const moneyOut = runOne(
    `SELECT COALESCE(SUM(ABS(amount)), 0) FROM transactions
     WHERE amount < 0 AND is_round_up = 0 AND transfer_account_id IS NULL
     AND settled_at >= ? AND settled_at <= ?`,
    [startStr, endStr]
  )
  const saverChanges = runOne(
    `SELECT COALESCE(SUM(amount), 0) FROM transactions
     WHERE transfer_account_id IN (SELECT id FROM accounts WHERE account_type = 'SAVER')
     AND settled_at >= ? AND settled_at <= ?`,
    [startStr, endStr]
  )
  const charges = runOne(
    `SELECT COUNT(*) FROM transactions
     WHERE amount < 0 AND is_round_up = 0 AND settled_at >= ? AND settled_at <= ?`,
    [startStr, endStr]
  )
  const payments = runOne(
    `SELECT COUNT(*) FROM transactions
     WHERE transfer_type IS NOT NULL AND settled_at >= ? AND settled_at <= ?`,
    [startStr, endStr]
  )

  return { moneyIn, moneyOut, saverChanges, charges, payments }
}

export interface CategoryBreakdownRow {
  category_id: string
  category_name: string
  total: number
}

export function getWeeklyCategoryBreakdown(weekRange?: WeekRange): CategoryBreakdownRow[] {
  const db = getDb()
  if (!db) return []
  const { startStr, endStr } = weekRange ?? getWeekRange()
  const stmt = db.prepare(
    `SELECT t.category_id, c.name, COALESCE(SUM(ABS(t.amount)), 0) as total
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.amount < 0 AND t.is_round_up = 0 AND t.transfer_account_id IS NULL
     AND t.settled_at >= ? AND t.settled_at <= ?
     GROUP BY t.category_id ORDER BY total DESC LIMIT 15`
  )
  stmt.bind([startStr, endStr])
  const list: CategoryBreakdownRow[] = []
  while (stmt.step()) {
    const row = stmt.get() as [string, string | null, number]
    list.push({
      category_id: row[0],
      category_name: row[1] ?? 'Uncategorised',
      total: row[2],
    })
  }
  stmt.free()
  return list
}
