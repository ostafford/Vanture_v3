## 4. Core Features

### **4.1 Dashboard (Home)**

**Layout (3-column):**
```
┌─────────────────────────────────────────────────────────┐
│  Header: Available / Spendable / Sync / Theme           │
├───────────────┬──────────────────┬──────────────────────┤
│  LEFT         │  CENTER          │  RIGHT               │
│               │                  │                      │
│  SAVERS       │  INSIGHTS        │  TRACKERS            │
│  - Total      │  - Week range    │  - Active trackers   │
│  - List       │  - Money In/Out  │  - Progress bars     │
│  - Progress   │  - Categories    │  - Days remaining    │
│               │                  │                      │
├───────────────┴──────────────────┴──────────────────────┤
│  UPCOMING TRANSACTIONS                                  │
│  - Pay Day indicator                                    │
│  - Next pay (grouped)                                   │
│  - Later (grouped)                                      │
│  - Reserved amount                                      │
└─────────────────────────────────────────────────────────┘
```

**Key Metrics:**
- **Available Balance:** Current transactional account balance
- **Spendable Balance:** Available - Reserved for Upcoming
- **Last Synced:** Timestamp of last sync

---

### **4.2 Trackers**

**Features:**
- ✅ Create tracker with single OR multiple categories
- ✅ Set budget amount (e.g., $200/week)
- ✅ Choose reset frequency: Weekly, Fortnightly, Monthly, Payday
- ✅ Visual progress bar showing spent vs remaining
- ✅ Days until reset
- ✅ List of transactions in current period

**UI Flow:**
1. Click "+ Add Tracker"
2. Modal opens:
   - Name (e.g., "Food & Drink")
   - Budget amount ($)
   - Reset frequency (dropdown)
   - Select categories (multi-select with search)
3. Save → Auto-calculates progress

**Example:**
```
Tracker: Food & Drink
Budget: $300/week
Categories: Groceries, Restaurants & Cafes, Pubs & Bars, Takeaway
Progress: $187 spent / $113 left / 3 days to go
▓▓▓▓▓▓▓▓░░░░ (62%)

Recent transactions:
- Wed 12 Feb | ALDI | $43
- Tue 11 Feb | The Butchers Den | $28
- Tue 10 Feb | Coles | $26

4.3 Spendable Balance

**Formula:** Spendable = Available - Reserved.

The reserved amount is computed using the **canonical logic in Section 5.2 of [05_Calculation_logic.md](05_Calculation_logic.md)**. Charges due **on** the next payday are excluded from the reserved amount; only charges due *before* the next payday are reserved.

**Display:**
```
Available: $2,224.00
Reserved: $20.23
─────────────────
Spendable: $2,203.77
```

Clicking "ⓘ" shows tooltip explaining calculation.

---

### **4.4 Savers**

Saver rows are linked to accounts by **same id**: `savers.id` = `accounts.id` for that saver. Goal amount, target date, and auto-transfer may come from the Up API where available (see [06_Sync_Strategy.md](06_Sync_Strategy.md)) or be user-defined in the app.

**Features:**
- ✅ List all saver accounts
- ✅ Show current balance vs goal
- ✅ Progress bars
- ✅ Monthly auto-transfer amount
- ✅ Interest rate (if applicable)
- ✅ Estimated completion date
- ✅ Transaction history per saver

**Saver Card Example:**
```
┌─────────────────────────────────────────┐
│ 🚨 Emergency                            │
│ $250 of $1,000                          │
│ ▓▓▓░░░░░░░ 25%                          │
│ Auto-transfer: $150/month (1st)         │
│ Target: Dec 2026                        │
└─────────────────────────────────────────┘
Goal Calculation:
```javascript
monthsRemaining = monthsBetween(today, targetDate);
recommendedMonthly = (goalAmount - currentBalance) / monthsRemaining;
// If user manually adds extra funds: recalculate monthly amount OR adjust target date
```

Loose Change (Special Saver):

Auto-increments with every round-up transaction
No goal (indefinite)
Display total accumulated


4.5 Spending Insights
Metrics (Weekly, Monthly, Yearly, Financial Year):
```sql
-- Money In
SELECT SUM(amount) FROM transactions 
WHERE amount > 0 AND settled_at BETWEEN startDate AND endDate;

-- Money Out
SELECT SUM(ABS(amount)) FROM transactions 
WHERE amount < 0 
  AND is_round_up = 0 
  AND transfer_account_id IS NULL 
  AND settled_at BETWEEN startDate AND endDate;

-- Changes in Savers
SELECT SUM(amount) FROM transactions 
WHERE transfer_account_id IN (SELECT id FROM accounts WHERE account_type = 'SAVER')
  AND settled_at BETWEEN startDate AND endDate;

-- Charges (count)
SELECT COUNT(*) FROM transactions 
WHERE amount < 0 
  AND is_round_up = 0 
  AND settled_at BETWEEN startDate AND endDate;

-- Payments made (count)
SELECT COUNT(*) FROM transactions 
WHERE transfer_type IS NOT NULL 
  AND settled_at BETWEEN startDate AND endDate;
```

**Display:**
```
Weekly Insights (9 Feb - 15 Feb)

Money In:              $0
Money Out:       $188.97
Changes in Savers:  +$5.47
Charges:             7
Payments made:       0
```

**Categories Breakdown:**
- Good Life: $80 (yellow bar)
- Personal: $13 (orange bar)
- Home: $96 (purple bar)
- Transport: $0 (blue bar)

---

### **4.6 Upcoming Transactions**

**Features:**
- ✅ Manual entry of regular charges
- ✅ Grouped by "Next pay" and "Later"
- ✅ Shows reserved amount
- ✅ Edit/delete upcoming charges

**UI Flow:**
1. Click transaction → "Create Regular"
2. Modal:
   - Name (auto-filled from merchant)
   - Amount
   - Frequency (dropdown)
   - Next charge date
   - Category
   - Include in Spendable? (checkbox, default: yes)
3. Save → Added to `upcoming_charges` table

**Display:**
```
💰 Pay Day - Due Tue 10 Feb

↓ Next pay  10 Feb - 23 Feb                    $121
┌────────────────────────────────────────────┐
│ Fri 14  Gregson & Associates  Weekly  $53 │
│ Tue 18  Apple                Monthly   $5 │
│ Thu 20  Gregson & Associates  Weekly  $53 │
│ Fri 21  Oura                 Monthly  $10 │
└────────────────────────────────────────────┘

↓ Later
┌────────────────────────────────────────────┐
│ Tue 25  ALDI Mobile          Monthly  $40 │
│ Thu 27  Gregson & Associates  Weekly  $53 │
│         💰 $20.23 reserved for Upcoming    │
└────────────────────────────────────────────┘
```

---

### **4.7 Transactions**

**Features:**
- ✅ Full transaction history
- ✅ Filters: Date range, Category, Amount range, Search
- ✅ Sorting: Date, Amount, Merchant
- ✅ Grouped by date
- ✅ Shows round-ups linked to parent transaction
- ✅ Pagination (Phase 5): default 50 per page with "Load more" for large sets; total count and "Showing N of M" displayed.

**Display:**
```
Transactions

[Filters]  [Search: "ALDI"]

Wed 12 Feb
- ALDI                $43.00  (Groceries)
  Round-up            +$0.42  → Loose Change
- The Butchers Den    $28.00  (Groceries)
  Round-up            +$0.72  → Loose Change

Tue 11 Feb
- Coles               $26.00  (Groceries)
  Round-up            +$0.74  → Loose Change
```