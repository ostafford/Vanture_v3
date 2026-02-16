import { useState } from 'react'
import { Card, ProgressBar, Button, Modal, Form } from 'react-bootstrap'
import { getSaversWithProgress, updateSaverGoals } from '@/services/savers'
import { formatMoney, formatDate } from '@/lib/format'

export function SaversSection() {
  const [, setRefresh] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [goalAmount, setGoalAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [monthlyTransfer, setMonthlyTransfer] = useState('')

  const savers = getSaversWithProgress()

  function openEdit(saver: { id: string; goal_amount: number | null; target_date: string | null; monthly_transfer: number | null }) {
    setEditingId(saver.id)
    setGoalAmount(saver.goal_amount != null ? String(saver.goal_amount / 100) : '')
    setTargetDate(saver.target_date ?? '')
    setMonthlyTransfer(saver.monthly_transfer != null ? String(saver.monthly_transfer / 100) : '')
  }

  function handleSaveGoals() {
    if (!editingId) return
    const goalCents = goalAmount ? Math.round(parseFloat(goalAmount) * 100) : null
    const monthlyCents = monthlyTransfer ? Math.round(parseFloat(monthlyTransfer) * 100) : null
    updateSaverGoals(editingId, goalCents, targetDate || null, monthlyCents)
    setEditingId(null)
    setRefresh((r) => r + 1)
  }

  const totalBalance = savers.reduce((sum, s) => sum + s.current_balance, 0)

  return (
    <>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>Savers</span>
          <small className="text-muted">${formatMoney(totalBalance)} total</small>
        </Card.Header>
        <Card.Body>
          {savers.length === 0 ? (
            <p className="text-muted small mb-0">
              No saver accounts yet. They&apos;ll appear after you sync with Up Bank.
            </p>
          ) : (
            <div className="d-flex flex-column gap-3">
              {savers.map((saver) => (
                <div key={saver.id}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <strong>{saver.name}</strong>
                      {saver.goal_amount != null && saver.goal_amount > 0 && (
                        <div className="small text-muted">
                          ${formatMoney(saver.current_balance)} of ${formatMoney(saver.goal_amount)}
                          {saver.target_date && ` · Target ${formatDate(saver.target_date)}`}
                        </div>
                      )}
                    </div>
                    <Button variant="outline-secondary" size="sm" onClick={() => openEdit(saver)}>
                      Edit
                    </Button>
                  </div>
                  {saver.goal_amount != null && saver.goal_amount > 0 ? (
                    <>
                      <ProgressBar
                        now={Math.min(100, saver.progress)}
                        variant={saver.onTrack ? 'success' : 'warning'}
                        className="mt-1"
                        label={`${Math.round(saver.progress)}%`}
                      />
                      {saver.monthly_transfer != null && saver.monthly_transfer > 0 && (
                        <small className="text-muted">
                          ${formatMoney(saver.monthly_transfer)}/mo
                          {saver.monthsRemaining > 0 &&
                            ` · ~$${formatMoney(saver.recommendedMonthly)} recommended`}
                        </small>
                      )}
                    </>
                  ) : (
                    <div className="small text-muted">${formatMoney(saver.current_balance)}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={editingId != null} onHide={() => setEditingId(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit saver goals</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Goal amount ($)</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0"
                placeholder="Optional"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Target date</Form.Label>
              <Form.Control
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Monthly transfer ($)</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0"
                placeholder="Optional"
                value={monthlyTransfer}
                onChange={(e) => setMonthlyTransfer(e.target.value)}
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
