export const PLP_VARIANT_STORAGE_KEY = 'plp-card-variant-v2'

/** @typedef {'optimized' | 'normal' | 'gentle' | 'strong' | 'refresh' | 'floor' | 'floor-deals' | 'floor-tags' | 'tile-layers'} PlpCardVariantId */

export const PLP_CARD_VARIANTS = [
  {
    id: 'optimized',
    labId: 'VD',
    name: 'Optimized (VD)',
    description:
      'New card — comprehension chips, price layers, quality, FAST, Buy Now. Gentle masonry stagger on Home.',
    figmaNode: '447:30030',
  },
  {
    id: 'normal',
    labId: null,
    name: 'Standard (legacy)',
    description: 'Pre-VD card — title, price row, rating (no secondary price line).',
  },
  {
    id: 'gentle',
    labId: 'V01',
    name: 'Gentle stagger',
    description: '2 image heights (~1.2×+). Anchors every 3rd card per column, offset L/R.',
  },
  {
    id: 'strong',
    labId: 'V02',
    name: 'Strong stagger',
    description: '3 image heights (~1.4×+). Anchors 0/7 per column; depth grows down feed.',
  },
  {
    id: 'refresh',
    labId: 'V03',
    name: 'Refresh',
    description: 'Gentle for products 0–19, then Strong from product 20 onward.',
  },
  {
    id: 'floor',
    labId: 'V04',
    name: 'Just floor (control)',
    description: 'Image + price & rating on image floor only (Figma simplify control).',
    figmaNode: '88:32110',
  },
  {
    id: 'floor-deals',
    labId: 'V05',
    name: 'Floor + deals row',
    description:
      'Image only on top. Price layer on tile: final, MRP, % off, and one deal slot (combo, UPI, or GST drop).',
    figmaNode: '88:38412',
  },
  {
    id: 'floor-tags',
    labId: 'V06',
    name: 'Floor + quality & tags',
    description:
      'Price layer on tile plus quality row (rating, count, trusted or gold). Optional deal timer on image.',
    figmaNode: '92:19175',
  },
  {
    id: 'tile-layers',
    labId: 'V07',
    name: 'Tile layers',
    description:
      'Clean image (wishlist only). Same content as V04 (price + rating) on the tile body — not on the image.',
  },
  { id: 'v08', labId: 'V08', name: 'Reserved', description: 'Coming soon.', disabled: true },
  { id: 'v09', labId: 'V09', name: 'Reserved', description: 'Coming soon.', disabled: true },
  { id: 'v10', labId: 'V10', name: 'Reserved', description: 'Coming soon.', disabled: true },
]

export const DEFAULT_PLP_CARD_VARIANT = 'optimized'

const VALID_IDS = new Set(PLP_CARD_VARIANTS.filter((v) => !v.disabled).map((v) => v.id))

export function isValidPlpCardVariant(id) {
  return VALID_IDS.has(id)
}
