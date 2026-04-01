import type React from 'react'
import { NeedVsWantDashboardSummary } from '@/components/plan/NeedVsWantDashboardSummary'

export function NeedVsWantSection({
  dragHandleProps,
}: {
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>
}) {
  return <NeedVsWantDashboardSummary dragHandleProps={dragHandleProps} />
}
