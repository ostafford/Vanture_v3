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

const FREQUENCIES = ['WEEKLY', 'FORTNIGHTLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'ONCE']

export function UpcomingSection() {
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
    } else {
      createUpcomingCharge(
        name.trim(),
        amountCents,
        frequency,
        nextChargeDate,
        categoryId || null,
        isReserved
      )
    }
    setShowModal(false)
    setRefresh((r) => r + 1)
  }

  function handleDelete() {
    if (editingCharge) {
      deleteUpcomingCharge(editingCharge.id)
      setShowModal(false)
      setRefresh((r) => r + 1)
    }
  }

  function renderList(items: UpcomingChargeRow[], title: string, totalCents: number) {
    if (items.length === 0) return null
    return (
      <div className="mb-3">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <strong>{title}</strong>
          <span>${formatMoney(totalCents)}</span>
        </div>
        <ul className="list-unstyled mb-0 border rounded p-2">
          {items.map((c) => (
            <li
              key={c.id}
              className="d-flex justify-content-between align-items-center py-1"
            >
              <span>
                {formatShortDate(c.next_charge_date)} {c.name} {c.frequency} ${formatMoney(c.amount)}
              </span>
              <div>
                <Button variant="outline-secondary" size="sm" className="me-1" onClick={() => openEdit(c)}>
                  Edit
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => {
                    deleteUpcomingCharge(c.id)
                    setRefresh((r) => r + 1)
                  }}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const nextPayTotal = nextPay.reduce((s, c) => s + c.amount, 0)
  const laterTotal = later.reduce((s, c) => s + c.amount, 0)

  return (
    <>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>Upcoming transactions</span>
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
          {nextPay.length === 0 && later.length === 0 ? (
            <p className="text-muted small mb-0">
              No upcoming charges. Add a regular charge to track.
            </p>
          ) : (
            <>
              {renderList(nextPay, 'Next pay', nextPayTotal)}
              {renderList(later, 'Later', laterTotal)}
            </>
          )}
          <div className="mt-2 small text-muted">
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
