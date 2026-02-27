import { useState } from 'react'
import { useStore } from 'zustand'
import {
  Card,
  Modal,
  Button,
  Row,
  Col,
  OverlayTrigger,
  Tooltip as BSTooltip,
} from 'react-bootstrap'
import {
  getWeekRange,
  getWeeklyInsights,
  getWeeklyCategoryBreakdown,
  getWeeklyInsightsRawCount,
  getWeeklyInsightsDebugCounts,
} from '@/services/insights'
import {
  formatMoney,
  formatShortDateFromDate,
  formatDollars,
} from '@/lib/format'
import { accentStore } from '@/stores/accentStore'
import { ACCENT_PALETTES } from '@/lib/accentPalettes'
import {
  getInsightsCategoryColors,
  setInsightsCategoryColor,
} from '@/lib/chartColors'
import { ChartColorPicker } from '@/components/ChartColorPicker'
import { StatCard } from '@/components/StatCard'
import { toast } from '@/stores/toastStore'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { MOBILE_MEDIA_QUERY } from '@/lib/constants'
import { InsightsBarChart } from '@/components/charts/InsightsBarChart'
import type { InsightsChartDatum } from '@/types/charts'

/**
 * Weekly Insights card: Money In (income), Money Out (spending), Savers (saver movement),
 * Charges (count of spending), Payments made (external BPAY/PayID etc.), and spending-by-category chart.
 * Definitions and filters are in @/services/insights.ts; see the file-level comment there.
 */
type EditingCategory = {
  category_id: string
  category_name: string
  totalDollars: number
}

export function InsightsSection() {
  const [, setRefresh] = useState(0)
  const [weekOffset, setWeekOffset] = useState(0)
  const [editingCategory, setEditingCategory] =
    useState<EditingCategory | null>(null)
  const [categoryBarColor, setCategoryBarColor] = useState<string | null>(null)
  const isMobile = useMediaQuery(MOBILE_MEDIA_QUERY)

  const accent = useStore(accentStore, (s) => s.accent)
  const weekRange = getWeekRange(weekOffset)
  const { startStr, endStr } = weekRange
  const insights = getWeeklyInsights(weekRange)
  const categories = getWeeklyCategoryBreakdown(weekRange)
  const rawCount = import.meta.env.DEV
    ? getWeeklyInsightsRawCount(weekRange)
    : 0
  const debugCounts = import.meta.env.DEV
    ? getWeeklyInsightsDebugCounts(weekRange)
    : null
  const chartPalette = ACCENT_PALETTES[accent].chartPalette
  const categoryColors = getInsightsCategoryColors()

  const chartData: InsightsChartDatum[] = categories.map((c, index) => {
    const totalDollars = Number.isFinite(c.total / 100) ? c.total / 100 : 0
    return {
      category_id: c.category_id,
      name: c.category_name,
      totalDollars,
      fill:
        categoryColors[c.category_id] ??
        chartPalette[index % chartPalette.length],
      stroke:
        categoryColors[c.category_id] ??
        chartPalette[index % chartPalette.length],
    }
  })

  const maxDomain = Math.max(
    1,
    ...chartData.map((d) => d.totalDollars).filter(Number.isFinite)
  )

  function openCategoryEdit(payload: {
    category_id: string
    name: string
    totalDollars: number
  }) {
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
    toast.success('Category colour updated.')
  }

  return (
    <>
      <Card>
        <Card.Header
          className={
            isMobile
              ? 'd-flex flex-column gap-2 section-header'
              : 'd-flex align-items-center justify-content-between flex-wrap gap-2 section-header'
          }
        >
          {isMobile ? (
            <>
              <div className="d-flex align-items-center">
                <span className="page-title-icon bg-gradient-primary text-white mr-2">
                  <i className="mdi mdi-chart-bar" aria-hidden />
                </span>
                <div className="d-flex flex-column">
                  <span>Weekly Insights</span>
                  <span className="small text-muted">
                    {formatShortDateFromDate(weekRange.start)} –{' '}
                    {formatShortDateFromDate(weekRange.end)}
                  </span>
                </div>
              </div>
              <div className="d-flex justify-content-center gap-2">
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <BSTooltip id="insights-prev-tooltip">
                      Previous week
                    </BSTooltip>
                  }
                >
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setWeekOffset((o) => o - 1)}
                    aria-label="Previous week"
                  >
                    <i className="mdi mdi-chevron-left" aria-hidden />
                  </Button>
                </OverlayTrigger>
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <BSTooltip id="insights-next-tooltip">Next week</BSTooltip>
                  }
                >
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setWeekOffset((o) => o + 1)}
                    disabled={weekOffset >= 0}
                    aria-label="Next week"
                  >
                    <i className="mdi mdi-chevron-right" aria-hidden />
                  </Button>
                </OverlayTrigger>
              </div>
            </>
          ) : (
            <>
              <div className="d-flex align-items-center">
                <span className="page-title-icon bg-gradient-primary text-white mr-2">
                  <i className="mdi mdi-chart-bar" aria-hidden />
                </span>
                <div className="d-flex flex-column">
                  <span>Weekly Insights</span>
                  <span className="small text-muted">
                    {formatShortDateFromDate(weekRange.start)} –{' '}
                    {formatShortDateFromDate(weekRange.end)}
                  </span>
                </div>
              </div>
              <div className="d-flex gap-2 flex-grow-1 justify-content-end">
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <BSTooltip id="insights-prev-tooltip">
                      Previous week
                    </BSTooltip>
                  }
                >
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setWeekOffset((o) => o - 1)}
                    aria-label="Previous week"
                  >
                    <i className="mdi mdi-chevron-left" aria-hidden />
                  </Button>
                </OverlayTrigger>
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <BSTooltip id="insights-next-tooltip">Next week</BSTooltip>
                  }
                >
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setWeekOffset((o) => o + 1)}
                    disabled={weekOffset >= 0}
                    aria-label="Next week"
                  >
                    <i className="mdi mdi-chevron-right" aria-hidden />
                  </Button>
                </OverlayTrigger>
              </div>
            </>
          )}
        </Card.Header>
        {import.meta.env.DEV && (
          <Card.Body className="py-1 small text-muted border-bottom">
            <div>
              Range: {startStr} – {endStr} · {rawCount} transactions in range
            </div>
            {debugCounts != null && (
              <div className="mt-1">
                Charges (spending): {debugCounts.charges} · Round-ups:{' '}
                {debugCounts.roundUps} · Transfers: {debugCounts.transfers}
              </div>
            )}
          </Card.Body>
        )}
        <Card.Body>
          {/* Metrics: see src/services/insights.ts for term definitions (Money In = income only, Money Out = spending only, etc.) */}
          <Row className="mb-3 g-2 g-md-3">
            <Col xs={6} md>
              <StatCard
                title="Money In"
                value={insights.moneyIn}
                gradient="success"
                imgAlt=""
                compact
              />
            </Col>
            <Col xs={6} md>
              <StatCard
                title="Money Out"
                value={insights.moneyOut}
                gradient="danger"
                imgAlt=""
                compact
              />
            </Col>
            <Col xs={6} md>
              <StatCard
                title="Savers"
                value={Math.abs(insights.saverChanges)}
                displayValue={
                  (insights.saverChanges >= 0 ? '+' : '') +
                  '$' +
                  formatMoney(insights.saverChanges)
                }
                gradient="success"
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
            <>
              <div
                className="visually-hidden"
                role="region"
                aria-label="Spending by category this week (table)"
              >
                <table className="table table-sm mb-0">
                  <caption className="visually-hidden">
                    Spending by category this week
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Category</th>
                      <th scope="col" className="text-end">
                        Spent
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((d) => (
                      <tr key={d.category_id}>
                        <td>{d.name}</td>
                        <td className="text-end">
                          ${formatDollars(d.totalDollars)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                style={{
                  width: '100%',
                  height: isMobile
                    ? Math.max(280, chartData.length * 48)
                    : Math.max(200, chartData.length * 32),
                }}
              >
                <InsightsBarChart
                  chartData={chartData}
                  maxDomain={maxDomain}
                  isMobile={isMobile}
                  onBarClick={(d) => openCategoryEdit(d)}
                  aria-label="Spending by category this week (bar chart)"
                />
              </div>
            </>
          ) : (
            <p className="text-muted small mb-0">
              No spending by category this week.
            </p>
          )}
        </Card.Body>
      </Card>

      <Modal
        show={editingCategory != null}
        onHide={() => setEditingCategory(null)}
        aria-labelledby="insights-color-modal-title"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title id="insights-color-modal-title">
            Edit category bar colour
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingCategory && (
            <>
              <p className="mb-2">
                <strong>{editingCategory.category_name}</strong>
                <span className="text-muted small ms-1">
                  ${formatDollars(editingCategory.totalDollars)} this week
                </span>
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
