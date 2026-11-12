/**
 * Pickup-anytime lab ("Convinience as Hinge") — education treatments for the
 * review-page pickup card, keyed to the first N products of the default Home
 * mixed feed, one variant per product.
 */

import { getProductsForGrid } from '../data/products'
import { buildMixedFeed } from './cohortFeed'
import { getDeliveryEtaDateForPin } from './checkoutConfig'

/* Discount-salience lab (post-UT round 2): research showed users miss the
   pickup discount on the review page. Kept: the "Save ₹" eyebrow and its FTUX
   spotlight, on the first 3 feed products. The loud round (4–14: offer sheet,
   swing tag, banners, scratch card…) is removed; its components stay in
   DiscountIdeasLoud. (The retired convenience/pickup-anytime set lives on in
   the PickupIdea* modules if it's ever revived.) */
export const PICKUP_VARIANTS = [
  { id: 1, key: '1-spotlight', group: 'Takeover', name: 'Page dims, pickup card spotlit with callout' },
  { id: 2, key: '2-save-flash', group: 'Card theme', name: 'Save eyebrow + green flash, no spotlight' },
  { id: 3, key: '3-spotlight-collapsed', group: 'Takeover', name: 'Spotlight on header-only card; store expands as it settles' },
]

/* The cart review's pickup card on every landing (not a lab arm, so not in the list above):
   Self-pickup v2 "Steady State" — the "₹X OFF" band grows in, a mint flash, then rest. */
export const STEADY_STATE_VARIANT = { id: 'steady', key: 'steady', group: 'Default', name: 'Steady state: band grows in, mint flash, rest' }

/* Variant 2 (test gate "Card closed until tapped", or ?card=closed): the pickup card shows band + header only until pickup is chosen; choosing
   pickup opens it, choosing Home closes it. Same first-visit FTUX and Steady State as Variant 1. */
export const STEADY_CLOSED_VARIANT = { id: 'steady-closed', key: 'steady-closed', group: 'Default', name: 'Card closed until pickup is selected' }

const VARIANT_PRODUCT_COUNT = PICKUP_VARIANTS.length

let feedIdsCache = null

/** First N unique products of the default Home listing, in feed order. */
function getVariantFeedIds() {
  if (!feedIdsCache) {
    const feed = buildMixedFeed(getProductsForGrid())
    const ids = []
    for (const product of feed) {
      const pid = String(product.product_id ?? product.productId ?? product.id)
      if (!ids.includes(pid)) ids.push(pid)
      if (ids.length === VARIANT_PRODUCT_COUNT) break
    }
    feedIdsCache = ids
  }
  return feedIdsCache
}

/* On for the eyebrow + FTUX set above (the convenience set before it was retired after the
   25 Aug Nagpur round). */
const VARIANTS_ENABLED = true

/** Variant for a product by its Home-feed position (first 3 products), else null. */
export function getPickupVariantForProduct(productId) {
  if (!VARIANTS_ENABLED || productId == null) return null
  const index = getVariantFeedIds().indexOf(String(productId))
  return index === -1 ? null : PICKUP_VARIANTS[index]
}

/** Explicit override (?pv=1..3) for demoing a variant on any product. */
export function getPickupVariantById(id) {
  if (!VARIANTS_ENABLED) return null
  return PICKUP_VARIANTS.find((v) => v.id === Number(id)) ?? null
}

let fullFeedIdsCache = null

/** Every unique product of the default Home listing, in feed order. */
function getFullFeedIds() {
  if (!fullFeedIdsCache) {
    const seen = new Set()
    fullFeedIdsCache = []
    for (const product of buildMixedFeed(getProductsForGrid())) {
      const pid = String(product.product_id ?? product.productId ?? product.id)
      if (!seen.has(pid)) {
        seen.add(pid)
        fullFeedIdsCache.push(pid)
      }
    }
  }
  return fullFeedIdsCache
}

/**
 * COD-after-pickup sheet A/B (both cohorts): alternate products down the feed
 * open alternate designs — even feed positions the animated store→home morph,
 * odd positions the static price-compare card pair.
 */
export function getCodSheetVariantForProduct(productId) {
  const index = getFullFeedIds().indexOf(String(productId ?? ''))
  return index !== -1 && index % 2 === 1 ? 'compare' : 'animated'
}

const FEED_POS_KEY = 'meesho-feed-pos'

/**
 * Home feed: remember the card position a product was opened from, so per-card variants follow
 * the card the shopper actually tapped — category pills and search reorder the feed. Per tab.
 */
export function rememberFeedPosition(productId, index) {
  try {
    const map = JSON.parse(window.sessionStorage.getItem(FEED_POS_KEY) || '{}')
    map[String(productId)] = index
    window.sessionStorage.setItem(FEED_POS_KEY, JSON.stringify(map))
  } catch {
    /* falls back to the default feed order */
  }
}

function getRememberedFeedPosition(productId) {
  try {
    const index = JSON.parse(window.sessionStorage.getItem(FEED_POS_KEY) || '{}')[String(productId)]
    return Number.isInteger(index) ? index : null
  } catch {
    return null
  }
}

/**
 * Store FAQ sheet (Call Store) variants by the position of the Home card the product was opened
 * from (else its place in the default feed): every 5th card (5th, 10th…) gets a
 * still from the pickup story on top of the plain answers; every other 4th card (4th, 8th…) the
 * video on top of collapsed questions; every other 3rd card (3rd, 6th…) the collapsed accordion;
 * the rest alternate — odd cards plain answers, even cards the video on top.
 * ?faq=plain | video | accordion | video-accordion | image forces one for every product.
 */
export function getStoreFaqVariantForProduct(productId) {
  const forced = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('faq')
  if (['plain', 'video', 'accordion', 'video-accordion', 'image'].includes(forced)) return forced
  const index = getRememberedFeedPosition(productId) ?? getFullFeedIds().indexOf(String(productId ?? ''))
  if (index === -1) return 'plain'
  /* newer variants win where the rules overlap (15th, 20th… cards; 12th, 24th…):
     every 5th card: still image + plain answers; every 4th: video + collapsed questions;
     every 3rd: collapsed questions; the rest alternate plain / video */
  if (index % 5 === 4) return 'image'
  if (index % 4 === 3) return 'video-accordion'
  if (index % 3 === 2) return 'accordion'
  return index % 2 === 1 ? 'video' : 'plain'
}

const DOW_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function buildWindowDay(date, offset, holdDays) {
  const dowShort = DOW_SHORT[date.getDay()]
  const dowTitle = dowShort[0] + dowShort.slice(1).toLowerCase()
  return {
    date,
    dowShort,
    dayNum: date.getDate(),
    label: `${dowTitle}, ${date.getDate()} ${MONTH_SHORT[date.getMonth()]}`,
    isArrival: offset === 0,
    isLast: offset === holdDays,
  }
}

/** Parse "11am-7pm" / "8 AM – 10 PM" → { openTime: '11 AM', closeTime: '7 PM' }. */
export function parseHoursRange(hours) {
  if (!hours) return null
  const matches = [...String(hours).matchAll(/(\d{1,2})(?::\d{2})?\s*(am|pm)/gi)]
  if (matches.length < 2) return null
  const fmt = (m) => `${Number(m[1])} ${m[2].toUpperCase()}`
  return { openTime: fmt(matches[0]), closeTime: fmt(matches[matches.length - 1]) }
}

/**
 * The pickup window: arrival day + 3 held days, derived from the same
 * pin-based ETA the review header shows — the two never disagree.
 */
export function getPickupWindow(pin, now = new Date()) {
  const holdDays = 3
  const arrivalDate = getDeliveryEtaDateForPin(pin, now)
  const days = []
  for (let offset = 0; offset <= holdDays; offset += 1) {
    const d = new Date(arrivalDate)
    d.setDate(d.getDate() + offset)
    days.push(buildWindowDay(d, offset, holdDays))
  }
  return {
    arrival: days[0],
    last: days[holdDays],
    days,
    openTime: '10 AM',
    closeTime: '10 PM',
    holdDays,
  }
}
