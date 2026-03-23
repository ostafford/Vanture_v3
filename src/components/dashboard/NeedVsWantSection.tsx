import { useState, useCallback } from 'react'
import { useStore } from 'zustand'
import { syncStore } from '@/stores/syncStore'
import {
  Card,
  Button,
  Modal,
  Form,
  ProgressBar,
  OverlayTrigger,
  Tooltip,
  Row,
  Col,
  Collapse,
} from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { themeStore } from '@/stores/themeStore'
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  markGoalComplete,
  reopenGoal,
  type GoalWithProgress,
} from '@/services/goals'
import { formatMoney } from '@/lib/format'
import { toast } from '@/stores/toastStore'
import { HelpPopover } from '@/components/HelpPopover'
import { getProgressVariant } from '@/lib/progressVariant'
import {
  buildWantPlannerSnapshot,
  getNeedsSummary,
  getWantSplitMode,
  setWantSplitMode,
  allocatePerWantPerPayCents,
  estimatePayPeriodsToFund,
  type WantSplitMode,
} from '@/services/wantPlanner'
import type React from 'react'

const WANT_ICONS = [
  { value: null, label: 'None' },
  { value: '\uD83C\uDFE0', label: 'House' },
  { value: '\uD83D\uDE97', label: 'Car' },
  { value: '\u2708\uFE0F', label: 'Travel' },
  { value: '\uD83C\uDF93', label: 'Education' },
  { value: '\uD83D\uDCB0', label: 'Savings' },
  { value: '\uD83C\uDFA8', label: 'Hobby' },
  { value: '\uD83C\uDF89', label: 'Event' },
  { value: '\uD83D\uDEE1\uFE0F', label: 'Emergency' },
  { value: '\uD83D\uDCBB', label: 'Tech' },
  { value: '\uD83C\uDFCB\uFE0F', label: 'Fitness' },
]

export function NeedVsWantSection({
  dragHandleProps,
}: {
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>
}) {
  const [refreshKey, setRefresh] = useState(0)
  useStore(syncStore, (s) => s.lastSyncCompletedAt)
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<GoalWithProgress | null>(null)
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [monthlyContribution, setMonthlyContribution] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [icon, setIcon] = useState<string | null>(null)
  const [priorityRank, setPriorityRank] = useState('')
  const [allocationPercent, setAllocationPercent] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)
  const [splitMode, setSplitMode] = useState<WantSplitMode>(() =>
    getWantSplitMode()
  )
  const [showAssumptions, setShowAssumptions] = useState(false)
  const theme = useStore(themeStore, (s) => s.theme)

  const goals = getGoals()
  const active = goals.filter((g) => !g.completed_at)
  const completed = goals.filter((g) => g.completed_at)

  const planner = buildWantPlannerSnapshot()
  const needsSummary = getNeedsSummary()

  const perWantAllocInputs = active.map((g) => ({
    id: g.id,
    remainingCents: g.remaining,
    priorityRank: g.priority_rank,
    allocationPercent: g.allocation_percent,
  }))
  const perWantAlloc = allocatePerWantPerPayCents(
    planner.baseSavingsPerPayPeriodCents,
    splitMode,
    perWantAllocInputs
  )

  const onSplitChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.target.value as WantSplitMode
      setSplitMode(v)
      setWantSplitMode(v)
      bumpRefresh()
    },
    []
  )

  function bumpRefresh() {
    setRefresh((r) => r + 1)
  }

  function openCreate() {
    setEditingGoal(null)
    setName('')
    setTargetAmount('')
    setCurrentAmount('')
    setMonthlyContribution('')
    setTargetDate('')
    setIcon(null)
    setPriorityRank('')
    setAllocationPercent('')
    setShowModal(true)
  }

  function openEdit(g: GoalWithProgress) {
    setEditingGoal(g)
    setName(g.name)
    setTargetAmount(String(g.target_amount / 100))
    setCurrentAmount(String(g.current_amount / 100))
    setMonthlyContribution(
      g.monthly_contribution != null ? String(g.monthly_contribution / 100) : ''
    )
    setTargetDate(g.target_date ?? '')
    setIcon(g.icon)
    setPriorityRank(g.priority_rank != null ? String(g.priority_rank) : '')
    setAllocationPercent(
      g.allocation_percent != null ? String(g.allocation_percent) : ''
    )
    setShowModal(true)
  }

  function handleSave() {
    const targetCents = Math.round(parseFloat(targetAmount || '0') * 100)
    if (!name.trim() || targetCents <= 0) return
    const currentCents = Math.round(parseFloat(currentAmount || '0') * 100)
    const monthlyCents = monthlyContribution
      ? Math.round(parseFloat(monthlyContribution) * 100)
      : null
    const dateVal = targetDate.trim() || null
    const pr =
      priorityRank.trim() === ''
        ? null
        : Math.max(0, parseInt(priorityRank, 10))
    const apRaw = allocationPercent.trim()
    const ap =
      apRaw === '' ? null : Math.min(100, Math.max(0, parseInt(apRaw, 10)))
    if (pr != null && Number.isNaN(pr)) {
      toast.error('Priority must be a number.')
      return
    }
    if (ap != null && Number.isNaN(ap)) {
      toast.error('Allocation % must be a number.')
      return
    }

    if (editingGoal) {
      updateGoal(
        editingGoal.id,
        name.trim(),
        targetCents,
        currentCents,
        monthlyCents,
        dateVal,
        icon,
        pr,
        ap
      )
      toast.success('Want updated.')
    } else {
      createGoal(name.trim(), targetCents, monthlyCents, dateVal, icon, pr, ap)
      toast.success('Want created.')
    }
    setShowModal(false)
    bumpRefresh()
  }

  function handleDelete() {
    if (editingGoal) {
      deleteGoal(editingGoal.id)
      setShowModal(false)
      bumpRefresh()
      toast.success('Want deleted.')
    }
  }

  function handleMarkComplete(g: GoalWithProgress) {
    markGoalComplete(g.id)
    bumpRefresh()
    toast.success(`"${g.name}" marked complete.`)
  }

  function handleReopen(g: GoalWithProgress) {
    reopenGoal(g.id)
    bumpRefresh()
  }

  const payPeriodLabel =
    planner.payPeriodDays === 7
      ? 'week'
      : planner.payPeriodDays === 14
        ? 'fortnight'
        : 'month'
  const cycleNoun = payPeriodLabel === 'month' ? 'monthly' : payPeriodLabel

  return (
    <>
      <Card data-refresh-version={refreshKey}>
        <Card.Header className="d-flex justify-content-between align-items-center section-header flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <span
              className="page-title-icon bg-gradient-primary text-white mr-2"
              {...dragHandleProps}
            >
              <i className="mdi mdi-scale-balance" aria-hidden />
            </span>
            <span>Need vs Want</span>
            <span
              className="badge text-bg-secondary"
              title="This section is in beta and may change"
              aria-label="This section is in beta and may change"
            >
              Beta v1
            </span>
            <HelpPopover
              id="need-vs-want-help"
              title="Need vs Want"
              content="Needs are upcoming obligations and your recent weekly spending trend. Wants are items you are saving toward; the planner suggests a conservative amount to set aside before your next payday."
              ariaLabel="What is Need vs Want?"
            />
          </div>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip id="want-add-tooltip">Add want</Tooltip>}
          >
            <Button
              variant="primary"
              size="sm"
              onClick={openCreate}
              aria-label="Add want"
            >
              <i className="mdi mdi-plus" aria-hidden />
            </Button>
          </OverlayTrigger>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            <Col md={6}>
              <h6 className="text-muted text-uppercase small mb-2">Needs</h6>
              <p className="small text-muted mb-2">
                Upcoming charges and your recent spending trend are treated as
                near-term needs before setting money aside for wants.
              </p>
              <ul className="small mb-2 ps-3">
                <li>
                  Reserved before payday:{' '}
                  <strong>${formatMoney(needsSummary.reservedCents)}</strong>
                </li>
                <li>
                  Due before next pay:{' '}
                  <strong>{needsSummary.countBeforeNextPay}</strong> (
                  <strong>
                    ${formatMoney(needsSummary.sumBeforeNextPayCents)}
                  </strong>
                  )
                </li>
                {needsSummary.nextPayday && (
                  <li>Next payday: {needsSummary.nextPayday}</li>
                )}
              </ul>
              <a
                href="#dashboard-section-upcoming"
                className="small d-inline-block"
              >
                Go to Upcoming transactions
              </a>
            </Col>
            <Col md={6}>
              <h6 className="text-muted text-uppercase small mb-2">Wants</h6>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-0">
                  Split savings across active wants
                </Form.Label>
                <Form.Select
                  size="sm"
                  value={splitMode}
                  onChange={onSplitChange}
                  aria-label="How to split savings across wants"
                >
                  <option value="equal">Equal (share evenly)</option>
                  <option value="priority">
                    Priority (fill top priority first)
                  </option>
                  <option value="percent">Percent (by allocation %)</option>
                </Form.Select>
              </Form.Group>

              {!planner.completeness.hasPayAmount && (
                <div className="alert alert-light border py-2 px-3 small mb-2">
                  Set <strong>pay amount</strong> and <strong>payday</strong> in{' '}
                  <Link to="/settings">Settings</Link> for more accurate
                  before-pay suggestions.
                </div>
              )}

              <div className="card card-body border rounded px-3 py-2 mb-2">
                <div className="small text-muted">
                  Suggested toward wants before next pay
                </div>
                <div className="h5 mb-1 text-success">
                  ${formatMoney(planner.recommendedBeforeNextPayCents)}
                </div>
                <div className="small text-muted">
                  {cycleNoun} cycle (~$
                  {formatMoney(planner.monthlyEquivalentSavingsCents)}/month
                  equivalent)
                </div>
                {planner.behavioralMultiplier > 1.01 && (
                  <div className="small text-warning mt-1">
                    Recent spending is above your 4-week average (x
                    {planner.behavioralMultiplier.toFixed(2)}).
                  </div>
                )}
                {planner.recommendedBeforeNextPayCents === 0 && (
                  <div className="small text-warning mt-1">
                    Current needs and safety buffer use up available funds
                    before next pay.
                  </div>
                )}
              </div>

              <button
                type="button"
                className="btn btn-link p-0 small text-decoration-none mb-2"
                onClick={() => setShowAssumptions((v) => !v)}
                aria-expanded={showAssumptions}
              >
                {showAssumptions ? 'Hide' : 'Show'} how this is estimated
              </button>
              <Collapse in={showAssumptions}>
                <ul className="small text-muted ps-3 mb-0">
                  {planner.assumptionLines.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </Collapse>
            </Col>
          </Row>

          <hr className="my-3" />

          {active.length === 0 && completed.length === 0 ? (
            <p className="text-muted small mb-0">
              No wants yet. Add a want to plan saving toward a purchase.
            </p>
          ) : (
            <>
              {active.map((g) => {
                const perPay = perWantAlloc.get(g.id) ?? 0
                const estPeriods = estimatePayPeriodsToFund(
                  g.remaining,
                  perPay,
                  planner.behavioralMultiplier
                )
                const estMonths =
                  estPeriods != null
                    ? (estPeriods * planner.payPeriodDays) / 30
                    : null
                const hasElevatedSpend =
                  planner.currentWeekMoneyOut >
                    planner.avgWeeklyMoneyOut4Weeks &&
                  planner.avgWeeklyMoneyOut4Weeks > 0
                const weeklyOverspendCents = hasElevatedSpend
                  ? planner.currentWeekMoneyOut -
                    planner.avgWeeklyMoneyOut4Weeks
                  : 0
                const reclaimPerPayCents = Math.max(
                  0,
                  Math.round(
                    weeklyOverspendCents * planner.weeksUntilNextPayday
                  )
                )
                const boostedPerPayCents = perPay + reclaimPerPayCents
                const improvedPeriods = estimatePayPeriodsToFund(
                  g.remaining,
                  boostedPerPayCents,
                  planner.behavioralMultiplier
                )
                const periodsSaved =
                  estPeriods != null && improvedPeriods != null
                    ? Math.max(0, estPeriods - improvedPeriods)
                    : 0
                return (
                  <div key={g.id} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div className="d-flex align-items-center gap-2">
                        {g.icon && <span>{g.icon}</span>}
                        <button
                          type="button"
                          className="btn btn-link p-0 text-decoration-none fw-medium"
                          onClick={() => openEdit(g)}
                          style={{ color: 'inherit' }}
                        >
                          {g.name}
                        </button>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="small text-muted">
                          ${formatMoney(g.current_amount)} / $
                          {formatMoney(g.target_amount)}
                        </span>
                        {g.progress >= 100 && (
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => handleMarkComplete(g)}
                            aria-label={`Mark ${g.name} complete`}
                          >
                            <i className="mdi mdi-check" aria-hidden />
                          </Button>
                        )}
                      </div>
                    </div>
                    <ProgressBar
                      now={Math.min(100, g.progress)}
                      variant={getProgressVariant(g.progress)}
                      style={{ height: 8 }}
                      aria-label={`${g.name} progress: ${Math.round(g.progress)}%`}
                    />
                    <div className="small text-muted mt-1">
                      {perPay > 0 ? (
                        <>
                          <span
                            className={
                              theme === 'dark'
                                ? 'fw-medium text-muted'
                                : 'fw-medium text-body'
                            }
                          >
                            At your current pace: ~${formatMoney(perPay)}/
                            {payPeriodLabel} toward this want.
                          </span>
                          {estPeriods != null && g.remaining > 0 && (
                            <>
                              {' '}
                              You could reach it in about {estPeriods} pay
                              period
                              {estPeriods === 1 ? '' : 's'} (~
                              {estMonths != null
                                ? estMonths.toFixed(1)
                                : '—'}{' '}
                              months at this rate).
                            </>
                          )}
                        </>
                      ) : (
                        <span className="text-warning">
                          No suggested amount before next pay right now.
                        </span>
                      )}
                      {g.monthly_contribution != null && (
                        <span className="ms-1">
                          · Manual: ${formatMoney(g.monthly_contribution)}/month
                          {g.target_date && ` · Target: ${g.target_date}`}
                        </span>
                      )}
                    </div>
                    {perPay > 0 &&
                      periodsSaved > 0 &&
                      weeklyOverspendCents > 0 && (
                        <div className="small mt-1 text-warning">
                          How to hit it sooner: if weekly outflow drops by about
                          ${formatMoney(weeklyOverspendCents)} (back to your
                          4-week average), this pace could improve by ~
                          {periodsSaved} pay period
                          {periodsSaved === 1 ? '' : 's'}.
                        </div>
                      )}
                  </div>
                )
              })}
              {completed.length > 0 && (
                <div className="mt-3">
                  <button
                    type="button"
                    className="btn btn-link p-0 small text-muted text-decoration-none"
                    onClick={() => setShowCompleted((v) => !v)}
                  >
                    {showCompleted ? 'Hide' : 'Show'} completed (
                    {completed.length})
                  </button>
                  {showCompleted &&
                    completed.map((g) => (
                      <div
                        key={g.id}
                        className="d-flex justify-content-between align-items-center mt-2 opacity-75"
                      >
                        <div className="d-flex align-items-center gap-2">
                          {g.icon && <span>{g.icon}</span>}
                          <span className="text-decoration-line-through small">
                            {g.name}
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="small text-muted">
                            ${formatMoney(g.target_amount)}
                          </span>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleReopen(g)}
                            aria-label={`Reopen ${g.name}`}
                          >
                            <i className="mdi mdi-undo" aria-hidden />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingGoal ? 'Edit want' : 'New want'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label htmlFor="want-name">Name</Form.Label>
              <Form.Control
                id="want-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bike"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label htmlFor="want-target-amount">Target ($)</Form.Label>
              <Form.Control
                id="want-target-amount"
                type="number"
                step="0.01"
                min="0"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
              />
            </Form.Group>
            {editingGoal && (
              <Form.Group className="mb-2">
                <Form.Label htmlFor="want-current-amount">
                  Saved so far ($)
                </Form.Label>
                <Form.Control
                  id="want-current-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                />
              </Form.Group>
            )}
            <Form.Group className="mb-2">
              <Form.Label htmlFor="want-monthly">
                Optional manual monthly contribution ($)
              </Form.Label>
              <Form.Control
                id="want-monthly"
                type="number"
                step="0.01"
                min="0"
                placeholder="Optional"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label htmlFor="want-target-date">Target date</Form.Label>
              <Form.Control
                id="want-target-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </Form.Group>
            <Row>
              <Col sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label htmlFor="want-priority">
                    Priority (lower first)
                  </Form.Label>
                  <Form.Control
                    id="want-priority"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 1"
                    value={priorityRank}
                    onChange={(e) => setPriorityRank(e.target.value)}
                  />
                  <Form.Text className="small">
                    Used when split = Priority
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label htmlFor="want-pct">Allocation %</Form.Label>
                  <Form.Control
                    id="want-pct"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="e.g. 40"
                    value={allocationPercent}
                    onChange={(e) => setAllocationPercent(e.target.value)}
                  />
                  <Form.Text className="small">
                    Used when split = Percent
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-2">
              <Form.Label>Icon</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {WANT_ICONS.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    style={{
                      minWidth: 40,
                      borderColor:
                        icon === opt.value
                          ? 'var(--vantura-primary)'
                          : undefined,
                      borderWidth: icon === opt.value ? 2 : undefined,
                    }}
                    onClick={() => setIcon(opt.value)}
                    aria-pressed={icon === opt.value}
                    aria-label={opt.label}
                  >
                    {opt.value ?? 'None'}
                  </button>
                ))}
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          {editingGoal && (
            <Button
              variant="outline-danger"
              className="me-auto"
              onClick={handleDelete}
            >
              Delete
            </Button>
          )}
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
