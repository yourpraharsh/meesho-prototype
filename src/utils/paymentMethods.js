/**
 * Payment method pricing — derived from computeOrder() totals only.
 * COD is the default for all users until a cod/prepaid user list is wired in.
 */

/** @typedef {'cod' | 'pay_online' | 'pay_later' | 'ask_friends'} PaymentMethodId */

export const PAYMENT_METHOD_IDS = /** @type {const} */ ([
  'cod',
  'pay_later',
  'pay_online',
  'ask_friends',
])

/** Primary method cards shown per user cohort on V3 inline review (Figma 1766:17278 / 1766:17386). */
export function getPaymentMethodIdsForCohort(cohort) {
  if (cohort === 'prepaid') {
    return /** @type {const} */ (['cod', 'pay_online', 'pay_later'])
  }
  return /** @type {const} */ (['cod', 'ask_friends'])
}

/** Online discount vs COD reference (ratio of order total, min ₹25). */
const ONLINE_DISCOUNT_RATIO = 0.05
const ONLINE_DISCOUNT_MIN = 25

/** Pay Later extra savings vs online price — stronger for prepaid users. */
const PAY_LATER_EXTRA_RATIO = 0.03
const PAY_LATER_PREPAID_RATIO = 0.167

/** Prepaid pay-later anchor vs COD payable (Figma ~510 vs ₹499). */
const PAY_LATER_PREPAID_COMPARE_FACTOR = 1.022

function onlineDiscountAmount(orderTotal) {
  return Math.max(ONLINE_DISCOUNT_MIN, Math.round(orderTotal * ONLINE_DISCOUNT_RATIO))
}

/**
 * @param {ReturnType<typeof import('./computeOrder').computeOrder>} order
 * @param {import('./userPaymentProfile').UserPaymentCohort} [cohort]
 */
export function computePaymentOptions(order, cohort = 'cod') {
  const base = order.orderTotal
  const onlineSave = onlineDiscountAmount(base)
  const codPayable = base + onlineSave
  const payOnline = base
  const payLaterRatio = cohort === 'prepaid' ? PAY_LATER_PREPAID_RATIO : PAY_LATER_EXTRA_RATIO
  const payLater = Math.max(0, Math.round(base * (1 - payLaterRatio)))
  const payLaterCompareAt =
    cohort === 'prepaid' ? Math.round(codPayable * PAY_LATER_PREPAID_COMPARE_FACTOR) : codPayable
  const askFriends = base

  return {
    cod: {
      id: 'cod',
      label: 'Cash on Delivery',
      payable: codPayable,
      compareAt: null,
      savingsVsCod: 0,
      bankOffers: false,
      showQr: false,
      showFlag: false,
    },
    pay_online: {
      id: 'pay_online',
      label: 'Pay Online',
      payable: payOnline,
      compareAt: codPayable,
      savingsVsCod: onlineSave,
      bankOffers: true,
      showQr: false,
      showFlag: true,
    },
    pay_later: {
      id: 'pay_later',
      label: 'Meesho Pay Later',
      payable: payLater,
      compareAt: payLaterCompareAt,
      savingsVsCod: payLaterCompareAt - payLater,
      bankOffers: false,
      showQr: false,
      showFlag: false,
      payByDate: '18th Jan',
    },
    ask_friends: {
      id: 'ask_friends',
      label: 'Ask Friends to Pay',
      payable: askFriends,
      compareAt: codPayable,
      savingsVsCod: onlineSave,
      bankOffers: false,
      showQr: true,
      showFlag: false,
    },
  }
}

/** Order-level offer copy for payment step banner. */
export function getOrderOfferLabel(order) {
  if (!order?.totalDiscount || order.totalDiscount <= 0) return null
  return `₹${order.totalDiscount} OFF on this order`
}

/** Last-used + accordion rows — prices derived from pay_online option. */
export function buildExtendedPaymentRows(paymentOptions) {
  const online = paymentOptions.pay_online
  const basePayable = online.payable
  const baseSave = online.savingsVsCod
  const offerChip = baseSave > 0 ? `₹${Math.min(baseSave, 25)} OFF` : null

  return {
    lastUsed: [
      { id: 'last_gpay', label: 'Google Pay', brand: 'gpay', payable: basePayable, savings: baseSave, offerText: offerChip },
      { id: 'last_axis', label: 'Axis Bank Card', brand: 'axis', payable: basePayable, savings: baseSave, offerText: offerChip },
      { id: 'last_phonepe', label: 'PhonePe', brand: 'phonepe', payable: basePayable, savings: baseSave, offerText: offerChip },
    ],
    upiApps: [
      { id: 'upi_phonepe', label: 'PhonePe', brand: 'phonepe', payable: basePayable },
      { id: 'upi_paytm', label: 'Paytm', brand: 'paytm', payable: basePayable },
      { id: 'upi_amazon', label: 'Amazon Pay', brand: 'amazon', payable: basePayable },
    ],
    cards: [
      { id: 'card_visa', label: 'Visa', brand: 'visa', payable: basePayable },
      { id: 'card_master', label: 'Mastercard', brand: 'master', payable: basePayable },
    ],
  }
}

/** Resolve payable for any payment selection key. */
export function getPayableForSelection(paymentOptions, selectionId) {
  if (paymentOptions[selectionId]) return paymentOptions[selectionId].payable
  const extended = buildExtendedPaymentRows(paymentOptions)
  const all = [...extended.lastUsed, ...extended.upiApps, ...extended.cards]
  return all.find((r) => r.id === selectionId)?.payable ?? paymentOptions.cod.payable
}

/** True when selection is a last-used / UPI / card row (not a primary method card). */
export function isExtendedPaymentSelection(methodId, extendedRows) {
  const all = [...extendedRows.lastUsed, ...extendedRows.upiApps, ...extendedRows.cards]
  return all.some((row) => row.id === methodId)
}

/** V4 unified checkout — Pay Online card alone is not enough; pick an instrument. */
export function canPlaceOrderOnUnifiedCheckout(methodId, extendedRows) {
  if (methodId === 'pay_online') return false
  if (PAYMENT_METHOD_IDS.includes(methodId)) return true
  return isExtendedPaymentSelection(methodId, extendedRows)
}

/** CTA label for extended selection ids. */
export function getPaymentCtaLabel(methodId) {
  if (methodId === 'cod' || methodId === 'ask_friends') return 'Place Order'
  return 'Proceed To Payment'
}

/** V3 review → dedicated payment step when online / pay-later is selected. */
export function shouldNavigateToPaymentStep(methodId) {
  return getPaymentCtaLabel(methodId) === 'Proceed To Payment'
}

/** V4 unified checkout — always Place Order. */
export function getUnifiedCheckoutCtaLabel() {
  return 'Place Order'
}

/** @param {string} methodId */
export function getSelectedPayable(paymentOptions, methodId) {
  return getPayableForSelection(paymentOptions, methodId)
}
