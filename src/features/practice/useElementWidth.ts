import { useEffect, useState, type RefObject } from 'react'

/**
 * The current width of an element, in pixels. Undefined until it is measured,
 * or always where ResizeObserver doesn't exist (tests).
 */
export function useElementWidth(ref: RefObject<HTMLElement | null>): number | undefined {
  const [width, setWidth] = useState<number>()

  useEffect(() => {
    const element = ref.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.floor(entry.contentRect.width))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return width
}
