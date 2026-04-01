import { useState, forwardRef, useImperativeHandle, useCallback } from 'react'
import { useStore } from 'zustand'
import { syncStore } from '@/stores/syncStore'
import { Button, Modal, Form, ProgressBar, Row, Col } from 'react-bootstrap'
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  markGoalComplete,
  reopenGoal,
  reorderActiveGoals,
  type GoalWithProgress,
} from '@/services/goals'
import { formatMoney } from '@/lib/format'
import { toast } from '@/stores/toastStore'
import {
  buildWantPlannerSnapshot,
  allocatePerWantPerPayCents,
  getWantScheduleHealth,
  getExpectedPerPayCentsForTarget,
  type WantSplitMode,
} from '@/services/wantPlanner'
import {
  getBadgeToneClass,
  getPaceStatusBadgeLabel,
  formatDueDateShort,
  getTrackerStyleProgress,
  formatPaceTooltip,
} from '@/components/plan/planDisplay'

export type PlanWantsListHandle = {
  openCreate: () => void
}

export const PlanWantsList = forwardRef<
  PlanWantsListHandle,
  { splitMode: WantSplitMode }
>(function PlanWantsList({ splitMode }, ref) {
  useStore(syncStore, (s) => s.lastSyncCompletedAt)
  const [refreshKey, setRefresh] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<GoalWithProgress | null>(null)
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [monthlyContribution, setMonthlyContribution] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [allocationPercent, setAllocationPercent] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)
  const [dragSourceId, setDragSourceId] = useState<number | null>(null)
  const [dragOverId, setDragOverId] = useState<number | null>(null)

  const goals = getGoals()
  const active = goals.filter((g) => !g.completed_at)
  const completed = goals.filter((g) => g.completed_at)

  const planner = buildWantPlannerSnapshot()
  const payPeriodLabel =
    planner.payPeriodDays === 7
      ? 'week'
      : planner.payPeriodDays === 14
        ? 'fortnight'
        : 'month'

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

  const bumpRefresh = useCallback(() => {
    setRefresh((r) => r + 1)
  }, [])

  const openCreate = useCallback(() => {
    setEditingGoal(null)
    setName('')
    setTargetAmount('')
    setCurrentAmount('')
    setMonthlyContribution('')
    setTargetDate('')
    setAllocationPercent('')
    setShowModal(true)
  }, [])

  useImperativeHandle(ref, () => ({ openCreate }), [openCreate])

  function openEdit(g: GoalWithProgress) {
    setEditingGoal(g)
    setName(g.name)
    setTargetAmount(String(g.target_amount / 100))
    setCurrentAmount(String(g.current_amount / 100))
    setMonthlyContribution(
      g.monthly_contribution != null ? String(g.monthly_contribution / 100) : ''
    )
    setTargetDate(g.target_date ?? '')
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
    const apRaw = allocationPercent.trim()
    const ap =
      apRaw === '' ? null : Math.min(100, Math.max(0, parseInt(apRaw, 10)))
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
        null,
        null,
        ap
      )
      toast.success('Want updated.')
    } else {
      createGoal(
        name.trim(),
        targetCents,
        monthlyCents,
        dateVal,
        null,
        null,
        ap
      )
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

  function handleWantDragStart(e: React.DragEvent<HTMLDivElement>, id: number) {
    e.dataTransfer.setData('text/plain', String(id))
    e.dataTransfer.effectAllowed = 'move'
    setDragSourceId(id)
  }

  function handleWantDragOver(e: React.DragEvent<HTMLDivElement>, id: number) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverId(id)
  }

  function handleWantDrop(
    e: React.DragEvent<HTMLDivElement>,
    targetId: number
  ) {
    e.preventDefault()
    const sourceRaw = e.dataTransfer.getData('text/plain')
    const sourceId = parseInt(sourceRaw, 10)
    setDragOverId(null)
    setDragSourceId(null)
    if (Number.isNaN(sourceId) || sourceId === targetId) return
    const ids = active.map((g) => g.id)
    const from = ids.indexOf(sourceId)
    const to = ids.indexOf(targetId)
    if (from === -1 || to === -1) return
    const next = [...ids]
    next.splice(from, 1)
    next.splice(to, 0, sourceId)
    reorderActiveGoals(next)
    bumpRefresh()
  }

  function handleWantDragEnd() {
    setDragOverId(null)
    setDragSourceId(null)
  }

  return (
    <>
      <div data-refresh-version={refreshKey}>
        {active.length === 0 && completed.length === 0 ? (
          <p className="text-muted small mb-0">
            No wants yet. Add a want to plan saving toward a purchase.
          </p>
        ) : (
          <>
            {active.map((g) => {
              const perPay = perWantAlloc.get(g.id) ?? 0
              const schedule = getWantScheduleHealth({
                remainingCents: g.remaining,
                perPayCents: perPay,
                payPeriodDays: planner.payPeriodDays,
                behavioralMultiplier: planner.behavioralMultiplier,
                targetDate: g.target_date,
              })
              const expectedPerPayCents =
                schedule.status === 'atRisk' || schedule.status === 'offTrack'
                  ? getExpectedPerPayCentsForTarget({
                      remainingCents: g.remaining,
                      payPeriodDays: planner.payPeriodDays,
                      behavioralMultiplier: planner.behavioralMultiplier,
                      targetDate: g.target_date,
                    })
                  : null
              const progressStyle = getTrackerStyleProgress(g.progress)
              return (
                <div
                  key={g.id}
                  className="mb-3"
                  draggable
                  onDragStart={(e) => handleWantDragStart(e, g.id)}
                  onDragEnd={handleWantDragEnd}
                  onDragOver={(e) => handleWantDragOver(e, g.id)}
                  onDrop={(e) => handleWantDrop(e, g.id)}
                  style={{
                    outline:
                      dragOverId === g.id && dragSourceId !== g.id
                        ? '2px dashed var(--vantura-primary)'
                        : undefined,
                    borderRadius: 6,
                    cursor: dragSourceId === g.id ? 'grabbing' : 'grab',
                  }}
                  title="Drag to reorder want"
                  aria-label={`Drag row to reorder want ${g.name}`}
                >
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <div className="d-flex align-items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-link p-0 text-decoration-none text-start"
                        onClick={() => openEdit(g)}
                        style={{ color: 'inherit' }}
                        aria-label={`Edit want ${g.name}`}
                      >
                        <div className="d-flex flex-column align-items-start">
                          <span className="fw-medium">{g.name}</span>
                          {g.target_date && (
                            <span className="small text-muted">
                              Due: {formatDueDateShort(g.target_date)}
                            </span>
                          )}
                        </div>
                      </button>
                    </div>
                    <div className="d-flex flex-column align-items-end gap-1">
                      <div className="d-flex gap-1 align-items-center flex-wrap justify-content-end">
                        <span
                          className={`badge ${getBadgeToneClass(schedule.tone)}`}
                          title={formatPaceTooltip(schedule)}
                        >
                          {getPaceStatusBadgeLabel(schedule)}
                        </span>
                        <span
                          className={`badge ${getBadgeToneClass(schedule.tone)}`}
                        >
                          Pace: ${formatMoney(perPay)}/{payPeriodLabel}
                        </span>
                        {expectedPerPayCents != null &&
                          (schedule.status === 'atRisk' ||
                            schedule.status === 'offTrack') && (
                            <span className="badge text-bg-warning">
                              Req: ${formatMoney(expectedPerPayCents)}/
                              {payPeriodLabel}
                            </span>
                          )}
                      </div>
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
                    variant={progressStyle.variant}
                    striped={progressStyle.striped}
                    animated={progressStyle.animated}
                    label={`${Math.round(g.progress)}%`}
                    style={{ height: 14 }}
                    aria-label={`${g.name} progress: ${Math.round(g.progress)}%`}
                  />
                  {g.monthly_contribution != null && (
                    <div className="small text-muted mt-1">
                      Manual: ${formatMoney(g.monthly_contribution)}/month
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
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingGoal ? 'Edit want' : 'New want'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label htmlFor="plan-want-name">Name</Form.Label>
              <Form.Control
                id="plan-want-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bike"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label htmlFor="plan-want-target-amount">
                Target ($)
              </Form.Label>
              <Form.Control
                id="plan-want-target-amount"
                type="number"
                step="0.01"
                min="0"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
              />
            </Form.Group>
            {editingGoal && (
              <Form.Group className="mb-2">
                <Form.Label htmlFor="plan-want-current-amount">
                  Saved so far ($)
                </Form.Label>
                <Form.Control
                  id="plan-want-current-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                />
              </Form.Group>
            )}
            <Form.Group className="mb-2">
              <Form.Label htmlFor="plan-want-monthly">
                Optional manual monthly contribution ($)
              </Form.Label>
              <Form.Control
                id="plan-want-monthly"
                type="number"
                step="0.01"
                min="0"
                placeholder="Optional"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label htmlFor="plan-want-target-date">
                Target date
              </Form.Label>
              <Form.Control
                id="plan-want-target-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </Form.Group>
            <Row>
              <Col sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label htmlFor="plan-want-pct">Allocation %</Form.Label>
                  <Form.Control
                    id="plan-want-pct"
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
})
