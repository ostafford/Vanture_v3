import {
  formatCompactDurationFromDays,
  formatMixedDurationFromDays,
  getWantScheduleHealth,
  type WantScheduleTone,
} from '@/services/wantPlanner'

export function toneTextClass(tone: WantScheduleTone): string {
  if (tone === 'success') return 'text-success'
  if (tone === 'warning') return 'text-warning'
  if (tone === 'danger') return 'text-danger'
  return 'text-muted'
}

export function getBadgeToneClass(tone: WantScheduleTone): string {
  if (tone === 'success') return 'text-bg-success'
  if (tone === 'warning') return 'text-bg-warning'
  if (tone === 'danger') return 'text-bg-danger'
  return 'text-bg-secondary'
}

export function formatDueDateShort(dateValue: string | null): string | null {
  if (!dateValue) return null
  const raw = String(dateValue).trim()
  if (!raw) return null
  const parts = raw.split('-')
  if (parts.length === 3) {
    const yy = parts[0].slice(-2)
    return `${parts[2]}/${parts[1]}/${yy}`
  }
  const parsed = new Date(`${raw}T12:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return null
  const dd = String(parsed.getUTCDate()).padStart(2, '0')
  const mm = String(parsed.getUTCMonth() + 1).padStart(2, '0')
  const yy = String(parsed.getUTCFullYear()).slice(-2)
  return `${dd}/${mm}/${yy}`
}

export function getNextPaydayToneClass(daysUntil: number | null): string {
  if (daysUntil == null) return 'text-muted'
  if (daysUntil <= 10) return 'text-success'
  if (daysUntil <= 20) return 'text-warning'
  return 'text-danger'
}

export function getTrackerStyleProgress(progress: number): {
  variant: 'danger' | 'warning' | 'success'
  striped: boolean
  animated: boolean
} {
  if (progress >= 81) {
    return { variant: 'success', striped: false, animated: false }
  }
  if (progress > 50) {
    return { variant: 'warning', striped: false, animated: false }
  }
  return { variant: 'danger', striped: false, animated: false }
}

export function getPaceStatusBadgeLabel(
  schedule: ReturnType<typeof getWantScheduleHealth>
): string {
  if (schedule.status === 'ahead') {
    return `Status: Ahead ${formatCompactDurationFromDays(Math.abs(schedule.daysDeltaToTarget ?? 0))}`
  }
  if (schedule.status === 'onTrack') return 'Status: On track'
  if (schedule.status === 'atRisk') {
    return `Status: At risk ${formatCompactDurationFromDays(schedule.daysDeltaToTarget ?? 0)}`
  }
  if (schedule.status === 'offTrack') {
    return `Status: Off track ${formatCompactDurationFromDays(schedule.daysDeltaToTarget ?? 0)}`
  }
  if (schedule.status === 'noPace') return 'Status: No pace yet'
  return 'Status: Add target date'
}

export function formatPaceTooltip(
  schedule: ReturnType<typeof getWantScheduleHealth>
): string {
  if (schedule.daysDeltaToTarget != null) {
    return `Pace status detail: ${formatMixedDurationFromDays(
      Math.abs(schedule.daysDeltaToTarget)
    )}`
  }
  return 'Pace status detail'
}
