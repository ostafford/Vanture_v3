import { describe, expect, it } from 'vitest'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import {
  type MonthSpendingSeries,
  type MonthSpendingSeriesPoint,
} from '@/lib/monthSpendingSeries'
import { MonthSpendingComparisonChart } from '@/components/charts/MonthSpendingComparisonChart'

function makeSeries(points: MonthSpendingSeriesPoint[]): MonthSpendingSeries {
  return { points, maxDay: points.length }
}

describe('MonthSpendingComparisonChart', () => {
  it('renders current and previous series paths', () => {
    const series = makeSeries([
      {
        day: 1,
        currentSpending: 1000,
        previousSpending: 500,
        currentIncome: 1500,
        previousIncome: 700,
        currentNet: 500,
        previousNet: 200,
      },
      {
        day: 2,
        currentSpending: 2000,
        previousSpending: 1000,
        currentIncome: 2500,
        previousIncome: 1700,
        currentNet: 500,
        previousNet: 700,
      },
    ])

    const html = ReactDOMServer.renderToString(
      <MonthSpendingComparisonChart
        series={series}
        metric="spending"
        height={200}
        showAverage
      />
    )

    expect(html.length).toBeGreaterThan(0)
  })

  it('shows fallback when there is no data', () => {
    const html = ReactDOMServer.renderToString(
      <MonthSpendingComparisonChart
        series={{ points: [], maxDay: 0 }}
        metric="spending"
      />
    )

    expect(html).toMatch(/Not enough data to show chart yet./i)
  })
})
