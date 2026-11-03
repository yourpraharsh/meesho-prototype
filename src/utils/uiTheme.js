/**
 * UI skin + device layout + Duo posture for the research prototype.
 * - skin: 'android' (Meesho design system, default) or 'ios' (Liquid Glass applied to the
 *   NAVIGATION CHROME ONLY: top bars, tab bar, CTA footers). ?ui=ios|android
 * - layout: 'phone' (default 430px frame) or 'duo' (iPhone Duo). ?layout=duo|phone
 * - posture (Duo only): folded · stand · landscape · book · portrait · laptop. ?posture=…
 *
 * URL params are consumed ONCE at module load with explicit precedence and written to
 * sessionStorage; every getter afterwards reads storage only, so the body classes applied
 * before React paints always equal what the hooks compute on mount.
 *   ?ui=android → Android skin on the phone frame (clears a stored Duo layout)
 *   ?layout=duo → Duo, which always carries the glass skin (wins over ?ui=android)
 */
import { useEffect, useState } from 'react'
import { IS_DUO_COVER } from './duoCoverEmbed'

const KEY = 'meesho-ui'
const LAYOUT_KEY = 'meesho-layout'
const POSTURE_KEY = 'meesho-posture'
const SPLIT_KEY = 'meesho-split'
const EVENT = 'meesho-ui-change'
const COMMIT_EVENT = 'meesho-posture-commit'

export const DUO_POSTURES = ['folded', 'stand', 'landscape', 'book', 'portrait', 'laptop']
/* Open (unfolded landscape) can run the app full screen or in one half (split view) */
export const DUO_SPLITS = ['full', 'left', 'right']

/* the postures whose screen is the wide inner display, which can be shared (split view) */
export function postureSplits(posture) {
  return posture === 'landscape' || posture === 'book'
}

/* the Duo cover stand-in (an iframe of the app) always shows the folded cover screen */
const COVER_STATE = { [KEY]: 'ios', [LAYOUT_KEY]: 'duo', [POSTURE_KEY]: 'folded', [SPLIT_KEY]: 'full' }

function store(k, v) {
  if (IS_DUO_COVER) return
  try {
    window.sessionStorage.setItem(k, v)
  } catch {
    /* storage unavailable — defaults apply */
  }
}

function read(k) {
  if (IS_DUO_COVER && k in COVER_STATE) return COVER_STATE[k]
  try {
    return window.sessionStorage.getItem(k)
  } catch {
    return null
  }
}

function consumeUrlParams() {
  if (typeof window === 'undefined' || IS_DUO_COVER) return
  const p = new URLSearchParams(window.location.search)
  const ui = p.get('ui')
  const layout = p.get('layout')
  const posture = p.get('posture')
  const split = p.get('split')
  if (DUO_SPLITS.includes(split)) store(SPLIT_KEY, split)
  if (ui === 'android') {
    store(KEY, 'android')
    store(LAYOUT_KEY, 'phone')
  } else if (ui === 'ios') {
    store(KEY, 'ios')
  }
  if (layout === 'phone') store(LAYOUT_KEY, 'phone')
  else if (layout === 'duo') {
    store(LAYOUT_KEY, 'duo')
    store(KEY, 'ios')
  }
  if (DUO_POSTURES.includes(posture)) {
    store(POSTURE_KEY, posture)
    if (layout !== 'phone') {
      store(LAYOUT_KEY, 'duo')
      store(KEY, 'ios')
    }
  }
}

export function getUiTheme() {
  if (read(LAYOUT_KEY) === 'duo') return 'ios' /* Duo implies the glass skin */
  return read(KEY) === 'ios' ? 'ios' : 'android'
}

export function getUiLayout() {
  return read(LAYOUT_KEY) === 'duo' ? 'duo' : 'phone'
}

export function getDuoSplit() {
  const v = read(SPLIT_KEY)
  return DUO_SPLITS.includes(v) ? v : 'full'
}

export function getDuoPosture() {
  const v = read(POSTURE_KEY)
  return DUO_POSTURES.includes(v) ? v : 'folded'
}

/* Apple: horizontal bars are kept only on the inner display in portrait (laptop is that
   portrait screen bent at the hinge); every other Duo posture moves navigation into a side rail. */
export function postureUsesRail(posture) {
  return Boolean(posture) && posture !== 'portrait' && posture !== 'laptop'
}

/**
 * The posture the screen is CURRENTLY showing. It lags the stored target while the fold
 * animation runs: DuoDevice commits it at the moment the old display has gone dark.
 */
export function getCommittedPosture() {
  if (typeof document === 'undefined') return null
  return document.body.dataset.posture || null
}

export function getCommittedSplit() {
  if (typeof document === 'undefined') return 'full'
  return document.body.dataset.split || 'full'
}

export function commitPostureClasses(posture, split = getDuoSplit()) {
  if (typeof document === 'undefined') return
  document.body.dataset.posture = posture || ''
  document.body.dataset.split = postureSplits(posture) ? split : 'full'
  document.body.classList.toggle('layout-duo', postureUsesRail(posture))
  window.dispatchEvent(new Event(COMMIT_EVENT))
}

/* Mirror state onto <body> before React paints so chrome never animates in from other values.
   body.duo-device = Duo device viewport · body.layout-duo = side-rail chrome · data-posture */
let lastLayout = null
function applyBodyClasses() {
  if (typeof document === 'undefined') return
  const layout = getUiLayout()
  document.body.classList.toggle('ui-ios', getUiTheme() === 'ios')
  document.body.classList.toggle('duo-device', layout === 'duo')
  if (layout !== 'duo') {
    if (getCommittedPosture() !== null || lastLayout === null) commitPostureClasses(null)
  } else if (lastLayout !== 'duo') {
    commitPostureClasses(getDuoPosture()) /* entering Duo: no fold animation */
  }
  lastLayout = layout
}

consumeUrlParams()
applyBodyClasses()

function emit() {
  applyBodyClasses()
  window.dispatchEvent(new Event(EVENT))
}

export function setUiTheme(theme) {
  store(KEY, theme)
  emit()
}

export function setUiLayout(layout) {
  store(LAYOUT_KEY, layout)
  emit()
}

export function setDuoPosture(posture) {
  if (!DUO_POSTURES.includes(posture)) return
  store(POSTURE_KEY, posture)
  emit()
}

/** Apply several fields in one go (one event, one body-class pass). */
export function setUiState({ theme, layout, posture, split } = {}) {
  if (theme) store(KEY, theme)
  if (layout) store(LAYOUT_KEY, layout)
  if (posture && DUO_POSTURES.includes(posture)) store(POSTURE_KEY, posture)
  if (split && DUO_SPLITS.includes(split)) store(SPLIT_KEY, split)
  emit()
}

function useSynced(getter, eventName = EVENT) {
  const [value, set] = useState(getter)
  useEffect(() => {
    const sync = () => set(getter())
    sync()
    window.addEventListener(eventName, sync)
    return () => window.removeEventListener(eventName, sync)
  }, [getter, eventName])
  return value
}

/** Current skin, live across the app (body.ui-ios). */
export function useUiTheme() {
  return [useSynced(getUiTheme), setUiTheme]
}

/** Current device layout, live across the app (body.layout-duo). */
export function useUiLayout() {
  return [useSynced(getUiLayout), setUiLayout]
}

/** Current Duo posture, live across the app (body[data-posture]). */
export function useDuoPosture() {
  return [useSynced(getDuoPosture), setDuoPosture]
}

/** The posture the screen is showing right now (lags the target during the fold animation). */
export function useCommittedPosture() {
  return useSynced(getCommittedPosture, COMMIT_EVENT)
}

/** Split view setting for Open (stored target). */
export function useDuoSplit() {
  return useSynced(getDuoSplit)
}

/** The split the screen is showing right now. */
export function useCommittedSplit() {
  return useSynced(getCommittedSplit, COMMIT_EVENT)
}
