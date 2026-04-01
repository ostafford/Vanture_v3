import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/db', () => ({
  getAppSetting: vi.fn(),
  setAppSetting: vi.fn(),
}))

vi.mock('@/services/balance', () => ({
  getAvailableBalance: vi.fn(),
  getSpendableBalance: vi.fn(),
  getPayAmountCents: vi.fn(),
  getReservedAmount: vi.fn(),
}))

vi.mock('@/services/upcoming', () => ({
  getUpcomingChargesGrouped: vi.fn(),
}))

vi.mock('@/services/insights', () => ({
  getWeeklyInsights: vi.fn(),
  getWeekRange: vi.fn(),
}))

import { buildWantPlannerSnapshot } from './wantPlanner'
import type { UpcomingChargeRow } from './upcoming'
import { getAppSetting } from '@/db'
import {
  getAvailableBalance,
  getPayAmountCents,
  getReservedAmount,
  getSpendableBalance,
} from '@/services/balance'
import { getUpcomingChargesGrouped } from '@/services/upcoming'
import { getWeeklyInsights, getWeekRange } from '@/services/insights'

describe('buildWantPlannerSnapshot (mocked dependencies)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-15T12:00:00Z'))
    vi.mocked(getAvailableBalance).mockReturnValue(100_000)
    vi.mocked(getSpendableBalance).mockReturnValue(90_000)
    vi.mocked(getReservedAmount).mockReturnValue(10_000)
    vi.mocked(getPayAmountCents).mockReturnValue(null)
    vi.mocked(getAppSetting).mockImplementation((key: string) => {
      if (key === 'next_payday') return '2026-03-29'
      if (key === 'payday_frequency') return 'FORTNIGHTLY'
      if (key === 'spendable_alert_below_cents') return ''
      if (key === 'spendable_alert_below_pct_pay') return ''
      return null
    })
    vi.mocked(getUpcomingChargesGrouped).mockReturnValue({
      nextPay: [{ amount: 5_000 } as UpcomingChargeRow],
      later: [],
      nextPayday: '2026-03-29',
    })
    let weekCall = 0
    vi.mocked(getWeekRange).mockImplementation(() => {
      weekCall += 1
      return { start: `w${weekCall}`, end: `w${weekCall}` } as ReturnType<
        typeof getWeekRange
      >
    })
    vi.mocked(getWeeklyInsights).mockReturnValue({
      moneyOut: 10_000,
    } as ReturnType<typeof getWeeklyInsights>)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('uses max(upcoming, behavioral) as needEstimateCents', () => {
    vi.mocked(getWeeklyInsights).mockReturnValue({
      moneyOut: 20_000,
    } as ReturnType<typeof getWeeklyInsights>)
    const snap = buildWantPlannerSnapshot()
    expect(snap.upcomingNeedsBeforeNextPayCents).toBe(5_000)
    expect(snap.weeksUntilNextPayday).toBeGreaterThanOrEqual(1)
    expect(snap.behavioralNeedCents).toBeGreaterThan(5_000)
    expect(snap.needEstimateCents).toBe(
      Math.max(5_000, snap.behavioralNeedCents)
    )
  })

  it('caps base savings by pay amount when pay settings exist', () => {
    vi.mocked(getWeeklyInsights).mockReturnValue({
      moneyOut: 5_000,
    } as ReturnType<typeof getWeeklyInsights>)
    vi.mocked(getPayAmountCents).mockReturnValue(15_000)
    const snap = buildWantPlannerSnapshot()
    expect(snap.completeness.hasPayAmount).toBe(true)
    expect(snap.baseSavingsPerPayPeriodCents).toBeLessThanOrEqual(15_000)
    expect(snap.baseSavingsPerPayPeriodCents).toBe(
      Math.min(Math.max(0, 100_000 - snap.needEstimateCents), 15_000)
    )
  })

  it('returns zero recommendation when needs consume available after buffer', () => {
    vi.mocked(getAvailableBalance).mockReturnValue(8_000)
    vi.mocked(getWeeklyInsights).mockReturnValue({
      moneyOut: 50_000,
    } as ReturnType<typeof getWeeklyInsights>)
    const snap = buildWantPlannerSnapshot()
    expect(snap.needEstimateCents).toBeGreaterThanOrEqual(
      snap.upcomingNeedsBeforeNextPayCents
    )
    expect(snap.recommendedBeforeNextPayCents).toBe(0)
  })
})
