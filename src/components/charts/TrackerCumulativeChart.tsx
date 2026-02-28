import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import type { TrackerTransactionTimelineRow } from '@/services/trackers'
import { formatMoney } from '@/lib/format'
import {
  estimateLeftAxisValueLabelSpace,
  estimateBottomAxisLabelSpace,
} from '@/lib/chartLabelSpace'

const BORDER_COLOR = 'var(--vantura-border, #ebedf2)'
const LINE_COLOR = 'var(--vantura-accent, #7367f0)'
const AREA_OPACITY = 0.2
const MARGIN_TOP = 8
const MARGIN_RIGHT = 24
const TOOLTIP_OFFSET = 10
const TOOLTIP_PADDING = 8

type TrackerCumulativeChartProps = {
  data: TrackerTransactionTimelineRow[]
  maxDomain?: number
  className?: string
  style?: React.CSSProperties
  'aria-label'?: string
}

export function TrackerCumulativeChart({
  data,
  maxDomain: maxDomainProp,
  className,
  style,
  'aria-label': ariaLabel,
}: TrackerCumulativeChartProps) {
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
    if (data.length === 0) return

    d3.select(container).selectAll('*').remove()

    const maxCumulative =
      maxDomainProp ?? Math.max(...data.map((d) => d.cumulativeSpent), 1)
    const dateLabels = data.map((d) => d.date)

    const left = estimateLeftAxisValueLabelSpace(maxCumulative / 100, 11)
    const bottom = estimateBottomAxisLabelSpace(dateLabels, 10)
    const right = MARGIN_RIGHT

    const innerWidth = dimensions.width - left - right
    const innerHeight = dimensions.height - MARGIN_TOP - bottom

    const xScale = d3.scalePoint().domain(dateLabels).range([0, innerWidth])

    const yScale = d3
      .scaleLinear()
      .domain([0, maxCumulative])
      .range([innerHeight, 0])
      .nice()

    const line = d3
      .line<TrackerTransactionTimelineRow>()
      .x((d) => xScale(d.date) ?? 0)
      .y((d) => yScale(d.cumulativeSpent))

    const area = d3
      .area<TrackerTransactionTimelineRow>()
      .x((d) => xScale(d.date) ?? 0)
      .y0(innerHeight)
      .y1((d) => yScale(d.cumulativeSpent))

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)

    const g = svg
      .append('g')
      .attr('transform', `translate(${left},${MARGIN_TOP})`)

    const showTooltip = (
      row: TrackerTransactionTimelineRow,
      event: MouseEvent
    ) => {
      if (!tooltipEl || !container.parentElement) return
      tooltipEl.innerHTML = `<strong>${row.date}</strong><br/>
        ${row.description || 'Transaction'}: $${formatMoney(row.amount)}<br/>
        Cumulative: $${formatMoney(row.cumulativeSpent)}`
      tooltipEl.style.display = 'block'
      const wr = container.parentElement.getBoundingClientRect()
      const tw = tooltipEl.offsetWidth || 160
      const th = tooltipEl.offsetHeight || 50
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

    g.append('path')
      .datum(data)
      .attr('fill', LINE_COLOR)
      .attr('fill-opacity', AREA_OPACITY)
      .attr('d', area)

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', LINE_COLOR)
      .attr('stroke-width', 2)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('d', line)

    g.selectAll('.point')
      .data(data)
      .join('circle')
      .attr('class', 'point')
      .attr('cx', (d) => xScale(d.date) ?? 0)
      .attr('cy', (d) => yScale(d.cumulativeSpent))
      .attr('r', 3)
      .attr('fill', LINE_COLOR)
      .style('cursor', 'pointer')
      .on(
        'mouseover',
        function (event: MouseEvent, d: TrackerTransactionTimelineRow) {
          showTooltip(d, event)
          d3.select(this).attr('r', 5)
        }
      )
      .on('mouseout', function () {
        hideTooltip()
        d3.select(this).attr('r', 3)
      })

    const xAxis = d3
      .axisBottom(xScale)
      .tickFormat((d) => {
        const s = String(d)
        return s.length > 10 ? s.slice(5, 10) : s
      })
      .tickSizeOuter(0)

    const yAxis = d3
      .axisLeft(yScale)
      .tickFormat((d: d3.NumberValue) => `$${formatMoney(Number(d))}`)
      .tickSizeOuter(0)

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((sel) =>
        sel.selectAll('.domain, .tick line').attr('stroke', BORDER_COLOR)
      )
      .call((sel) => sel.selectAll('.tick text').attr('fill', 'currentColor'))
      .style('font-size', '10px')

    g.append('g')
      .call(yAxis)
      .style('font-size', '11px')
      .call((sel) =>
        sel.selectAll('.domain, .tick line').attr('stroke', BORDER_COLOR)
      )
      .call((sel) => sel.selectAll('.tick text').attr('fill', 'currentColor'))

    return () => {
      hideTooltip()
      d3.select(container).selectAll('*').remove()
    }
  }, [data, maxDomainProp, dimensions])

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
