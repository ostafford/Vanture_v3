export type MonthMetric = 'spending' | 'income' | 'net'

export interface DailyMetricCents {
  /** Money in (income) in cents for the day. */
  moneyInCents: number
  /** Money out (spending) in cents for the day (always positive). */
  moneyOutCents: number
}

export interface MonthDailyInput {
  /** Map of day-of-month (1-based) to that day's metrics in cents. */
  byDay: Record<number, DailyMetricCents>
  /** Number of days in the month (e.g. 28, 30, 31). */
  daysInMonth: number
}

export interface MonthSpendingSeriesPoint {
  day: number
  currentSpending: number | null
  previousSpending: number | null
  currentIncome: number | null
  previousIncome: number | null
  currentNet: number | null
  previousNet: number | null
}

export interface MonthSpendingSeries {
  points: MonthSpendingSeriesPoint[]
  /** Maximum day count across both months (used for x-axis domain). */
  maxDay: number
}

/**
 * Build cumulative 1..N day series for current and previous month using
 * daily money-in and money-out values (in cents). Values are converted to
 * cumulative cents and left as numbers for the caller to format.
 */
export function buildMonthSpendingSeries(
  current: MonthDailyInput | null,
  previous: MonthDailyInput | null
): MonthSpendingSeries {
  const currentDays = current?.daysInMonth ?? 0
  const previousDays = previous?.daysInMonth ?? 0
  const maxDay = Math.max(currentDays, previousDays, 0)

  let curIncomeCum = 0
  let curSpendingCum = 0
  let prevIncomeCum = 0
  let prevSpendingCum = 0

  const points: MonthSpendingSeriesPoint[] = []

  for (let day = 1; day <= maxDay; day += 1) {
    if (current && day <= current.daysInMonth) {
      const curMetrics = current.byDay[day]
      if (curMetrics) {
        curIncomeCum += curMetrics.moneyInCents
        curSpendingCum += curMetrics.moneyOutCents
      }
    }

    if (previous && day <= previous.daysInMonth) {
      const prevMetrics = previous.byDay[day]
      if (prevMetrics) {
        prevIncomeCum += prevMetrics.moneyInCents
        prevSpendingCum += prevMetrics.moneyOutCents
      }
    }

    const hasCurrentDay = current != null && day <= current.daysInMonth
    const hasPreviousDay = previous != null && day <= previous.daysInMonth

    points.push({
      day,
      currentSpending: hasCurrentDay ? curSpendingCum : null,
      previousSpending: hasPreviousDay ? prevSpendingCum : null,
      currentIncome: hasCurrentDay ? curIncomeCum : null,
      previousIncome: hasPreviousDay ? prevIncomeCum : null,
      currentNet: hasCurrentDay ? curIncomeCum - curSpendingCum : null,
      previousNet: hasPreviousDay ? prevIncomeCum - prevSpendingCum : null,
    })
  }

  return { points, maxDay }
}
