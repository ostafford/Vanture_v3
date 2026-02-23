import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculateReservedAmount } from './balance'

describe('calculateReservedAmount', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-02-23T12:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns 0 when nextPayday is null', () => {
    expect(
      calculateReservedAmount(
        [
          {
            next_charge_date: '2025-02-25',
            frequency: 'ONCE',
            amount: 1000,
            is_reserved: 1,
          },
        ],
        null,
        'MONTHLY'
      )
    ).toBe(0)
  })

  it('returns 0 when paydayFrequency is null', () => {
    expect(
      calculateReservedAmount(
        [
          {
            next_charge_date: '2025-02-25',
            frequency: 'ONCE',
            amount: 1000,
            is_reserved: 1,
          },
        ],
        '2025-03-01',
        null
      )
    ).toBe(0)
  })

  it('returns 0 for empty charges', () => {
    expect(calculateReservedAmount([], '2025-03-01', 'MONTHLY')).toBe(0)
  })

  it('ignores charges with is_reserved = 0', () => {
    expect(
      calculateReservedAmount(
        [
          {
            next_charge_date: '2025-02-25',
            frequency: 'ONCE',
            amount: 1000,
            is_reserved: 0,
          },
        ],
        '2025-03-01',
        'MONTHLY'
      )
    ).toBe(0)
  })

  it('reserves full amount for ONCE charge before next payday', () => {
    expect(
      calculateReservedAmount(
        [
          {
            next_charge_date: '2025-02-25',
            frequency: 'ONCE',
            amount: 5000,
            is_reserved: 1,
          },
        ],
        '2025-03-01',
        'MONTHLY'
      )
    ).toBe(5000)
  })

  it('reserves full amount for WEEKLY charge before next payday', () => {
    expect(
      calculateReservedAmount(
        [
          {
            next_charge_date: '2025-02-25',
            frequency: 'WEEKLY',
            amount: 3000,
            is_reserved: 1,
          },
        ],
        '2025-03-01',
        'WEEKLY'
      )
    ).toBe(3000)
  })

  it('prorates MONTHLY charge until next payday', () => {
    const reserved = calculateReservedAmount(
      [
        {
          next_charge_date: '2025-02-25',
          frequency: 'MONTHLY',
          amount: 3000,
          is_reserved: 1,
        },
      ],
      '2025-03-09',
      'MONTHLY'
    )
    expect(reserved).toBeGreaterThan(0)
    expect(reserved).toBeLessThanOrEqual(3000)
  })
})
