3. Database Schema
Tables Overview:
accounts
├── transactions (foreign key: account_id)
│   ├── round_up_parent_id (self-referencing)
│   └── transfer_account_id (foreign key: account_id)
├── savers (same id as accounts: for each saver account, savers.id = accounts.id; one row in accounts with account_type = 'SAVER', one row in savers with same id and extra goal fields; join on id)
categories
├── tracker_categories (foreign key: category_id)
│   └── trackers (foreign key: tracker_id)
└── transactions (foreign key: category_id)
upcoming_charges
└── category_id (foreign key: categories)
app_settings

Detailed Schema:
accounts
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  account_type TEXT NOT NULL,        -- 'TRANSACTIONAL' | 'SAVER'
  balance INTEGER NOT NULL,          -- Cents
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  ownership_type TEXT,
  synced_at TEXT
);

transactions
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  status TEXT NOT NULL,              -- 'HELD' | 'SETTLED'
  raw_text TEXT,
  description TEXT NOT NULL,
  message TEXT,
  is_categorizable INTEGER DEFAULT 1,
  category_id TEXT,
  parent_category_id TEXT,
  amount INTEGER NOT NULL,           -- Cents (negative = debit)
  currency TEXT DEFAULT 'AUD',
  foreign_amount INTEGER,
  foreign_currency TEXT,
  settled_at TEXT,
  created_at TEXT NOT NULL,
  
  -- Round-up tracking
  is_round_up INTEGER DEFAULT 0,
  round_up_parent_id TEXT,
  
  -- Transfer tracking
  transfer_account_id TEXT,
  transfer_type TEXT,                -- 'SCHEDULED' | 'MANUAL'
  
  synced_at TEXT,
  
  FOREIGN KEY (account_id) REFERENCES accounts(id),
  FOREIGN KEY (round_up_parent_id) REFERENCES transactions(id),
  FOREIGN KEY (transfer_account_id) REFERENCES accounts(id),
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (parent_category_id) REFERENCES categories(id)
);

CREATE INDEX idx_transactions_settled_at ON transactions(settled_at);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);

categories
```sql
CREATE TABLE categories (
  id TEXT PRIMARY KEY,               -- e.g., 'groceries'
  name TEXT NOT NULL,                -- e.g., 'Groceries'
  parent_id TEXT,
  
  FOREIGN KEY (parent_id) REFERENCES categories(id)
);
```
trackers
```sql
CREATE TABLE trackers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  budget_amount INTEGER NOT NULL,    -- Cents
  reset_frequency TEXT NOT NULL,     -- 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY' | 'PAYDAY'
  reset_day INTEGER,                 -- 1-7 (weekday) or 1-31 (day of month)
  start_date TEXT NOT NULL,
  last_reset_date TEXT NOT NULL,
  next_reset_date TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL
);
```
For `reset_frequency = 'PAYDAY'`, **next_reset_date** and **last_reset_date** are derived from the user's payday settings in app_settings (`payday_frequency`, `payday_day`, `next_payday`). When advancing tracker periods (e.g. on sync or app open), recalculate the next payday from those settings and set the tracker's reset dates accordingly.

tracker_categories (many-to-many)
```sql
CREATE TABLE tracker_categories (
  tracker_id INTEGER NOT NULL,
  category_id TEXT NOT NULL,
  
  PRIMARY KEY (tracker_id, category_id),
  FOREIGN KEY (tracker_id) REFERENCES trackers(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```
savers
```sql
CREATE TABLE savers (
  id TEXT PRIMARY KEY,               -- Up API saver account ID
  name TEXT NOT NULL,
  icon TEXT,
  current_balance INTEGER NOT NULL,  -- Cents
  goal_amount INTEGER,               -- Cents (NULL if no goal)
  target_date TEXT,
  monthly_transfer INTEGER,
  auto_transfer_day INTEGER,
  is_goal_based INTEGER DEFAULT 0,
  interest_rate REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```
upcoming_charges
```sql
CREATE TABLE upcoming_charges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  amount INTEGER NOT NULL,           -- Cents
  frequency TEXT NOT NULL,           -- 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ONCE'
  next_charge_date TEXT NOT NULL,
  category_id TEXT,
  is_reserved INTEGER DEFAULT 1,     -- Include in Spendable calculation
  created_at TEXT NOT NULL,
  
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```
app_settings
```sql
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

-- Key-value pairs:
-- 'api_token_encrypted': Encrypted API token (base64 IV + AES-GCM ciphertext). See 08_Security.
-- 'encryption_salt': Salt for PBKDF2 key derivation (base64, 16 bytes). See 08_Security.
-- API token is stored encrypted; key is derived from user passphrase (never stored).
-- 'schema_version': Positive integer. Set when schema is created or migrated; used to run migrations when the app detects a lower stored version than the code expects.
-- 'theme': 'light' | 'dark'
-- 'last_sync': ISO timestamp
-- 'payday_frequency': 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY'
-- 'next_payday': ISO date
-- 'payday_day': Day of week (1-7) or day of month (1-31)
-- 'onboarding_complete': '0' | '1'
-- 'accent_color': User-selected accent (Phase 12). One of: 'purple', 'blue', 'teal', 'green', 'amber', 'rose'. Default purple.

**Schema versioning and migrations:** When creating the DB for the first time, set `app_settings.schema_version` to the current schema version (e.g. 1). When the documented schema in this file is updated (new tables, new columns, or breaking changes), increment the schema version and implement migration logic: on app init, read stored `schema_version`; if it is less than the version required by the code, run the appropriate migration(s) (e.g. ALTER TABLE, new tables), then set `schema_version` to the new value. Phase 1 creates schema version 1 only.
