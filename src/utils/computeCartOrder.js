import { getProductById } from '../data/products'
import { getHeroImageForProduct } from '../data/categoryProductImages'
import { computeOrder } from './computeOrder'
import { getReturnTypeById } from './checkoutConfig'

const MONEY = ['mrp', 'basePrice', 'productDiscount', 'returnSavings', 'orderTotal', 'totalDiscount']

/**
 * The cart as one order, the same shape computeOrder returns for a single product, so the
 * review (DeliveryTypeReview), payment (PaymentOrder) and success steps work on it unchanged.
 * Money fields are each line's computeOrder × qty, summed; the percentage and labels are
 * recomputed on the totals. Pickup savings and payment-option prices are NOT applied here:
 * they round and have minimums, so apply them once to this total (applyDeliveryType,
 * computePaymentOptions), never per item.
 *
 * Extra fields: `lines` (one per cart line: key, productId, product, selectedOptions,
 * sizeLabel, returnTypeId, returnTypeLabel, qty, image, unit = per-unit order, order = line
 * order), `itemCount` (lines) and `qtyTotal` (units).
 *
 * @param {Array<{key, productId, selectedOptions?, returnTypeId?, sizeLabel?, returnTypeLabel?, qty?}>} items
 */
export function computeCartOrder(items = []) {
  const lines = []
  items.forEach((it) => {
    const product = getProductById(it.productId)
    if (!product) return
    const unit = computeOrder(product, it.selectedOptions || {}, it.returnTypeId || 'all_easy')
    const qty = Math.max(1, it.qty || 1)
    const order = { ...unit }
    MONEY.forEach((k) => {
      order[k] = unit[k] * qty
    })
    lines.push({
      key: it.key,
      productId: it.productId,
      product,
      selectedOptions: it.selectedOptions || {},
      sizeLabel: it.sizeLabel ?? null,
      returnTypeId: unit.returnTypeId,
      returnTypeLabel: it.returnTypeLabel ?? unit.returnTypeLabel,
      qty,
      image: getHeroImageForProduct(product) || product.hero_image_url || null,
      unit,
      order,
    })
  })

  const total = {}
  MONEY.forEach((k) => {
    total[k] = lines.reduce((sum, l) => sum + l.order[k], 0)
  })
  const returnIds = [...new Set(lines.map((l) => l.returnTypeId))]
  const returnType = getReturnTypeById(returnIds.length === 1 ? returnIds[0] : 'all_easy')
  const { totalDiscount, mrp } = total

  return {
    ...total,
    returnTypeId: returnType.id,
    returnTypeLabel: returnIds.length === 1 ? (returnType.reviewLabel ?? returnType.shortLabel) : null,
    discountPercent: mrp > 0 ? Math.round((totalDiscount / mrp) * 100) : 0,
    savingsLabel: totalDiscount > 0 ? `₹${totalDiscount} discount applied` : null,
    youSaveLabel: totalDiscount > 0 ? `You'll save ₹${totalDiscount}` : null,
    lines,
    itemCount: lines.length,
    qtyTotal: lines.reduce((n, l) => n + l.qty, 0),
  }
}
