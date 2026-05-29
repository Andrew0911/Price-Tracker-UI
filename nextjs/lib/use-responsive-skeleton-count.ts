"use client"

import { useEffect, useRef, useState } from "react"

type ResponsiveSkeletonCountOptions = {
  itemHeight: number | ((size: { width: number; height: number }) => number)
  gap: number
  minCount: number
  maxCount: number | ((size: { width: number; height: number }) => number)
  itemMinWidth?: number
  maxColumns?: number
  extraRows?: number
}

function resolveResponsiveValue(
  value: number | ((size: { width: number; height: number }) => number),
  size: { width: number; height: number }
) {
  return typeof value === "function" ? value(size) : value
}

export function useResponsiveSkeletonCount({
  itemHeight,
  gap,
  minCount,
  maxCount,
  itemMinWidth,
  maxColumns,
  extraRows = 1,
}: ResponsiveSkeletonCountOptions) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [count, setCount] = useState(minCount)

  useEffect(() => {
    const element = ref.current
    if (!element || typeof ResizeObserver === "undefined") return
    const observedElement = element

    let frame = 0

    function updateCount() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const { height, width } = observedElement.getBoundingClientRect()
        const size = { width, height }
        const resolvedItemHeight = resolveResponsiveValue(itemHeight, size)
        const resolvedMaxCount = resolveResponsiveValue(maxCount, size)
        const measuredColumns = itemMinWidth
          ? Math.max(1, Math.floor((width + gap) / (itemMinWidth + gap)))
          : 1
        const columns = maxColumns
          ? Math.min(maxColumns, measuredColumns)
          : measuredColumns
        const rows = Math.max(
          1,
          Math.floor((height + gap) / (resolvedItemHeight + gap)) + extraRows
        )
        const nextCount = Math.min(
          resolvedMaxCount,
          Math.max(minCount, rows * columns)
        )

        setCount(nextCount)
      })
    }

    const observer = new ResizeObserver(updateCount)
    observer.observe(observedElement)
    updateCount()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [
    extraRows,
    gap,
    itemHeight,
    itemMinWidth,
    maxColumns,
    maxCount,
    minCount,
  ])

  return [ref, count] as const
}
