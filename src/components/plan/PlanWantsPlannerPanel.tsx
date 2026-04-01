import { Col, Form, Collapse } from 'react-bootstrap'
import { Link as RouterLink } from 'react-router-dom'
import { formatMoney } from '@/lib/format'
import {
  type WantPlannerSnapshot,
  type WantScheduleTone,
  type WantSplitMode,
} from '@/services/wantPlanner'
import { toneTextClass } from '@/components/plan/planDisplay'

export function PlanWantsPlannerPanel({
  planner,
  splitMode,
  onSplitChange,
  showAssumptions,
  onToggleAssumptions,
  assumptionLines,
  recommendationTone,
}: {
  planner: WantPlannerSnapshot
  splitMode: WantSplitMode
  onSplitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  showAssumptions: boolean
  onToggleAssumptions: () => void
  assumptionLines: string[]
  /** From want pace rows; defaults to success when suggestion &gt; 0 */
  recommendationTone?: WantScheduleTone
}) {
  const payPeriodLabel =
    planner.payPeriodDays === 7
      ? 'week'
      : planner.payPeriodDays === 14
        ? 'fortnight'
        : 'month'
  const cycleNoun = payPeriodLabel === 'month' ? 'monthly' : payPeriodLabel
  const tone: WantScheduleTone =
    recommendationTone ??
    (planner.recommendedBeforeNextPayCents > 0 ? 'success' : 'warning')

  return (
    <Col md={6}>
      <h6 className="text-muted text-uppercase small mb-2">Wants</h6>
      <Form.Group className="mb-2">
        <Form.Label className="small mb-0">
          Split savings across active wants
        </Form.Label>
        <Form.Select
          size="sm"
          value={splitMode}
          onChange={onSplitChange}
          aria-label="How to split savings across wants"
        >
          <option value="equal">Equal (share evenly)</option>
          <option value="priority">Priority (fill top priority first)</option>
          <option value="percent">Percent (by allocation %)</option>
        </Form.Select>
      </Form.Group>

      {!planner.completeness.hasPayAmount && (
        <div className="alert alert-light border py-2 px-3 small mb-2">
          Set <strong>pay amount</strong> and <strong>payday</strong> in{' '}
          <RouterLink to="/settings">Settings</RouterLink> for more accurate
          before-pay suggestions.
        </div>
      )}

      <div className="card card-body border rounded px-3 py-2 mb-2">
        <div className="small text-muted">
          Suggested toward wants before next pay
        </div>
        <div className={`h5 mb-1 ${toneTextClass(tone)}`}>
          ${formatMoney(planner.recommendedBeforeNextPayCents)}
        </div>
        <div className="small text-muted">
          {cycleNoun} cycle (~$
          {formatMoney(planner.monthlyEquivalentSavingsCents)}/month equivalent)
        </div>
        {planner.behavioralMultiplier > 1.01 && (
          <div className="small text-warning mt-1">
            Recent spending is above your 4-week average (x
            {planner.behavioralMultiplier.toFixed(2)}).
          </div>
        )}
        {planner.recommendedBeforeNextPayCents === 0 && (
          <div className="small text-warning mt-1">
            Current needs and safety buffer use up available funds before next
            pay.
          </div>
        )}
      </div>

      <button
        type="button"
        className="btn btn-link p-0 small text-decoration-none mb-2"
        onClick={onToggleAssumptions}
        aria-expanded={showAssumptions}
      >
        {showAssumptions ? 'Hide' : 'Show'} how this is estimated
      </button>
      <Collapse in={showAssumptions}>
        <ul className="small text-muted ps-3 mb-0">
          {assumptionLines.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </Collapse>
    </Col>
  )
}
