/**
 * User payment cohort — stub until cod/prepaid user list is provided.
 * Override for QA: `?cohort=prepaid` or `?cohort=cod` on review/payment routes.
 */

/** @typedef {'cod' | 'prepaid'} UserPaymentCohort */

/** Categories that use prepaid payment UX (online = PLP/PDP price; pay later cheaper; COD costlier). */
export const PREPAID_PAYMENT_CATEGORY_IDS = /** @type {const} */ (['home_bedsheets'])

/**
 * @param {string | null | undefined} [override]
 * @param {string | null | undefined} [categoryId]
 * @returns {UserPaymentCohort}
 */
export function getUserPaymentCohort(override, categoryId) {
  if (override === 'prepaid' || override === 'cod') return override
  if (categoryId && PREPAID_PAYMENT_CATEGORY_IDS.includes(categoryId)) return 'prepaid'
  return 'cod'
}

/**
 * @param {UserPaymentCohort} cohort
 * @returns {import('./paymentMethods').PaymentMethodId}
 */
export function getDefaultPaymentMethod(cohort = 'cod') {
  return cohort === 'prepaid' ? 'pay_online' : 'cod'
}
