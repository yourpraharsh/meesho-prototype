/**
 * The element that scrolls the page. On the phone layouts that is the window; in the
 * iPhone Duo folded layout the app lives inside a fixed 466×679 device screen whose
 * inner .app-scroll wrapper scrolls on its own, so scroll-driven chrome must read/listen there.
 */
export function getScrollRoot() {
  if (typeof document === 'undefined') return null
  return document.body.classList.contains('duo-device') ? document.querySelector('.app-scroll') : null
}

export function getScrollY() {
  const root = getScrollRoot()
  return root ? root.scrollTop : window.scrollY
}

export function scrollRootTo(top, behavior) {
  const root = getScrollRoot()
  const target = root || window
  target.scrollTo(behavior ? { top, behavior } : { top })
}

export function getScrollMetrics() {
  const root = getScrollRoot()
  return root
    ? { scrollHeight: root.scrollHeight, viewportHeight: root.clientHeight }
    : { scrollHeight: document.documentElement.scrollHeight, viewportHeight: window.innerHeight }
}

/** Subscribe to the active scroll root; returns the unsubscribe function. */
export function onRootScroll(handler) {
  const target = getScrollRoot() || window
  target.addEventListener('scroll', handler, { passive: true })
  return () => target.removeEventListener('scroll', handler)
}
