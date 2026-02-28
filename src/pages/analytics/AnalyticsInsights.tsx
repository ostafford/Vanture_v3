import { useState, useMemo } from 'react'
import { Card, Row, Col, Form } from 'react-bootstrap'
import {
  getInsightsHistory,
  getCategoryBreakdownHistory,
  getWeekRange,
  getWeeklyCategoryBreakdown,
} from '@/services/insights'
import { getInsightsCategoryColors } from '@/lib/chartColors'
import { UNCATEGORISED_COLOR_KEY } from '@/lib/chartColors'
import { InsightsHistoryChart } from '@/components/charts/InsightsHistoryChart'
import { CategoryTrendChart } from '@/components/charts/CategoryTrendChart'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { MOBILE_MEDIA_QUERY } from '@/lib/constants'

const WEEK_OPTIONS = [
  { value: 8, label: 'Last 8 weeks' },
  { value: 12, label: 'Last 12 weeks' },
  { value: 26, label: 'Last 26 weeks' },
]

export function AnalyticsInsights() {
  const [weeksBack, setWeeksBack] = useState(12)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    () => getWeeklyCategoryBreakdown(getWeekRange(0))[0]?.category_id ?? ''
  )
  const isMobile = useMediaQuery(MOBILE_MEDIA_QUERY)

  const insightsHistory = useMemo(
    () => getInsightsHistory(weeksBack),
    [weeksBack]
  )

  const categoriesWithSpending = useMemo(() => {
    return getWeeklyCategoryBreakdown(getWeekRange(0))
  }, [])

  const categoryOptions = useMemo(() => {
    return categoriesWithSpending.map((r) => ({
      id: r.category_id,
      name: r.category_name,
    }))
  }, [categoriesWithSpending])

  const activeCategoryId = selectedCategoryId || categoryOptions[0]?.id || ''
  const activeCategoryName =
    categoryOptions.find((c) => c.id === activeCategoryId)?.name ?? 'Category'

  const categoryHistory = useMemo(
    () =>
      activeCategoryId
        ? getCategoryBreakdownHistory(activeCategoryId, weeksBack)
        : [],
    [activeCategoryId, weeksBack]
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
              <div
                style={{
                  width: '100%',
                  height: isMobile ? 220 : 260,
                }}
              >
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
            <div
              style={{
                width: '100%',
                height: isMobile ? 200 : 240,
              }}
            >
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
