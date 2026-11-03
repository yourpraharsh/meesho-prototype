import { PLACEHOLDER_ADDRESSES } from './checkoutConfig'

/**
 * PDP / PLP delivery promise — 3, 4, or 5 calendar days (not checkout ribbon dates).
 *
 * Logic:
 *   slot = hash(productId + pin) % 3
 *   days = 3 + slot  →  3, 4, or 5
 *
 *   • 3 or 4 days → fast (show FAST wordmark)
 *   • 5 days      → normal (text only, no FAST logo)
 *
 * Checkout review ribbon uses getDeliveryEtaForPin() — 5–7 days → calendar date
 * ("Tuesday, 7 Jul"). That is separate from this day-count promise.
 */

export const DEFAULT_DELIVERY_PIN = PLACEHOLDER_ADDRESSES[0]?.pin ?? '110059'

/** @returns {0 | 1 | 2} */
function deliverySlot(product, pin) {
  const productId = String(product?.product_id ?? product?.productId ?? product?.id ?? 0)
  const pinDigits = String(pin ?? DEFAULT_DELIVERY_PIN).replace(/\D/g, '') || DEFAULT_DELIVERY_PIN
  const key = `${productId}:${pinDigits}`
  let hash = 0
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  return /** @type {0 | 1 | 2} */ (hash % 3)
}

/** @returns {3 | 4 | 5} */
export function getDeliveryPromiseDays(product, pin = DEFAULT_DELIVERY_PIN) {
  return /** @type {3 | 4 | 5} */ (3 + deliverySlot(product, pin))
}

/** PLP fast cards — only 3 or 4 day promises. */
export function getPlpFastDeliveryDays(product, pin = DEFAULT_DELIVERY_PIN) {
  return /** @type {3 | 4} */ (3 + (deliverySlot(product, pin) % 2))
}

/**
 * @param {number} days
 * @returns {{ days: number, isFast: boolean, dayLabel: string, label: string }}
 */
export function buildDeliveryPromise(days) {
  const isFast = days === 3 || days === 4
  const dayLabel = `${days} Day`
  return {
    days,
    isFast,
    dayLabel,
    label: `${dayLabel} Delivery`,
  }
}

export function getDeliveryPromiseForPdp(product, pin = DEFAULT_DELIVERY_PIN) {
  return buildDeliveryPromise(getDeliveryPromiseDays(product, pin))
}

export function getDeliveryPromiseForPlp(product, pin = DEFAULT_DELIVERY_PIN) {
  return buildDeliveryPromise(getPlpFastDeliveryDays(product, pin))
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDeliveryDate(date) {
  return `${DAY_NAMES[date.getDay()]}, ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`
}

/** Calendar ETA from product promise days — e.g. "Sunday, 12 Jun". */
export function getDeliveryEtaForProductPromise(product, pin = DEFAULT_DELIVERY_PIN, now = new Date()) {
  const days = getDeliveryPromiseDays(product, pin)
  const eta = new Date(now)
  eta.setHours(12, 0, 0, 0)
  eta.setDate(eta.getDate() + days)
  return formatDeliveryDate(eta)
}

/** Compact address for PDP ribbons — e.g. "6B, Surya Apartments...560103". */
export function formatPdpAddressSnippet(address) {
  const line = String(address?.line ?? '').trim()
  const pin = String(address?.pin ?? '').trim()
  if (!line && !pin) return ''
  const parts = line.split(',').map((part) => part.trim()).filter(Boolean)
  let lead = parts.slice(0, 2).join(', ') || line
  if (lead.length > 26) {
    lead = `${lead.slice(0, 24).trim()}...`
  } else if (pin) {
    lead = `${lead}...`
  }
  return pin ? `${lead}${pin}` : lead
}
