import { useEffect, useState } from 'react'
import { getScrollY, onRootScroll } from '../utils/scrollRoot'

/**
 * True while the page is being scrolled (any direction, ≥ `minDelta` px since the last
 * idle position); flips back to false `idleMs` after the last scroll event.
 */
export function useScrollActivity({ enabled = true, idleMs = 350, minDelta = 6, rootKey = 'window' } = {}) {
  const [scrolling, setScrolling] = useState(false)
  useEffect(() => {
    if (!enabled) {
      setScrolling(false)
      return undefined
    }
    let idleY = getScrollY()
    let timer = 0
    const onScroll = () => {
      if (Math.abs(getScrollY() - idleY) >= minDelta) setScrolling(true)
      clearTimeout(timer)
      timer = setTimeout(() => {
        idleY = getScrollY()
        setScrolling(false)
      }, idleMs)
    }
    const off = onRootScroll(onScroll)
    return () => {
      clearTimeout(timer)
      off()
    }
  }, [enabled, idleMs, minDelta, rootKey])
  return scrolling
}
