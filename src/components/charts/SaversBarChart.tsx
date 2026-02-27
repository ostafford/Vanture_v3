import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import type { SaversChartRow } from '@/types/charts'
import { formatMoney, formatDollars } from '@/lib/format'
import {
  estimateLeftAxisLabelSpace,
  estimateBottomAxisLabelSpace,
} from '@/lib/chartLabelSpace'

const BORDER_COLOR = 'var(--vantura-border, #ebedf2)'
const REMAINING_COLOR = 'var(--vantura-border, #ebedf2)'
const BAR_MAX_WIDTH = 32
const MARGIN_TOP = 8
const MARGIN_RIGHT_DESKTOP = 24
const MARGIN_RIGHT_MOBILE = 8
const MARGIN_LEFT_MOBILE = 40
const TOOLTIP_OFFSET = 10
const TOOLTIP_PADDING = 8

type SaversBarChartProps = {
  chartData: SaversChartRow[]
  maxDomain: number
  isMobile: boolean
  /** Prefer a stable callback (e.g. useCallback) to avoid unnecessary redraws. */
  onBarClick?: (row: SaversChartRow) => void
  className?: string
  style?: React.CSSProperties
  /** Accessible chart summary (e.g. "Savers progress"). */
  'aria-label'?: string
}

/**
 * D3 stacked bar chart for Savers (saved vs remaining per goal).
 * Desktop: horizontal stacked bars. Mobile: vertical stacked bars.
 */
export function SaversBarChart({
  chartData,
  maxDomain,
  isMobile,
  onBarClick,
  className,
  style,
  'aria-label': ariaLabel,
}: SaversBarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setDimensions({ width, height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const container = containerRef.current
    const tooltipEl = tooltipRef.current
    if (!container || dimensions.width <= 0 || dimensions.height <= 0) return
    if (chartData.length === 0) return

    d3.select(container).selectAll('*').remove()

    const keys = chartData.map((d) => d.id)
    const names = chartData.map((d) => d.name)
    const nameByKey: Record<string, string> = {}
    chartData.forEach((d) => {
      nameByKey[d.id] = d.name
    })

    const left = isMobile
      ? MARGIN_LEFT_MOBILE
      : estimateLeftAxisLabelSpace(names, 12)
    const bottom = isMobile
      ? estimateBottomAxisLabelSpace(names, 11, { rotatedDeg: -60 })
      : 8
    const right = isMobile ? MARGIN_RIGHT_MOBILE : MARGIN_RIGHT_DESKTOP

    const innerWidth = dimensions.width - left - right
    const innerHeight = dimensions.height - MARGIN_TOP - bottom

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)

    const g = svg
      .append('g')
      .attr('transform', `translate(${left},${MARGIN_TOP})`)

    const valueScale = d3
      .scaleLinear()
      .domain([0, maxDomain])
      .range([0, innerWidth])
    const valueScaleVert = d3
      .scaleLinear()
      .domain([0, maxDomain])
      .range([innerHeight, 0])

    const categoryScale = d3
      .scaleBand()
      .domain(keys)
      .range(isMobile ? [0, innerWidth] : [0, innerHeight])
      .paddingInner(0.2)
      .paddingOuter(0.1)

    const bandwidth = categoryScale.bandwidth()
    const barSize = Math.min(BAR_MAX_WIDTH, bandwidth)

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const stack = d3.stack<SaversChartRow>().keys(['current', 'remaining'])(
      chartData
    )
    const [savedStack, remainingStack] = stack

    const showTooltip = (row: SaversChartRow, event: MouseEvent) => {
      if (!tooltipEl || !container.parentElement) return
      const s = row.saver
      const goalText =
        s.goal_amount != null
          ? `of $${formatMoney(s.goal_amount)}`
          : 'No goal set'
      const content = `<strong>${s.name}</strong><br/>$${formatMoney(s.current_balance)} ${goalText}`
      tooltipEl.innerHTML = content
      tooltipEl.style.display = 'block'
      const wr = container.parentElement.getBoundingClientRect()
      const tw = tooltipEl.offsetWidth || 120
      const th = tooltipEl.offsetHeight || 40
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

    const hideTooltip = () => {
      if (tooltipRef.current) {
        tooltipRef.current.style.display = 'none'
      }
    }

    type StackPoint = d3.SeriesPoint<SaversChartRow>

    const drawBars = (
      segment: StackPoint[],
      segmentClass: string,
      fill: string | ((d: StackPoint) => string),
      stroke: string | ((d: StackPoint) => string),
      rxRight: number
    ) => {
      const getFill = typeof fill === 'function' ? fill : () => fill
      const getStroke = typeof stroke === 'function' ? stroke : () => stroke
      if (isMobile) {
        g.selectAll<SVGRectElement, StackPoint>(`.${segmentClass}`)
          .data(segment)
          .join('rect')
          .attr('class', segmentClass)
          .attr(
            'x',
            (d: StackPoint) =>
              (categoryScale(d.data.id) ?? 0) + (bandwidth - barSize) / 2
          )
          .attr('y', (d: StackPoint) => valueScaleVert(d[1]))
          .attr('width', barSize)
          .attr(
            'height',
            (d: StackPoint) => valueScaleVert(d[0]) - valueScaleVert(d[1])
          )
          .attr('fill', (d: StackPoint) => getFill(d))
          .attr('stroke', (d: StackPoint) => getStroke(d))
          .attr('stroke-width', 1)
          .attr('rx', rxRight)
          .attr('ry', rxRight)
          .style('cursor', onBarClick ? 'pointer' : 'default')
          .on(
            'mouseover',
            function (this: SVGRectElement, event: MouseEvent, d: StackPoint) {
              showTooltip(d.data, event)
              if (!reduceMotion) d3.select(this).style('opacity', 0.8)
            }
          )
          .on('mouseout', function (this: SVGRectElement) {
            hideTooltip()
            d3.select(this).style('opacity', null)
          })
          .on('click', (_: MouseEvent, d: StackPoint) => {
            onBarClick?.(d.data)
          })
      } else {
        g.selectAll<SVGRectElement, StackPoint>(`.${segmentClass}`)
          .data(segment)
          .join('rect')
          .attr('class', segmentClass)
          .attr('x', (d: StackPoint) => valueScale(d[0]))
          .attr(
            'y',
            (d: StackPoint) =>
              (categoryScale(d.data.id) ?? 0) + (bandwidth - barSize) / 2
          )
          .attr('width', (d: StackPoint) => valueScale(d[1]) - valueScale(d[0]))
          .attr('height', barSize)
          .attr('fill', (d: StackPoint) => getFill(d))
          .attr('stroke', (d: StackPoint) => getStroke(d))
          .attr('stroke-width', 1)
          .attr('rx', rxRight)
          .attr('ry', rxRight)
          .style('cursor', onBarClick ? 'pointer' : 'default')
          .on(
            'mouseover',
            function (this: SVGRectElement, event: MouseEvent, d: StackPoint) {
              showTooltip(d.data, event)
              if (!reduceMotion) d3.select(this).style('opacity', 0.8)
            }
          )
          .on('mouseout', function (this: SVGRectElement) {
            hideTooltip()
            d3.select(this).style('opacity', null)
          })
          .on('click', (_: MouseEvent, d: StackPoint) => {
            onBarClick?.(d.data)
          })
      }
    }

    const formatTickLabel = (key: string) => nameByKey[key] ?? key

    if (isMobile) {
      const xAxis = d3
        .axisBottom(categoryScale)
        .tickFormat(formatTickLabel)
        .tickSizeOuter(0)
      const yAxis = d3
        .axisLeft(valueScaleVert)
        .tickFormat((d: d3.NumberValue) => `$${formatDollars(Number(d))}`)
        .tickSizeOuter(0)

      g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .selectAll('text')
        .attr('transform', 'rotate(-60)')
        .style('text-anchor', 'end')
        .style('font-size', '11px')
        .attr('fill', BORDER_COLOR)

      g.append('g')
        .call(yAxis)
        .style('font-size', '11px')
        .call((sel: d3.Selection<SVGGElement, unknown, null, undefined>) =>
          sel.selectAll('.domain, .tick line').attr('stroke', BORDER_COLOR)
        )
        .call((sel: d3.Selection<SVGGElement, unknown, null, undefined>) =>
          sel.selectAll('.tick text').attr('fill', 'currentColor')
        )

      drawBars(
        savedStack,
        'bar-saved',
        (d) => d.data.currentFill,
        (d) => d.data.currentFill,
        4
      )
      drawBars(
        remainingStack,
        'bar-remaining',
        REMAINING_COLOR,
        REMAINING_COLOR,
        0
      )
    } else {
      const xAxis = d3
        .axisBottom(valueScale)
        .tickFormat((d: d3.NumberValue) => `$${formatDollars(Number(d))}`)
        .tickSizeOuter(0)
      const yAxis = d3
        .axisLeft(categoryScale)
        .tickFormat(formatTickLabel)
        .tickSizeOuter(0)

      g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .call((sel: d3.Selection<SVGGElement, unknown, null, undefined>) =>
          sel.selectAll('.domain, .tick line').attr('stroke', BORDER_COLOR)
        )
        .call((sel: d3.Selection<SVGGElement, unknown, null, undefined>) =>
          sel.selectAll('.tick text').attr('fill', 'currentColor')
        )

      g.append('g')
        .call(yAxis)
        .style('font-size', '12px')
        .call((sel: d3.Selection<SVGGElement, unknown, null, undefined>) =>
          sel.selectAll('.domain, .tick line').attr('stroke', BORDER_COLOR)
        )
        .call((sel: d3.Selection<SVGGElement, unknown, null, undefined>) =>
          sel.selectAll('.tick text').attr('fill', 'currentColor')
        )

      drawBars(
        savedStack,
        'bar-saved',
        (d) => d.data.currentFill,
        (d) => d.data.currentFill,
        4
      )
      drawBars(
        remainingStack,
        'bar-remaining',
        REMAINING_COLOR,
        REMAINING_COLOR,
        0
      )
    }

    return () => {
      hideTooltip()
      d3.select(container).selectAll('*').remove()
    }
  }, [chartData, maxDomain, isMobile, onBarClick, dimensions])

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
          background: 'var(--vantura-bg-elevated, #fff)',
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
