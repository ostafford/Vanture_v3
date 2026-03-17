import { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import type {
  MonthSpendingSeries,
  MonthSpendingSeriesPoint,
  MonthMetric,
} from '@/lib/monthSpendingSeries'
import { formatDollars } from '@/lib/format'

const BORDER_COLOR = 'var(--vantura-border, #ebedf2)'
const MARGIN_TOP = 12
const MARGIN_BOTTOM = 24
const MARGIN_RIGHT = 24

export interface MonthSpendingComparisonChartProps {
  series: MonthSpendingSeries | null
  metric: MonthMetric
  height?: number
  showAverage?: boolean
  className?: string
  style?: React.CSSProperties
  'aria-label'?: string
}

function getMetricValues(
  points: MonthSpendingSeriesPoint[],
  metric: MonthMetric
) {
  const currentKey =
    metric === 'spending'
      ? 'currentSpending'
      : metric === 'income'
        ? 'currentIncome'
        : 'currentNet'
  const previousKey =
    metric === 'spending'
      ? 'previousSpending'
      : metric === 'income'
        ? 'previousIncome'
        : 'previousNet'

  const currentValues: (number | null)[] = []
  const previousValues: (number | null)[] = []

  for (const p of points) {
    currentValues.push(p[currentKey] as number | null)
    previousValues.push(p[previousKey] as number | null)
  }

  return { currentValues, previousValues }
}

function computeAverage(values: (number | null)[]): number | null {
  let sum = 0
  let count = 0
  for (const v of values) {
    if (v != null) {
      sum += v
      count += 1
    }
  }
  if (count === 0) return null
  return sum / count
}

export function MonthSpendingComparisonChart({
  series,
  metric,
  height = 220,
  showAverage = false,
  className,
  style,
  'aria-label': ariaLabel,
}: MonthSpendingComparisonChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  const prepared = useMemo(() => {
    if (!series || series.points.length === 0) return null
    const { currentValues, previousValues } = getMetricValues(
      series.points,
      metric
    )

    const allValues = [...currentValues, ...previousValues].filter(
      (v): v is number => v != null
    )
    if (allValues.length === 0) {
      return {
        points: series.points,
        yDomain: [0, 1],
        avg: null,
      }
    }

    const minVal = d3.min(allValues) ?? 0
    const maxVal = d3.max(allValues) ?? 0

    let domainMin: number
    if (metric === 'net') {
      domainMin = Math.min(minVal, 0)
    } else {
      domainMin = 0
    }

    const span = maxVal - domainMin || Math.abs(maxVal) || 1
    const padding = span * 0.05
    const yMin = domainMin - padding
    const yMax = maxVal + padding

    const avg = showAverage ? computeAverage(currentValues) : null

    return {
      points: series.points,
      yDomain: [yMin, yMax] as [number, number],
      avg,
    }
  }, [series, metric, showAverage])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const { width: nextWidth } = entries[0].contentRect
      setWidth(nextWidth)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !prepared || width <= 0 || height <= 0) return

    d3.select(container).selectAll('*').remove()

    const { points, yDomain, avg } = prepared

    const marginLeft = 60
    const innerWidth = width - marginLeft - MARGIN_RIGHT
    const innerHeight = height - MARGIN_TOP - MARGIN_BOTTOM

    if (innerWidth <= 0 || innerHeight <= 0) return

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)

    const g = svg
      .append('g')
      .attr('transform', `translate(${marginLeft},${MARGIN_TOP})`)

    const xScale = d3
      .scaleLinear()
      .domain([1, points.length])
      .range([0, innerWidth])

    const yScale = d3
      .scaleLinear()
      .domain(yDomain)
      .nice()
      .range([innerHeight, 0])

    const currentLine = d3
      .line<MonthSpendingSeriesPoint>()
      .defined((d) => {
        const { currentValues } = getMetricValues([d], metric)
        return currentValues[0] != null
      })
      .x((d) => xScale(d.day))
      .y((d) => {
        const { currentValues } = getMetricValues([d], metric)
        return yScale(currentValues[0] ?? 0)
      })

    const previousLine = d3
      .line<MonthSpendingSeriesPoint>()
      .defined((d) => {
        const { previousValues } = getMetricValues([d], metric)
        return previousValues[0] != null
      })
      .x((d) => xScale(d.day))
      .y((d) => {
        const { previousValues } = getMetricValues([d], metric)
        return yScale(previousValues[0] ?? 0)
      })

    const xAxis = d3
      .axisBottom(xScale)
      .ticks(Math.min(points.length, 8))
      .tickFormat((d: d3.NumberValue) => `Day ${d.toString()}`)
      .tickSizeOuter(0)

    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat((d: d3.NumberValue) => `$${formatDollars(Number(d) / 100)}`)
      .tickSizeOuter(0)

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .style('font-size', '11px')
      .call((sel: d3.Selection<SVGGElement, unknown, null, undefined>) =>
        sel.selectAll('.domain, .tick line').attr('stroke', BORDER_COLOR)
      )
      .call((sel: d3.Selection<SVGGElement, unknown, null, undefined>) =>
        sel.selectAll('.tick text').attr('fill', 'currentColor')
      )

    g.append('g')
      .call(yAxis)
      .style('font-size', '10px')
      .call((sel: d3.Selection<SVGGElement, unknown, null, undefined>) =>
        sel.selectAll('.domain, .tick line').attr('stroke', BORDER_COLOR)
      )
      .call((sel: d3.Selection<SVGGElement, unknown, null, undefined>) =>
        sel.selectAll('.tick text').attr('fill', 'currentColor')
      )

    if (avg != null) {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', yScale(avg))
        .attr('y2', yScale(avg))
        .attr('stroke', 'var(--vantura-chart-average, #f2994a)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4 4')
    }

    const area = d3
      .area<MonthSpendingSeriesPoint>()
      .defined(currentLine.defined())
      .x((d) => xScale(d.day))
      .y0(innerHeight)
      .y1((d) => {
        const { currentValues } = getMetricValues([d], metric)
        return yScale(currentValues[0] ?? 0)
      })

    g.append('path')
      .datum(points)
      .attr(
        'fill',
        'var(--vantura-chart-accent-soft, rgba(255, 159, 67, 0.15))'
      )
      .attr('stroke', 'var(--vantura-chart-accent, var(--bs-primary, #ff9f43))')
      .attr('stroke-width', 2)
      .attr('d', area)
      .attr('opacity', 0.9)

    g.append('path')
      .datum(points)
      .attr(
        'stroke',
        'var(--vantura-chart-previous, var(--bs-gray-600, #6c757d))'
      )
      .attr('stroke-width', 2)
      .attr('fill', 'none')
      .attr('d', previousLine)
      .attr('opacity', 0.9)

    const hideTooltip = () => {
      if (tooltipRef.current) {
        tooltipRef.current.style.display = 'none'
      }
    }

    return () => {
      hideTooltip()
      d3.select(container).selectAll('*').remove()
    }
  }, [prepared, metric, width, height])

  if (!series || series.points.length === 0) {
    return (
      <div className={className} style={style}>
        <div className="small text-muted">
          Not enough data to show chart yet.
        </div>
      </div>
    )
  }

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height,
        ...style,
      }}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div
        ref={tooltipRef}
        role="tooltip"
        style={{
          position: 'absolute',
          display: 'none',
          padding: '6px 10px',
          background: 'var(--vantura-surface)',
          color: 'var(--vantura-text)',
          border: '1px solid var(--vantura-border, #ebedf2)',
          borderRadius: 4,
          fontSize: 12,
          pointerEvents: 'none',
          zIndex: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      />
    </div>
  )
}
