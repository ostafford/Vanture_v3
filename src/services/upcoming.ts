/**
 * Upcoming charges: CRUD, group by Next pay / Later (Option A: edit/delete only, no auto-advance).
 */

import { getDb, getAppSetting, schedulePersist } from '@/db'

export interface UpcomingChargeRow {
  id: number
  name: string
  amount: number
  frequency: string
  next_charge_date: string
  category_id: string | null
  is_reserved: number
}

export interface UpcomingGrouped {
  nextPay: UpcomingChargeRow[]
  later: UpcomingChargeRow[]
  nextPayday: string | null
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

export function getUpcomingChargesGrouped(): UpcomingGrouped {
  const db = getDb()
  if (!db) return { nextPay: [], later: [], nextPayday: null }
  const nextPayday = getAppSetting('next_payday')
  const stmt = db.prepare(
    `SELECT id, name, amount, frequency, next_charge_date, category_id, is_reserved
     FROM upcoming_charges ORDER BY next_charge_date`
  )
  const nextPay: UpcomingChargeRow[] = []
  const later: UpcomingChargeRow[] = []
  const today = todayDateString()
  while (stmt.step()) {
    const row = stmt.get() as [number, string, number, string, string, string | null, number]
    const charge: UpcomingChargeRow = {
      id: row[0],
      name: row[1],
      amount: row[2],
      frequency: row[3],
      next_charge_date: row[4],
      category_id: row[5],
      is_reserved: row[6],
    }
    if (charge.next_charge_date < today) {
      continue
    }
    if (nextPayday && charge.next_charge_date < nextPayday) {
      nextPay.push(charge)
    } else {
      later.push(charge)
    }
  }
  stmt.free()
  return { nextPay, later, nextPayday }
}

export function createUpcomingCharge(
  name: string,
  amountCents: number,
  frequency: string,
  nextChargeDate: string,
  categoryId: string | null,
  isReserved: boolean
): number {
  const db = getDb()
  if (!db) throw new Error('Database not ready')
  const now = new Date().toISOString()
  db.run(
    `INSERT INTO upcoming_charges (name, amount, frequency, next_charge_date, category_id, is_reserved, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, amountCents, frequency, nextChargeDate, categoryId, isReserved ? 1 : 0, now]
  )
  const result = db.exec('SELECT last_insert_rowid()')
  const id = (result[0]?.values?.[0]?.[0] as number) ?? 0
  schedulePersist()
  return id
}

export function updateUpcomingCharge(
  id: number,
  name: string,
  amountCents: number,
  frequency: string,
  nextChargeDate: string,
  categoryId: string | null,
  isReserved: boolean
): void {
  const db = getDb()
  if (!db) throw new Error('Database not ready')
  db.run(
    `UPDATE upcoming_charges SET name = ?, amount = ?, frequency = ?, next_charge_date = ?, category_id = ?, is_reserved = ? WHERE id = ?`,
    [name, amountCents, frequency, nextChargeDate, categoryId, isReserved ? 1 : 0, id]
  )
  schedulePersist()
}

export function deleteUpcomingCharge(id: number): void {
  const db = getDb()
  if (!db) throw new Error('Database not ready')
  db.run(`DELETE FROM upcoming_charges WHERE id = ?`, [id])
  schedulePersist()
}
