import { useState } from 'react'
import { Card, Button, Modal, Form } from 'react-bootstrap'
import {
  getUpcomingChargesGrouped,
  createUpcomingCharge,
  updateUpcomingCharge,
  deleteUpcomingCharge,
  type UpcomingChargeRow,
} from '@/services/upcoming'
import { getReservedAmount } from '@/services/balance'
import { getCategories } from '@/services/categories'
import { formatMoney, formatShortDate } from '@/lib/format'
import { toast } from '@/stores/toastStore'

const FREQUENCIES = ['WEEKLY', 'FORTNIGHTLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'ONCE']

export interface UpcomingSectionProps {
  onUpcomingChange?: () => void
}

export function UpcomingSection({ onUpcomingChange }: UpcomingSectionProps) {
  const [, setRefresh] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editingCharge, setEditingCharge] = useState<UpcomingChargeRow | null>(null)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState('MONTHLY')
  const [nextChargeDate, setNextChargeDate] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [isReserved, setIsReserved] = useState(true)

  const { nextPay, later, nextPayday } = getUpcomingChargesGrouped()
  const reserved = getReservedAmount()
  const categories = getCategories()

  function openCreate() {
    setEditingCharge(null)
    setName('')
    setAmount('')
    setFrequency('MONTHLY')
    setNextChargeDate(new Date().toISOString().slice(0, 10))
    setCategoryId('')
    setIsReserved(true)
    setShowModal(true)
  }

  function openEdit(c: UpcomingChargeRow) {
    setEditingCharge(c)
    setName(c.name)
    setAmount(String(c.amount / 100))
    setFrequency(c.frequency)
    setNextChargeDate(c.next_charge_date)
    setCategoryId(c.category_id ?? '')
    setIsReserved(c.is_reserved === 1)
    setShowModal(true)
  }

  function handleSave() {
    const amountCents = Math.round(parseFloat(amount || '0') * 100)
    if (!name.trim() || amountCents <= 0 || !nextChargeDate) return
    if (editingCharge) {
      updateUpcomingCharge(
        editingCharge.id,
        name.trim(),
        amountCents,
        frequency,
        nextChargeDate,
        categoryId || null,
        isReserved
      )
      toast.success('Upcoming charge updated.')
    } else {
      createUpcomingCharge(
        name.trim(),
        amountCents,
        frequency,
        nextChargeDate,
        categoryId || null,
        isReserved
      )
      toast.success('Upcoming charge added.')
    }
    setShowModal(false)
    setRefresh((r) => r + 1)
    onUpcomingChange?.()
  }

  function handleDelete() {
    if (editingCharge) {
      deleteUpcomingCharge(editingCharge.id)
      setShowModal(false)
      setRefresh((r) => r + 1)
      onUpcomingChange?.()
    }
  }

  const nextPayTotal = nextPay.reduce((s, c) => s + c.amount, 0)
  const laterTotal = later.reduce((s, c) => s + c.amount, 0)
  const hasAny = nextPay.length > 0 || later.length > 0

  function renderDataRow(c: UpcomingChargeRow) {
    return (
      <tr
        key={c.id}
        role="button"
        tabIndex={0}
        onClick={() => openEdit(c)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEdit(c) } }}
        style={{ cursor: 'pointer' }}
      >
        <td>{formatShortDate(c.next_charge_date)}</td>
        <td>{c.name}</td>
        <td>{c.frequency}</td>
        <td className="text-end">${formatMoney(c.amount)}</td>
      </tr>
    )
  }

  return (
    <>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center section-header">
          <div className="d-flex align-items-center">
            <span className="page-title-icon bg-gradient-primary text-white mr-2">
              <i className="mdi mdi-calendar-clock" aria-hidden />
            </span>
            <span>Upcoming transactions</span>
          </div>
          <Button variant="primary" size="sm" onClick={openCreate}>
            + Add
          </Button>
        </Card.Header>
        <Card.Body>
          {nextPayday && (
            <p className="small text-muted mb-2">
              Pay day – Due {formatShortDate(nextPayday)}
            </p>
          )}
          {!hasAny ? (
            <p className="text-muted small mb-0">
              No upcoming charges. Add a regular charge to track.
            </p>
          ) : (
            <table className="table table-striped mb-0">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Frequency</th>
                  <th className="text-end">Amount</th>
                </tr>
              </thead>
              <tbody>
                {nextPay.length > 0 && (
                  <>
                    <tr className="upcoming-section-header">
                      <td colSpan={4}>
                        <div className="d-flex justify-content-between align-items-center page-title">
                          <strong>Next pay</strong>
                          <span className="text-danger fw-normal">${formatMoney(nextPayTotal)} <span className="text-muted">total</span></span>
                        </div>
                      </td>
                    </tr>
                    {nextPay.map(renderDataRow)}
                  </>
                )}
                {later.length > 0 && (
                  <>
                    <tr className="upcoming-section-header">
                      <td colSpan={4}>
                        <div className="d-flex justify-content-between align-items-center">
                          <strong>Later</strong>
                          <span>${formatMoney(laterTotal)}</span>
                        </div>
                      </td>
                    </tr>
                    {later.map(renderDataRow)}
                  </>
                )}
              </tbody>
            </table>
          )}
          <div className="mt-2 small text-danger">
            ${formatMoney(reserved)} reserved for upcoming
          </div>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingCharge ? 'Edit upcoming charge' : 'Add upcoming charge'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label htmlFor="upcoming-charge-name">Name</Form.Label>
              <Form.Control
                id="upcoming-charge-name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label htmlFor="upcoming-charge-amount">Amount ($)</Form.Label>
              <Form.Control
                id="upcoming-charge-amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label htmlFor="upcoming-charge-frequency">Frequency</Form.Label>
              <Form.Select
                id="upcoming-charge-frequency"
                name="frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f.charAt(0) + f.slice(1).toLowerCase()}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label htmlFor="upcoming-charge-next-date">Next charge date</Form.Label>
              <Form.Control
                id="upcoming-charge-next-date"
                name="nextChargeDate"
                type="date"
                value={nextChargeDate}
                onChange={(e) => setNextChargeDate(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label htmlFor="upcoming-charge-category">Category</Form.Label>
              <Form.Select
                id="upcoming-charge-category"
                name="categoryId"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Check
                type="checkbox"
                id="upcoming-charge-is-reserved"
                name="isReserved"
                label="Include in Spendable (reserve this amount)"
                checked={isReserved}
                onChange={(e) => setIsReserved(e.target.checked)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          {editingCharge && (
            <Button variant="outline-danger" className="me-auto" onClick={handleDelete}>
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
