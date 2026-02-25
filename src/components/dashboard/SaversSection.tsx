import { useState } from 'react'
import { Card, Button, Modal, Form } from 'react-bootstrap'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { getSaversWithProgress, updateSaverGoals } from '@/services/savers'
import { getSaverChartColors, setSaverChartColor } from '@/lib/chartColors'
import { formatMoney } from '@/lib/format'
import { ChartColorPicker } from '@/components/ChartColorPicker'
import { toast } from '@/stores/toastStore'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { MOBILE_MEDIA_QUERY } from '@/lib/constants'
import {
  WrappedYAxisTick,
  WrappedXAxisTick,
} from '@/components/dashboard/ChartWrappedTicks'

export function SaversSection() {
  const [, setRefresh] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [goalAmount, setGoalAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [monthlyTransfer, setMonthlyTransfer] = useState('')
  const [barColor, setBarColor] = useState<string | null>(null)
  const isMobile = useMediaQuery(MOBILE_MEDIA_QUERY)

  const savers = getSaversWithProgress()

  function openEdit(saver: {
    id: string
    goal_amount: number | null
    target_date: string | null
    monthly_transfer: number | null
  }) {
    setEditingId(saver.id)
    setGoalAmount(
      saver.goal_amount != null ? String(saver.goal_amount / 100) : ''
    )
    setTargetDate(saver.target_date ?? '')
    setMonthlyTransfer(
      saver.monthly_transfer != null ? String(saver.monthly_transfer / 100) : ''
    )
    setBarColor(getSaverChartColors()[saver.id] ?? null)
  }

  function handleSaveGoals() {
    if (!editingId) return
    const goalCents = goalAmount
      ? Math.round(parseFloat(goalAmount) * 100)
      : null
    const monthlyCents = monthlyTransfer
      ? Math.round(parseFloat(monthlyTransfer) * 100)
      : null
    setSaverChartColor(editingId, barColor)
    updateSaverGoals(editingId, goalCents, targetDate || null, monthlyCents)
    setEditingId(null)
    setRefresh((r) => r + 1)
    toast.success('Saver goals saved.')
  }

  const totalBalance = savers.reduce((sum, s) => sum + s.current_balance, 0)

  const saverColors = getSaverChartColors()

  type ChartRow = {
    id: string
    name: string
    current: number
    remaining: number
    goal: number
    saver: (typeof savers)[0]
    currentFill: string
  }

  const chartData: ChartRow[] = savers.map((s) => {
    const currentDollars = s.current_balance / 100
    const goalDollars =
      s.goal_amount != null && s.goal_amount > 0
        ? s.goal_amount / 100
        : currentDollars
    const remaining = Math.max(0, goalDollars - currentDollars)
    return {
      id: s.id,
      name: s.name,
      current: currentDollars,
      remaining: s.goal_amount != null && s.goal_amount > 0 ? remaining : 0,
      goal: goalDollars,
      saver: s,
      currentFill: saverColors[s.id] ?? 'var(--vantura-primary)',
    }
  })

  const maxDomain = Math.max(
    ...chartData.map((d) => d.current + d.remaining),
    1
  )

  return (
    <>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center section-header">
          <div className="d-flex align-items-center">
            <span className="page-title-icon bg-gradient-primary text-white mr-2">
              <i className="mdi mdi-piggy-bank" aria-hidden />
            </span>
            <span>Savers</span>
          </div>
          <span className="text-success fw-normal">
            ${formatMoney(totalBalance)}{' '}
            <span className="text-muted">total</span>
          </span>
        </Card.Header>
        <Card.Body>
          {savers.length === 0 ? (
            <p className="text-muted small mb-0">
              No saver accounts yet. They&apos;ll appear after you sync with Up
              Bank.
            </p>
          ) : (
            <>
              <ResponsiveContainer
                width="100%"
                height={
                  isMobile
                    ? Math.max(280, chartData.length * 56)
                    : Math.max(260, chartData.length * 52)
                }
              >
                {isMobile ? (
                  <BarChart
                    data={chartData}
                    margin={{ top: 8, right: 8, left: 8, bottom: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--vantura-border, #ebedf2)"
                    />
                    <XAxis
                      type="category"
                      dataKey="name"
                      tick={(props) => (
                        <WrappedXAxisTick
                          {...props}
                          fontSize={11}
                          maxCharsPerLine={12}
                        />
                      )}
                      height={40}
                      interval={0}
                    />
                    <YAxis
                      type="number"
                      domain={[0, maxDomain]}
                      tickFormatter={(v) => `$${v}`}
                      width={40}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        `$${Number(value).toFixed(2)}`,
                        '',
                      ]}
                      labelFormatter={(label) => label}
                      content={({ active, payload }) => {
                        if (
                          !active ||
                          !payload?.length ||
                          !payload[0].payload.saver
                        )
                          return null
                        const { saver } = payload[0].payload
                        return (
                          <div className="bg-surface border rounded shadow-sm p-2 small">
                            <strong>{saver.name}</strong>
                            <div>
                              ${formatMoney(saver.current_balance)} of $
                              {formatMoney(saver.goal_amount ?? 0)}
                            </div>
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 mt-1"
                              onClick={() => openEdit(saver)}
                            >
                              Edit goals
                            </Button>
                          </div>
                        )
                      }}
                    />
                    <Bar
                      dataKey="current"
                      stackId="a"
                      fillOpacity={0.3}
                      strokeWidth={1}
                      onClick={(data: ChartRow) => openEdit(data.saver)}
                      cursor="pointer"
                      name="Saved"
                      radius={[4, 4, 0, 0]}
                    >
                      {chartData.map((row) => (
                        <Cell
                          key={row.id}
                          fill={row.currentFill}
                          stroke={row.currentFill}
                        />
                      ))}
                    </Bar>
                    <Bar
                      dataKey="remaining"
                      stackId="a"
                      fill="var(--vantura-border)"
                      fillOpacity={0.5}
                      stroke="var(--vantura-border)"
                      strokeWidth={1}
                      onClick={(data: ChartRow) => openEdit(data.saver)}
                      cursor="pointer"
                      name="Remaining"
                      radius={[0, 0, 0, 0]}
                    />
                  </BarChart>
                ) : (
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 8, right: 24, left: 56, bottom: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--vantura-border, #ebedf2)"
                    />
                    <XAxis
                      type="number"
                      domain={[0, maxDomain]}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={56}
                      tick={(props) => (
                        <WrappedYAxisTick
                          {...props}
                          fontSize={12}
                          maxCharsPerLine={10}
                        />
                      )}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        `$${value.toFixed(2)}`,
                        '',
                      ]}
                      labelFormatter={(label) => label}
                      content={({ active, payload }) => {
                        if (
                          !active ||
                          !payload?.length ||
                          !payload[0].payload.saver
                        )
                          return null
                        const { saver } = payload[0].payload
                        return (
                          <div className="bg-surface border rounded shadow-sm p-2 small">
                            <strong>{saver.name}</strong>
                            <div>
                              ${formatMoney(saver.current_balance)} of $
                              {formatMoney(saver.goal_amount ?? 0)}
                            </div>
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 mt-1"
                              onClick={() => openEdit(saver)}
                            >
                              Edit goals
                            </Button>
                          </div>
                        )
                      }}
                    />
                    <Bar
                      dataKey="current"
                      stackId="a"
                      fillOpacity={0.3}
                      strokeWidth={1}
                      onClick={(data: ChartRow) => openEdit(data.saver)}
                      cursor="pointer"
                      name="Saved"
                    >
                      {chartData.map((row) => (
                        <Cell
                          key={row.id}
                          fill={row.currentFill}
                          stroke={row.currentFill}
                        />
                      ))}
                    </Bar>
                    <Bar
                      dataKey="remaining"
                      stackId="a"
                      fill="var(--vantura-border)"
                      fillOpacity={0.5}
                      stroke="var(--vantura-border)"
                      strokeWidth={1}
                      onClick={(data: ChartRow) => openEdit(data.saver)}
                      cursor="pointer"
                      name="Remaining"
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </>
          )}
        </Card.Body>
      </Card>

      <Modal
        show={editingId != null}
        onHide={() => setEditingId(null)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit saver goals</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label htmlFor="saver-edit-goal-amount">
                Goal amount ($)
              </Form.Label>
              <Form.Control
                id="saver-edit-goal-amount"
                name="goalAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Optional"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label htmlFor="saver-edit-target-date">
                Target date
              </Form.Label>
              <Form.Control
                id="saver-edit-target-date"
                name="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label htmlFor="saver-edit-monthly-transfer">
                Monthly transfer ($)
              </Form.Label>
              <Form.Control
                id="saver-edit-monthly-transfer"
                name="monthlyTransfer"
                type="number"
                step="0.01"
                min="0"
                placeholder="Optional"
                value={monthlyTransfer}
                onChange={(e) => setMonthlyTransfer(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label id="saver-edit-bar-color-label">Bar color</Form.Label>
              <ChartColorPicker
                aria-label="Saver bar color"
                value={barColor}
                onChange={setBarColor}
                allowReset
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditingId(null)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveGoals}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
