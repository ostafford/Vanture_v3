import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card } from 'react-bootstrap'
import {
  getMonthComparison,
  type MonthDelta,
  type NarrativeInsight,
} from '@/services/insights'
import { formatMoney } from '@/lib/format'

function getCurrentMonthBounds(): { from: string; to: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  const from = `${y}-${String(m).padStart(2, '0')}-01`
  const lastDay = new Date(y, m, 0).getDate()
  const to = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { from, to }
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function DeltaBadge({
  delta,
  invert,
}: {
  delta: MonthDelta
  invert?: boolean
}) {
  if (delta.direction === 'flat') return null
  const isUp = delta.direction === 'up'
  const positive = invert ? !isUp : isUp
  const icon = isUp ? 'mdi-arrow-up' : 'mdi-arrow-down'
  const cls = positive ? 'text-success' : 'text-danger'
  const absDelta = Math.abs(delta.delta)
  const isCount = Number.isInteger(delta.current) && absDelta < 10000
  const label = isCount ? String(absDelta) : `$${formatMoney(absDelta)}`
  return (
    <span
      className={`small ${cls} ms-1`}
      aria-label={`${delta.direction} ${label}`}
    >
      <i className={`mdi ${icon}`} aria-hidden style={{ fontSize: '0.7rem' }} />{' '}
      {label}
    </span>
  )
}

const NARRATIVE_ICONS: Record<NarrativeInsight['type'], string> = {
  win: 'mdi-check-circle-outline',
  challenge: 'mdi-alert-circle-outline',
  opportunity: 'mdi-lightbulb-outline',
}

const NARRATIVE_COLORS: Record<NarrativeInsight['type'], string> = {
  win: 'text-success',
  challenge: 'text-danger',
  opportunity: 'text-warning',
}

export function MonthSummarySection() {
  const { from, to } = useMemo(() => getCurrentMonthBounds(), [])
  const comparison = useMemo(() => getMonthComparison(from, to), [from, to])
  const monthLabel = MONTH_NAMES[new Date().getMonth()]

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center section-header">
        <div className="d-flex align-items-center">
          <span className="page-title-icon bg-gradient-primary text-white mr-2">
            <i className="mdi mdi-calendar-month" aria-hidden />
          </span>
          <span>{monthLabel} at a glance</span>
        </div>
        <Link
          to="/analytics/monthly-review"
          className="btn btn-outline-secondary btn-sm"
          aria-label="View full monthly review"
        >
          <i className="mdi mdi-chevron-right" aria-hidden />
        </Link>
      </Card.Header>
      <Card.Body className="py-3">
        <div className="d-flex flex-wrap gap-3 align-items-center">
          <div>
            <span className="small text-muted">Money in</span>
            <div className="fw-medium text-success">
              ${formatMoney(comparison.moneyIn.current)}
              {comparison.hasPreviousData && (
                <DeltaBadge delta={comparison.moneyIn} />
              )}
            </div>
          </div>
          <div>
            <span className="small text-muted">Money out</span>
            <div className="fw-medium text-danger">
              ${formatMoney(comparison.moneyOut.current)}
              {comparison.hasPreviousData && (
                <DeltaBadge delta={comparison.moneyOut} invert />
              )}
            </div>
          </div>
          <div>
            <span className="small text-muted">Charges</span>
            <div className="fw-medium">
              {comparison.charges.current}
              {comparison.hasPreviousData && (
                <DeltaBadge delta={comparison.charges} invert />
              )}
            </div>
          </div>
          {comparison.currentTopCategory && (
            <div>
              <span className="small text-muted">Top category</span>
              <div className="fw-medium">
                {comparison.currentTopCategory.category_name} ($
                {formatMoney(comparison.currentTopCategory.total)})
              </div>
            </div>
          )}
        </div>

        {comparison.hasPreviousData && comparison.narratives.length > 0 && (
          <div className="mt-3 pt-2 border-top">
            {comparison.narratives.map((n, i) => (
              <div key={i} className="d-flex align-items-start gap-1 mb-1">
                <i
                  className={`mdi ${NARRATIVE_ICONS[n.type]} ${NARRATIVE_COLORS[n.type]}`}
                  aria-hidden
                  style={{ fontSize: '0.95rem', marginTop: 1 }}
                />
                <span className="small">{n.label}</span>
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  )
}
