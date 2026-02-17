/**
 * Database schema (Phase 1: schema version 1).
 * Creation order respects FK dependencies.
 */

import type { Database } from 'sql.js'

const SCHEMA_VERSION = 1

const DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    account_type TEXT NOT NULL,
    balance INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    ownership_type TEXT,
    synced_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
  )`,
  `CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    status TEXT NOT NULL,
    raw_text TEXT,
    description TEXT NOT NULL,
    message TEXT,
    is_categorizable INTEGER DEFAULT 1,
    category_id TEXT,
    parent_category_id TEXT,
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'AUD',
    foreign_amount INTEGER,
    foreign_currency TEXT,
    settled_at TEXT,
    created_at TEXT NOT NULL,
    is_round_up INTEGER DEFAULT 0,
    round_up_parent_id TEXT,
    transfer_account_id TEXT,
    transfer_type TEXT,
    synced_at TEXT,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (round_up_parent_id) REFERENCES transactions(id),
    FOREIGN KEY (transfer_account_id) REFERENCES accounts(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (parent_category_id) REFERENCES categories(id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_settled_at ON transactions(settled_at)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_round_up_parent_id ON transactions(round_up_parent_id)`,
  `CREATE TABLE IF NOT EXISTS trackers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    budget_amount INTEGER NOT NULL,
    reset_frequency TEXT NOT NULL,
    reset_day INTEGER,
    start_date TEXT NOT NULL,
    last_reset_date TEXT NOT NULL,
    next_reset_date TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS tracker_categories (
    tracker_id INTEGER NOT NULL,
    category_id TEXT NOT NULL,
    PRIMARY KEY (tracker_id, category_id),
    FOREIGN KEY (tracker_id) REFERENCES trackers(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  )`,
  `CREATE TABLE IF NOT EXISTS savers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    current_balance INTEGER NOT NULL,
    goal_amount INTEGER,
    target_date TEXT,
    monthly_transfer INTEGER,
    auto_transfer_day INTEGER,
    is_goal_based INTEGER DEFAULT 0,
    interest_rate REAL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS upcoming_charges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    amount INTEGER NOT NULL,
    frequency TEXT NOT NULL,
    next_charge_date TEXT NOT NULL,
    category_id TEXT,
    is_reserved INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  )`,
  `CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
]

export function runSchema(database: Database): void {
  for (const sql of DDL_STATEMENTS) {
    database.run(sql)
  }
  database.run(
    `INSERT OR REPLACE INTO app_settings (key, value) VALUES ('schema_version', ?)`,
    [String(SCHEMA_VERSION)]
  )
}

export { SCHEMA_VERSION }
