/**
 * Shared D3 chart tooltip helpers.
 * Eliminates copy-pasted positioning logic and innerHTML usage across chart components.
 */

const TOOLTIP_OFFSET = 10
const TOOLTIP_PADDING = 8

/**
 * Clamps and applies tooltip position relative to the container's parent element.
 * Keeps the tooltip within the parent bounds using the event's client coordinates.
 */
export function positionTooltip(
  tooltipEl: HTMLElement,
  container: HTMLElement,
  event: MouseEvent,
  fallbackWidth = 140,
  fallbackHeight = 44
): void {
  const parent = container.parentElement
  if (!parent) return
  const wr = parent.getBoundingClientRect()
  const tw = tooltipEl.offsetWidth || fallbackWidth
  const th = tooltipEl.offsetHeight || fallbackHeight
  let leftPx = event.clientX - wr.left + TOOLTIP_OFFSET
  let topPx = event.clientY - wr.top + TOOLTIP_OFFSET
  leftPx = Math.max(
    TOOLTIP_PADDING,
    Math.min(wr.width - tw - TOOLTIP_PADDING, leftPx)
  )
  topPx = Math.max(
    TOOLTIP_PADDING,
    Math.min(wr.height - th - TOOLTIP_PADDING, topPx)
  )
  tooltipEl.style.left = `${leftPx}px`
  tooltipEl.style.top = `${topPx}px`
}

/**
 * Replaces tooltip content with a bold title followed by text lines separated by <br>.
 * Uses DOM API (never innerHTML) to prevent XSS even if content contains special characters.
 * Null/undefined entries in lines are skipped.
 */
export function setTooltipContent(
  tooltipEl: HTMLElement,
  title: string,
  lines: (string | null | undefined)[]
): void {
  tooltipEl.replaceChildren()
  const strong = document.createElement('strong')
  strong.textContent = title
  tooltipEl.appendChild(strong)
  for (const text of lines) {
    if (text == null) continue
    tooltipEl.appendChild(document.createElement('br'))
    tooltipEl.appendChild(document.createTextNode(text))
  }
}
