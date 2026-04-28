import { getDb, schedulePersist } from '@/db'

export type MaybuyStatus = 'PENDING' | 'BOUGHT' | 'SKIPPED'

export interface MaybuyRow {
  id: number
  name: string
  price_cents: number
  url: string | null
  notes: string | null
  saver_account_id: string | null
  status: MaybuyStatus
  created_at: string
  decided_at: string | null
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysBetweenDates(a: string, b: string): number {
  const dateA = new Date(a.slice(0, 10) + 'T12:00:00Z').getTime()
  const dateB = new Date(b.slice(0, 10) + 'T12:00:00Z').getTime()
  return Math.floor(Math.abs(dateB - dateA) / (24 * 60 * 60 * 1000))
}

export function daysThinking(createdAt: string): number {
  return daysBetweenDates(createdAt, todayDateString())
}

export function daysHeldBeforeDecision(
  createdAt: string,
  decidedAt: string
): number {
  return daysBetweenDates(createdAt, decidedAt)
}

function readRows(
  db: NonNullable<ReturnType<typeof getDb>>,
  whereClause = '',
  params: (string | number)[] = []
): MaybuyRow[] {
  const sql = `SELECT id, name, price_cents, url, notes, saver_account_id, status, created_at, decided_at
               FROM maybuys${whereClause ? ' WHERE ' + whereClause : ''}
               ORDER BY created_at DESC`
  const stmt = db.prepare(sql)
  if (params.length) stmt.bind(params)
  const rows: MaybuyRow[] = []
  while (stmt.step()) {
    const r = stmt.get() as [
      number,
      string,
      number,
      string | null,
      string | null,
      string | null,
      string,
      string,
      string | null,
    ]
    rows.push({
      id: r[0],
      name: r[1],
      price_cents: r[2],
      url: r[3],
      notes: r[4],
      saver_account_id: r[5],
      status: r[6] as MaybuyStatus,
      created_at: r[7],
      decided_at: r[8],
    })
  }
  stmt.free()
  return rows
}

export function getMaybuys(): MaybuyRow[] {
  const db = getDb()
  if (!db) return []
  return readRows(db)
}

export function getPendingMaybuys(): MaybuyRow[] {
  const db = getDb()
  if (!db) return []
  return readRows(db, "status = 'PENDING'")
}

export function getMaybuyHistory(): MaybuyRow[] {
  const db = getDb()
  if (!db) return []
  return readRows(db, "status IN ('BOUGHT', 'SKIPPED')")
}

export function createMaybuy(
  name: string,
  priceCents: number,
  url: string | null,
  notes: string | null,
  saverAccountId: string | null
): number {
  const db = getDb()
  if (!db) throw new Error('Database not ready')
  const now = new Date().toISOString()
  db.run(
    `INSERT INTO maybuys (name, price_cents, url, notes, saver_account_id, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'PENDING', ?)`,
    [name, priceCents, url, notes, saverAccountId, now]
  )
  const result = db.exec('SELECT last_insert_rowid()')
  const id = (result[0]?.values?.[0]?.[0] as number) ?? 0
  schedulePersist()
  return id
}

export function updateMaybuy(
  id: number,
  name: string,
  priceCents: number,
  url: string | null,
  notes: string | null,
  saverAccountId: string | null
): void {
  const db = getDb()
  if (!db) throw new Error('Database not ready')
  db.run(
    `UPDATE maybuys SET name = ?, price_cents = ?, url = ?, notes = ?, saver_account_id = ? WHERE id = ?`,
    [name, priceCents, url, notes, saverAccountId, id]
  )
  schedulePersist()
}

export function deleteMaybuy(id: number): void {
  const db = getDb()
  if (!db) throw new Error('Database not ready')
  db.run(`DELETE FROM maybuys WHERE id = ?`, [id])
  schedulePersist()
}

export function markMaybuyBought(id: number): void {
  const db = getDb()
  if (!db) throw new Error('Database not ready')
  const now = new Date().toISOString()
  db.run(`UPDATE maybuys SET status = 'BOUGHT', decided_at = ? WHERE id = ?`, [
    now,
    id,
  ])
  schedulePersist()
}

export function markMaybuySkipped(id: number): void {
  const db = getDb()
  if (!db) throw new Error('Database not ready')
  const now = new Date().toISOString()
  db.run(`UPDATE maybuys SET status = 'SKIPPED', decided_at = ? WHERE id = ?`, [
    now,
    id,
  ])
  schedulePersist()
}
