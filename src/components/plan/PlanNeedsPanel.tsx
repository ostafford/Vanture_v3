import { Col } from 'react-bootstrap'
import { formatMoney } from '@/lib/format'
import {
  getNeedEstimateDriver,
  type NeedsSummary,
  type WantPlannerSnapshot,
} from '@/services/wantPlanner'
import {
  formatDueDateShort,
  getNextPaydayToneClass,
} from '@/components/plan/planDisplay'

function driverLabel(driver: ReturnType<typeof getNeedEstimateDriver>): string {
  if (driver === 'upcoming') return 'Charges due before next payday'
  if (driver === 'behavioral') return 'Recent weekly spending pace until payday'
  return 'Charges and spending pace (equal)'
}

export function PlanNeedsPanel({
  needsSummary,
  planner,
  upcomingAnchorId,
}: {
  needsSummary: NeedsSummary
  planner: WantPlannerSnapshot
  /** e.g. `dashboard-section-upcoming` for same-origin anchor */
  upcomingAnchorId: string
}) {
  const driver = getNeedEstimateDriver(planner)

  return (
    <Col md={6}>
      <h6 className="text-muted text-uppercase small mb-2">Needs</h6>
      <p className="small text-muted mb-2">
        Reserved amounts and bills due before your next payday. The planner
        compares those charges to your recent spending trend and uses whichever
        is higher as the near-term need before suggesting savings for wants.
      </p>
      <ul className="small mb-2 ps-3">
        <li>
          Reserved before payday (prorated bills):{' '}
          <strong className="text-danger">
            ${formatMoney(needsSummary.reservedCents)}
          </strong>
        </li>
        <li>
          Due before next pay:{' '}
          <strong>{needsSummary.countBeforeNextPay}</strong> (
          <strong className="text-danger">
            ${formatMoney(needsSummary.sumBeforeNextPayCents)}
          </strong>
          )
        </li>
        {needsSummary.nextPayday && (
          <li>
            Next payday:{' '}
            <span
              className={getNextPaydayToneClass(
                needsSummary.daysUntilNextPayday
              )}
            >
              {formatDueDateShort(needsSummary.nextPayday) ??
                needsSummary.nextPayday}
            </span>
          </li>
        )}
      </ul>
      <div className="small border rounded px-3 py-2 mb-2 bg-body-secondary bg-opacity-10">
        <div
          className="text-muted text-uppercase mb-1"
          style={{ fontSize: '0.7rem' }}
        >
          Planner uses the higher of
        </div>
        <ul className="small mb-2 ps-3">
          <li>
            Charges before payday:{' '}
            <strong>
              ${formatMoney(planner.upcomingNeedsBeforeNextPayCents)}
            </strong>
          </li>
          <li>
            This week&apos;s spend × weeks until payday:{' '}
            <strong>${formatMoney(planner.behavioralNeedCents)}</strong>
          </li>
        </ul>
        <div className="small mb-0">
          <strong>Primary driver:</strong> {driverLabel(driver)}.{' '}
          <strong>Total need estimate:</strong>{' '}
          <span className="text-danger">
            ${formatMoney(planner.needEstimateCents)}
          </span>
        </div>
      </div>
      <a href={`#${upcomingAnchorId}`} className="small d-inline-block">
        Go to Upcoming transactions
      </a>
    </Col>
  )
}
