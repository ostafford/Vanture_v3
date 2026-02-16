/**
 * Savers: list, progress (5.3), user-defined goals.
 */

import { getDb, schedulePersist } from '@/db'

export interface SaverRow {
  id: string
  name: string
  icon: string | null
  current_balance: number
  goal_amount: number | null
  target_date: string | null
  monthly_transfer: number | null
}

export interface SaverWithProgress extends SaverRow {
  progress: number
  remaining: number
  monthsRemaining: number
  recommendedMonthly: number
  onTrack: boolean
}

function monthsBetween(fromDate: Date, toDate: Date): number {
  const months =
    (toDate.getFullYear() - fromDate.getFullYear()) * 12 +
    (toDate.getMonth() - fromDate.getMonth())
  return Math.max(0, months)
}

export function getSaversWithProgress(): SaverWithProgress[] {
  const db = getDb()
  if (!db) return []
  const stmt = db.prepare(
    `SELECT id, name, icon, current_balance, goal_amount, target_date, monthly_transfer
     FROM savers ORDER BY name`
  )
  const list: SaverWithProgress[] = []
  const today = new Date()
  while (stmt.step()) {
    const row = stmt.get() as [
      string,
      string,
      string | null,
      number,
      number | null,
      string | null,
      number | null,
    ]
    const current_balance = row[3]
    const goal_amount = row[4]
    const target_date = row[5]
    const monthly_transfer = row[6] ?? 0
    let progress = 0
    let remaining = 0
    let monthsRemaining = 0
    let recommendedMonthly = 0
    let onTrack = false
    if (goal_amount != null && goal_amount > 0) {
      remaining = goal_amount - current_balance
      const target = target_date ? new Date(target_date + 'T12:00:00Z') : today
      monthsRemaining = monthsBetween(today, target)
      recommendedMonthly = monthsRemaining > 0 ? remaining / monthsRemaining : 0
      progress = (current_balance / goal_amount) * 100
      onTrack = recommendedMonthly <= monthly_transfer
    }
    list.push({
      id: row[0],
      name: row[1],
      icon: row[2],
      current_balance: row[3],
      goal_amount: row[4],
      target_date: row[5],
      monthly_transfer: row[6],
      progress,
      remaining,
      monthsRemaining,
      recommendedMonthly,
      onTrack,
    })
  }
  stmt.free()
  return list
}

export function updateSaverGoals(
  id: string,
  goalAmount: number | null,
  targetDate: string | null,
  monthlyTransfer: number | null
): void {
  const db = getDb()
  if (!db) throw new Error('Database not ready')
  const isGoalBased = goalAmount != null && goalAmount > 0 ? 1 : 0
  const now = new Date().toISOString()
  db.run(
    `UPDATE savers SET goal_amount = ?, target_date = ?, monthly_transfer = ?, is_goal_based = ?, updated_at = ? WHERE id = ?`,
    [
      goalAmount ?? null,
      targetDate ?? null,
      monthlyTransfer ?? null,
      isGoalBased,
      now,
      id,
    ]
  )
  schedulePersist()
}
