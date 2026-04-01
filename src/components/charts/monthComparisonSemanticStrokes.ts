import type {
  MonthMetric,
  MonthSpendingSeriesPoint,
} from '@/lib/monthSpendingSeries'

const SUCCESS_COLOR = 'var(--vantura-success, #1bcfb4)'
const DANGER_COLOR = 'var(--vantura-danger, #fe7c96)'

function computeMtd(points: MonthSpendingSeriesPoint[], metric: MonthMetric) {
  const currentKey =
    metric === 'spending'
      ? 'currentSpending'
      : metric === 'income'
        ? 'currentIncome'
        : 'currentNet'
  const previousKey =
    metric === 'spending'
      ? 'previousSpending'
      : metric === 'income'
        ? 'previousIncome'
        : 'previousNet'

  let currentMtd: number | null = null
  let previousMtd: number | null = null

  for (const p of points) {
    const c = p[currentKey] as number | null
    const prev = p[previousKey] as number | null
    if (c != null) currentMtd = c
    if (prev != null) previousMtd = prev
  }

  return { currentMtd, previousMtd }
}

export function getMonthComparisonSemanticStrokes(
  points: MonthSpendingSeriesPoint[],
  metric: MonthMetric
): { currentStroke: string; previousStroke: string } | null {
  const { currentMtd, previousMtd } = computeMtd(points, metric)
  if (currentMtd == null || previousMtd == null) return null

  const isGood =
    metric === 'spending'
      ? currentMtd <= previousMtd
      : currentMtd >= previousMtd

  return {
    currentStroke: isGood ? SUCCESS_COLOR : DANGER_COLOR,
    previousStroke: isGood ? DANGER_COLOR : SUCCESS_COLOR,
  }
}
