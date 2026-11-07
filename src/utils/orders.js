/**
 * Orders for the OLP / ODP. Real orders placed in this session come first,
 * followed by six sample prepaid home-delivery orders built from the feed.
 * Each order can carry one "switch to store pickup" idea for the ODP lab (lab off for now).
 */
import { getProductsForGrid } from '../data/products'
import { buildMixedFeed } from './cohortFeed'
import { getHeroImageForProduct } from '../data/categoryProductImages'
import { getDeliveryEtaForPin } from './checkoutConfig'
import { getSelectedPincode } from './testPincode'
import { DELIVERY_TYPE } from './deliveryTypes'

const ORDERS_KEY = 'meesho-orders'
const PATCHES_KEY = 'meesho-order-patches'
const SAMPLE_COUNT = 9

/** ODP switch-to-pickup ideas, one per OLP card (post-review set, index order). */
export const SWITCH_IDEAS = [
  'inline-cta', // 1 primary button right under the status
  'store-banner', // 2 store banner, placed with the delivery address
  'home-question', // 3 "Will you be home?" — Yes primary, No reveals the switch
  'sticky-bar', // 4 fixed bar above the fold
  'deliver-to-toggle', // 5 Home (full address) | Meesho Store cards
  'auto-ask', // 6 sheet opens on landing
  'missed-delivery', // 7 first attempt missed — visual home ✕ → store ✓
  'countdown', // 8 "switch before it ships" cutoff timer
  'compare', // 9 icon-first Home vs Store comparison
]

/* Idea: the first sample order is out for delivery and shows its delivery OTP on the OLP
   card's line and on the ODP's truck (false → every order is back to "Order Placed") */
const DELIVERY_OTP_IDEA = true

export const ORDER_STATUS = {
  PLACED: 'placed',
  OUT_FOR_DELIVERY: 'out-for-delivery',
}

/* Off: the ODP switch-to-pickup lab is retired, so every order shows the plain ODP */
const SWITCH_IDEAS_ENABLED = false
const switchIdeaAt = (i) => (SWITCH_IDEAS_ENABLED ? SWITCH_IDEAS[i % SWITCH_IDEAS.length] : null)

const readJson = (key, fallback) => {
  try {
    const raw = window.sessionStorage.getItem(key)
    const v = raw ? JSON.parse(raw) : fallback
    return v ?? fallback
  } catch {
    return fallback
  }
}

const writeJson = (key, value) => {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* falls back to in-memory state */
  }
}

export function getPlacedOrders() {
  const list = readJson(ORDERS_KEY, [])
  return Array.isArray(list) ? list : []
}

export function recordPlacedOrder(order) {
  const list = getPlacedOrders()
  list.unshift({ id: `ord-${Date.now()}`, placedAt: Date.now(), ...order })
  writeJson(ORDERS_KEY, list)
}

/** Post-order changes (e.g. switched to pickup) — kept for samples and real orders alike. */
export function updateOrder(id, patch) {
  const list = getPlacedOrders()
  const idx = list.findIndex((o) => String(o.id) === String(id))
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...patch }
    writeJson(ORDERS_KEY, list)
    return
  }
  const patches = readJson(PATCHES_KEY, {})
  patches[id] = { ...(patches[id] ?? {}), ...patch }
  writeJson(PATCHES_KEY, patches)
}

/** "Tuesday, 1 Sep" → "Tue, 1 Sep" (OLP shows the short weekday). */
export const shortEta = (label) => String(label ?? '').replace(/^(\w{3})\w+,/, '$1,')

/** "Tuesday, 1 Sep" → "1 Sep" */
export const etaDay = (label) => String(label ?? '').match(/\d{1,2} \w{3}/)?.[0] ?? String(label ?? '')

const SAMPLE_SIZES = ['L', 'M', 'S', 'XL', 'Free Size', 'M', 'L', 'Free Size', 'M']
let sampleCache = null

export function getSampleOrders() {
  if (sampleCache) return sampleCache
  const eta = getDeliveryEtaForPin(getSelectedPincode())
  const seen = new Set()
  const picks = []
  for (const product of buildMixedFeed(getProductsForGrid())) {
    const pid = String(product.product_id ?? product.productId ?? product.id)
    if (seen.has(pid)) continue
    seen.add(pid)
    picks.push(product)
    if (picks.length === SAMPLE_COUNT) break
  }
  sampleCache = picks.map((product, i) => ({
    id: `sample-${i}`,
    sample: true,
    switchIdea: switchIdeaAt(i),
    productId: String(product.product_id ?? product.productId ?? product.id),
    title: product.title,
    image: getHeroImageForProduct(product) || product?.hero_image_url || '',
    sizeLabel: SAMPLE_SIZES[i],
    qty: 1,
    payable: product.price_summary?.price ?? 0,
    saved: Math.max(0, (product.price_summary?.mrp ?? 0) - (product.price_summary?.price ?? 0)),
    returnTypeId: 'all_easy',
    paymentMethodId: 'pay_online',
    deliveryTypeId: DELIVERY_TYPE.HOME,
    etaLabel: eta,
    status: DELIVERY_OTP_IDEA && i === 0 ? ORDER_STATUS.OUT_FOR_DELIVERY : ORDER_STATUS.PLACED,
    placedAt: Date.now() - i * 3600000,
  }))
  return sampleCache
}

/** On the way to the door today (a store-pickup order never is). */
export const isOutForDelivery = (order) =>
  order?.status === ORDER_STATUS.OUT_FOR_DELIVERY && order.deliveryTypeId !== DELIVERY_TYPE.PICKUP

/** Stable 4-digit delivery OTP derived from the order id (never starts with 0). */
export function deliveryOtp(order) {
  let hash = 7
  for (const ch of String(order?.id ?? '')) hash = (hash * 131 + ch.charCodeAt(0)) >>> 0
  return String(1000 + (hash % 9000))
}

/** Orders to list: real ones from this session first, then the six samples. */
export function getOrdersForListing() {
  const patches = readJson(PATCHES_KEY, {})
  const all = [...getPlacedOrders(), ...getSampleOrders()]
  return all.map((order, index) => ({
    ...order,
    /* set last so an idea stored on an earlier order can't bring the lab back */
    switchIdea: switchIdeaAt(index),
    ...(patches[order.id] ?? {}),
  }))
}

/** Look up one order (real or sample) for the details page. */
export function getOrderById(id) {
  return getOrdersForListing().find((order) => String(order.id) === String(id)) ?? null
}

/** Stable 9-digit order number derived from the order id. */
export function orderNumber(order) {
  let hash = 0
  for (const ch of String(order?.id ?? '')) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return String(223000000 + (hash % 999999)).padStart(9, '0')
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "14 Jan" for a timestamp, optionally offset by whole days. */
export function shortDate(ts, plusDays = 0) {
  const d = new Date(ts ?? Date.now())
  d.setDate(d.getDate() + plusDays)
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`
}
