import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Row, Col, Badge, Form } from 'react-bootstrap'
import {
  getTrackersWithProgressForPeriod,
  type TrackerResetFrequency,
} from '@/services/trackers'
import { formatMoney } from '@/lib/format'
const RESET_FREQUENCIES: { value: TrackerResetFrequency; label: string }[] = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'FORTNIGHTLY', label: 'Fortnightly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'PAYDAY', label: 'Payday' },
]

const FREQUENCY_ORDER: TrackerResetFrequency[] = [
  'PAYDAY',
  'WEEKLY',
  'FORTNIGHTLY',
  'MONTHLY',
]

export function AnalyticsTrackers() {
  const [frequencyFilter, setFrequencyFilter] = useState<string>('')

  const trackers = getTrackersWithProgressForPeriod(0)
  const filtered = frequencyFilter
    ? trackers.filter((t) => t.reset_frequency === frequencyFilter)
    : trackers

  const sortedTrackers = [...filtered].sort(
    (a, b) =>
      FREQUENCY_ORDER.indexOf(a.reset_frequency as TrackerResetFrequency) -
      FREQUENCY_ORDER.indexOf(b.reset_frequency as TrackerResetFrequency)
  )

  return (
    <>
      <Card className="grid-margin">
        <Card.Header>
          <Card.Title className="mb-0">Trackers Overview</Card.Title>
          <Card.Text as="div" className="small text-muted mt-1">
            Select a tracker to view detailed analytics and spending trends over
            time.
          </Card.Text>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col md={4}>
              <Form.Select
                value={frequencyFilter}
                onChange={(e) => setFrequencyFilter(e.target.value)}
                aria-label="Filter by frequency"
              >
                <option value="">All frequencies</option>
                {RESET_FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>
          {sortedTrackers.length === 0 ? (
            <p className="text-muted mb-0">
              {trackers.length === 0
                ? 'No trackers yet. Add one from the dashboard to get started.'
                : 'No trackers match the selected frequency.'}
            </p>
          ) : (
            <div className="d-flex flex-column gap-3">
              {sortedTrackers.map((t) => {
                const frequencyLabel =
                  RESET_FREQUENCIES.find((f) => f.value === t.reset_frequency)
                    ?.label ?? t.reset_frequency
                return (
                  <Card key={t.id} className="border">
                    <Card.Body className="py-3">
                      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                        <div>
                          <strong>{t.name}</strong>
                          <div className="d-flex gap-1 mt-1 flex-wrap">
                            {t.badge_color && t.badge_color.trim() ? (
                              <Badge
                                style={{
                                  backgroundColor: t.badge_color.trim(),
                                  color: 'white',
                                }}
                              >
                                {frequencyLabel}
                              </Badge>
                            ) : (
                              <Badge bg="secondary">{frequencyLabel}</Badge>
                            )}
                            <span className="small text-muted">
                              ${formatMoney(t.spent)} of $
                              {formatMoney(t.budget_amount)} spent
                            </span>
                          </div>
                        </div>
                        <Link
                          to={`/analytics/trackers/${t.id}`}
                          className="btn btn-outline-primary btn-sm"
                        >
                          View analytics
                          <i
                            className="mdi mdi-chevron-right ms-1"
                            aria-hidden
                          />
                        </Link>
                      </div>
                    </Card.Body>
                  </Card>
                )
              })}
            </div>
          )}
        </Card.Body>
      </Card>
    </>
  )
}
