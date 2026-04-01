import { describe, expect, it } from 'vitest'
import {
  monthlyEquivalentMultiplier,
  toMonthlyEquivalentCents,
} from '@/lib/monthlyEquivalent'

describe('monthlyEquivalent', () => {
  it('converts recurring frequencies to monthly multipliers', () => {
    expect(monthlyEquivalentMultiplier('MONTHLY')).toBe(1)
    expect(monthlyEquivalentMultiplier('QUARTERLY')).toBeCloseTo(1 / 3)
    expect(monthlyEquivalentMultiplier('YEARLY')).toBeCloseTo(1 / 12)
    expect(monthlyEquivalentMultiplier('WEEKLY')).toBeCloseTo(52 / 12)
    expect(monthlyEquivalentMultiplier('FORTNIGHTLY')).toBeCloseTo(26 / 12)
  })

  it('returns 0 for unknown frequency', () => {
    expect(monthlyEquivalentMultiplier('ONCE')).toBe(0)
    expect(toMonthlyEquivalentCents(10000, 'ONCE')).toBe(0)
  })

  it('computes monthly equivalent cents with rounding', () => {
    // $10 weekly → about $43.33/month
    expect(toMonthlyEquivalentCents(1000, 'WEEKLY')).toBe(
      Math.round(1000 * (52 / 12))
    )
  })
})
