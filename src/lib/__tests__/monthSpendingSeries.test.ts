import { describe, expect, it } from 'vitest'
import {
  buildMonthSpendingSeries,
  type MonthDailyInput,
} from '@/lib/monthSpendingSeries'

describe('buildMonthSpendingSeries', () => {
  it('builds cumulative series for current and previous months', () => {
    const current: MonthDailyInput = {
      daysInMonth: 3,
      byDay: {
        1: { moneyInCents: 10000, moneyOutCents: 2000 },
        3: { moneyInCents: 5000, moneyOutCents: 1000 },
      },
    }
    const previous: MonthDailyInput = {
      daysInMonth: 2,
      byDay: {
        1: { moneyInCents: 8000, moneyOutCents: 3000 },
        2: { moneyInCents: 2000, moneyOutCents: 1000 },
      },
    }

    const { points, maxDay } = buildMonthSpendingSeries(current, previous)

    expect(maxDay).toBe(3)
    expect(points).toHaveLength(3)

    // Day 1: sums of first entries
    expect(points[0]).toMatchObject({
      day: 1,
      currentIncome: 10000,
      currentSpending: 2000,
      previousIncome: 8000,
      previousSpending: 3000,
      currentNet: 8000,
      previousNet: 5000,
    })

    // Day 2: current unchanged (no data), previous accumulated
    expect(points[1]).toMatchObject({
      day: 2,
      currentIncome: 10000,
      currentSpending: 2000,
      previousIncome: 10000,
      previousSpending: 4000,
      currentNet: 8000,
      previousNet: 6000,
    })

    // Day 3: current accumulates second entry, previous has no data (nulls)
    expect(points[2]).toMatchObject({
      day: 3,
      currentIncome: 15000,
      currentSpending: 3000,
      previousIncome: null,
      previousSpending: null,
      currentNet: 12000,
      previousNet: null,
    })
  })

  it('handles missing current or previous months', () => {
    const current: MonthDailyInput = {
      daysInMonth: 2,
      byDay: {
        1: { moneyInCents: 1000, moneyOutCents: 500 },
        2: { moneyInCents: 0, moneyOutCents: 100 },
      },
    }

    const { points, maxDay } = buildMonthSpendingSeries(current, null)

    expect(maxDay).toBe(2)
    expect(points[1]).toMatchObject({
      day: 2,
      currentIncome: 1000,
      currentSpending: 600,
      previousIncome: null,
      previousSpending: null,
    })
  })
})
