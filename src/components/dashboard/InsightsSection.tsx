import { Card } from 'react-bootstrap'
import {
  getWeekRange,
  getWeeklyInsights,
  getWeeklyCategoryBreakdown,
} from '@/services/insights'
import { formatMoney, formatShortDate } from '@/lib/format'

export function InsightsSection() {
  const { startStr, endStr } = getWeekRange()
  const insights = getWeeklyInsights()
  const categories = getWeeklyCategoryBreakdown()
  const maxCategory = Math.max(...categories.map((c) => c.total), 1)

  return (
    <Card>
      <Card.Header>
        Weekly Insights ({formatShortDate(startStr)} – {formatShortDate(endStr)})
      </Card.Header>
      <Card.Body>
        <div className="mb-3">
          <div className="d-flex justify-content-between small">
            <span className="text-muted">Money In</span>
            <span className="text-success">${formatMoney(insights.moneyIn)}</span>
          </div>
          <div className="d-flex justify-content-between small">
            <span className="text-muted">Money Out</span>
            <span>${formatMoney(insights.moneyOut)}</span>
          </div>
          <div className="d-flex justify-content-between small">
            <span className="text-muted">Changes in Savers</span>
            <span>{insights.saverChanges >= 0 ? '+' : ''}${formatMoney(insights.saverChanges)}</span>
          </div>
          <div className="d-flex justify-content-between small">
            <span className="text-muted">Charges</span>
            <span>{insights.charges}</span>
          </div>
          <div className="d-flex justify-content-between small">
            <span className="text-muted">Payments made</span>
            <span>{insights.payments}</span>
          </div>
        </div>
        {categories.length > 0 && (
          <>
            <h6 className="text-muted small">Categories</h6>
            <div className="d-flex flex-column gap-1">
              {categories.map((c) => (
                <div key={c.category_id} className="d-flex align-items-center gap-2 small">
                  <div
                    style={{
                      width: `${Math.min(100, (c.total / maxCategory) * 100)}%`,
                      height: 8,
                      backgroundColor: 'var(--vantura-primary)',
                      borderRadius: 4,
                      minWidth: 4,
                    }}
                  />
                  <span className="text-nowrap" style={{ minWidth: 120 }}>
                    {c.category_name}
                  </span>
                  <span>${formatMoney(c.total)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  )
}
