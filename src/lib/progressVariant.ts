export type ProgressVariant = 'success' | 'warning' | 'danger'

export function getProgressVariant(progressRaw: number): ProgressVariant {
  const progress = Number.isFinite(progressRaw) ? progressRaw : 0

  if (progress >= 100) {
    return 'success'
  }
  if (progress > 80) {
    return 'danger'
  }
  if (progress > 50) {
    return 'warning'
  }
  return 'success'
}
