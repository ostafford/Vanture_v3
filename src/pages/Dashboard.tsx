import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Row, Col } from 'react-bootstrap'
import {
  getAvailableBalance,
  getReservedAmount,
  getSpendableBalance,
} from '@/services/balance'
import { formatMoney } from '@/lib/format'
import { SaversSection } from '@/components/dashboard/SaversSection'
import { InsightsSection } from '@/components/dashboard/InsightsSection'
import { TrackersSection } from '@/components/dashboard/TrackersSection'
import { UpcomingSection } from '@/components/dashboard/UpcomingSection'
import { StatCard } from '@/components/StatCard'

export function Dashboard() {
  const [, setDataVersion] = useState(0)
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
            gradient="danger"
            imgAlt="circle"
          />
        </Col>
        <Col md={4} className="stretch-card grid-margin">
          <StatCard
            title="Spendable"
            value={getSpendableBalance()}
            subtitle={`$${formatMoney(getReservedAmount())} reserved for upcoming`}
            gradient="info"
            imgAlt="circle"
            tooltip="Spendable = Available minus reserved for upcoming charges. Only charges due before your next payday are reserved; prorated for monthly/quarterly/yearly."
          />
        </Col>
        <Col md={4} className="stretch-card grid-margin">
          <StatCard
            title="Reserved"
            value={getReservedAmount()}
            gradient="success"
            imgAlt="circle"
          />
        </Col>
      </Row>
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
