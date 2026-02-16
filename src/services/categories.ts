import { getDb } from '@/db'

export interface CategoryRow {
  id: string
  name: string
}

export function getCategories(): CategoryRow[] {
  const db = getDb()
  if (!db) return []
  const stmt = db.prepare(`SELECT id, name FROM categories ORDER BY name`)
  const list: CategoryRow[] = []
  while (stmt.step()) {
    const row = stmt.get() as [string, string]
    list.push({ id: row[0], name: row[1] })
  }
  stmt.free()
  return list
}
