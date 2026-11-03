import { getBuyNowFunctionalLayer, getFunctionalOptionLabel } from './pdpPricing'
import { getTatForPincode } from './testPincode'

/**
 * Checkout placeholders (Figma-first) — return types, addresses, delivery copy.
 * Price deltas are ratios applied inside computeOrder() from product MRP/base price.
 */

/** @typedef {'all_easy' | 'wrong_defect'} ReturnTypeId */

export const RETURN_TYPES = /** @type {const} */ ([
  {
    id: 'all_easy',
    badge: 'YES',
    label: 'All issue easy returns allowed',
    shortLabel: 'Easy returns',
    reviewLabel: 'All issue easy returns',
    /** No extra charge vs base discounted price */
    savingsRatio: 0,
  },
  {
    id: 'wrong_defect',
    badge: 'NO',
    label: 'Only wrong/defect item returns allowed',
    shortLabel: 'Wrong/defect only',
    reviewLabel: 'Only wrong/defect item returns',
    /** Save this fraction of MRP when choosing limited returns */
    savingsRatio: 0.05,
  },
])

export function getReturnTypeById(id) {
  return RETURN_TYPES.find((r) => r.id === id) ?? RETURN_TYPES[0]
}

/** True when size/volume is required and a valid in-stock option is selected. */
export function isBuyNowSizeSelectionValid(functionalLayer, selectedOptions, oosOptionIds) {
  if (!functionalLayer) return true
  const optionId = selectedOptions[functionalLayer.axis_id]
  if (!optionId) return false
  return !oosOptionIds?.has(optionId)
}

/** Payload passed via router state into all review/payment variants. */
export function buildCheckoutState(
  product,
  layers,
  selectedOptions,
  returnTypeId = 'all_easy',
  functionalLayer = null,
) {
  const layer = functionalLayer ?? getBuyNowFunctionalLayer(layers ?? product?.vsku?.layers ?? [])
  const sizeOptionId = layer ? selectedOptions[layer.axis_id] : null
  const sizeLabel = layer
    ? layer.options?.find((o) => o.option_id === sizeOptionId)?.label
    : getFunctionalOptionLabel(layers ?? product?.vsku?.layers ?? [], selectedOptions)
  const returnType = getReturnTypeById(returnTypeId)
  return {
    selectedOptions,
    returnTypeId: returnType.id,
    sizeLabel: sizeLabel ?? null,
    returnTypeLabel: returnType.reviewLabel ?? returnType.shortLabel ?? null,
  }
}

/** Placeholder saved addresses — labelled per plan until real data exists. */
export const PLACEHOLDER_ADDRESSES = [
  {
    id: 'home',
    label: 'Home',
    name: 'Rahul Mishra',
    phone: '9182736612',
    line: 'B404, SJR Complex, Bazaar Samiti Rd, Area 59, adkc Bangalore',
    city: 'Bangalore',
    pin: '110059',
  },
  {
    id: 'work',
    label: 'Work',
    name: 'Priya Sharma',
    phone: '9988776655',
    line: 'WeWork Embassy, Outer Ring Rd, Bellandur',
    city: 'Bengaluru',
    pin: '560103',
  },
  {
    id: 'mom',
    label: 'Mom',
    name: 'Lakshmi Devi',
    phone: '9123456789',
    line: '12, MG Road, Jayanagar 4th Block',
    city: 'Bengaluru',
    pin: '560041',
  },
]

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDeliveryDate(date) {
  return `${DAY_NAMES[date.getDay()]}, ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`
}

/** Stable 5–7 day offset from pin so different addresses differ slightly. */
function deliveryDaysForPin(pin) {
  const digits = String(pin ?? '').replace(/\D/g, '')
  if (!digits) return 6
  let hash = 0
  for (let i = 0; i < digits.length; i += 1) {
    hash = (hash * 31 + digits.charCodeAt(i)) >>> 0
  }
  return 5 + (hash % 3)
}

/**
 * Delivery ETA copy — 5–7 calendar days from today, formatted like Figma ("Monday, 6 Jul").
 * @param {string | number | null | undefined} pin
 * @param {Date} [now]
 */
export function getDeliveryEtaDateForPin(pin, now = new Date()) {
  /* User-testing pincodes: EDD pinned to 1 Sep 2026 for the post-UT round,
     so every variant, eyebrow, and calendar tile reads off the same date. */
  const tat = getTatForPincode(String(pin ?? ''))
  if (tat != null) return new Date(2026, 8, 1, 12, 0, 0, 0)
  const eta = new Date(now)
  eta.setHours(12, 0, 0, 0)
  eta.setDate(eta.getDate() + deliveryDaysForPin(pin))
  return eta
}

export function getDeliveryEtaForPin(pin, now = new Date()) {
  return formatDeliveryDate(getDeliveryEtaDateForPin(pin, now))
}
