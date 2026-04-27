import { useEffect, useRef, useState } from 'react'

export interface ChartDimensions {
  width: number
  height: number
}

/**
 * Observes an element's content size via ResizeObserver and returns the current dimensions.
 * Returns a [ref, dimensions] tuple: attach ref to the container div, read dimensions for drawing.
 * Automatically disconnects the observer on unmount.
 */
export function useChartDimensions(): [
  React.RefObject<HTMLDivElement>,
  ChartDimensions,
] {
  const ref = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState<ChartDimensions>({
    width: 0,
    height: 0,
  })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setDimensions({ width, height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return [ref, dimensions]
}
