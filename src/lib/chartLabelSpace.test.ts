import { describe, it, expect } from 'vitest'
import {
  estimateLeftAxisLabelSpace,
  estimateBottomAxisLabelSpace,
} from './chartLabelSpace'

describe('estimateLeftAxisLabelSpace', () => {
  it('returns min when labels are empty', () => {
    expect(estimateLeftAxisLabelSpace([])).toBe(56)
    expect(estimateLeftAxisLabelSpace([], 12, { minPx: 40 })).toBe(40)
  })

  it('increases with longer labels and font size', () => {
    const short = estimateLeftAxisLabelSpace(['A', 'B'], 12)
    const long = estimateLeftAxisLabelSpace(['Very Long Category Name'], 12)
    expect(long).toBeGreaterThan(short)
    const largeFont = estimateLeftAxisLabelSpace(['Same'], 16)
    const smallFont = estimateLeftAxisLabelSpace(['Same'], 10)
    expect(largeFont).toBeGreaterThanOrEqual(smallFont)
  })

  it('respects maxPx option', () => {
    const space = estimateLeftAxisLabelSpace(
      ['Very long label that would normally need lots of pixels'],
      12,
      { maxPx: 80 }
    )
    expect(space).toBeLessThanOrEqual(80)
  })
})

describe('estimateBottomAxisLabelSpace', () => {
  it('returns min when labels are empty', () => {
    expect(estimateBottomAxisLabelSpace([])).toBe(20)
    expect(estimateBottomAxisLabelSpace([], 11, { minPx: 30 })).toBe(30)
  })

  it('increases with longer labels', () => {
    const short = estimateBottomAxisLabelSpace(['A'], 11)
    const long = estimateBottomAxisLabelSpace(
      ['Very Long Category Name Here'],
      11
    )
    expect(long).toBeGreaterThan(short)
  })

  it('uses rotatedDeg for height calculation', () => {
    const withRotation = estimateBottomAxisLabelSpace(['Category'], 11, {
      rotatedDeg: -60,
    })
    const noRotation = estimateBottomAxisLabelSpace(['Category'], 11, {
      rotatedDeg: 0,
    })
    expect(withRotation).toBeGreaterThan(noRotation)
  })
})
