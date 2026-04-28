/**
 * Local account rows synced from Up Bank (see sync upsertAccount).
 */

import { getDb } from '@/db'

export interface AccountRow {
  id: string
  display_name: string
  account_type: string
  balance: number
  ownership_type: string | null
  is_closed: number
}

/**
 * Returns accounts matching the given types. Excludes closed accounts by default.
 * Pass includeClosed=true only for historical lookups (e.g. transaction filters).
 */
export function getAccountsByTypes(
  types: string[],
  includeClosed = false
): AccountRow[] {
  const db = getDb()
  if (!db || types.length === 0) return []
  const placeholders = types.map(() => '?').join(',')
  const closedFilter = includeClosed ? '' : ' AND is_closed = 0'
  const stmt = db.prepare(
    `SELECT id, display_name, account_type, balance, ownership_type, is_closed
     FROM accounts WHERE account_type IN (${placeholders})${closedFilter}
     ORDER BY display_name COLLATE NOCASE`
  )
  stmt.bind(types)
  const out: AccountRow[] = []
  while (stmt.step()) {
    const r = stmt.get() as [
      string,
      string,
      string,
      number,
      string | null,
      number,
    ]
    out.push({
      id: r[0],
      display_name: r[1],
      account_type: r[2],
      balance: r[3],
      ownership_type: r[4],
      is_closed: r[5],
    })
  }
  stmt.free()
  return out
}

export function sumAccountBalancesCents(rows: AccountRow[]): number {
  return rows.reduce((s, r) => s + r.balance, 0)
}
