import { buildExtendedPaymentRows, getPayableForSelection } from './paymentMethods'

/**
 * @typedef {'cod' | 'online' | 'pay_later' | 'ask_friends'} OrderSuccessVariant
 * @typedef {'grand' | 'standard' | 'minimal'} OrderSuccessCelebrationTier
 * @typedef {{
 *   variant: OrderSuccessVariant,
 *   celebrationTier: OrderSuccessCelebrationTier,
 *   totalDiscount: number,
 *   paymentSavings: number,
 *   discountAmount: number,
 *   payable: number,
 *   paymentMethodLabel: string,
 *   paymentSubtitle: string,
 *   heroMessage: string | null,
 *   showSavingsHero: boolean,
 * }} OrderSuccessPayload
 */

/** @param {string} methodId @param {ReturnType<typeof import('./paymentMethods').computePaymentOptions>} paymentOptions */
function resolvePaymentMethodLabel(methodId, paymentOptions) {
  if (paymentOptions[methodId]?.label) return paymentOptions[methodId].label
  const extended = buildExtendedPaymentRows(paymentOptions)
  const all = [...extended.lastUsed, ...extended.upiApps, ...extended.cards]
  return all.find((row) => row.id === methodId)?.label ?? 'Pay Online'
}

/**
 * @param {number} discountAmount
 * @param {number} paymentSavings
 * @returns {OrderSuccessCelebrationTier}
 */
function resolveCelebrationTier(discountAmount, paymentSavings) {
  if (discountAmount >= 80 || paymentSavings >= 40) return 'grand'
  if (discountAmount > 0) return 'standard'
  return 'minimal'
}

/**
 * Discount shown on success — mirrors review order summary.
 * COD: order-level discount only (MRP / return savings).
 * Online & others: order discount + extra savings vs COD.
 *
 * @param {string} paymentMethodId
 * @param {ReturnType<typeof import('./paymentMethods').computePaymentOptions>} paymentOptions
 * @param {ReturnType<import('./computeOrder').computeOrder>} order
 * @returns {OrderSuccessPayload | null}
 */
export function buildOrderSuccessPayload(paymentMethodId, paymentOptions, order) {
  if (!paymentOptions || !paymentMethodId || !order) return null

  const payable = getPayableForSelection(paymentOptions, paymentMethodId)
  const codPayable = paymentOptions.cod.payable
  const totalDiscount = order.totalDiscount ?? 0
  const paymentSavings = Math.max(0, codPayable - payable)
  const discountAmount = totalDiscount + paymentSavings
  const paymentMethodLabel = resolvePaymentMethodLabel(paymentMethodId, paymentOptions)
  const celebrationTier = resolveCelebrationTier(discountAmount, paymentSavings)
  const showSavingsHero = discountAmount > 0

  let variant = /** @type {OrderSuccessVariant} */ ('online')
  let paymentSubtitle = `Paid ₹${payable} via ${paymentMethodLabel}`
  let heroMessage = `Payment of ₹${payable} received`

  if (paymentMethodId === 'cod') {
    variant = 'cod'
    paymentSubtitle = `Pay ₹${payable} on delivery`
    heroMessage = showSavingsHero ? null : `Pay ₹${payable} when your order arrives`
  } else if (paymentMethodId === 'ask_friends') {
    variant = 'ask_friends'
    paymentSubtitle = `₹${payable} · Ask Friends to Pay`
    heroMessage = showSavingsHero
      ? null
      : `Share the payment link — friends pay ₹${payable}`
  } else if (paymentMethodId === 'pay_later') {
    variant = 'pay_later'
    paymentSubtitle = `Pay ₹${payable} · Meesho Pay Later`
    heroMessage = showSavingsHero ? null : `Pay ₹${payable} before the due date`
  } else if (paymentOptions[paymentMethodId]) {
    paymentSubtitle = `Paid ₹${payable} via ${paymentMethodLabel}`
    heroMessage = showSavingsHero ? null : `Paid ₹${payable} via ${paymentMethodLabel}`
  } else {
    paymentSubtitle = `Paid ₹${payable} via ${paymentMethodLabel}`
    heroMessage = showSavingsHero ? null : `Paid ₹${payable} via ${paymentMethodLabel}`
  }

  return {
    variant,
    celebrationTier,
    totalDiscount,
    paymentSavings,
    discountAmount,
    payable,
    paymentMethodLabel,
    paymentSubtitle,
    heroMessage,
    showSavingsHero,
  }
}

/** @param {import('react-router-dom').NavigateFunction} navigate */
export function goToOrderSuccess(navigate, { paymentMethodId, paymentOptions, order }, options = {}) {
  const state = buildOrderSuccessPayload(paymentMethodId, paymentOptions, order)
  if (!state) return Promise.resolve(false)

  const delayMs = options.delayMs ?? 200

  return new Promise((resolve) => {
    window.setTimeout(() => {
      navigate('/order/success', { replace: true, state })
      resolve(true)
    }, delayMs)
  })
}
