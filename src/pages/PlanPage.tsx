import { useRef, useState, useCallback } from 'react'
import { useStore } from 'zustand'
import { Card, Button, Row, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { syncStore } from '@/stores/syncStore'
import { HelpPopover } from '@/components/HelpPopover'
import { PlanNeedsPanel } from '@/components/plan/PlanNeedsPanel'
import { PlanWantsPlannerPanel } from '@/components/plan/PlanWantsPlannerPanel'
import {
  PlanWantsList,
  type PlanWantsListHandle,
} from '@/components/plan/PlanWantsList'
import { getGoals } from '@/services/goals'
import {
  buildWantPlannerSnapshot,
  getNeedsSummary,
  allocatePerWantPerPayCents,
  getWantScheduleHealth,
  getWantSplitMode,
  setWantSplitMode,
  type WantSplitMode,
  type WantScheduleTone,
} from '@/services/wantPlanner'

export function PlanPage() {
  useStore(syncStore, (s) => s.lastSyncCompletedAt)
  const listRef = useRef<PlanWantsListHandle>(null)
  const [splitMode, setSplitMode] = useState<WantSplitMode>(() =>
    getWantSplitMode()
  )
  const [showAssumptions, setShowAssumptions] = useState(false)

  const goals = getGoals()
  const active = goals.filter((g) => !g.completed_at)
  const planner = buildWantPlannerSnapshot()
  const needsSummary = getNeedsSummary()

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
  const wantSchedules = active.map((g) =>
    getWantScheduleHealth({
      remainingCents: g.remaining,
      perPayCents: perWantAlloc.get(g.id) ?? 0,
      payPeriodDays: planner.payPeriodDays,
      behavioralMultiplier: planner.behavioralMultiplier,
      targetDate: g.target_date,
    })
  )
  const topRecommendationTone: WantScheduleTone =
    wantSchedules.find((s) => s.tone === 'danger')?.tone ??
    wantSchedules.find((s) => s.tone === 'warning')?.tone ??
    wantSchedules.find((s) => s.tone === 'success')?.tone ??
    'secondary'

  const onSplitChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.target.value as WantSplitMode
      setSplitMode(v)
      setWantSplitMode(v)
    },
    []
  )

  return (
    <div className="grid-margin">
      <div className="page-header d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div>
          <h3 className="page-title mb-1">Plan</h3>
          <p className="text-muted small mb-0">
            Cover needs first, then split what is left toward your wants before
            next payday.
          </p>
        </div>
      </div>

      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center section-header flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <span className="page-title-icon bg-gradient-primary text-white">
              <i className="mdi mdi-scale-balance" aria-hidden />
            </span>
            <span>Plan workspace</span>
            <span
              className="badge text-bg-secondary"
              title="This section is in beta and may change"
              aria-label="This section is in beta and may change"
            >
              Beta v1
            </span>
            <HelpPopover
              id="plan-page-help"
              title="Plan"
              content="Needs are upcoming obligations and your recent weekly spending trend (whichever is higher is used). Wants are savings targets; the planner suggests a conservative amount to set aside before your next payday."
              ariaLabel="What is Plan?"
            />
          </div>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip id="plan-want-add-tooltip">Add want</Tooltip>}
          >
            <Button
              variant="primary"
              size="sm"
              onClick={() => listRef.current?.openCreate()}
              aria-label="Add want"
            >
              <i className="mdi mdi-plus" aria-hidden />
            </Button>
          </OverlayTrigger>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            <PlanNeedsPanel
              needsSummary={needsSummary}
              planner={planner}
              upcomingAnchorId="dashboard-section-upcoming"
            />
            <PlanWantsPlannerPanel
              planner={planner}
              splitMode={splitMode}
              onSplitChange={onSplitChange}
              showAssumptions={showAssumptions}
              onToggleAssumptions={() => setShowAssumptions((v) => !v)}
              assumptionLines={planner.assumptionLines}
              recommendationTone={topRecommendationTone}
            />
          </Row>

          <hr className="my-3" />

          <PlanWantsList ref={listRef} splitMode={splitMode} />
        </Card.Body>
      </Card>
    </div>
  )
}
