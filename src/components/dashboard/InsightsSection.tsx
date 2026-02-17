import { useState } from 'react'
import { useStore } from 'zustand'
import { Card, Modal, Button, Row, Col } from 'react-bootstrap'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  getWeekRange,
  getWeeklyInsights,
  getWeeklyCategoryBreakdown,
  getWeeklyInsightsRawCount,
  getWeeklyInsightsDebugCounts,
} from '@/services/insights'
import { formatMoney, formatShortDateFromDate } from '@/lib/format'
import { accentStore } from '@/stores/accentStore'
import { ACCENT_PALETTES } from '@/lib/accentPalettes'
import { getInsightsCategoryColors, setInsightsCategoryColor } from '@/lib/chartColors'
import { ChartColorPicker } from '@/components/ChartColorPicker'
import { StatCard } from '@/components/StatCard'

/**
 * Weekly Insights card: Money In (income), Money Out (spending), Savers (saver movement),
 * Charges (count of spending), Payments made (external BPAY/PayID etc.), and spending-by-category chart.
 * Definitions and filters are in @/services/insights.ts; see the file-level comment there.
 */
type EditingCategory = { category_id: string; category_name: string; totalDollars: number }

export function InsightsSection() {
  const [, setRefresh] = useState(0)
  const [weekOffset, setWeekOffset] = useState(0)
  const [editingCategory, setEditingCategory] = useState<EditingCategory | null>(null)
  const [categoryBarColor, setCategoryBarColor] = useState<string | null>(null)

  const accent = useStore(accentStore, (s) => s.accent)
  const weekRange = getWeekRange(weekOffset)
  const { startStr, endStr } = weekRange
  const insights = getWeeklyInsights(weekRange)
  const categories = getWeeklyCategoryBreakdown(weekRange)
  const rawCount = import.meta.env.DEV ? getWeeklyInsightsRawCount(weekRange) : 0
  const debugCounts = import.meta.env.DEV ? getWeeklyInsightsDebugCounts(weekRange) : null
  const chartPalette = ACCENT_PALETTES[accent].chartPalette
  const categoryColors = getInsightsCategoryColors()

  const chartData = categories.map((c, index) => ({
    category_id: c.category_id,
    name: c.category_name,
    totalDollars: c.total / 100,
    fill: categoryColors[c.category_id] ?? chartPalette[index % chartPalette.length],
    stroke: categoryColors[c.category_id] ?? chartPalette[index % chartPalette.length],
  }))

  const maxDomain = Math.max(...chartData.map((d) => d.totalDollars), 1)

  function openCategoryEdit(payload: { category_id: string; name: string; totalDollars: number }) {
    setEditingCategory({
      category_id: payload.category_id,
      category_name: payload.name,
      totalDollars: payload.totalDollars,
    })
    setCategoryBarColor(categoryColors[payload.category_id] ?? null)
  }

  function handleSaveCategoryColor() {
    if (!editingCategory) return
    setInsightsCategoryColor(editingCategory.category_id, categoryBarColor)
    setEditingCategory(null)
    setRefresh((r) => r + 1)
  }

  return (
    <>
    <Card>
      <Card.Header className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <span>Weekly Insights ({formatShortDateFromDate(weekRange.start)} – {formatShortDateFromDate(weekRange.end)})</span>
        <div className="d-flex gap-1">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => setWeekOffset((o) => o - 1)}
            aria-label="Previous week"
          >
            Previous
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => setWeekOffset((o) => o + 1)}
            disabled={weekOffset >= 0}
            aria-label="Next week"
          >
            Next
          </Button>
        </div>
      </Card.Header>
      {import.meta.env.DEV && (
        <Card.Body className="py-1 small text-muted border-bottom">
          <div>Range: {startStr} – {endStr} · {rawCount} transactions in range</div>
          {debugCounts != null && (
            <div className="mt-1">
              Charges (spending): {debugCounts.charges} · Round-ups: {debugCounts.roundUps} · Transfers: {debugCounts.transfers}
            </div>
          )}
        </Card.Body>
      )}
      <Card.Body>
        {/* Metrics: see src/services/insights.ts for term definitions (Money In = income only, Money Out = spending only, etc.) */}
        <Row className="mb-3 g-2 g-md-3">
          <Col xs={6} md>
            <StatCard title="Money In" value={insights.moneyIn} gradient="success" imgAlt="" compact />
          </Col>
          <Col xs={6} md>
            <StatCard title="Money Out" value={insights.moneyOut} gradient="danger" imgAlt="" compact />
          </Col>
          <Col xs={6} md>
            <StatCard
              title="Savers"
              value={Math.abs(insights.saverChanges)}
              displayValue={(insights.saverChanges >= 0 ? '+' : '') + '$' + formatMoney(insights.saverChanges)}
              gradient="info"
              imgAlt=""
              compact
            />
          </Col>
          <Col xs={6} md>
            <StatCard
              title="Charges"
              value={0}
              displayValue={insights.charges}
              gradient="danger"
              imgAlt=""
              tooltip="Count of spending transactions this week (excludes transfers)."
              compact
            />
          </Col>
          <Col xs={6} md>
            <StatCard
              title="Payments made"
              value={0}
              displayValue={insights.payments}
              gradient="danger"
              imgAlt=""
              tooltip="External payments (e.g. BPAY, PayID) this week."
              compact
            />
          </Col>
        </Row>
        {categories.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 32)}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 88, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--vantura-border, #ebedf2)" />
              <XAxis type="number" domain={[0, maxDomain]} tickFormatter={(v) => `$${v}`} />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Spend']}
                labelFormatter={(label) => label}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const p = payload[0].payload
                  return (
                    <div className="bg-surface border rounded shadow-sm p-2 small">
                      <strong>{p.name}</strong>
                      <div>${p.totalDollars.toFixed(2)} spent</div>
                      <Button variant="link" size="sm" className="p-0 mt-1" onClick={() => openCategoryEdit(p)}>
                        Edit colour
                      </Button>
                    </div>
                  )
                }}
              />
              <Bar
                dataKey="totalDollars"
                fillOpacity={0.3}
                strokeWidth={1}
                name="Spend"
                radius={[0, 4, 4, 0]}
                onClick={(data: { category_id: string; name: string; totalDollars: number }) => openCategoryEdit(data)}
                cursor="pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted small mb-0">No spending by category this week.</p>
        )}
      </Card.Body>
    </Card>

    <Modal show={editingCategory != null} onHide={() => setEditingCategory(null)} aria-labelledby="insights-color-modal-title">
      <Modal.Header closeButton>
        <Modal.Title id="insights-color-modal-title">Edit category bar colour</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {editingCategory && (
          <>
            <p className="mb-2">
              <strong>{editingCategory.category_name}</strong>
              <span className="text-muted small ms-1">${editingCategory.totalDollars.toFixed(2)} this week</span>
            </p>
            <ChartColorPicker
              aria-label="Category bar colour"
              value={categoryBarColor}
              onChange={setCategoryBarColor}
              allowReset
            />
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setEditingCategory(null)}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSaveCategoryColor}>
          Save
        </Button>
      </Modal.Footer>
    </Modal>
    </>
  )
}
