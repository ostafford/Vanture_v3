import { describe, it, expect } from 'vitest'
import {
  getPaydayDayOptions,
  PAYDAY_DAYS_WEEKLY,
  PAYDAY_DAYS_MONTHLY,
} from './payday'

describe('getPaydayDayOptions', () => {
  it('returns weekly options for WEEKLY', () => {
    const opts = getPaydayDayOptions('WEEKLY')
    expect(opts).toEqual(PAYDAY_DAYS_WEEKLY)
    expect(opts).toHaveLength(7)
    expect(opts[0]).toEqual({ value: 1, label: 'Monday' })
  })

  it('returns weekly options for FORTNIGHTLY', () => {
    const opts = getPaydayDayOptions('FORTNIGHTLY')
    expect(opts).toEqual(PAYDAY_DAYS_WEEKLY)
  })

  it('returns monthly options for MONTHLY', () => {
    const opts = getPaydayDayOptions('MONTHLY')
    expect(opts).toEqual(PAYDAY_DAYS_MONTHLY)
    expect(opts).toHaveLength(28)
    expect(opts[0]).toEqual({ value: 1, label: '1st' })
    expect(opts[1]).toEqual({ value: 2, label: '2nd' })
    expect(opts[2]).toEqual({ value: 3, label: '3rd' })
    expect(opts[3]).toEqual({ value: 4, label: '4th' })
  })
})
