import { describe, it, expect } from 'vitest'
import {
  formatMoney,
  formatDate,
  formatShortDate,
  formatShortDateFromDate,
  formatShortDateWithYear,
} from './format'

describe('formatMoney', () => {
  it('formats cents as dollars with two decimals', () => {
    expect(formatMoney(0)).toBe('0.00')
    expect(formatMoney(100)).toBe('1.00')
    expect(formatMoney(12345)).toBe('123.45')
    expect(formatMoney(-500)).toBe('-5.00')
  })
})

describe('formatDate', () => {
  it('formats ISO date string with day, month, and year', () => {
    const out = formatDate('2025-02-23')
    expect(out).toContain('23')
    expect(out).toContain('Feb')
    expect(out).toContain('2025')
  })
  it('formats another date', () => {
    const out = formatDate('2025-12-01')
    expect(out).toContain('1')
    expect(out).toContain('Dec')
    expect(out).toContain('2025')
  })
  it('returns Invalid Date string for unparseable input', () => {
    expect(formatDate('invalid')).toBe('Invalid Date')
  })
})

describe('formatShortDateFromDate', () => {
  it('formats Date as weekday, day, month', () => {
    const d = new Date(2025, 1, 9)
    const out = formatShortDateFromDate(d)
    expect(out).toContain('9')
    expect(out).toContain('Feb')
  })
})

describe('formatShortDate', () => {
  it('formats ISO date string with weekday', () => {
    const out = formatShortDate('2025-02-09')
    expect(out).toContain('9')
    expect(out).toContain('Feb')
  })
  it('returns Invalid Date string for unparseable input', () => {
    expect(formatShortDate('x')).toBe('Invalid Date')
  })
})

describe('formatShortDateWithYear', () => {
  it('includes two-digit year', () => {
    const out = formatShortDateWithYear('2025-02-09')
    expect(out).toContain('9')
    expect(out).toContain('Feb')
    expect(out).toContain("'25")
  })
  it('returns Invalid Date string for unparseable input', () => {
    const out = formatShortDateWithYear('bad')
    expect(out).toContain('Invalid Date')
  })
})
