import { isSimplifyFloorVariant, isStaggerVariant } from './plpCardFlavour'

/** @typedef {'normal' | 'gentle' | 'strong' | 'refresh' | 'floor' | 'floor-deals' | 'floor-tags'} PlpCardVariantId */
/** @typedef {'left' | 'right'} MasonryColumn */

/**
 * Anchor tiers use column-local index + phase offset so left/right never
 * re-sync to the same visual row (Pinterest-style offset keeps growing).
 * @returns {'standard' | 'gentle-anchor' | 'strong-medium' | 'strong-anchor'}
 */
export function getPlpImageHeightTier(columnIndex, column, globalIndex, variantId) {
  if (columnIndex < 0 || !isStaggerVariant(variantId)) return 'standard'
  // Optimized VD card — image is always 1:1; stagger comes from tile content only.
  if (variantId === 'optimized') return 'standard'

  const rhythm =
    variantId === 'refresh'
      ? globalIndex < 20
        ? 'gentle'
        : 'strong'
      : variantId

  if (rhythm === 'gentle') {
    // Left: slots 0,3,6… in column · Right: 1,4,7… (phase +1) — never paired row sync
    const phase = column === 'left' ? 0 : 1
    return (columnIndex + phase) % 3 === 0 ? 'gentle-anchor' : 'standard'
  }

  if (rhythm === 'strong') {
    const pos = column === 'left' ? columnIndex % 8 : (columnIndex + 4) % 8
    if (pos === 0 || pos === 7) return 'strong-anchor'
    if (pos === 4) return 'strong-medium'
    return 'standard'
  }

  return 'standard'
}

const TIER_CLASS = {
  standard: '',
  'gentle-anchor': 'product-card-image-wrap--gentle-anchor',
  'strong-medium': 'product-card-image-wrap--strong-medium',
  'strong-anchor': 'product-card-image-wrap--strong-anchor',
}

export function getPlpImageWrapClassName(columnIndex, column, globalIndex, variantId) {
  const tier = getPlpImageHeightTier(columnIndex, column, globalIndex, variantId)
  return TIER_CLASS[tier] || ''
}

/** Depth grows anchor height down each column so stagger exceeds rather than resets. */
export function getPlpStaggerDepthStyle(columnIndex, column, globalIndex, variantId) {
  const tier = getPlpImageHeightTier(columnIndex, column, globalIndex, variantId)
  if (tier === 'standard') return undefined
  return { '--stagger-depth': String(columnIndex) }
}
