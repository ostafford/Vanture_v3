import { useState } from 'react'
import { useStore } from 'zustand'
import {
  Card,
  Row,
  Col,
  Button,
  Modal,
  Form,
  Nav,
  Badge,
  OverlayTrigger,
  Tooltip,
} from 'react-bootstrap'
import {
  getPendingMaybuys,
  getMaybuyHistory,
  createMaybuy,
  updateMaybuy,
  deleteMaybuy,
  markMaybuyBought,
  markMaybuySkipped,
  daysThinking,
  daysHeldBeforeDecision,
  type MaybuyRow,
} from '@/services/maybuys'
import { getAccountsByTypes } from '@/services/accounts'
import { formatMoney, formatDate } from '@/lib/format'
import { toast } from '@/stores/toastStore'
import { syncStore } from '@/stores/syncStore'
import { HelpPopover } from '@/components/HelpPopover'

export function AnalyticsMaybuys() {
  const [tab, setTab] = useState<'wishlist' | 'history'>('wishlist')
  const [refresh, setRefresh] = useState(0)
  useStore(syncStore, (s) => s.lastSyncCompletedAt)

  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MaybuyRow | null>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [saverAccountId, setSaverAccountId] = useState('')

  const pending = getPendingMaybuys()
  const history = getMaybuyHistory()
  const savers = getAccountsByTypes(['SAVER'])

  void refresh

  function openCreate() {
    setEditingItem(null)
    setName('')
    setPrice('')
    setUrl('')
    setNotes('')
    setSaverAccountId('')
    setShowModal(true)
  }

  function openEdit(item: MaybuyRow) {
    setEditingItem(item)
    setName(item.name)
    setPrice(String(item.price_cents / 100))
    setUrl(item.url ?? '')
    setNotes(item.notes ?? '')
    setSaverAccountId(item.saver_account_id ?? '')
    setShowModal(true)
  }

  function handleSave() {
    const priceCents = Math.round(parseFloat(price || '0') * 100)
    if (!name.trim() || priceCents <= 0) return
    const urlVal = url.trim() || null
    const notesVal = notes.trim() || null
    const saverVal = saverAccountId || null

    if (editingItem) {
      updateMaybuy(
        editingItem.id,
        name.trim(),
        priceCents,
        urlVal,
        notesVal,
        saverVal
      )
      toast.success('Maybuy updated.')
    } else {
      createMaybuy(name.trim(), priceCents, urlVal, notesVal, saverVal)
      toast.success('Added to your Maybuys.')
    }
    setShowModal(false)
    setRefresh((r) => r + 1)
  }

  function handleDelete() {
    if (!editingItem) return
    deleteMaybuy(editingItem.id)
    setShowModal(false)
    setRefresh((r) => r + 1)
    toast.success('Maybuy removed.')
  }

  function handleBuy(item: MaybuyRow) {
    markMaybuyBought(item.id)
    setRefresh((r) => r + 1)
    toast.success(`Marked "${item.name}" as bought.`)
  }

  function handleSkip(item: MaybuyRow) {
    markMaybuySkipped(item.id)
    setRefresh((r) => r + 1)
    toast.success(`Skipped "${item.name}".`)
  }

  function thinkingLabel(days: number): string {
    if (days === 0) return 'Added today'
    if (days === 1) return 'Thinking about this for 1 day'
    return `Thinking about this for ${days} days`
  }

  const saverMap = Object.fromEntries(savers.map((s) => [s.id, s]))

  const pendingTotal = pending.reduce((s, i) => s + i.price_cents, 0)

  return (
    <div className="grid-margin">
      <p className="text-muted mb-3">
        Add things you&apos;re considering buying. Let the clock nudge you
        toward a more intentional decision.
      </p>

      <Nav
        variant="tabs"
        className="mb-3"
        activeKey={tab}
        onSelect={(k) => setTab((k as 'wishlist' | 'history') ?? 'wishlist')}
      >
        <Nav.Item>
          <Nav.Link eventKey="wishlist">
            Wishlist
            {pending.length > 0 && (
              <Badge bg="primary" className="ms-2">
                {pending.length}
              </Badge>
            )}
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="history">History</Nav.Link>
        </Nav.Item>
      </Nav>

      {tab === 'wishlist' && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center gap-2">
              {pending.length > 0 && (
                <span className="text-muted small">
                  {pending.length} item{pending.length === 1 ? '' : 's'} ·{' '}
                  <strong>${formatMoney(pendingTotal)}</strong> total
                </span>
              )}
              <HelpPopover
                id="maybuys-help"
                title="Maybuys"
                content="Add items you're thinking about buying. The timer shows how long you've been considering each one — a gentle nudge to spend more intentionally. Link a Saver to see how much you've already set aside."
                ariaLabel="How do Maybuys work?"
              />
            </div>
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip id="maybuys-add-tooltip">Add item</Tooltip>}
            >
              <Button
                variant="primary"
                size="sm"
                onClick={openCreate}
                aria-label="Add Maybuy item"
              >
                <i className="mdi mdi-plus" aria-hidden /> Add item
              </Button>
            </OverlayTrigger>
          </div>

          {pending.length === 0 ? (
            <Card className="border">
              <Card.Body className="text-center py-5">
                <i
                  className="mdi mdi-cart-heart d-block mb-2 text-muted"
                  style={{ fontSize: '2.5rem' }}
                  aria-hidden
                />
                <p className="text-muted mb-3">
                  Nothing here yet. Add something you&apos;re thinking about
                  buying — the timer will help you decide.
                </p>
                <Button variant="primary" size="sm" onClick={openCreate}>
                  Add your first Maybuy
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <Row className="g-3">
              {pending.map((item) => {
                const days = daysThinking(item.created_at)
                const saver = item.saver_account_id
                  ? saverMap[item.saver_account_id]
                  : null
                return (
                  <Col key={item.id} xs={12} md={6} lg={4}>
                    <Card className="h-100 border">
                      <Card.Body className="d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="flex-grow-1 me-2">
                            <h6 className="mb-1 fw-semibold">{item.name}</h6>
                            <p className="mb-0 h5 fw-bold">
                              ${formatMoney(item.price_cents)}
                            </p>
                          </div>
                          <OverlayTrigger
                            placement="top"
                            overlay={
                              <Tooltip id={`maybuy-edit-${item.id}`}>
                                Edit
                              </Tooltip>
                            }
                          >
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 text-muted"
                              onClick={() => openEdit(item)}
                              aria-label={`Edit ${item.name}`}
                            >
                              <i
                                className="mdi mdi-pencil-outline"
                                style={{ fontSize: '1.1rem' }}
                                aria-hidden
                              />
                            </Button>
                          </OverlayTrigger>
                        </div>

                        <p className="small text-muted mb-2">
                          <i
                            className="mdi mdi-clock-outline me-1"
                            aria-hidden
                          />
                          {thinkingLabel(days)}
                        </p>

                        {saver && (
                          <p className="small text-muted mb-2">
                            <i
                              className="mdi mdi-piggy-bank-outline me-1"
                              aria-hidden
                            />
                            {saver.display_name} · ${formatMoney(saver.balance)}{' '}
                            saved
                          </p>
                        )}

                        {item.notes && (
                          <p className="small text-muted mb-2">{item.notes}</p>
                        )}

                        {item.url && (
                          <p className="small mb-2">
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary"
                            >
                              View item{' '}
                              <i className="mdi mdi-open-in-new" aria-hidden />
                            </a>
                          </p>
                        )}

                        <div className="mt-auto pt-2 d-flex gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            className="flex-fill"
                            onClick={() => handleBuy(item)}
                          >
                            Buy it
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="flex-fill"
                            onClick={() => handleSkip(item)}
                          >
                            Skip it
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                )
              })}
            </Row>
          )}
        </>
      )}

      {tab === 'history' && (
        <>
          {history.length === 0 ? (
            <Card className="border">
              <Card.Body className="text-center py-5">
                <p className="text-muted mb-0">
                  No decisions yet. Your bought and skipped items will appear
                  here.
                </p>
              </Card.Body>
            </Card>
          ) : (
            <Card className="border">
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <table className="table table-striped mb-0">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th className="text-end">Price</th>
                        <th>Decision</th>
                        <th>Added</th>
                        <th>Decided</th>
                        <th className="text-end">Days held</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((item) => {
                        const held = item.decided_at
                          ? daysHeldBeforeDecision(
                              item.created_at,
                              item.decided_at
                            )
                          : null
                        return (
                          <tr key={item.id}>
                            <td>
                              <span className="fw-medium">{item.name}</span>
                              {item.url && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ms-2 text-muted"
                                  aria-label={`View ${item.name}`}
                                >
                                  <i
                                    className="mdi mdi-open-in-new small"
                                    aria-hidden
                                  />
                                </a>
                              )}
                            </td>
                            <td className="text-end">
                              ${formatMoney(item.price_cents)}
                            </td>
                            <td>
                              {item.status === 'BOUGHT' ? (
                                <Badge bg="success">Bought</Badge>
                              ) : (
                                <Badge bg="secondary">Skipped</Badge>
                              )}
                            </td>
                            <td className="text-muted small">
                              {formatDate(item.created_at)}
                            </td>
                            <td className="text-muted small">
                              {item.decided_at
                                ? formatDate(item.decided_at)
                                : '—'}
                            </td>
                            <td className="text-end text-muted small">
                              {held !== null ? held : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>
          )}
        </>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingItem ? 'Edit Maybuy' : 'Add Maybuy'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label htmlFor="maybuy-name">Name</Form.Label>
              <Form.Control
                id="maybuy-name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sony headphones"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label htmlFor="maybuy-price">Price ($)</Form.Label>
              <Form.Control
                id="maybuy-price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label htmlFor="maybuy-url">
                URL <span className="text-muted fw-normal">(optional)</span>
              </Form.Label>
              <Form.Control
                id="maybuy-url"
                name="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label htmlFor="maybuy-notes">
                Notes <span className="text-muted fw-normal">(optional)</span>
              </Form.Label>
              <Form.Control
                id="maybuy-notes"
                as="textarea"
                name="notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Why do you want this?"
              />
            </Form.Group>
            {savers.length > 0 && (
              <Form.Group className="mb-2">
                <Form.Label htmlFor="maybuy-saver">
                  Link to Saver{' '}
                  <span className="text-muted fw-normal">(optional)</span>
                </Form.Label>
                <Form.Select
                  id="maybuy-saver"
                  name="saverAccountId"
                  value={saverAccountId}
                  onChange={(e) => setSaverAccountId(e.target.value)}
                >
                  <option value="">None</option>
                  {savers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.display_name} (${formatMoney(s.balance)})
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  Shows this saver&apos;s balance alongside the price.
                </Form.Text>
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          {editingItem && (
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
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!name.trim() || !price.trim() || parseFloat(price) <= 0}
          >
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
