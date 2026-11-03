import { useCallback, useEffect, useRef, useState } from 'react'
import { getScrollMetrics, getScrollY, onRootScroll } from '../utils/scrollRoot'

export const CHROME_DEFAULTS = {
  collapseAt: 56, /* header collapses past this scrollY… */
  expandAt: 16, /* …and re-expands only below this (hysteresis) */
  minimizeAt: 120, /* tab bar may minimize past this scrollY */
  downDelta: 8, /* …after this much continuous downward travel */
  upDelta: 12, /* …and re-expands after this much upward travel */
}

/** Scroll direction (+1 down, -1 up, 0 none). */
export function scrollDirection(lastY, y) {
  return y > lastY ? 1 : y < lastY ? -1 : 0
}

/** The anchor is the scroll position where the current run of travel started. */
export function nextAnchor({ anchorY, lastY, lastDir }, y) {
  const dir = scrollDirection(lastY, y)
  if (dir !== 0 && dir !== lastDir) return { anchorY: lastY, lastDir: dir }
  return { anchorY, lastDir: dir === 0 ? lastDir : dir }
}

/** Pure state transition — returns `prev` itself when nothing changes. */
export function nextChromeState(prev, { y, travelled, shortPage }, o = CHROME_DEFAULTS) {
  const collapsed = prev.collapsed ? y > o.expandAt : y > o.collapseAt
  let { minimized } = prev
  if (y <= o.minimizeAt || shortPage) minimized = false
  else if (travelled >= o.downDelta) minimized = true
  else if (travelled <= -o.upDelta) minimized = false
  if (collapsed === prev.collapsed && minimized === prev.minimized) return prev
  return { collapsed, minimized }
}

/**
 * iOS 26-style scroll-driven navigation chrome.
 * - `collapsed`: Home header keeps only its search row (with hysteresis).
 * - `minimized`: the tab bar shrinks to one floating button on downward travel and
 *   comes back on upward travel, near the top, on short pages, or via `expand()`.
 * `expand()` also restarts the travel run at the current position, so call it after a
 * programmatic scroll (e.g. restoring Home's position) so the jump never reads as a swipe.
 * Inert when `enabled` is false (Meesho/Android skin).
 */
export function useScrollChrome({ enabled = true, rootKey = 'window', ...overrides } = {}) {
  const opts = { ...CHROME_DEFAULTS, ...overrides }
  const [state, setState] = useState({ collapsed: false, minimized: false })
  const lastYRef = useRef(0)
  const runRef = useRef({ anchorY: 0, lastDir: 0 })

  useEffect(() => {
    if (!enabled) {
      setState((prev) => (prev.collapsed || prev.minimized ? { collapsed: false, minimized: false } : prev))
      return undefined
    }
    lastYRef.current = getScrollY()
    runRef.current = { anchorY: lastYRef.current, lastDir: 0 }
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = getScrollY()
        runRef.current = nextAnchor({ ...runRef.current, lastY: lastYRef.current }, y)
        const { scrollHeight, viewportHeight } = getScrollMetrics()
        const shortPage = scrollHeight < viewportHeight + 200
        setState((prev) => nextChromeState(prev, { y, travelled: y - runRef.current.anchorY, shortPage }, opts))
        lastYRef.current = y
        ticking = false
      })
    }
    onScroll()
    return onRootScroll(onScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, rootKey, opts.collapseAt, opts.expandAt, opts.minimizeAt, opts.downDelta, opts.upDelta])

  const expand = useCallback(() => {
    const y = getScrollY()
    lastYRef.current = y
    runRef.current = { anchorY: y, lastDir: 0 }
    setState((s) => (s.minimized ? { ...s, minimized: false } : s))
  }, [])

  return { ...state, expand }
}
