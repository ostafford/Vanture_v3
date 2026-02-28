import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import type { InsightsHistoryRow } from '@/services/insights'
import { formatMoney } from '@/lib/format'
import {
  estimateLeftAxisValueLabelSpace,
  estimateBottomAxisLabelSpace,
} from '@/lib/chartLabelSpace'

const BORDER_COLOR = 'var(--vantura-border, #ebedf2)'
const MONEY_IN_COLOR = '#28c76f'
const MONEY_OUT_COLOR = 'var(--vantura-danger, #ea5455)'
const MARGIN_TOP = 8
const MARGIN_RIGHT = 24
const TOOLTIP_OFFSET = 10
const TOOLTIP_PADDING = 8

type InsightsHistoryChartProps = {
  data: InsightsHistoryRow[]
  maxDomain?: number
  className?: string
  style?: React.CSSProperties
  'aria-label'?: string
}

export function InsightsHistoryChart({
  data,
  maxDomain: maxDomainProp,
  className,
  style,
  'aria-label': ariaLabel,
}: InsightsHistoryChartProps) {
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

    const maxVal =
      maxDomainProp ??
      Math.max(...data.flatMap((d) => [d.moneyIn, d.moneyOut]), 100)

    const labels = data.map((d) => d.weekLabel)

    const left = estimateLeftAxisValueLabelSpace(maxVal / 100, 11)
    const bottom = estimateBottomAxisLabelSpace(labels, 10)
    const right = MARGIN_RIGHT

    const innerWidth = dimensions.width - left - right
    const innerHeight = dimensions.height - MARGIN_TOP - bottom

    const xScale = d3
      .scaleBand()
      .domain(labels)
      .range([0, innerWidth])
      .paddingInner(0.2)
      .paddingOuter(0.1)

    const yScale = d3
      .scaleLinear()
      .domain([0, maxVal])
      .range([innerHeight, 0])
      .nice()

    const bandwidth = xScale.bandwidth()
    const barWidth = bandwidth * 0.4

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)

    const g = svg
      .append('g')
      .attr('transform', `translate(${left},${MARGIN_TOP})`)

    const showTooltip = (row: InsightsHistoryRow, event: MouseEvent) => {
      if (!tooltipEl || !container.parentElement) return
      tooltipEl.innerHTML = `<strong>${row.weekLabel}</strong><br/>
        Money In: $${formatMoney(row.moneyIn)}<br/>
        Money Out: $${formatMoney(row.moneyOut)}`
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

    data.forEach((row) => {
      const x =
        (xScale(row.weekLabel) ?? 0) + (bandwidth - barWidth * 2 - 4) / 2
      const inY = yScale(Math.min(row.moneyIn, maxVal))
      const outY = yScale(Math.min(row.moneyOut, maxVal))
      const inHeight = innerHeight - inY
      const outHeight = innerHeight - outY

      g.append('rect')
        .attr('class', 'bar-in')
        .attr('x', x)
        .attr('y', inY)
        .attr('width', barWidth)
        .attr('height', inHeight)
        .attr('fill', MONEY_IN_COLOR)
        .attr('rx', 2)
        .attr('ry', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function (event: MouseEvent) {
          showTooltip(row, event)
          d3.select(this).style('opacity', 0.8)
        })
        .on('mouseout', function () {
          hideTooltip()
          d3.select(this).style('opacity', null)
        })

      g.append('rect')
        .attr('class', 'bar-out')
        .attr('x', x + barWidth + 4)
        .attr('y', outY)
        .attr('width', barWidth)
        .attr('height', outHeight)
        .attr('fill', MONEY_OUT_COLOR)
        .attr('rx', 2)
        .attr('ry', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function (event: MouseEvent) {
          showTooltip(row, event)
          d3.select(this).style('opacity', 0.8)
        })
        .on('mouseout', function () {
          hideTooltip()
          d3.select(this).style('opacity', null)
        })
    })

    const xAxis = d3.axisBottom(xScale).tickSizeOuter(0)
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
