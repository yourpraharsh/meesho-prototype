/**
 * User-testing pincode selection (Nagpur field study).
 * The tester picks a pincode before the app UI shows; the choice drives the
 * delivery address, ETA (per-pincode TAT), and the pickup-store list
 * (real stores <1km from users, closest first) from stores_by_pincode.xlsx.
 */

import storesByPincode from '../data/storesByPincode.json'

const STORAGE_KEY = 'meesho-test-pincode'
const COHORT_KEY = 'meesho-test-cohort'

export const TEST_PINCODES = Object.keys(storesByPincode)

/** 'cod' | 'non-cod' — asked in the gate right after the pincode. */
export function getSelectedTestCohort() {
  try {
    const urlCohort = new URLSearchParams(window.location.search).get('cohort')
    if (urlCohort === 'cod' || urlCohort === 'non-cod') {
      window.sessionStorage.setItem(COHORT_KEY, urlCohort)
      return urlCohort
    }
    const stored = window.sessionStorage.getItem(COHORT_KEY)
    return stored === 'cod' || stored === 'non-cod' ? stored : null
  } catch {
    return null
  }
}

export function setSelectedTestCohort(cohort) {
  try {
    window.sessionStorage.setItem(COHORT_KEY, cohort)
  } catch {
    /* gate will re-ask */
  }
}

export function isCodTestUser() {
  return getSelectedTestCohort() === 'cod'
}

export function clearSelectedTestCohort() {
  try {
    window.sessionStorage.removeItem(COHORT_KEY)
  } catch {
    /* noop */
  }
}

/** 'open' | 'closed' — cart review pickup card variant, asked in the gate after the cohort
 *  (moderator's pick per participant). ?card=open|closed pre-selects it and skips the step. */
const CARD_KEY = 'meesho-test-card'

export function getSelectedCardVariant() {
  try {
    const urlCard = new URLSearchParams(window.location.search).get('card')
    if (urlCard === 'open' || urlCard === 'closed') {
      window.sessionStorage.setItem(CARD_KEY, urlCard)
      return urlCard
    }
    const stored = window.sessionStorage.getItem(CARD_KEY)
    return stored === 'open' || stored === 'closed' ? stored : null
  } catch {
    return null
  }
}

export function setSelectedCardVariant(card) {
  try {
    window.sessionStorage.setItem(CARD_KEY, card)
  } catch {
    /* gate will re-ask */
  }
}

export function clearSelectedCardVariant() {
  try {
    window.sessionStorage.removeItem(CARD_KEY)
  } catch {
    /* noop */
  }
}

/** Re-launch the gate flow (pincode → cohort → pickup card) from anywhere in the app. */
export const OPEN_GATE_EVENT = 'meesho-open-gate'

/** First-time-experience budgets (e.g. the review-page spotlight's 3 runs). */
const FTUX_KEYS = [
  'meesho-spotlight-runs',
  'meesho-spotlight-collapsed-runs',
  /* cart review FTUX, one budget per card variant (open / ?card=closed) */
  'meesho-cart-ftux-open-runs',
  'meesho-cart-ftux-closed-runs',
]

export function resetFtuxBudgets() {
  try {
    FTUX_KEYS.forEach((key) => window.localStorage.removeItem(key))
  } catch {
    /* noop */
  }
}

/* ?spot=reset on any URL clears the FTUX budgets as the app loads. */
try {
  if (new URLSearchParams(window.location.search).get('spot') === 'reset') resetFtuxBudgets()
} catch {
  /* noop */
}

/** New participant: the Meesho User chip restarts the gate AND the FTUX budgets. */
export function openTestGate() {
  resetFtuxBudgets()
  window.dispatchEvent(new Event(OPEN_GATE_EVENT))
}

export function getSelectedPincode() {
  /* ?pin=440027 pre-selects and skips the gate (handy for sharing links). */
  try {
    const urlPin = new URLSearchParams(window.location.search).get('pin')
    if (urlPin && storesByPincode[urlPin]) {
      window.sessionStorage.setItem(STORAGE_KEY, urlPin)
      return urlPin
    }
    const stored = window.sessionStorage.getItem(STORAGE_KEY)
    return stored && storesByPincode[stored] ? stored : null
  } catch {
    return null
  }
}

export function setSelectedPincode(pin) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, pin)
  } catch {
    /* sessionStorage unavailable — gate will re-ask */
  }
}

export function clearSelectedPincode() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* noop */
  }
}

/** Stores <1km for the selected pincode, closest first (pre-sorted in data). */
export function getStoresForSelectedPincode() {
  const pin = getSelectedPincode()
  if (!pin) return null
  const entry = storesByPincode[pin]
  if (!entry?.stores?.length) return null
  return entry.stores.map((store) => ({
    id: store.id,
    name: store.name,
    landmark: store.type,
    walk: store.walk,
    hours: store.hours,
    /* No phone numbers in the store data — prototype dial target keeps the
       Call Store action present for testing. */
    phone: '+91 98123 45678',
    photo: store.photo,
    mapsHref: store.mapsHref,
    trusted: store.trusted,
  }))
}

/** Delivery TAT (days) for the selected pincode — drives the shown EDD. */
export function getTatForPincode(pin) {
  return storesByPincode[pin]?.tat ?? null
}

/** Store count per pincode, for the gate UI. */
export function getStoreCountForPincode(pin) {
  return storesByPincode[pin]?.stores?.length ?? 0
}
