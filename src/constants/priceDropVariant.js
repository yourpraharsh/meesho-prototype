export const PRICE_DROP_VARIANT_STORAGE_KEY = 'price-drop-variant-v2'

/** @typedef {'auto' | 'inline' | 'badge'} PriceDropVariantId */

/** Controls how Price-Drop cards render across the feed. */
export const PRICE_DROP_VARIANTS = [
  {
    id: 'auto',
    labId: 'Mix',
    name: 'Banded mix (default)',
    description: 'Alternates in blocks so any one viewport shows a single treatment, never both mixed.',
    figmaNode: null,
  },
  {
    id: 'inline',
    labId: 'PD-A',
    name: 'Inline pill only',
    description: 'Compact “Price Drop” pill on the price row for every price-drop card (no mixing).',
    figmaNode: null,
  },
  {
    id: 'badge',
    labId: 'PD-B',
    name: 'Own-row badge only',
    description: 'Prominent “Price Drop ↘” badge on its own row for every price-drop card (no mixing).',
    figmaNode: null,
  },
]

export const DEFAULT_PRICE_DROP_VARIANT = 'auto'

const VALID_IDS = new Set(PRICE_DROP_VARIANTS.map((v) => v.id))

export function isValidPriceDropVariant(id) {
  return VALID_IDS.has(id)
}
