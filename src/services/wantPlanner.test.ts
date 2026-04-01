import { describe, expect, it } from 'vitest'
import {
  allocatePerWantPerPayCents,
  formatCompactDurationFromDays,
  formatMixedDurationFromDays,
  getExpectedPerPayCentsForTarget,
  getNeedEstimateDriver,
  getWantScheduleHealth,
} from './wantPlanner'

describe('getNeedEstimateDriver', () => {
  it('returns upcoming when charges exceed behavioral estimate', () => {
    expect(
      getNeedEstimateDriver({
        upcomingNeedsBeforeNextPayCents: 5000,
        behavioralNeedCents: 3000,
      })
    ).toBe('upcoming')
  })

  it('returns behavioral when spending pace exceeds charges', () => {
    expect(
      getNeedEstimateDriver({
        upcomingNeedsBeforeNextPayCents: 2000,
        behavioralNeedCents: 8000,
      })
    ).toBe('behavioral')
  })

  it('returns tie when both legs are equal', () => {
    expect(
      getNeedEstimateDriver({
        upcomingNeedsBeforeNextPayCents: 4000,
        behavioralNeedCents: 4000,
      })
    ).toBe('tie')
  })
})

describe('allocatePerWantPerPayCents', () => {
  it('splits equally across active wants with remainder distributed', () => {
    const map = allocatePerWantPerPayCents(100, 'equal', [
      { id: 1, remainingCents: 1000, priorityRank: 1, allocationPercent: null },
      { id: 2, remainingCents: 1000, priorityRank: 2, allocationPercent: null },
      { id: 3, remainingCents: 1000, priorityRank: 3, allocationPercent: null },
    ])
    expect(map.get(1)! + map.get(2)! + map.get(3)!).toBe(100)
    expect(Math.abs(map.get(1)! - map.get(2)!)).toBeLessThanOrEqual(1)
  })

  it('priority mode fills highest priority first', () => {
    const map = allocatePerWantPerPayCents(150, 'priority', [
      { id: 1, remainingCents: 80, priorityRank: 1, allocationPercent: null },
      { id: 2, remainingCents: 200, priorityRank: 2, allocationPercent: null },
    ])
    expect(map.get(1)).toBe(80)
    expect(map.get(2)).toBe(70)
  })

  it('percent mode uses allocation weights when they sum above zero', () => {
    const map = allocatePerWantPerPayCents(100, 'percent', [
      {
        id: 1,
        remainingCents: 1000,
        priorityRank: 1,
        allocationPercent: 25,
      },
      {
        id: 2,
        remainingCents: 1000,
        priorityRank: 2,
        allocationPercent: 75,
      },
    ])
    expect(map.get(1)).toBe(25)
    expect(map.get(2)).toBe(75)
  })
})

describe('getWantScheduleHealth', () => {
  const now = new Date('2026-03-24T00:00:00Z')

  it('returns onTrack when projected completion is on target date', () => {
    const result = getWantScheduleHealth({
      remainingCents: 20000,
      perPayCents: 10000,
      payPeriodDays: 14,
      behavioralMultiplier: 1,
      targetDate: '2026-04-21',
      now,
    })
    expect(result.status).toBe('onTrack')
    expect(result.tone).toBe('success')
    expect(result.daysDeltaToTarget).toBe(0)
  })

  it('returns atRisk when projected completion is 1-45 days late', () => {
    const result = getWantScheduleHealth({
      remainingCents: 40000,
      perPayCents: 10000,
      payPeriodDays: 14,
      behavioralMultiplier: 1,
      targetDate: '2026-05-04',
      now,
    })
    expect(result.status).toBe('atRisk')
    expect(result.tone).toBe('warning')
    expect(result.daysDeltaToTarget).toBe(15)
  })

  it('returns offTrack when projected completion is over 45 days late', () => {
    const result = getWantScheduleHealth({
      remainingCents: 50000,
      perPayCents: 10000,
      payPeriodDays: 14,
      behavioralMultiplier: 1,
      targetDate: '2026-04-06',
      now,
    })
    expect(result.status).toBe('offTrack')
    expect(result.tone).toBe('danger')
    expect(result.daysDeltaToTarget).toBe(57)
  })

  it('returns noTargetDate when target date is missing', () => {
    const result = getWantScheduleHealth({
      remainingCents: 20000,
      perPayCents: 10000,
      payPeriodDays: 14,
      behavioralMultiplier: 1,
      targetDate: null,
      now,
    })
    expect(result.status).toBe('noTargetDate')
    expect(result.tone).toBe('secondary')
    expect(result.daysDeltaToTarget).toBeNull()
  })

  it('returns noPace when per-pay pace is zero', () => {
    const result = getWantScheduleHealth({
      remainingCents: 20000,
      perPayCents: 0,
      payPeriodDays: 14,
      behavioralMultiplier: 1,
      targetDate: '2026-05-30',
      now,
    })
    expect(result.status).toBe('noPace')
    expect(result.tone).toBe('secondary')
    expect(result.daysDeltaToTarget).toBeNull()
  })
})

describe('formatMixedDurationFromDays', () => {
  it('formats mixed months and days', () => {
    expect(formatMixedDurationFromDays(449)).toBe('1 year 2 months')
  })

  it('formats short values as days', () => {
    expect(formatMixedDurationFromDays(12)).toBe('12 days')
  })
})

describe('formatCompactDurationFromDays', () => {
  it('formats compact mixed units', () => {
    expect(formatCompactDurationFromDays(449)).toBe('1y 2mo')
  })

  it('formats compact days', () => {
    expect(formatCompactDurationFromDays(12)).toBe('12d')
  })
})

describe('getExpectedPerPayCentsForTarget', () => {
  const now = new Date('2026-03-24T00:00:00Z')

  it('returns required pace to hit target date', () => {
    const result = getExpectedPerPayCentsForTarget({
      remainingCents: 40000,
      payPeriodDays: 14,
      behavioralMultiplier: 1,
      targetDate: '2026-05-05',
      now,
    })
    expect(result).toBe(10000)
  })

  it('returns full remaining when target date already passed', () => {
    const result = getExpectedPerPayCentsForTarget({
      remainingCents: 40000,
      payPeriodDays: 14,
      behavioralMultiplier: 1,
      targetDate: '2026-03-01',
      now,
    })
    expect(result).toBe(40000)
  })
})
