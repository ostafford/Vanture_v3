import { formatMoney } from '@/lib/format'
import type { MonthComparisonData, MonthDelta } from '@/services/insights'

// ── Sentiment helpers ─────────────────────────────────────────────────────────

type Sentiment = 'positive' | 'negative' | 'neutral'

function getSentiment(
  direction: MonthDelta['direction'],
  invert: boolean
): Sentiment {
  if (direction === 'flat') return 'neutral'
  const isUp = direction === 'up'
  return (invert ? !isUp : isUp) ? 'positive' : 'negative'
}

const SENTIMENT_COLOR: Record<Sentiment, string> = {
  positive: 'var(--bs-success, #1bcfb4)',
  negative: 'var(--bs-danger, #fc424a)',
  neutral: 'var(--bs-secondary-color, #6c757d)',
}

const SENTIMENT_BG: Record<Sentiment, string> = {
  positive: 'color-mix(in srgb, var(--bs-success) 12%, transparent)',
  negative: 'color-mix(in srgb, var(--bs-danger) 12%, transparent)',
  neutral: 'var(--bs-tertiary-bg, rgba(0,0,0,0.04))',
}

const PREV_BAR = 'rgba(108, 117, 125, 0.28)'

function fmtAbs(cents: number) {
  return `$${formatMoney(Math.abs(cents))}`
}

function fmtPct(delta: number, base: number): string | null {
  if (Math.abs(base) < 1) return null
  const pct = Math.round((Math.abs(delta) / Math.abs(base)) * 100)
  return pct > 0 ? `${pct}%` : null
}

// ── Change tile ───────────────────────────────────────────────────────────────

function ChangeTile({
  label,
  delta,
  invert = false,
}: {
  label: string
  delta: MonthDelta
  invert?: boolean
}) {
  const sentiment = getSentiment(delta.direction, invert)
  const color = SENTIMENT_COLOR[sentiment]
  const bg = SENTIMENT_BG[sentiment]
  const sign =
    delta.direction === 'up' ? '+' : delta.direction === 'down' ? '−' : ''
  const arrow =
    delta.direction === 'up' ? '↑' : delta.direction === 'down' ? '↓' : '→'
  const pct = fmtPct(delta.delta, delta.previous)

  return (
    <div
      className="rounded p-3 flex-fill"
      style={{ background: bg, minWidth: 120 }}
    >
      <div
        className="text-muted mb-1"
        style={{
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </div>
      <div className="fw-bold" style={{ fontSize: '1.15rem', color }}>
        {sign}
        {fmtAbs(delta.delta)}
      </div>
      <div style={{ fontSize: '0.72rem', color }}>
        {arrow}
        {pct ? ` ${pct}` : ''}
      </div>
    </div>
  )
}

// ── Comparison bar row ────────────────────────────────────────────────────────

function BarRow({
  label,
  current,
  previous,
  maxVal,
  sentiment,
  currentLabel,
  priorLabel,
}: {
  label: string
  current: number
  previous: number
  maxVal: number
  sentiment: Sentiment
  currentLabel: string
  priorLabel: string
}) {
  const curPct = maxVal > 0 ? Math.min((current / maxVal) * 100, 100) : 0
  const prevPct = maxVal > 0 ? Math.min((previous / maxVal) * 100, 100) : 0
  const barColor = SENTIMENT_COLOR[sentiment]

  return (
    <div className="mb-3">
      <div
        className="text-muted mb-2"
        style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </div>
      {/* Current month */}
      <div className="d-flex align-items-center gap-2 mb-1">
        <div
          style={{
            flex: 1,
            height: 11,
            borderRadius: 6,
            background: 'var(--bs-secondary-bg, rgba(0,0,0,0.08))',
          }}
        >
          <div
            style={{
              width: `${curPct}%`,
              height: '100%',
              borderRadius: 6,
              background: barColor,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
        <div
          style={{
            width: 76,
            textAlign: 'right',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: barColor,
          }}
        >
          {fmtAbs(current)}
        </div>
        <div className="text-muted" style={{ width: 64, fontSize: '0.68rem' }}>
          {currentLabel}
        </div>
      </div>
      {/* Previous month */}
      <div className="d-flex align-items-center gap-2">
        <div
          style={{
            flex: 1,
            height: 11,
            borderRadius: 6,
            background: 'var(--bs-secondary-bg, rgba(0,0,0,0.08))',
          }}
        >
          <div
            style={{
              width: `${prevPct}%`,
              height: '100%',
              borderRadius: 6,
              background: PREV_BAR,
            }}
          />
        </div>
        <div
          className="text-muted"
          style={{
            width: 76,
            textAlign: 'right',
            fontSize: '0.8rem',
          }}
        >
          {fmtAbs(previous)}
        </div>
        <div className="text-muted" style={{ width: 64, fontSize: '0.68rem' }}>
          {priorLabel}
        </div>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function ComparisonVisual({
  comparison,
  currentLabel,
  priorLabel,
}: {
  comparison: MonthComparisonData
  currentLabel: string
  priorLabel: string
}) {
  const { moneyIn, moneyOut, netDelta, biggestCategoryMover } = comparison

  const maxVal = Math.max(
    moneyIn.current,
    moneyIn.previous,
    moneyOut.current,
    moneyOut.previous,
    1
  )

  const incomeChangePct =
    moneyIn.previous > 0
      ? (Math.abs(moneyIn.delta) / Math.abs(moneyIn.previous)) * 100
      : 0
  const showIncomeTile = incomeChangePct >= 5 && Math.abs(moneyIn.delta) >= 500

  const netCurrent = moneyIn.current - moneyOut.current
  const netPrevious = moneyIn.previous - moneyOut.previous

  const incomeSentiment = getSentiment(moneyIn.direction, false)
  const spendingSentiment = getSentiment(moneyOut.direction, true)

  const showNetTile = netDelta.direction !== 'flat'
  const showCategoryTile =
    biggestCategoryMover != null &&
    Math.abs(biggestCategoryMover.deltaTotal) >= 200

  const hasTiles = showNetTile || showCategoryTile || showIncomeTile

  return (
    <div className="mt-3 pt-2 border-top">
      {/* Part 1: Delta tiles */}
      {hasTiles ? (
        <div className="d-flex gap-2 flex-wrap mb-4">
          {showNetTile && (
            <ChangeTile label="Net position" delta={netDelta} invert={false} />
          )}
          {showCategoryTile && biggestCategoryMover && (
            <ChangeTile
              label={biggestCategoryMover.category_name}
              delta={{
                current: biggestCategoryMover.currentTotal,
                previous: biggestCategoryMover.previousTotal,
                delta: biggestCategoryMover.deltaTotal,
                direction:
                  biggestCategoryMover.deltaTotal > 0
                    ? 'up'
                    : biggestCategoryMover.deltaTotal < 0
                      ? 'down'
                      : 'flat',
              }}
              invert={true}
            />
          )}
          {showIncomeTile && (
            <ChangeTile label="Income" delta={moneyIn} invert={false} />
          )}
        </div>
      ) : (
        <div className="d-flex align-items-center gap-1 mb-3">
          <i
            className="mdi mdi-check-circle-outline text-success"
            aria-hidden
            style={{ fontSize: '0.95rem' }}
          />
          <span className="small">On track with {priorLabel}</span>
        </div>
      )}

      {/* Part 2: Comparison bars */}
      <BarRow
        label="Income"
        current={moneyIn.current}
        previous={moneyIn.previous}
        maxVal={maxVal}
        sentiment={incomeSentiment}
        currentLabel={currentLabel}
        priorLabel={priorLabel}
      />
      <BarRow
        label="Spending"
        current={moneyOut.current}
        previous={moneyOut.previous}
        maxVal={maxVal}
        sentiment={spendingSentiment}
        currentLabel={currentLabel}
        priorLabel={priorLabel}
      />

      {/* Net summary row */}
      <div
        className="d-flex align-items-center gap-2 pt-2 border-top"
        style={{ fontSize: '0.8rem' }}
      >
        <div
          className="text-muted"
          style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            width: 64,
          }}
        >
          Net
        </div>
        <div
          className="fw-semibold"
          style={{
            color:
              netCurrent >= 0
                ? 'var(--bs-success, #1bcfb4)'
                : 'var(--bs-danger, #fc424a)',
          }}
        >
          {netCurrent >= 0 ? '+' : '−'}
          {fmtAbs(netCurrent)}
        </div>
        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
          vs {netPrevious >= 0 ? '+' : '−'}
          {fmtAbs(netPrevious)} in {priorLabel}
        </div>
      </div>
    </div>
  )
}
