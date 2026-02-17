import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Row, Col, Modal, Button, Form } from 'react-bootstrap'
import {
  getAvailableBalance,
  getReservedAmount,
  getSpendableBalance,
} from '@/services/balance'
import { formatMoney } from '@/lib/format'
import { getAppSetting, setAppSetting } from '@/db'
import { SaversSection } from '@/components/dashboard/SaversSection'
import { InsightsSection } from '@/components/dashboard/InsightsSection'
import { TrackersSection } from '@/components/dashboard/TrackersSection'
import { UpcomingSection } from '@/components/dashboard/UpcomingSection'
import { StatCard } from '@/components/StatCard'

const SPENDABLE_ALERT_KEY = 'spendable_alert_below_cents'

export function Dashboard() {
  const [, setDataVersion] = useState(0)
  const [showThresholdModal, setShowThresholdModal] = useState(false)
  const [thresholdDollars, setThresholdDollars] = useState('')

  const spendableCents = getSpendableBalance()
  const thresholdCentsRaw = getAppSetting(SPENDABLE_ALERT_KEY)
  const thresholdCents = thresholdCentsRaw != null && thresholdCentsRaw !== '' ? parseInt(thresholdCentsRaw, 10) : null
  const isSpendableLow = thresholdCents != null && thresholdCents > 0 && spendableCents < thresholdCents
  const spendableGradient = isSpendableLow ? 'danger' : 'success'

  const openThresholdModal = useCallback(() => {
    const raw = getAppSetting(SPENDABLE_ALERT_KEY)
    const cents = raw != null && raw !== '' ? parseInt(raw, 10) : 0
    setThresholdDollars(cents > 0 ? (cents / 100).toFixed(2) : '')
    setShowThresholdModal(true)
  }, [])

  const saveThreshold = useCallback(() => {
    const trimmed = thresholdDollars.trim()
    if (trimmed === '') {
      setAppSetting(SPENDABLE_ALERT_KEY, '0')
    } else {
      const cents = Math.round(parseFloat(trimmed) * 100)
      setAppSetting(SPENDABLE_ALERT_KEY, String(isNaN(cents) ? 0 : Math.max(0, cents)))
    }
    setShowThresholdModal(false)
    setDataVersion((v) => v + 1)
  }, [thresholdDollars])

  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">
          <span className="page-title-icon bg-gradient-primary text-white mr-2">
            <i className="mdi mdi-home" aria-hidden />
          </span>
          Dashboard
        </h3>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link to="/">Dashboard</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              Overview <i className="mdi mdi-alert-circle-outline icon-sm text-primary align-middle" aria-hidden />
            </li>
          </ol>
        </nav>
      </div>
      <Row className="grid-margin">
        <Col md={4} className="stretch-card grid-margin">
          <StatCard
            title="Available"
            value={getAvailableBalance()}
            gradient="success"
            imgAlt="circle"
          />
        </Col>
        <Col md={4} className="stretch-card grid-margin">
          <div
            role="button"
            tabIndex={0}
            onClick={openThresholdModal}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openThresholdModal() } }}
            style={{ cursor: 'pointer' }}
            aria-label="Spendable balance; click to set low balance alert"
          >
            <StatCard
              title="Spendable"
              value={spendableCents}
              subtitle={`$${formatMoney(getReservedAmount())} reserved for upcoming`}
              gradient={spendableGradient}
              imgAlt="circle"
              tooltip={isSpendableLow ? 'Spendable is below your alert threshold.' : 'Spendable = Available minus reserved for upcoming charges. Only charges due before your next payday are reserved; prorated for monthly/quarterly/yearly. Click to set alert threshold.'}
            />
          </div>
        </Col>
        <Col md={4} className="stretch-card grid-margin">
          <StatCard
            title="Reserved"
            value={getReservedAmount()}
            gradient="danger"
            imgAlt="circle"
          />
        </Col>
      </Row>

      <Modal show={showThresholdModal} onHide={() => setShowThresholdModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Spendable alert threshold</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Label>Alert when Spendable is below ($)</Form.Label>
          <Form.Control
            type="number"
            min="0"
            step="0.01"
            placeholder="Leave empty to disable"
            value={thresholdDollars}
            onChange={(e) => setThresholdDollars(e.target.value)}
            aria-label="Alert when Spendable is below (dollars)"
          />
          <Form.Text className="text-muted">When Spendable drops below this amount, the card turns red. Leave empty or 0 to disable.</Form.Text>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowThresholdModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={saveThreshold}>Save</Button>
        </Modal.Footer>
      </Modal>
      <Row className="grid-margin">
        <Col md={7} className="grid-margin stretch-card">
          <SaversSection />
        </Col>
        <Col md={5} className="grid-margin stretch-card">
          <TrackersSection />
        </Col>
      </Row>
      <Row className="grid-margin">
        <Col xs={12} className="grid-margin">
          <InsightsSection />
        </Col>
      </Row>
      <Row className="grid-margin">
        <Col xs={12} className="grid-margin">
          <UpcomingSection onUpcomingChange={() => setDataVersion((v) => v + 1)} />
        </Col>
      </Row>
    </div>
  )
}
