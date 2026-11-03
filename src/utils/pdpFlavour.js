import { getPlpCardData } from './plpCardData'
import { getPlpIndexForProduct } from './orderDiscountLines'
import { productDetailGlobalIndex } from './pdpSections'

/** Stable “was” price for PDP price-drop pill — slightly above current, below MRP. */
function derivePriceDropFrom(product, displayPrice, displayMrp) {
  const price = Math.round(displayPrice)
  if (!Number.isFinite(price) || price <= 0) return null

  const id = String(product?.product_id ?? product?.productId ?? 0)
  let h = 0
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0
  const bump = 5 + (h % 12)
  let from = price + bump

  if (displayMrp != null && Number.isFinite(displayMrp)) {
    const mrp = Math.round(displayMrp)
    if (from >= mrp) from = Math.max(price + 1, mrp - 1)
  }

  return from > price ? from : null
}

/** The COD price shown next to an online price (cards and PDP use the same rule). */
export function deriveCodPayable(displayPrice) {
  const base = Math.round(displayPrice)
  if (!Number.isFinite(base) || base <= 0) return null
  const onlineSave = Math.max(25, Math.round(base * 0.05))
  return base + onlineSave
}

/**
 * PLP card flavour adapted for PDP — VSKU-resolved prices + PDP-only price-drop pill amount.
 */
export function getPdpFlavour(product, { displayPrice, displayMrp, discountPercent, plpIndex } = {}) {
  const globalIndex =
    plpIndex != null
      ? plpIndex
      : getPlpIndexForProduct(product) ?? productDetailGlobalIndex(product?.product_id ?? product?.productId)
  const flavour = getPlpCardData(product, globalIndex)

  const price = Math.round(displayPrice) || flavour.price
  const mrp = displayMrp != null ? Math.round(displayMrp) : flavour.mrp
  const discountPct =
    discountPercent ??
    flavour.discountPct ??
    (mrp && price ? Math.round(((mrp - price) / mrp) * 100) : null)
  const saleAmountOff = mrp != null && price != null ? Math.max(mrp - price, 0) : flavour.saleAmountOff

  const priceDropFrom =
    flavour.priceConsiderationTag === 'price_drop'
      ? derivePriceDropFrom(product, price, mrp)
      : null

  return {
    ...flavour,
    globalIndex,
    price,
    mrp,
    discountPct,
    saleAmountOff,
    codPayable: deriveCodPayable(price),
    priceDropFrom,
  }
}

export function getPdpDealTimerPrefix(flavour) {
  if (flavour.primaryPriceTag === 'combo_offer') return 'Combo Offer Ends in'
  if (flavour.primaryPriceTag === 'sale') return 'Sale Ends in'
  return 'Daily Deals End in'
}
