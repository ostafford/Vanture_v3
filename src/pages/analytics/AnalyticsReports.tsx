import { useState, useMemo, useRef, useEffect } from 'react'
import { Card, Row, Col, Form, Button, ButtonGroup, Nav } from 'react-bootstrap'
import {
  getCategoryBreakdownForDateRange,
  getReportsSankeyData,
  getInsightsHistory,
  getCategoryBreakdownHistory,
  getWeekRange,
  getWeeklyCategoryBreakdown,
  getMonthComparison,
  type MonthDelta,
  type NarrativeInsight,
} from '@/services/insights'
import {
  getInsightsCategoryColors,
  normalizeCategoryIdForColor,
  UNCATEGORISED_COLOR_KEY,
} from '@/lib/chartColors'
import { ACCENT_PALETTES } from '@/lib/accentPalettes'
import { useStore } from 'zustand'
import { accentStore } from '@/stores/accentStore'
import { syncStore } from '@/stores/syncStore'
import { InsightsBarChart } from '@/components/charts/InsightsBarChart'
import { SankeyFlowChart } from '@/components/charts/SankeyFlowChart'
import { InsightsHistoryChart } from '@/components/charts/InsightsHistoryChart'
import { CategoryTrendChart } from '@/components/charts/CategoryTrendChart'
import type { InsightsChartDatum } from '@/types/charts'
import { formatMoney } from '@/lib/format'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { MOBILE_MEDIA_QUERY } from '@/lib/constants'
import {
  monthNameLong,
  previousCalendarMonth,
  comparisonMonthPairLabels,
} from '@/lib/monthLabels'
import {
  getTrackersWithProgress,
  getTrackerSpentInPeriod,
} from '@/services/trackers'

// ─── Category Spending Tab ────────────────────────────────────────────────────

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getDefaultDateRange(): { from: string; to: string } {
  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - 30)
  return { from: localDateStr(from), to: localDateStr(to) }
}

type ReportPreset =
  | { id: string; label: string; days: number }
  | { id: string; label: string; month: 'current' | 'previous' }

function buildReportPresets(): ReportPreset[] {
  const now = new Date()
  const cy = now.getFullYear()
  const cm = now.getMonth() + 1
  const prev = previousCalendarMonth(cy, cm)
  return [
    { id: 'd7', label: 'Last 7 days', days: 7 },
    { id: 'd30', label: 'Last 30 days', days: 30 },
    { id: 'd90', label: 'Last 90 days', days: 90 },
    { id: 'm_current', label: monthNameLong(cy, cm), month: 'current' },
    {
      id: 'm_previous',
      label: monthNameLong(prev.year, prev.month),
      month: 'previous',
    },
  ]
}

function getPresetRange(preset: ReportPreset): { from: string; to: string } {
  const now = new Date()
  if ('days' in preset) {
    const from = new Date(now)
    from.setDate(from.getDate() - preset.days)
    return { from: localDateStr(from), to: localDateStr(now) }
  }
  if (preset.month === 'current') {
    const y = now.getFullYear()
    const m = now.getMonth() + 1
    return {
      from: `${y}-${String(m).padStart(2, '0')}-01`,
      to: localDateStr(now),
    }
  }
  const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  const m = now.getMonth() === 0 ? 12 : now.getMonth()
  const from = `${y}-${String(m).padStart(2, '0')}-01`
  const lastDay = new Date(y, m, 0).getDate()
  return {
    from,
    to: `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
  }
}

function CategorySpendingTab() {
  const [dateFrom, setDateFrom] = useState(() => getDefaultDateRange().from)
  const [dateTo, setDateTo] = useState(() => getDefaultDateRange().to)
  const [showSankey, setShowSankey] = useState(false)
  const [sankeySize, setSankeySize] = useState({ width: 400, height: 240 })
  const sankeyContainerRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery(MOBILE_MEDIA_QUERY)
  const accent = useStore(accentStore, (s) => s.accent)
  const lastSyncCompletedAt = useStore(syncStore, (s) => s.lastSyncCompletedAt)
  const chartPalette = ACCENT_PALETTES[accent].chartPalette
  const categoryColors = getInsightsCategoryColors()
  const reportPresets = buildReportPresets()

  const breakdown = useMemo(
    () => getCategoryBreakdownForDateRange(dateFrom, dateTo),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dateFrom, dateTo, lastSyncCompletedAt]
  )
  const sankeyData = useMemo(
    () => getReportsSankeyData(dateFrom, dateTo),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dateFrom, dateTo, lastSyncCompletedAt]
  )
  const sankeyHeight = Math.max(200, sankeyData.categories.length * 28)

  const chartData: InsightsChartDatum[] = useMemo(
    () =>
      breakdown.map((c, index) => {
        const totalDollars = Number.isFinite(c.total / 100) ? c.total / 100 : 0
        const colorKey = normalizeCategoryIdForColor(c.category_id)
        return {
          category_id: c.category_id ?? '',
          name: c.category_name,
          totalDollars,
          fill:
            categoryColors[colorKey] ??
            chartPalette[index % chartPalette.length],
          stroke:
            categoryColors[colorKey] ??
            chartPalette[index % chartPalette.length],
        }
      }),
    [breakdown, categoryColors, chartPalette]
  )
  const maxDomain = useMemo(
    () =>
      Math.max(
        1,
        ...chartData.map((d) => d.totalDollars).filter(Number.isFinite)
      ),
    [chartData]
  )
  const totalSpent = breakdown.reduce((s, c) => s + c.total, 0)

  useEffect(() => {
    if (!showSankey || !sankeyContainerRef.current) return
    const el = sankeyContainerRef.current
    const updateSize = () => {
      if (el) {
        const w = el.offsetWidth || 400
        setSankeySize((prev) =>
          prev.width !== w || prev.height !== sankeyHeight
            ? { width: w, height: sankeyHeight }
            : prev
        )
      }
    }
    updateSize()
    const ro = new ResizeObserver(updateSize)
    ro.observe(el)
    return () => ro.disconnect()
  }, [showSankey, sankeyHeight])

  return (
    <>
      <Card className="grid-margin">
        <Card.Header>
          <Card.Title className="mb-0">Category spending</Card.Title>
          <Card.Text as="div" className="small text-muted mt-1">
            Spending by category over a custom date range. Optionally view
            income-to-spending flow (Sankey).
          </Card.Text>
        </Card.Header>
        <Card.Body>
          <div className="mb-3">
            <ButtonGroup size="sm" className="flex-wrap">
              {reportPresets.map((preset) => (
                <Button
                  key={preset.id}
                  variant="outline-secondary"
                  onClick={() => {
                    const r = getPresetRange(preset)
                    setDateFrom(r.from)
                    setDateTo(r.to)
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </ButtonGroup>
          </div>
          <Row className="mb-3">
            <Col xs={12} md={6} lg={4}>
              <Form.Group className="mb-2">
                <Form.Label className="small">From</Form.Label>
                <Form.Control
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  aria-label="Report start date"
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={6} lg={4}>
              <Form.Group className="mb-2">
                <Form.Label className="small">To</Form.Label>
                <Form.Control
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  aria-label="Report end date"
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={6} lg={4} className="d-flex align-items-end mb-2">
              <Form.Check
                type="switch"
                id="reports-sankey-toggle"
                label="Show Sankey diagram"
                checked={showSankey}
                onChange={(e) => setShowSankey(e.target.checked)}
              />
            </Col>
          </Row>
          <div className="mb-3 small text-muted">
            Income (period): ${formatMoney(sankeyData.moneyIn)} · Spent: $
            {formatMoney(totalSpent)}
          </div>
          {chartData.length === 0 ? (
            <p className="text-muted mb-0">
              No spending in this date range. Adjust the dates or make sure
              transactions are synced.
            </p>
          ) : (
            <div style={{ width: '100%', height: isMobile ? 280 : 320 }}>
              <InsightsBarChart
                chartData={chartData}
                maxDomain={maxDomain}
                isMobile={isMobile}
                aria-label={`Spending by category from ${dateFrom} to ${dateTo}`}
              />
            </div>
          )}
        </Card.Body>
      </Card>

      {showSankey && (
        <Card className="grid-margin">
          <Card.Header>
            <Card.Title className="mb-0">Income to spending flow</Card.Title>
            <Card.Text as="div" className="small text-muted mt-1">
              Flow from Income to each spending category. Link width is
              proportional to amount.
            </Card.Text>
          </Card.Header>
          <Card.Body>
            {sankeyData.categories.length === 0 && sankeyData.moneyIn === 0 ? (
              <p className="text-muted mb-0">
                No income or spending in this date range.
              </p>
            ) : (
              <div
                ref={sankeyContainerRef}
                style={{ width: '100%', height: sankeyHeight }}
              >
                <SankeyFlowChart
                  moneyInCents={sankeyData.moneyIn}
                  categories={sankeyData.categories}
                  width={sankeySize.width}
                  height={sankeySize.height}
                  ariaLabel="Income to spending by category"
                />
              </div>
            )}
          </Card.Body>
        </Card>
      )}
    </>
  )
}

// ─── Weekly Trends Tab ────────────────────────────────────────────────────────

const WEEK_OPTIONS = [
  { value: 8, label: 'Last 8 weeks' },
  { value: 12, label: 'Last 12 weeks' },
  { value: 26, label: 'Last 26 weeks' },
]

function WeeklyTrendsTab() {
  const [weeksBack, setWeeksBack] = useState(12)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    () => getWeeklyCategoryBreakdown(getWeekRange(0))[0]?.category_id ?? ''
  )
  const isMobile = useMediaQuery(MOBILE_MEDIA_QUERY)
  const lastSyncCompletedAt = useStore(syncStore, (s) => s.lastSyncCompletedAt)

  const insightsHistory = useMemo(
    () => getInsightsHistory(weeksBack),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weeksBack, lastSyncCompletedAt]
  )

  const categoriesWithSpending = useMemo(
    () => getWeeklyCategoryBreakdown(getWeekRange(0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lastSyncCompletedAt]
  )

  const categoryOptions = useMemo(
    () =>
      categoriesWithSpending.map((r) => ({
        id: r.category_id,
        name: r.category_name,
      })),
    [categoriesWithSpending]
  )

  const activeCategoryId = selectedCategoryId || categoryOptions[0]?.id || ''
  const activeCategoryName =
    categoryOptions.find((c) => c.id === activeCategoryId)?.name ?? 'Category'

  const categoryHistory = useMemo(
    () =>
      activeCategoryId
        ? getCategoryBreakdownHistory(activeCategoryId, weeksBack)
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeCategoryId, weeksBack, lastSyncCompletedAt]
  )

  const categoryColors = getInsightsCategoryColors()
  const categoryColor =
    activeCategoryId === '' || activeCategoryId == null
      ? undefined
      : (categoryColors[activeCategoryId] ??
        categoryColors[UNCATEGORISED_COLOR_KEY])

  const maxDomainInsights = useMemo(() => {
    if (insightsHistory.length === 0) return undefined
    return Math.max(
      ...insightsHistory.flatMap((d) => [d.moneyIn, d.moneyOut]),
      100
    )
  }, [insightsHistory])

  const maxDomainCategory = useMemo(() => {
    if (categoryHistory.length === 0) return undefined
    return Math.max(...categoryHistory.map((d) => d.total), 100)
  }, [categoryHistory])

  return (
    <>
      <Card className="grid-margin">
        <Card.Header>
          <Card.Title className="mb-0">Money In vs Money Out</Card.Title>
          <Card.Text as="div" className="small text-muted mt-1">
            Weekly comparison of income and spending over time.
          </Card.Text>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col md={4}>
              <Form.Select
                value={weeksBack}
                onChange={(e) => setWeeksBack(Number(e.target.value))}
                aria-label="Weeks to show"
              >
                {WEEK_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>
          {insightsHistory.length === 0 ? (
            <p className="text-muted mb-0">No data available.</p>
          ) : (
            <>
              <div style={{ width: '100%', height: isMobile ? 220 : 260 }}>
                <InsightsHistoryChart
                  data={insightsHistory}
                  maxDomain={maxDomainInsights}
                  aria-label="Money In and Money Out by week"
                />
              </div>
              <div className="small text-muted mt-2">
                Green = Money In, Red = Money Out
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      <Card className="grid-margin">
        <Card.Header>
          <Card.Title className="mb-0">Category Spending Trends</Card.Title>
          <Card.Text as="div" className="small text-muted mt-1">
            Compare weekly spending for a category over time.
          </Card.Text>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col md={4}>
              <Form.Select
                value={activeCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                aria-label="Category"
              >
                {categoryOptions.length === 0 ? (
                  <option value="">No categories</option>
                ) : (
                  categoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                )}
              </Form.Select>
            </Col>
          </Row>
          {categoryHistory.length === 0 ? (
            <p className="text-muted mb-0">
              {categoryOptions.length === 0
                ? 'No spending categories this week. Make some purchases to see category trends.'
                : 'No data for this category.'}
            </p>
          ) : (
            <div style={{ width: '100%', height: isMobile ? 200 : 240 }}>
              <CategoryTrendChart
                data={categoryHistory}
                categoryName={activeCategoryName}
                maxDomain={maxDomainCategory}
                barColor={categoryColor}
                aria-label={`${activeCategoryName} spending by week`}
              />
            </div>
          )}
        </Card.Body>
      </Card>
    </>
  )
}

// ─── Monthly Review Tab ───────────────────────────────────────────────────────

function getMonthBounds(
  year: number,
  month: number
): { from: string; to: string } {
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { from, to }
}

function getExclusiveMonthEnd(year: number, month: number): string {
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`
}

function DeltaBadge({
  delta,
  invert,
  vsPriorLabel,
}: {
  delta: MonthDelta
  invert?: boolean
  vsPriorLabel: string
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
    <div
      className={`small ${cls}`}
      aria-label={`${delta.direction} ${label} vs ${vsPriorLabel}`}
      style={{ fontSize: '0.75rem', lineHeight: 1.3 }}
    >
      <i
        className={`mdi ${icon}`}
        aria-hidden
        style={{ fontSize: '0.65rem' }}
      />{' '}
      {label}
    </div>
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

function MonthlyReviewTab() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const lastSyncCompletedAt = useStore(syncStore, (s) => s.lastSyncCompletedAt)

  const { from, to } = useMemo(() => getMonthBounds(year, month), [year, month])
  const comparison = useMemo(
    () => getMonthComparison(from, to),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [from, to, lastSyncCompletedAt]
  )
  const monthPairLabels = useMemo(
    () => comparisonMonthPairLabels(year, month),
    [year, month]
  )
  const categories = useMemo(
    () => getCategoryBreakdownForDateRange(from, to),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [from, to, lastSyncCompletedAt]
  )
  const trackers = useMemo(
    () => getTrackersWithProgress(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lastSyncCompletedAt]
  )
  const trackerExclusiveEnd = useMemo(
    () => getExclusiveMonthEnd(year, month),
    [year, month]
  )
  const trackerSpendInMonth = useMemo(
    () =>
      trackers.map((t) => ({
        tracker: t,
        spent: getTrackerSpentInPeriod(t.id, from, trackerExclusiveEnd),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trackers, from, trackerExclusiveEnd, lastSyncCompletedAt]
  )

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear()
    return Array.from({ length: 5 }, (_, i) => current - i)
  }, [])

  return (
    <>
      <Card className="grid-margin">
        <Card.Header>
          <Card.Title className="mb-0">Monthly review</Card.Title>
          <Card.Text as="div" className="small text-muted mt-1">
            Summary of money in, money out, top categories, and tracker spend
            for the selected month.
          </Card.Text>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                aria-label="Month"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {monthNameLong(2020, m)}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                aria-label="Year"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="grid-margin">
        <Card.Header>
          <Card.Title className="mb-0">
            {monthNameLong(year, month)} {year} — Summary
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col xs={6} md={3}>
              <div className="small text-muted">Money in</div>
              <div className="fw-semibold text-success">
                ${formatMoney(comparison.moneyIn.current)}
              </div>
              {comparison.hasPreviousData && (
                <DeltaBadge
                  delta={comparison.moneyIn}
                  vsPriorLabel={monthPairLabels.vsPriorShort}
                />
              )}
            </Col>
            <Col xs={6} md={3}>
              <div className="small text-muted">Money out</div>
              <div className="fw-semibold text-danger">
                ${formatMoney(comparison.moneyOut.current)}
              </div>
              {comparison.hasPreviousData && (
                <DeltaBadge
                  delta={comparison.moneyOut}
                  invert
                  vsPriorLabel={monthPairLabels.vsPriorShort}
                />
              )}
            </Col>
            <Col xs={6} md={3}>
              <div className="small text-muted">Charges (count)</div>
              <div className="fw-semibold">{comparison.charges.current}</div>
              {comparison.hasPreviousData && (
                <DeltaBadge
                  delta={comparison.charges}
                  invert
                  vsPriorLabel={monthPairLabels.vsPriorShort}
                />
              )}
            </Col>
            {comparison.currentTopCategory && (
              <Col xs={6} md={3}>
                <div className="small text-muted">Top category</div>
                <div className="fw-semibold">
                  {comparison.currentTopCategory.category_name} ($
                  {formatMoney(comparison.currentTopCategory.total)})
                </div>
              </Col>
            )}
          </Row>

          {comparison.hasPreviousData && comparison.narratives.length > 0 && (
            <div className="mt-3 pt-2 border-top">
              <div className="small text-muted mb-2">
                vs {monthPairLabels.previousLabel}
              </div>
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

      <Card className="grid-margin">
        <Card.Header>
          <Card.Title className="mb-0">Top categories</Card.Title>
        </Card.Header>
        <Card.Body>
          {categories.length === 0 ? (
            <p className="text-muted mb-0">No spending in this month.</p>
          ) : (
            <ul className="list-group list-group-flush">
              {categories.slice(0, 10).map((c) => (
                <li
                  key={c.category_id ?? 'uncategorised'}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <span>{c.category_name}</span>
                  <span>${formatMoney(c.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card.Body>
      </Card>

      <Card className="grid-margin">
        <Card.Header>
          <Card.Title className="mb-0">Trackers (spend in month)</Card.Title>
        </Card.Header>
        <Card.Body>
          {trackerSpendInMonth.length === 0 ? (
            <p className="text-muted mb-0">No trackers.</p>
          ) : (
            <ul className="list-group list-group-flush">
              {trackerSpendInMonth.map(({ tracker, spent }) => (
                <li
                  key={tracker.id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <span>{tracker.name}</span>
                  <span>
                    ${formatMoney(spent)} of $
                    {formatMoney(tracker.budget_amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card.Body>
      </Card>
    </>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

type ReportsTab = 'categories' | 'weekly' | 'monthly'

export function AnalyticsReports() {
  const [activeTab, setActiveTab] = useState<ReportsTab>('categories')

  return (
    <div className="grid-margin">
      <Nav
        variant="tabs"
        className="mb-4"
        activeKey={activeTab}
        onSelect={(k) => setActiveTab((k as ReportsTab) ?? 'categories')}
      >
        <Nav.Item>
          <Nav.Link eventKey="categories">By category</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="weekly">Weekly trends</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="monthly">Monthly review</Nav.Link>
        </Nav.Item>
      </Nav>

      {activeTab === 'categories' && <CategorySpendingTab />}
      {activeTab === 'weekly' && <WeeklyTrendsTab />}
      {activeTab === 'monthly' && <MonthlyReviewTab />}
    </div>
  )
}
