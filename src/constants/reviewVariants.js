/** Review UX variant per catalog category (user-test routing). */

export const REVIEW_VARIANT = {
  CLARITY: 1,
  CHECK_ADDRESS: 2,
  PAYMENT_INLINE: 3,
  PAYMENT_STEP: 4,
}

const VARIANT_BY_CATEGORY = {
  women_kurti: REVIEW_VARIANT.CLARITY,
  mens_shirts: REVIEW_VARIANT.CLARITY,
  beauty_lipstick: REVIEW_VARIANT.CLARITY,
  beauty_shampoo: REVIEW_VARIANT.CLARITY,
  beauty_hair_oil: REVIEW_VARIANT.CLARITY,
  baby_diaper: REVIEW_VARIANT.CLARITY,
  women_saree: REVIEW_VARIANT.CHECK_ADDRESS,
  mens_shoes: REVIEW_VARIANT.CHECK_ADDRESS,
  lod_top_bottom_sets: REVIEW_VARIANT.PAYMENT_INLINE,
  women_top_bottom_sets: REVIEW_VARIANT.PAYMENT_INLINE,
  home_bedsheets: REVIEW_VARIANT.PAYMENT_INLINE,
  kitchen_cooker: REVIEW_VARIANT.PAYMENT_INLINE,
  kitchen_cooker_volume: REVIEW_VARIANT.PAYMENT_INLINE,
  kitchen_water_bottle: REVIEW_VARIANT.PAYMENT_STEP,
}

export function getReviewVariantForCategory(categoryId) {
  return VARIANT_BY_CATEGORY[categoryId] ?? REVIEW_VARIANT.CLARITY
}

export function getReviewVariantTitle(variant) {
  if (variant === REVIEW_VARIANT.CHECK_ADDRESS) return 'CHECK ADDRESS'
  if (variant === REVIEW_VARIANT.PAYMENT_INLINE) return 'REVIEW ORDER'
  if (variant === REVIEW_VARIANT.PAYMENT_STEP) return 'REVIEW ORDER'
  return 'REVIEW ORDER'
}
