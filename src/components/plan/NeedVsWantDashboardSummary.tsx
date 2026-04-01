import type { HTMLAttributes } from 'react'
import { useStore } from 'zustand'
import { Card, Row, Col } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { syncStore } from '@/stores/syncStore'
import { HelpPopover } from '@/components/HelpPopover'
import { formatMoney } from '@/lib/format'
import { getGoals } from '@/services/goals'
import {
  buildWantPlannerSnapshot,
  getNeedsSummary,
  getNeedEstimateDriver,
  allocatePerWantPerPayCents,
  getWantScheduleHealth,
  getWantSplitMode,
  type WantSplitMode,
} from '@/services/wantPlanner'
import {
  formatDueDateShort,
  getNextPaydayToneClass,
  toneTextClass,
} from '@/components/plan/planDisplay'

function driverShortLabel(
  driver: ReturnType<typeof getNeedEstimateDriver>
): string {
  if (driver === 'upcoming') return 'Charges before payday'
  if (driver === 'behavioral') return 'Spending pace until payday'
  return 'Charges and pace (equal)'
}

export function NeedVsWantDashboardSummary({
  dragHandleProps,
}: {
  dragHandleProps?: HTMLAttributes<HTMLSpanElement>
}) {
  useStore(syncStore, (s) => s.lastSyncCompletedAt)

  const planner = buildWantPlannerSnapshot()
  const needsSummary = getNeedsSummary()
  const splitMode: WantSplitMode = getWantSplitMode()
  const goals = getGoals()
  const active = goals.filter((g) => !g.completed_at)

  const perWantAllocInputs = active.map((g) => ({
    id: g.id,
    remainingCents: g.remaining,
    priorityRank: g.priority_rank,
    allocationPercent: g.allocation_percent,
  }))
  const perWantAlloc = allocatePerWantPerPayCents(
    planner.baseSavingsPerPayPeriodCents,
    splitMode,
    perWantAllocInputs
  )
  let atRiskCount = 0
  const tones: Array<'danger' | 'warning' | 'success' | 'secondary'> = []
  for (const g of active) {
    const schedule = getWantScheduleHealth({
      remainingCents: g.remaining,
      perPayCents: perWantAlloc.get(g.id) ?? 0,
      payPeriodDays: planner.payPeriodDays,
      behavioralMultiplier: planner.behavioralMultiplier,
      targetDate: g.target_date,
    })
    if (schedule.status === 'atRisk' || schedule.status === 'offTrack') {
      atRiskCount += 1
    }
    tones.push(schedule.tone)
  }
  const recommendationTone =
    tones.find((t) => t === 'danger') ??
    tones.find((t) => t === 'warning') ??
    tones.find((t) => t === 'success') ??
    'secondary'

  const driver = getNeedEstimateDriver(planner)

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center section-header flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <span
            className="page-title-icon bg-gradient-primary text-white mr-2"
            {...dragHandleProps}
          >
            <i className="mdi mdi-scale-balance" aria-hidden />
          </span>
          <span>Plan</span>
          <span
            className="badge text-bg-secondary"
            title="This section is in beta and may change"
            aria-label="This section is in beta and may change"
          >
            Beta v1
          </span>
          <HelpPopover
            id="plan-dashboard-help"
            title="Plan"
            content="Summary of needs vs wants. Open Plan for the full breakdown, assumptions, and want list."
            ariaLabel="What is the Plan summary?"
          />
        </div>
      </Card.Header>
      <Card.Body>
        <Row className="g-3 align-items-start">
          <Col md={7}>
            <div className="small text-muted mb-1">
              Suggested toward wants before next pay
            </div>
            <div className={`h4 mb-2 ${toneTextClass(recommendationTone)}`}>
              ${formatMoney(planner.recommendedBeforeNextPayCents)}
            </div>
            <div className="small text-muted mb-2">
              Need estimate driver: <strong>{driverShortLabel(driver)}</strong>
              {' · '}
              Total need estimate{' '}
              <strong className="text-danger">
                ${formatMoney(planner.needEstimateCents)}
              </strong>
            </div>
            {atRiskCount > 0 && (
              <div className="small text-warning mb-2">
                {atRiskCount} active want{atRiskCount === 1 ? '' : 's'} off pace
                or at risk
              </div>
            )}
            {needsSummary.nextPayday && (
              <div className="small text-muted mb-3">
                Next payday:{' '}
                <span
                  className={getNextPaydayToneClass(
                    needsSummary.daysUntilNextPayday
                  )}
                >
                  {formatDueDateShort(needsSummary.nextPayday) ??
                    needsSummary.nextPayday}
                </span>
              </div>
            )}
            <Link className="btn btn-primary btn-sm" to="/plan">
              View breakdown and manage wants
            </Link>
          </Col>
          <Col md={5}>
            <div className="small border rounded px-3 py-2 bg-body-secondary bg-opacity-10">
              <div
                className="text-muted text-uppercase mb-1"
                style={{ fontSize: '0.65rem' }}
              >
                At a glance
              </div>
              <ul className="small mb-0 ps-3">
                <li>
                  Reserved (prorated):{' '}
                  <strong>${formatMoney(needsSummary.reservedCents)}</strong>
                </li>
                <li>
                  Due before next pay: {needsSummary.countBeforeNextPay} (
                  <strong>
                    ${formatMoney(needsSummary.sumBeforeNextPayCents)}
                  </strong>
                  )
                </li>
                <li>
                  Charges vs pace: $
                  {formatMoney(planner.upcomingNeedsBeforeNextPayCents)} / $
                  {formatMoney(planner.behavioralNeedCents)}
                </li>
              </ul>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  )
}
