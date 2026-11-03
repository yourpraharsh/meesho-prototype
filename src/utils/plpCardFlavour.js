import { supportsComboOffer } from './plpCardAttributes'
import { resolveRatingCount } from './plpCardData'
import { SHOW_PLP_UPI_PRIMARY_TAG } from './plpCardData'

/** @typedef {'optimized' | 'normal' | 'gentle' | 'strong' | 'refresh' | 'floor' | 'floor-deals' | 'floor-tags' | 'tile-layers'} PlpCardVariantId */

/** @typedef {'combo' | 'upi' | 'gst'} PriceExtraSlot */
/** @typedef {'trusted' | 'gold'} QualityMarkerSlot */

const SIMPLIFY_CARD_VARIANTS = new Set(['floor', 'floor-deals', 'floor-tags', 'tile-layers'])

const TILE_BODY_VARIANTS = new Set(['floor-deals', 'floor-tags'])

const FLOOR_BODY_VARIANTS = new Set(['tile-layers'])

/** Price row: floor + one extra — mutually exclusive extras. */
const PRICE_EXTRA_SLOTS = SHOW_PLP_UPI_PRIMARY_TAG ? ['combo', 'upi', 'gst'] : ['combo', 'gst']

/** Quality row: floor (rating) + one marker — mutually exclusive markers. */
const QUALITY_MARKER_SLOTS = ['trusted', 'gold']

export function isOptimizedVariant(variantId) {
  return variantId === 'optimized'
}

export function isUniformGridVariant(variantId) {
  return SIMPLIFY_CARD_VARIANTS.has(variantId)
}

export function isSimplifyCardVariant(variantId) {
  return SIMPLIFY_CARD_VARIANTS.has(variantId)
}

/** @deprecated alias */
export function isSimplifyFloorVariant(variantId) {
  return isSimplifyCardVariant(variantId)
}

export function isTileBodyVariant(variantId) {
  return TILE_BODY_VARIANTS.has(variantId)
}

/** V07 — same content as V04 floor, on tile body instead of image. */
export function isFloorBodyVariant(variantId) {
  return FLOOR_BODY_VARIANTS.has(variantId)
}

/** V06 only — rating floor + trusted / gold markers (not on V05 deals). */
export function hasQualityLayer(variantId) {
  return variantId === 'floor-tags'
}

export function isStaggerVariant(variantId) {
  return (
    variantId === 'optimized' ||
    variantId === 'gentle' ||
    variantId === 'strong' ||
    variantId === 'refresh'
  )
}

/**
 * Price layer — floor (final + MRP + % off) + exactly ONE extra slot (combo | UPI | GST).
 */
export function getPriceLayer(product, globalIndex) {
  const ps = product.price_summary ?? {}
  const finalPrice = ps.price
  let extraSlot = PRICE_EXTRA_SLOTS[globalIndex % PRICE_EXTRA_SLOTS.length]
  if (extraSlot === 'combo' && !supportsComboOffer(product)) {
    const start = globalIndex % PRICE_EXTRA_SLOTS.length
    extraSlot =
      PRICE_EXTRA_SLOTS.slice(start + 1).find((slot) => slot !== 'combo') ??
      PRICE_EXTRA_SLOTS.find((slot) => slot !== 'combo') ??
      'gst'
  }

  return {
    finalPrice,
    mrp: ps.mrp ?? null,
    discountPercent: ps.discount_percent ?? null,
    extraSlot,
    gstDropLabel: 'GST price drop',
  }
}

/**
 * Quality layer — floor (rating + count) + exactly ONE marker (trusted | gold).
 */
export function getQualityLayer(product, globalIndex) {
  const markerSlot = QUALITY_MARKER_SLOTS[globalIndex % QUALITY_MARKER_SLOTS.length]

  return {
    rating: product.rating?.value ?? 0,
    ratingCount: resolveRatingCount(product, globalIndex),
    markerSlot,
  }
}

export function showDealTimer(variantId, globalIndex) {
  return variantId === 'floor-tags' && globalIndex % 3 === 1
}
