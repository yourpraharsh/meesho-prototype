import { getReturnTypeById } from './checkoutConfig'
import {
  getPlpCardData,
  getPriceConsiderationLabel,
  PLP_DEMO_PROFILE_COUNT,
  SHOW_PLP_UPI_PRIMARY_TAG,
} from './plpCardData'

/** Stable PLP profile index for a product outside the feed grid. */
export function getPlpIndexForProduct(product) {
  const key = String(product?.product_id ?? product?.productId ?? product?.id ?? 0)
  let hash = 0
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  return hash % PLP_DEMO_PROFILE_COUNT
}

function distributeByWeight(total, segments) {
  if (total <= 0 || !segments.length) return []
  const totalWeight = segments.reduce((sum, seg) => sum + seg.weight, 0)
  let allocated = 0

  return segments
    .map((seg, index) => {
      let amount
      if (index === segments.length - 1) {
        amount = total - allocated
      } else {
        amount = Math.round((total * seg.weight) / totalWeight)
        allocated += amount
      }
      return { ...seg, amount: Math.max(0, amount) }
    })
    .filter((line) => line.amount > 0)
}

/**
 * Break order discount into PLP-aligned marker rows for the review price breakdown.
 * @param {object} product
 * @param {ReturnType<typeof import('./computeOrder').computeOrder>} order
 */
export function buildOrderDiscountLines(product, order) {
  if (!product || !order || order.totalDiscount <= 0) return []

  const flavour = getPlpCardData(product, getPlpIndexForProduct(product))
  const lines = []

  if (order.returnSavings > 0) {
    const returnType = getReturnTypeById(order.returnTypeId)
    lines.push({
      id: 'return-offer',
      marker: 'return_offer',
      amount: order.returnSavings,
      label: returnType.reviewLabel ?? returnType.shortLabel,
    })
  }

  const productDiscount = order.productDiscount ?? 0
  if (productDiscount <= 0) return lines

  /** @type {{ id: string, marker: string, weight: number, flavour?: object }[]} */
  const segments = []

  if (SHOW_PLP_UPI_PRIMARY_TAG && flavour.primaryPriceTag === 'upi') {
    segments.push({ id: 'upi', marker: 'upi', weight: 3, flavour })
  } else if (flavour.primaryPriceTag === 'sale') {
    segments.push({ id: 'sale', marker: 'sale', weight: 3, flavour })
  } else if (flavour.primaryPriceTag === 'combo_offer') {
    segments.push({ id: 'combo', marker: 'combo_offer', weight: 3, flavour })
  }

  if (flavour.dealTimer) {
    segments.push({ id: 'deal-timer', marker: 'deal_timer', weight: 2, flavour })
  }

  if (flavour.priceConsiderationTag) {
    segments.push({
      id: `consideration-${flavour.priceConsiderationTag}`,
      marker: flavour.priceConsiderationTag,
      weight: 1,
      flavour,
      label: getPriceConsiderationLabel(flavour),
    })
  }

  if (!segments.length) {
    lines.push({
      id: 'sale-fallback',
      marker: 'sale',
      amount: productDiscount,
      flavour: { primaryPriceTag: 'sale', saleAmountOff: productDiscount },
    })
    return lines
  }

  for (const seg of distributeByWeight(productDiscount, segments)) {
    lines.push({
      id: seg.id,
      marker: seg.marker,
      amount: seg.amount,
      flavour: seg.flavour,
      label: seg.label ?? null,
    })
  }

  return lines
}
