import { Row, Col } from 'react-bootstrap'
import { BalanceCard } from '@/components/BalanceCard'
import { SaversSection } from '@/components/dashboard/SaversSection'
import { InsightsSection } from '@/components/dashboard/InsightsSection'
import { TrackersSection } from '@/components/dashboard/TrackersSection'
import { UpcomingSection } from '@/components/dashboard/UpcomingSection'

export function Dashboard() {
  return (
    <div>
      <h1 className="mb-3">Dashboard</h1>
      <div className="mb-4">
        <BalanceCard />
      </div>
      <Row className="g-4 mb-4">
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
