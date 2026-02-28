import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import type { SaverBalanceHistoryRow } from '@/services/savers'
import { formatMoney } from '@/lib/format'
import {
  estimateLeftAxisValueLabelSpace,
  estimateBottomAxisLabelSpace,
} from '@/lib/chartLabelSpace'

const BORDER_COLOR = 'var(--vantura-border, #ebedf2)'
const MARGIN_TOP = 8
const MARGIN_RIGHT = 24
const TOOLTIP_OFFSET = 10
const TOOLTIP_PADDING = 8
const DEFAULT_LINE_COLORS = [
  'var(--vantura-accent, #7367f0)',
  '#28c76f',
  '#ea5455',
  '#ff9f43',
  '#00cfe8',
]

export interface SaverSeries {
  saverId: string
  saverName: string
  data: SaverBalanceHistoryRow[]
  color: string
}

type SaversHistoryChartProps = {
  series: SaverSeries[]
  maxDomain?: number
  className?: string
  style?: React.CSSProperties
  'aria-label'?: string
}

export function SaversHistoryChart({
  series,
  maxDomain: maxDomainProp,
  className,
  style,
  'aria-label': ariaLabel,
}: SaversHistoryChartProps) {
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
    const visible = series.filter((s) => s.data.length > 0)
    if (visible.length === 0) return

    d3.select(container).selectAll('*').remove()

    const allDates = new Set<string>()
    visible.forEach((s) => s.data.forEach((d) => allDates.add(d.date)))
    const dateSorted = Array.from(allDates).sort()

    const maxBalance =
      maxDomainProp ??
      Math.max(...visible.flatMap((s) => s.data.map((d) => d.balance)), 100)

    const left = estimateLeftAxisValueLabelSpace(maxBalance / 100, 11)
    const bottom = estimateBottomAxisLabelSpace(dateSorted.slice(0, 5), 10)
    const right = MARGIN_RIGHT

    const innerWidth = dimensions.width - left - right
    const innerHeight = dimensions.height - MARGIN_TOP - bottom

    const xScale = d3.scalePoint().domain(dateSorted).range([0, innerWidth])

    const yScale = d3
      .scaleLinear()
      .domain([0, maxBalance])
      .range([innerHeight, 0])
      .nice()

    const line = d3
      .line<SaverBalanceHistoryRow>()
      .x((d) => xScale(d.date) ?? 0)
      .y((d) => yScale(d.balance))

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)

    const g = svg
      .append('g')
      .attr('transform', `translate(${left},${MARGIN_TOP})`)

    const showTooltip = (
      row: SaverBalanceHistoryRow,
      saverName: string,
      event: MouseEvent
    ) => {
      if (!tooltipEl || !container.parentElement) return
      tooltipEl.innerHTML = `<strong>${saverName}</strong><br/>
        ${row.date}: $${formatMoney(row.balance)}`
      tooltipEl.style.display = 'block'
      const wr = container.parentElement.getBoundingClientRect()
      const tw = tooltipEl.offsetWidth || 140
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

    visible.forEach((s) => {
      g.append('path')
        .datum(s.data)
        .attr('fill', 'none')
        .attr('stroke', s.color)
        .attr('stroke-width', 2)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('d', line)

      g.selectAll(`.point-${s.saverId}`)
        .data(s.data)
        .join('circle')
        .attr('class', `point-${s.saverId}`)
        .attr('cx', (d) => xScale(d.date) ?? 0)
        .attr('cy', (d) => yScale(d.balance))
        .attr('r', 3)
        .attr('fill', s.color)
        .style('cursor', 'pointer')
        .on(
          'mouseover',
          function (event: MouseEvent, d: SaverBalanceHistoryRow) {
            showTooltip(d, s.saverName, event)
            d3.select(this).attr('r', 5)
          }
        )
        .on('mouseout', function () {
          hideTooltip()
          d3.select(this).attr('r', 3)
        })
    })

    const tickCount = Math.min(8, dateSorted.length)
    const tickValues =
      tickCount <= 1 || tickCount >= dateSorted.length
        ? dateSorted
        : Array.from({ length: tickCount }, (_, i) => {
            const idx = Math.round(
              (i / (tickCount - 1)) * (dateSorted.length - 1)
            )
            return dateSorted[idx]
          })

    const xAxis = d3
      .axisBottom(xScale)
      .tickFormat((d) => {
        const s = String(d)
        return s.length > 10 ? s.slice(5, 10) : s
      })
      .tickValues(tickValues)
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
  }, [series, maxDomainProp, dimensions])

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

export { DEFAULT_LINE_COLORS }
