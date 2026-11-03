/**
 * The iPhone Duo preview's cover-screen stand-in.
 *
 * While the device folds or unfolds, the swinging half's cover side shows exactly what the
 * closed screen will: a second copy of the app, in an iframe (?duoCover), that always renders
 * the folded layout of the same page at the same scroll. The live app can't, because it is
 * laid out for the inner display until the device is shut.
 *
 * This module is imported first (main.jsx). Inside that iframe it marks the document and makes
 * every storage write a no-op: the copy shares the tab's sessionStorage (so it passes the same
 * PIN and cohort gates) but must never change the real app's state.
 */
export const IS_DUO_COVER =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('duoCover')

if (IS_DUO_COVER) {
  document.documentElement.classList.add('duo-cover-embed')
  const noop = () => {}
  Storage.prototype.setItem = noop
  Storage.prototype.removeItem = noop
  Storage.prototype.clear = noop
}

/** The iframe URL for the cover stand-in of the page at `path` (pathname + search). */
export function duoCoverSrc(path) {
  return `${path}${path.includes('?') ? '&' : '?'}duoCover=1`
}
