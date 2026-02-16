/**
 * Spendable balance: available (transactional accounts) minus reserved (prorated upcoming charges).
 * Reserved calculation per Arch_Docs 05_Calculation_logic.md Section 5.2.
 */

import { getDb, getAppSetting } from '@/db'

export type PaydayFrequency = 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY'

export interface UpcomingChargeRow {
  next_charge_date: string
  frequency: string
  amount: number
  is_reserved: number
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysBetween(dateStrA: string, dateStrB: string): number {
  const a = new Date(dateStrA + 'T12:00:00Z').getTime()
  const b = new Date(dateStrB + 'T12:00:00Z').getTime()
  return Math.round((b - a) / (24 * 60 * 60 * 1000))
}

/**
 * Prorated reserved amount (cents) from upcoming charges before next payday.
 * Only charges with next_charge_date before nextPayday and in the future; filter by is_reserved = 1 at call site.
 */
export function calculateReservedAmount(
  upcomingCharges: UpcomingChargeRow[],
  nextPayday: string | null,
  paydayFrequency: string | null
): number {
  if (!nextPayday || !paydayFrequency) return 0
  const charges = upcomingCharges.filter((c) => c.is_reserved === 1)
  let totalReserved = 0
  const paydayDays: Record<string, number> = {
    WEEKLY: 7,
    FORTNIGHTLY: 14,
    MONTHLY: 30,
  }
  const today = todayDateString()

  for (const charge of charges) {
    if (charge.next_charge_date >= nextPayday) continue
    if (charge.next_charge_date <= today) continue

    const daysUntilCharge = daysBetween(today, charge.next_charge_date)

    switch (charge.frequency) {
      case 'WEEKLY':
      case 'FORTNIGHTLY':
      case 'ONCE':
        totalReserved += charge.amount
        break
      case 'MONTHLY':
      case 'QUARTERLY':
      case 'YEARLY': {
        const payPeriodDays = paydayDays[paydayFrequency] ?? 30
        const payPeriodsUntilCharge = Math.ceil(daysUntilCharge / payPeriodDays)
        const amountPerPeriod =
          payPeriodsUntilCharge > 0 ? charge.amount / payPeriodsUntilCharge : charge.amount
        const portionToReserve = Math.min(amountPerPeriod, charge.amount)
        totalReserved += portionToReserve
        break
      }
      default:
        totalReserved += charge.amount
    }
  }
  return Math.round(totalReserved)
}

/**
 * Sum of balances (cents) of all transactional accounts.
 */
export function getAvailableBalance(): number {
  const db = getDb()
  if (!db) return 0
  const stmt = db.prepare(
    `SELECT COALESCE(SUM(balance), 0) as total FROM accounts WHERE account_type = 'TRANSACTIONAL'`
  )
  stmt.step()
  const row = stmt.get()
  stmt.free()
  return row ? Number(row[0]) : 0
}

/**
 * Reserved amount (cents) from upcoming_charges using 5.2 proration.
 */
export function getReservedAmount(): number {
  const db = getDb()
  if (!db) return 0
  const nextPayday = getAppSetting('next_payday')
  const paydayFrequency = getAppSetting('payday_frequency')
  const stmt = db.prepare(
    `SELECT next_charge_date, frequency, amount, is_reserved FROM upcoming_charges`
  )
  const charges: UpcomingChargeRow[] = []
  while (stmt.step()) {
    const row = stmt.get() as [string, string, number, number]
    charges.push({
      next_charge_date: row[0],
      frequency: row[1],
      amount: row[2],
      is_reserved: row[3],
    })
  }
  stmt.free()
  return calculateReservedAmount(charges, nextPayday, paydayFrequency)
}

/**
 * Spendable = Available - Reserved (cents).
 */
export function getSpendableBalance(): number {
  const available = getAvailableBalance()
  const reserved = getReservedAmount()
  return Math.max(0, available - reserved)
}
