import { useState } from 'react'
import {
  Card,
  Button,
  ProgressBar,
  Modal,
  Form,
  Badge,
  Collapse,
  Alert,
} from 'react-bootstrap'
import {
  getTrackersWithProgress,
  getTrackerTransactionsInPeriod,
  getTrackerCategoryIds,
  createTracker,
  updateTracker,
  deleteTracker,
  type TrackerResetFrequency,
} from '@/services/trackers'
import { getCategories } from '@/services/categories'
import { getPayAmountCents } from '@/services/balance'
import { formatMoney, formatShortDate } from '@/lib/format'
import { toast } from '@/stores/toastStore'
import { HelpPopover } from '@/components/HelpPopover'

const RESET_FREQUENCIES: { value: TrackerResetFrequency; label: string }[] = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'FORTNIGHTLY', label: 'Fortnightly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'PAYDAY', label: 'Payday' },
]

function getTrackerProgressStyle(progress: number): {
  variant: 'primary' | 'warning' | 'danger'
  striped: boolean
  animated: boolean
} {
  if (progress >= 100) {
    return { variant: 'danger', striped: true, animated: true }
  }
  if (progress >= 81) {
    return { variant: 'danger', striped: false, animated: false }
  }
  if (progress > 50) {
    return { variant: 'warning', striped: false, animated: false }
  }
  return { variant: 'primary', striped: false, animated: false }
}

export function TrackersSection() {
  const [, setRefresh] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [budget, setBudget] = useState('')
  const [frequency, setFrequency] = useState<TrackerResetFrequency>('WEEKLY')
  const [resetDay, setResetDay] = useState(1)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])

  const trackers = getTrackersWithProgress()
  const categories = getCategories()
  const payAmountCents = getPayAmountCents()
  const totalPaydayBudgetCents = trackers
    .filter((t) => t.reset_frequency === 'PAYDAY')
    .reduce((sum, t) => sum + t.budget_amount, 0)
  const paydayBudgetExceedsPay =
    payAmountCents != null &&
    payAmountCents > 0 &&
    totalPaydayBudgetCents > payAmountCents

  function openCreate() {
    setEditingId(null)
    setName('')
    setBudget('')
    setFrequency('WEEKLY')
    setResetDay(1)
    setSelectedCategoryIds([])
    setShowModal(true)
  }

  function openEdit(t: {
    id: number
    name: string
    budget_amount: number
    reset_frequency: string
    reset_day: number | null
  }) {
    setEditingId(t.id)
    setName(t.name)
    setBudget(String(t.budget_amount / 100))
    setFrequency(t.reset_frequency as TrackerResetFrequency)
    setResetDay(t.reset_day ?? 1)
    setSelectedCategoryIds(getTrackerCategoryIds(t.id))
    setShowModal(true)
  }

  function handleSave() {
    const budgetCents = Math.round(parseFloat(budget || '0') * 100)
    if (!name.trim() || budgetCents <= 0 || selectedCategoryIds.length === 0)
      return
    if (editingId != null) {
      updateTracker(
        editingId,
        name.trim(),
        budgetCents,
        frequency,
        resetDay,
        selectedCategoryIds
      )
      toast.success('Tracker saved.')
    } else {
      createTracker(
        name.trim(),
        budgetCents,
        frequency,
        resetDay,
        selectedCategoryIds
      )
      toast.success('Tracker created.')
    }
    setShowModal(false)
    setRefresh((r) => r + 1)
  }

  function handleDelete(id: number) {
    deleteTracker(id)
    setShowModal(false)
    setRefresh((r) => r + 1)
  }

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const resetDayOptions =
    frequency === 'MONTHLY'
      ? Array.from({ length: 28 }, (_, i) => i + 1)
      : [1, 2, 3, 4, 5, 6, 7]

  const budgetCentsForModal = Math.round(parseFloat(budget || '0') * 100)
  const otherPaydayBudgetCents =
    editingId != null
      ? trackers
          .filter((t) => t.reset_frequency === 'PAYDAY' && t.id !== editingId)
          .reduce((sum, t) => sum + t.budget_amount, 0)
      : totalPaydayBudgetCents
  const newTotalPaydayCents = otherPaydayBudgetCents + budgetCentsForModal
  const modalPaydayExceedsPay =
    frequency === 'PAYDAY' &&
    payAmountCents != null &&
    payAmountCents > 0 &&
    budgetCentsForModal > 0 &&
    newTotalPaydayCents > payAmountCents

  return (
    <>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center section-header">
          <div className="d-flex align-items-center">
            <span className="page-title-icon bg-gradient-primary text-white mr-2">
              <i className="mdi mdi-chart-line" aria-hidden />
            </span>
            <span>Trackers</span>
            <HelpPopover
              id="trackers-help"
              title="Trackers"
              content="Set a budget and reset frequency (Weekly, Fortnightly, Monthly, or Payday). Assign one or more categories to each tracker. The dashboard shows progress, days left, and transactions in the current period."
              ariaLabel="What are trackers?"
            />
          </div>
          <Button variant="primary" size="sm" onClick={openCreate}>
            + Add Tracker
          </Button>
        </Card.Header>
        <Card.Body>
          {paydayBudgetExceedsPay && (
            <Alert variant="warning" className="mb-3">
              Total PAYDAY tracker budgets ($
              {formatMoney(totalPaydayBudgetCents)}) exceed your pay amount ($
              {formatMoney(payAmountCents!)}). Consider adjusting budgets or pay
              amount in Settings.
            </Alert>
          )}
          {trackers.length === 0 ? (
            <p className="text-muted small mb-0">
              No trackers yet. Add one to get started.
            </p>
          ) : (
            <div className="d-flex flex-column gap-3">
              {trackers.map((t) => {
                const progressStyle = getTrackerProgressStyle(t.progress)
                return (
                  <div key={t.id}>
                    <div
                      className="d-flex justify-content-between align-items-start"
                      style={{ cursor: 'pointer' }}
                      onClick={() =>
                        setExpandedId(expandedId === t.id ? null : t.id)
                      }
                    >
                      <div>
                        <strong>{t.name}</strong>
                        <Badge bg="info" className="ms-2">
                          {t.daysLeft} days
                        </Badge>
                      </div>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEdit(t)
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                    <h6
                      className={`text-${progressStyle.variant} mt-1 text-end`}
                    >
                      ${formatMoney(t.remaining)} left
                    </h6>
                    <ProgressBar
                      now={Math.min(100, t.progress)}
                      variant={progressStyle.variant}
                      striped={progressStyle.striped}
                      animated={progressStyle.animated}
                      label={`${Math.round(t.progress)}%`}
                    />
                    <small className="text-muted">
                      ${formatMoney(t.spent)} of ${formatMoney(t.budget_amount)}{' '}
                      spent
                    </small>
                    <Collapse in={expandedId === t.id}>
                      <div className="mt-2 small">
                        {getTrackerTransactionsInPeriod(t.id).length === 0 ? (
                          <span className="text-muted">
                            No transactions this period
                          </span>
                        ) : (
                          <ul className="list-unstyled mb-0">
                            {getTrackerTransactionsInPeriod(t.id).map((tx) => (
                              <li key={tx.id}>
                                {formatShortDate(
                                  tx.created_at ?? tx.settled_at ?? ''
                                )}{' '}
                                {tx.description} $
                                {formatMoney(Math.abs(tx.amount))}
                                {tx.status === 'HELD' && (
                                  <span className="text-muted small ms-1">
                                    (Held)
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </Collapse>
                  </div>
                )
              })}
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editingId != null ? 'Edit tracker' : 'Add tracker'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label htmlFor="tracker-edit-name">Name</Form.Label>
              <Form.Control
                id="tracker-edit-name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Food & Drink"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label htmlFor="tracker-edit-budget">Budget ($)</Form.Label>
              <Form.Control
                id="tracker-edit-budget"
                name="budget"
                type="number"
                step="0.01"
                min="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label htmlFor="tracker-edit-frequency">
                Reset frequency
              </Form.Label>
              <Form.Select
                id="tracker-edit-frequency"
                name="frequency"
                value={frequency}
                onChange={(e) =>
                  setFrequency(e.target.value as TrackerResetFrequency)
                }
              >
                {RESET_FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            {frequency !== 'PAYDAY' && (
              <Form.Group className="mb-2">
                <Form.Label htmlFor="tracker-edit-reset-day">
                  Reset day
                </Form.Label>
                <Form.Select
                  id="tracker-edit-reset-day"
                  name="resetDay"
                  value={resetDay}
                  onChange={(e) => setResetDay(Number(e.target.value))}
                >
                  {resetDayOptions.map((d) => (
                    <option key={d} value={d}>
                      {frequency === 'MONTHLY'
                        ? `${d}`
                        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][
                            d - 1
                          ]}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}
            {modalPaydayExceedsPay && (
              <Alert variant="warning" className="mb-2">
                Total PAYDAY budgets will be ${formatMoney(newTotalPaydayCents)}{' '}
                (pay amount ${formatMoney(payAmountCents!)}).
              </Alert>
            )}
            <Form.Group className="mb-2">
              <Form.Label>Categories</Form.Label>
              <div
                className="border rounded p-2"
                style={{ maxHeight: 160, overflowY: 'auto' }}
              >
                {categories.map((c) => (
                  <Form.Check
                    key={c.id}
                    type="checkbox"
                    id={`cat-${c.id}`}
                    label={c.name}
                    checked={selectedCategoryIds.includes(c.id)}
                    onChange={() => toggleCategory(c.id)}
                  />
                ))}
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          {editingId != null && (
            <Button
              variant="outline-danger"
              className="me-auto"
              onClick={() => handleDelete(editingId)}
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
