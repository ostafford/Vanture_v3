/**
 * Estimates pixel space needed for chart axis labels so the plot area can
 * shrink to accommodate single-line labels. Used for D3 chart axis margins
 * (left Y-axis and bottom X-axis label space).
 */

const PX_PER_CHAR = 7
const BUFFER_EMOJI = 1.2
const MIN_LEFT_PX = 56
const MIN_BOTTOM_PX = 20
const MAX_LEFT_PX = 200
const TICK_PADDING = 16

/**
 * Labels for the axis (e.g. chartData.map(d => d.name)).
 */
export function estimateLeftAxisLabelSpace(
  labels: string[],
  fontSize: number = 12,
  options?: { maxPx?: number; minPx?: number }
): number {
  if (labels.length === 0) return options?.minPx ?? MIN_LEFT_PX
  const maxLen = Math.max(...labels.map((s) => String(s).length))
  const pxPerChar = Math.ceil((PX_PER_CHAR * fontSize) / 12) * BUFFER_EMOJI
  const labelWidth = Math.ceil(maxLen * pxPerChar)
  const maxPx = options?.maxPx ?? MAX_LEFT_PX
  const minPx = options?.minPx ?? MIN_LEFT_PX
  const space = Math.min(Math.max(labelWidth + TICK_PADDING, minPx), maxPx)
  return space
}

/**
 * Estimates bottom space for X-axis category labels (one line, optionally rotated).
 * Rotated labels need vertical height; one line at -60deg needs roughly
 * sin(60)*estimatedWidth for the projected height.
 */
export function estimateBottomAxisLabelSpace(
  labels: string[],
  fontSize: number = 11,
  options?: { minPx?: number; rotatedDeg?: number }
): number {
  if (labels.length === 0) return options?.minPx ?? MIN_BOTTOM_PX
  const maxLen = Math.max(...labels.map((s) => String(s).length))
  const pxPerChar = Math.ceil((PX_PER_CHAR * fontSize) / 12) * BUFFER_EMOJI
  const labelWidthPx = Math.ceil(maxLen * pxPerChar)
  const rotatedDeg = options?.rotatedDeg ?? -60
  const angleRad = Math.abs(rotatedDeg) * (Math.PI / 180)
  const height = Math.ceil(labelWidthPx * Math.sin(angleRad)) + 8
  const minPx = options?.minPx ?? MIN_BOTTOM_PX
  return Math.max(height, minPx)
}
