/**
 * Standalone goals: not tied to a specific saver account.
 * Users can create manual goals with target amount, monthly contribution, and optional date.
 */

import { getDb, schedulePersist } from '@/db'

export interface GoalRow {
  id: number
  name: string
  target_amount: number
  current_amount: number
  monthly_contribution: number | null
  target_date: string | null
  icon: string | null
  completed_at: string | null
  /** Lower sorts first when splitting savings by priority. */
  priority_rank: number | null
  /** 0–100 when using percent split across wants. */
  allocation_percent: number | null
  created_at: string
  updated_at: string
}

export interface GoalWithProgress extends GoalRow {
  progress: number
  remaining: number
}

export function getGoals(): GoalWithProgress[] {
  const db = getDb()
  if (!db) return []
  const stmt = db.prepare(
    `SELECT id, name, target_amount, current_amount, monthly_contribution,
            target_date, icon, completed_at, priority_rank, allocation_percent,
            created_at, updated_at
     FROM goals
     ORDER BY
       completed_at IS NOT NULL,
       CASE WHEN completed_at IS NULL AND priority_rank IS NULL THEN 1 ELSE 0 END,
       CASE WHEN completed_at IS NULL THEN COALESCE(priority_rank, 999999) ELSE 0 END,
       name`
  )
  const list: GoalWithProgress[] = []
  while (stmt.step()) {
    const row = stmt.get() as [
      number,
      string,
      number,
      number,
      number | null,
      string | null,
      string | null,
      string | null,
      number | null,
      number | null,
      string,
      string,
    ]
    const target = row[2]
    const current = row[3]
    const progress = target > 0 ? (current / target) * 100 : 0
    const remaining = Math.max(0, target - current)
    list.push({
      id: row[0],
      name: row[1],
      target_amount: row[2],
      current_amount: row[3],
      monthly_contribution: row[4],
      target_date: row[5],
      icon: row[6],
      completed_at: row[7],
      priority_rank: row[8],
      allocation_percent: row[9],
      created_at: row[10],
      updated_at: row[11],
      progress,
      remaining,
    })
  }
  stmt.free()
  return list
}

export function createGoal(
  name: string,
  targetAmount: number,
  monthlyContribution: number | null,
  targetDate: string | null,
  icon: string | null,
  priorityRank: number | null = null,
  allocationPercent: number | null = null
): number {
  const db = getDb()
  if (!db) throw new Error('Database not ready')
  const now = new Date().toISOString()
  db.run(
    `INSERT INTO goals (name, target_amount, current_amount, monthly_contribution, target_date, icon, priority_rank, allocation_percent, created_at, updated_at)
     VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      targetAmount,
      monthlyContribution,
      targetDate,
      icon,
      priorityRank,
      allocationPercent,
      now,
      now,
    ]
  )
  const result = db.exec('SELECT last_insert_rowid()')
  const id = (result[0]?.values?.[0]?.[0] as number) ?? 0
  schedulePersist()
  recordGoalSnapshot(id)
  return id
}

export function updateGoal(
  id: number,
  name: string,
  targetAmount: number,
  currentAmount: number,
  monthlyContribution: number | null,
  targetDate: string | null,
  icon: string | null,
  priorityRank: number | null = null,
  allocationPercent: number | null = null
): void {
  const db = getDb()
  if (!db) throw new Error('Database not ready')
  const now = new Date().toISOString()
  db.run(
    `UPDATE goals SET name = ?, target_amount = ?, current_amount = ?, monthly_contribution = ?, target_date = ?, icon = ?, priority_rank = ?, allocation_percent = ?, updated_at = ? WHERE id = ?`,
    [
      name,
      targetAmount,
      currentAmount,
      monthlyContribution,
      targetDate,
      icon,
      priorityRank,
      allocationPercent,
      now,
      id,
    ]
  )
  schedulePersist()
  recordGoalSnapshot(id)
}

/**
 * Persist active want order by assigning sequential priority ranks.
 * First id in the list becomes top priority.
 */
export function reorderActiveGoals(goalIdsInOrder: number[]): void {
  const db = getDb()
  if (!db) throw new Error('Database not ready')
  if (goalIdsInOrder.length === 0) return
  const now = new Date().toISOString()
  db.run('BEGIN')
  try {
    for (let i = 0; i < goalIdsInOrder.length; i++) {
      db.run(
        `UPDATE goals
         SET priority_rank = ?, updated_at = ?
         WHERE id = ? AND completed_at IS NULL`,
        [i, now, goalIdsInOrder[i]]
      )
    }
    db.run('COMMIT')
    schedulePersist()
  } catch (error) {
    db.run('ROLLBACK')
    throw error
  }
}

export function deleteGoal(id: number): void {
  const db = getDb()
  if (!db) throw new Error('Database not ready')
  db.run(`DELETE FROM goals WHERE id = ?`, [id])
  schedulePersist()
}

export function markGoalComplete(id: number): void {
  const db = getDb()
  if (!db) throw new Error('Database not ready')
  const now = new Date().toISOString()
  db.run(`UPDATE goals SET completed_at = ? WHERE id = ?`, [now, id])
  schedulePersist()
}

export function reopenGoal(id: number): void {
  const db = getDb()
  if (!db) throw new Error('Database not ready')
  db.run(`UPDATE goals SET completed_at = NULL WHERE id = ?`, [id])
  schedulePersist()
}

export interface GoalSnapshot {
  snapshot_date: string
  current_amount: number
  target_amount: number
}

/**
 * Record today's snapshot for a goal. Called after create/update.
 */
export function recordGoalSnapshot(goalId: number): void {
  const db = getDb()
  if (!db) return
  const today = new Date().toISOString().slice(0, 10)
  const stmt = db.prepare(
    `SELECT current_amount, target_amount FROM goals WHERE id = ?`
  )
  stmt.bind([goalId])
  if (!stmt.step()) {
    stmt.free()
    return
  }
  const row = stmt.get() as [number, number]
  stmt.free()
  db.run(
    `INSERT OR REPLACE INTO goal_snapshots (goal_id, snapshot_date, current_amount, target_amount) VALUES (?, ?, ?, ?)`,
    [goalId, today, row[0], row[1]]
  )
  schedulePersist()
}

/**
 * Get snapshots for a specific goal, oldest first.
 */
export function getGoalSnapshots(
  goalId: number,
  options?: { dateFrom?: string; dateTo?: string; limit?: number }
): GoalSnapshot[] {
  const db = getDb()
  if (!db) return []
  const limit = options?.limit ?? 365
  let sql = `SELECT snapshot_date, current_amount, target_amount FROM goal_snapshots WHERE goal_id = ?`
  const params: (string | number)[] = [goalId]
  if (options?.dateFrom) {
    sql += ` AND snapshot_date >= ?`
    params.push(options.dateFrom)
  }
  if (options?.dateTo) {
    sql += ` AND snapshot_date <= ?`
    params.push(options.dateTo)
  }
  sql += ` ORDER BY snapshot_date ASC`
  if (limit > 0) {
    sql += ` LIMIT ?`
    params.push(limit)
  }
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const list: GoalSnapshot[] = []
  while (stmt.step()) {
    const row = stmt.get() as [string, number, number]
    list.push({
      snapshot_date: row[0],
      current_amount: row[1],
      target_amount: row[2],
    })
  }
  stmt.free()
  return list
}
