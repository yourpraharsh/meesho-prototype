import { useEffect, useState } from 'react'
import { getScrollY, onRootScroll } from '../utils/scrollRoot'

export const CHROME_DEFAULTS = {
  collapseAt: 56, /* header collapses past this scrollY… */
  expandAt: 16, /* …and re-expands only below this (hysteresis) */
}

/** Pure state transition — returns `prev` itself when nothing changes. */
export function nextChromeState(prev, { y }, o = CHROME_DEFAULTS) {
  const collapsed = prev.collapsed ? y > o.expandAt : y > o.collapseAt
  if (collapsed === prev.collapsed) return prev
  return { collapsed }
}

/**
 * iOS 26-style scroll-driven navigation chrome.
 * - `collapsed`: Home header keeps only its search row (with hysteresis).
 * The tab bar never minimizes: it stays full while the feed scrolls.
 * Inert when `enabled` is false (Meesho/Android skin).
 */
export function useScrollChrome({ enabled = true, rootKey = 'window', ...overrides } = {}) {
  const opts = { ...CHROME_DEFAULTS, ...overrides }
  const [state, setState] = useState({ collapsed: false })

  useEffect(() => {
    if (!enabled) {
      setState((prev) => (prev.collapsed ? { collapsed: false } : prev))
      return undefined
    }
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = getScrollY()
        setState((prev) => nextChromeState(prev, { y }, opts))
        ticking = false
      })
    }
    onScroll()
    return onRootScroll(onScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, rootKey, opts.collapseAt, opts.expandAt])

  return state
}
