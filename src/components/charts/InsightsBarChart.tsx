import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import type { InsightsChartDatum } from '@/types/charts'
import { formatDollars } from '@/lib/format'
import {
  estimateLeftAxisLabelSpace,
  estimateBottomAxisLabelSpace,
} from '@/lib/chartLabelSpace'

const BORDER_COLOR = 'var(--vantura-border, #ebedf2)'
const BAR_MAX_WIDTH = 32
const MARGIN_TOP = 8
const MARGIN_RIGHT_DESKTOP = 24
const MARGIN_RIGHT_MOBILE = 8
const MARGIN_LEFT_MOBILE = 40
const TOOLTIP_OFFSET = 10
const TOOLTIP_PADDING = 8

type InsightsBarChartProps = {
  chartData: InsightsChartDatum[]
  maxDomain: number
  isMobile: boolean
  /** Prefer a stable callback (e.g. useCallback) to avoid unnecessary redraws. */
  onBarClick?: (datum: InsightsChartDatum) => void
  className?: string
  style?: React.CSSProperties
  /** Accessible chart summary (e.g. "Spending by category this week"). */
  'aria-label'?: string
}

/**
 * D3 single-series bar chart for Weekly Insights (spending by category).
 * Desktop: horizontal bars (Y = category, X = dollars). Mobile: vertical bars (X = category, Y = dollars).
 */
export function InsightsBarChart({
  chartData,
  maxDomain,
  isMobile,
  onBarClick,
  className,
  style,
  'aria-label': ariaLabel,
}: InsightsBarChartProps) {
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

    const keys = chartData.map((d) => d.category_id)
    const names = chartData.map((d) => d.name)
    const nameByKey: Record<string, string> = {}
    chartData.forEach((d) => {
      nameByKey[d.category_id] = d.name
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

    const showTooltip = (datum: InsightsChartDatum, event: MouseEvent) => {
      if (!tooltipEl || !container.parentElement) return
      const content = `<strong>${datum.name}</strong><br/>$${formatDollars(datum.totalDollars)} spent`
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

      g.selectAll<SVGRectElement, InsightsChartDatum>('.bar')
        .data(chartData)
        .join('rect')
        .attr('class', 'bar')
        .attr(
          'x',
          (d: InsightsChartDatum) =>
            (categoryScale(d.category_id) ?? 0) + (bandwidth - barSize) / 2
        )
        .attr('y', (d: InsightsChartDatum) => valueScaleVert(d.totalDollars))
        .attr('width', barSize)
        .attr(
          'height',
          (d: InsightsChartDatum) =>
            innerHeight - valueScaleVert(d.totalDollars)
        )
        .attr('fill', (d: InsightsChartDatum) => d.fill)
        .attr('stroke', (d: InsightsChartDatum) => d.stroke)
        .attr('stroke-width', 1)
        .attr('rx', 4)
        .attr('ry', 4)
        .style('cursor', onBarClick ? 'pointer' : 'default')
        .on(
          'mouseover',
          function (
            this: SVGRectElement,
            event: MouseEvent,
            d: InsightsChartDatum
          ) {
            showTooltip(d, event)
            if (!reduceMotion) d3.select(this).style('opacity', 0.8)
          }
        )
        .on('mouseout', function (this: SVGRectElement) {
          hideTooltip()
          d3.select(this).style('opacity', null)
        })
        .on('click', (_: MouseEvent, d: InsightsChartDatum) => {
          onBarClick?.(d)
        })
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

      g.selectAll<SVGRectElement, InsightsChartDatum>('.bar')
        .data(chartData)
        .join('rect')
        .attr('class', 'bar')
        .attr('x', 0)
        .attr(
          'y',
          (d: InsightsChartDatum) =>
            (categoryScale(d.category_id) ?? 0) + (bandwidth - barSize) / 2
        )
        .attr('width', (d: InsightsChartDatum) => valueScale(d.totalDollars))
        .attr('height', barSize)
        .attr('fill', (d: InsightsChartDatum) => d.fill)
        .attr('stroke', (d: InsightsChartDatum) => d.stroke)
        .attr('stroke-width', 1)
        .attr('rx', 4)
        .attr('ry', 4)
        .style('cursor', onBarClick ? 'pointer' : 'default')
        .on(
          'mouseover',
          function (
            this: SVGRectElement,
            event: MouseEvent,
            d: InsightsChartDatum
          ) {
            showTooltip(d, event)
            if (!reduceMotion) d3.select(this).style('opacity', 0.8)
          }
        )
        .on('mouseout', function (this: SVGRectElement) {
          hideTooltip()
          d3.select(this).style('opacity', null)
        })
        .on('click', (_: MouseEvent, d: InsightsChartDatum) => {
          onBarClick?.(d)
        })
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
