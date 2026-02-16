import { useStore } from 'zustand'
import { Card } from 'react-bootstrap'
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
} from '@/services/insights'
import { formatMoney, formatShortDate } from '@/lib/format'
import { accentStore } from '@/stores/accentStore'
import { ACCENT_PALETTES } from '@/lib/accentPalettes'

export function InsightsSection() {
  const accent = useStore(accentStore, (s) => s.accent)
  const { startStr, endStr } = getWeekRange()
  const insights = getWeeklyInsights()
  const categories = getWeeklyCategoryBreakdown()
  const chartPalette = ACCENT_PALETTES[accent].chartPalette

  const chartData = categories.map((c, index) => ({
    category_id: c.category_id,
    name: c.category_name,
    totalDollars: c.total / 100,
    fill: chartPalette[index % chartPalette.length],
    stroke: chartPalette[index % chartPalette.length],
  }))

  const maxDomain = Math.max(...chartData.map((d) => d.totalDollars), 1)

  return (
    <Card>
      <Card.Header>
        Weekly Insights ({formatShortDate(startStr)} – {formatShortDate(endStr)})
      </Card.Header>
      <Card.Body>
        <div className="d-flex flex-wrap gap-3 gap-md-4 mb-3 small">
          <span className="text-muted">Money In</span>
          <span className="text-success">${formatMoney(insights.moneyIn)}</span>
          <span className="text-muted">Money Out</span>
          <span>${formatMoney(insights.moneyOut)}</span>
          <span className="text-muted">Savers</span>
          <span>{insights.saverChanges >= 0 ? '+' : ''}${formatMoney(insights.saverChanges)}</span>
          <span className="text-muted">Charges</span>
          <span>{insights.charges}</span>
          <span className="text-muted">Payments made</span>
          <span>{insights.payments}</span>
        </div>
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
              />
              <Bar
                dataKey="totalDollars"
                fillOpacity={0.3}
                strokeWidth={1}
                name="Spend"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted small mb-0">No spending by category this week.</p>
        )}
      </Card.Body>
    </Card>
  )
}
