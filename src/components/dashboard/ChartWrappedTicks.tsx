import { wrapLabel } from '@/lib/wrapLabel'

const DEFAULT_MAX_CHARS = 10
const DEFAULT_FONT_SIZE = 12

type TickPayload = { value?: string }
type TickProps = {
  x?: number
  y?: number
  payload?: TickPayload
  tickFormatter?: (value: unknown, index: number) => string
  index?: number
  fontSize?: number
  fill?: string
}

/**
 * Recharts YAxis custom tick: wraps category label into multiple lines so
 * desktop horizontal bar charts can use a reduced left axis width (e.g. 56px).
 */
export function WrappedYAxisTick(
  props: TickProps & { maxCharsPerLine?: number }
) {
  const {
    x = 0,
    y = 0,
    payload,
    tickFormatter,
    index = 0,
    fontSize = DEFAULT_FONT_SIZE,
    fill = 'currentColor',
    maxCharsPerLine = DEFAULT_MAX_CHARS,
  } = props
  const raw =
    payload?.value != null
      ? String(
          tickFormatter ? tickFormatter(payload.value, index) : payload.value
        )
      : ''
  const lines = wrapLabel(raw, maxCharsPerLine)
  return (
    <text
      x={x}
      y={y}
      fill={fill}
      textAnchor="end"
      fontSize={fontSize}
      fontFamily="inherit"
    >
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : '1.1em'}>
          {line}
        </tspan>
      ))}
    </text>
  )
}

/**
 * Recharts XAxis custom tick: wraps category label into multiple lines and
 * rotates at -30deg by default so labels are easier to read (reduced bottom height).
 */
export function WrappedXAxisTick(
  props: TickProps & { maxCharsPerLine?: number; angle?: number }
) {
  const {
    x = 0,
    y = 0,
    payload,
    tickFormatter,
    index = 0,
    fontSize = DEFAULT_FONT_SIZE,
    fill = 'currentColor',
    maxCharsPerLine = DEFAULT_MAX_CHARS,
    angle = -60,
  } = props
  const raw =
    payload?.value != null
      ? String(
          tickFormatter ? tickFormatter(payload.value, index) : payload.value
        )
      : ''
  const lines = wrapLabel(raw, maxCharsPerLine)
  const reversed = [...lines].reverse()
  return (
    <text
      x={x}
      y={y}
      fill={fill}
      textAnchor={angle !== 0 ? 'end' : 'middle'}
      fontSize={fontSize}
      fontFamily="inherit"
      transform={angle !== 0 ? `rotate(${angle}, ${x}, ${y})` : undefined}
    >
      {reversed.map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : '-1.1em'}>
          {line}
        </tspan>
      ))}
    </text>
  )
}
