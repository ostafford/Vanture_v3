import { Row, Col } from 'react-bootstrap'
import { BalanceCard } from '@/components/BalanceCard'
import { SaversSection } from '@/components/dashboard/SaversSection'
import { InsightsSection } from '@/components/dashboard/InsightsSection'
import { TrackersSection } from '@/components/dashboard/TrackersSection'
import { UpcomingSection } from '@/components/dashboard/UpcomingSection'

export function Dashboard() {
  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">
          <span className="page-title-icon">
            <i className="mdi mdi-home" aria-hidden />
          </span>
          Dashboard
        </h3>
      </div>
      <div className="grid-margin">
        <BalanceCard />
      </div>
      <Row className="g-4 grid-margin">
        <Col md={4}>
          <SaversSection />
        </Col>
        <Col md={4}>
          <InsightsSection />
        </Col>
        <Col md={4}>
          <TrackersSection />
        </Col>
      </Row>
      <UpcomingSection />
    </div>
  )
}
