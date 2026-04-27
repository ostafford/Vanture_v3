import { useEffect, useRef } from 'react'
import {
  select,
  scaleBand,
  scaleLinear,
  axisBottom,
  axisLeft,
  type NumberValue,
} from 'd3'
import type { TrackerPeriodHistoryRow } from '@/services/trackers'
import { formatMoney } from '@/lib/format'
import {
  estimateLeftAxisValueLabelSpace,
  estimateBottomAxisLabelSpace,
} from '@/lib/chartLabelSpace'
import { useChartDimensions } from '@/hooks/useChartDimensions'
import { positionTooltip, setTooltipContent } from '@/lib/chartTooltip'

const BORDER_COLOR = 'var(--vantura-border, #ebedf2)'
const BUDGET_COLOR = 'var(--vantura-border, #ebedf2)'
const SPENT_COLOR = 'var(--vantura-primary)'
const SPENT_OVER_COLOR = 'var(--vantura-danger)'
const MARGIN_TOP = 8
const MARGIN_RIGHT = 24

type TrackerHistoryChartProps = {
  data: TrackerPeriodHistoryRow[]
  maxDomain?: number
  onBarClick?: (row: TrackerPeriodHistoryRow) => void
  className?: string
  style?: React.CSSProperties
  'aria-label'?: string
}

export function TrackerHistoryChart({
  data,
  maxDomain: maxDomainProp,
  onBarClick,
  className,
  style,
  'aria-label': ariaLabel,
}: TrackerHistoryChartProps) {
  const [containerRef, dimensions] = useChartDimensions()
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const tooltipEl = tooltipRef.current
    if (!container || dimensions.width <= 0 || dimensions.height <= 0) return
    if (data.length === 0) return

    select(container).selectAll('*').remove()

    const maxVal =
      maxDomainProp ?? Math.max(...data.flatMap((d) => [d.budget, d.spent]), 1)
    const labels = data.map((d) => d.periodLabel)

    const left = estimateLeftAxisValueLabelSpace(maxVal / 100, 11)
    const bottom = estimateBottomAxisLabelSpace(labels, 11)
    const right = MARGIN_RIGHT

    const innerWidth = dimensions.width - left - right
    const innerHeight = dimensions.height - MARGIN_TOP - bottom

    const xScale = scaleBand()
      .domain(labels)
      .range([0, innerWidth])
      .paddingInner(0.2)
      .paddingOuter(0.1)

    const yScale = scaleLinear()
      .domain([0, maxVal])
      .range([innerHeight, 0])
      .nice()

    const bandwidth = xScale.bandwidth()
    const barWidth = bandwidth * 0.35

    const svg = select(container)
      .append('svg')
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)

    const g = svg
      .append('g')
      .attr('transform', `translate(${left},${MARGIN_TOP})`)

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const showTooltip = (row: TrackerPeriodHistoryRow, event: MouseEvent) => {
      if (!tooltipEl || !container.parentElement) return
      const over = row.spent > row.budget
      setTooltipContent(tooltipEl, row.periodLabel, [
        `Budget: $${formatMoney(row.budget)}`,
        `Spent: $${formatMoney(row.spent)}${over ? ' (over)' : ''}`,
      ])
      tooltipEl.style.display = 'block'
      positionTooltip(tooltipEl, container, event, 120, 44)
    }

    const hideTooltip = () => {
      if (tooltipRef.current) tooltipRef.current.style.display = 'none'
    }

    data.forEach((row) => {
      const x =
        (xScale(row.periodLabel) ?? 0) + (bandwidth - barWidth * 2 - 2) / 2
      const budgetY = yScale(Math.min(row.budget, maxVal))
      const spentY = yScale(Math.min(row.spent, maxVal))
      const budgetBarHeight = innerHeight - budgetY
      const spentBarHeight = innerHeight - spentY
      const spentColor = row.spent > row.budget ? SPENT_OVER_COLOR : SPENT_COLOR

      g.append('rect')
        .attr('class', 'bar-budget')
        .attr('x', x)
        .attr('y', budgetY)
        .attr('width', barWidth)
        .attr('height', budgetBarHeight)
        .attr('fill', BUDGET_COLOR)
        .attr('rx', 2)
        .attr('ry', 2)
        .style('cursor', onBarClick ? 'pointer' : 'default')
        .on('mouseover', function (event: MouseEvent) {
          showTooltip(row, event)
          if (!reduceMotion) select(this).style('opacity', 0.8)
        })
        .on('mouseout', function () {
          hideTooltip()
          select(this).style('opacity', null)
        })
        .on('click', () => onBarClick?.(row))

      g.append('rect')
        .attr('class', 'bar-spent')
        .attr('x', x + barWidth + 2)
        .attr('y', spentY)
        .attr('width', barWidth)
        .attr('height', spentBarHeight)
        .attr('fill', spentColor)
        .attr('rx', 2)
        .attr('ry', 2)
        .style('cursor', onBarClick ? 'pointer' : 'default')
        .on('mouseover', function (event: MouseEvent) {
          showTooltip(row, event)
          if (!reduceMotion) select(this).style('opacity', 0.8)
        })
        .on('mouseout', function () {
          hideTooltip()
          select(this).style('opacity', null)
        })
        .on('click', () => onBarClick?.(row))
    })

    const xAxis = axisBottom(xScale)
      .tickFormat((d) => String(d))
      .tickSizeOuter(0)

    const yAxis = axisLeft(yScale)
      .tickFormat((d: NumberValue) => `$${formatMoney(Number(d))}`)
      .tickSizeOuter(0)

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((sel) =>
        sel.selectAll('.domain, .tick line').attr('stroke', BORDER_COLOR)
      )
      .call((sel) => sel.selectAll('.tick text').attr('fill', 'currentColor'))
      .style('font-size', '11px')

    g.append('g')
      .call(yAxis)
      .style('font-size', '11px')
      .call((sel) =>
        sel.selectAll('.domain, .tick line').attr('stroke', BORDER_COLOR)
      )
      .call((sel) => sel.selectAll('.tick text').attr('fill', 'currentColor'))

    return () => {
      hideTooltip()
      select(container).selectAll('*').remove()
    }
  }, [data, maxDomainProp, onBarClick, dimensions, containerRef])

  return (
    <div
      className={className}
      style={{ position: 'relative', width: '100%', height: '100%', ...style }}
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
