5. Calculation Logic
5.1 Tracker Progress
```sql
-- Get spent amount in current period
SELECT COALESCE(SUM(ABS(t.amount)), 0) as spent
FROM transactions t
INNER JOIN tracker_categories tc ON t.category_id = tc.category_id
WHERE tc.tracker_id = :trackerId
  AND t.settled_at >= (SELECT last_reset_date FROM trackers WHERE id = :trackerId)
  AND t.settled_at < (SELECT next_reset_date FROM trackers WHERE id = :trackerId)
  AND t.amount < 0
  AND t.is_round_up = 0;
```
```javascript
const remaining = tracker.budget_amount - spent;
const daysLeft = daysBetween(today, tracker.next_reset_date);
const progress = (spent / tracker.budget_amount) * 100;
```

5.2 Spendable Balance (Prorated)

**Single source of truth for proration** (Section 4.3 references this).

**Rules:** Only consider charges with `next_charge_date` **before** next payday; charges due on the payday itself are excluded. Only include charges where `next_charge_date` is in the future (e.g. `next_charge_date > today`); skip past or stale dates to avoid negative or incorrect reserved amounts.

```javascript
function calculateReservedAmount(upcomingCharges, nextPayday, paydayFrequency) {
  let totalReserved = 0;
  
  const paydayDays = {
    'WEEKLY': 7,
    'FORTNIGHTLY': 14,
    'MONTHLY': 30
  };
  
  const today = new Date();
  
  upcomingCharges.forEach(charge => {
    if (charge.next_charge_date >= nextPayday) {
      return; // Don't reserve for charges on or after next payday
    }
    if (charge.next_charge_date <= today) {
      return; // Skip past/stale charge dates
    }
    
    const daysUntilCharge = daysBetween(today, charge.next_charge_date);
    const daysUntilPayday = daysBetween(today, nextPayday);
    
    switch (charge.frequency) {
      case 'WEEKLY':
      case 'FORTNIGHTLY':
      case 'ONCE':
        totalReserved += charge.amount;
        break;
        
      case 'MONTHLY':
      case 'QUARTERLY':
      case 'YEARLY':
        // Prorate based on pay periods
        const payPeriodDays = paydayDays[paydayFrequency];
        const payPeriodsUntilCharge = Math.ceil(daysUntilCharge / payPeriodDays);
        const amountPerPeriod = charge.amount / payPeriodsUntilCharge;
        
        // Reserve only the portion for this pay period
        const portionToReserve = Math.min(amountPerPeriod, charge.amount);
        totalReserved += portionToReserve;
        break;
    }
  });
  
  return totalReserved;
}
```

5.3 Saver Goal Progress
```javascript
function calculateSaverProgress(saver) {
  const currentBalance = saver.current_balance;
  const goalAmount = saver.goal_amount;
  const targetDate = new Date(saver.target_date);
  const today = new Date();
  
  const remaining = goalAmount - currentBalance;
  const monthsRemaining = monthsBetween(today, targetDate);
  
  const recommendedMonthly = monthsRemaining > 0 
    ? remaining / monthsRemaining 
    : 0;
  
  const progress = (currentBalance / goalAmount) * 100;
  
  return {
    currentBalance,
    goalAmount,
    remaining,
    progress,
    monthsRemaining,
    recommendedMonthly,
    onTrack: recommendedMonthly <= saver.monthly_transfer
  };
}
```

5.4 Weekly Insights
```javascript
function getWeekRange() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7)); // Get Monday
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return { start: monday, end: sunday };
}

async function calculateWeeklyInsights() {
  const { start, end } = getWeekRange();
  
  const moneyIn = await db.execute(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM transactions
    WHERE amount > 0
      AND settled_at >= ? AND settled_at <= ?
  `, [start.toISOString(), end.toISOString()]);
  
  const moneyOut = await db.execute(`
    SELECT COALESCE(SUM(ABS(amount)), 0) as total
    FROM transactions
    WHERE amount < 0
      AND is_round_up = 0
      AND transfer_account_id IS NULL
      AND settled_at >= ? AND settled_at <= ?
  `, [start.toISOString(), end.toISOString()]);
  
  const saverChanges = await db.execute(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM transactions
    WHERE transfer_account_id IN (
      SELECT id FROM accounts WHERE account_type = 'SAVER'
    )
    AND settled_at >= ? AND settled_at <= ?
  `, [start.toISOString(), end.toISOString()]);
  
  const charges = await db.execute(`
    SELECT COUNT(*) as count
    FROM transactions
    WHERE amount < 0
      AND is_round_up = 0
      AND settled_at >= ? AND settled_at <= ?
  `, [start.toISOString(), end.toISOString()]);
  
  const payments = await db.execute(`
    SELECT COUNT(*) as count
    FROM transactions
    WHERE transfer_type IS NOT NULL
      AND settled_at >= ? AND settled_at <= ?
  `, [start.toISOString(), end.toISOString()]);
  
  return {
    moneyIn: moneyIn[0].total,
    moneyOut: moneyOut[0].total,
    saverChanges: saverChanges[0].total,
    charges: charges[0].count,
    payments: payments[0].count
  };
}
```
