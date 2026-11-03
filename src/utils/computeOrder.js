import { getReturnTypeById } from './checkoutConfig'
import { resolveDisplayMrp, resolveDisplayPrice } from './pdpPricing'

/**
 * Single pricing source for review + payment flows.
 * @param {object} product
 * @param {Record<string, string>} selectedOptions
 * @param {string} returnTypeId
 */
export function computeOrder(product, selectedOptions, returnTypeId = 'all_easy') {
  const basePrice = Math.round(resolveDisplayPrice(product, selectedOptions) || 0)
  const mrp = Math.round(resolveDisplayMrp(product, selectedOptions) || basePrice)
  const returnType = getReturnTypeById(returnTypeId)

  const productDiscount = Math.max(0, mrp - basePrice)
  const returnSavings =
    returnType.savingsRatio > 0 ? Math.round(mrp * returnType.savingsRatio) : 0
  const orderTotal = Math.max(0, basePrice - returnSavings)
  const totalDiscount = Math.max(0, mrp - orderTotal)
  const discountPercent = mrp > 0 ? Math.round((totalDiscount / mrp) * 100) : 0

  return {
    mrp,
    basePrice,
    productDiscount,
    returnSavings,
    returnTypeId: returnType.id,
    returnTypeLabel: returnType.reviewLabel ?? returnType.shortLabel,
    orderTotal,
    totalDiscount,
    discountPercent,
    savingsLabel: totalDiscount > 0 ? `₹${totalDiscount} discount applied` : null,
    youSaveLabel: totalDiscount > 0 ? `You'll save ₹${totalDiscount}` : null,
  }
}
