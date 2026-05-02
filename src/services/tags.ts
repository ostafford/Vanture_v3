import { getDb, schedulePersist } from '@/db'

/** All tag labels known to the local DB, sorted alphabetically. */
export function getAllTags(): string[] {
  const db = getDb()
  if (!db) return []
  const stmt = db.prepare(`SELECT id FROM tags ORDER BY id`)
  const tags: string[] = []
  while (stmt.step()) tags.push((stmt.get() as [string])[0])
  stmt.free()
  return tags
}

/** Tags attached to a single transaction. */
export function getTagsForTransaction(transactionId: string): string[] {
  const db = getDb()
  if (!db) return []
  const stmt = db.prepare(
    `SELECT tag_id FROM transaction_tags WHERE transaction_id = ? ORDER BY tag_id`
  )
  stmt.bind([transactionId])
  const tags: string[] = []
  while (stmt.step()) tags.push((stmt.get() as [string])[0])
  stmt.free()
  return tags
}

/** Tags for multiple transactions. Returns map transaction_id → tag labels[]. */
export function getTagsForTransactions(
  transactionIds: string[]
): Map<string, string[]> {
  const db = getDb()
  const map = new Map<string, string[]>()
  if (!db || transactionIds.length === 0) return map
  const placeholders = transactionIds.map(() => '?').join(',')
  const stmt = db.prepare(
    `SELECT transaction_id, tag_id FROM transaction_tags
     WHERE transaction_id IN (${placeholders}) ORDER BY tag_id`
  )
  stmt.bind(transactionIds as unknown as (string | number)[])
  while (stmt.step()) {
    const row = stmt.get() as [string, string]
    const existing = map.get(row[0]) ?? []
    existing.push(row[1])
    map.set(row[0], existing)
  }
  stmt.free()
  return map
}

/**
 * Replace all tags for a transaction in the local DB.
 * Called after a successful API write (add or remove).
 */
export function setTransactionTagsLocal(
  transactionId: string,
  tagIds: string[]
): void {
  const db = getDb()
  if (!db) throw new Error('Database not ready')
  db.run(`DELETE FROM transaction_tags WHERE transaction_id = ?`, [
    transactionId,
  ])
  for (const tagId of tagIds) {
    db.run(`INSERT OR IGNORE INTO tags (id) VALUES (?)`, [tagId])
    db.run(
      `INSERT OR IGNORE INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)`,
      [transactionId, tagId]
    )
  }
  schedulePersist()
}
