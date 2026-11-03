/**
 * PDP section helpers — sold-by, product details (from PLP chips), NDD carousel.
 */

import {
  pickAttributeLabels,
  inferPackFromProduct,
  attributeIsFabric,
  attributeIsVolume,
} from './plpCardAttributes'

const SELLER_NAMES = [
  'Sahil Sellers',
  'Style Hub',
  'Urban Mart',
  'Meesho Mall Partner',
  'Fashion Lane',
  'Home Essentials Co',
  'Beauty Bazaar',
  'Footwear World',
  'Kitchen Hub',
  'Baby Care Plus',
  'Ethnic Wear Studio',
  'Trendy Traders',
]

function seedFromId(id, salt = 0) {
  let h = salt >>> 0
  const s = String(id ?? '')
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function pickFromPool(pool, id, offset = 0) {
  if (!pool?.length) return pool[0]
  return pool[(seedFromId(id, offset) + offset) % pool.length]
}

/** Stable index for PLP attribute pickers on PDP. */
export function productDetailGlobalIndex(productId) {
  return seedFromId(productId, 0)
}

/** Deterministic sold-by row — stable per product. */
export function getSoldByInfo(product) {
  if (product?.supplier?.name) {
    return {
      name: product.supplier.name,
      rating: Math.min(4.9, Number(product.supplier.rating ?? 4)),
      reviewCount: product.supplier.reviewCount ?? 1200,
      initial: String(product.supplier.name).charAt(0).toUpperCase(),
    }
  }
  const id = product?.product_id ?? product?.productId ?? '0'
  const name = pickFromPool(SELLER_NAMES, id, 3)
  const s = seedFromId(id, 7)
  const rating = Math.min(4.9, Math.round((3.2 + (s % 17) / 10) * 10) / 10)
  const reviewCount = 800 + (s % 48000)
  return {
    name,
    rating,
    reviewCount,
    initial: name.charAt(0).toUpperCase(),
  }
}

const PACK_LABEL_RE = /\bpack of \d+/i
const SIZE_LABELS = new Set(['S', 'M', 'L', 'XL', 'XXL', 'Small', 'Medium', 'Large', 'Newborn', 'Pants', 'Single', 'Double', 'Queen', 'King'])
const FINISH_LABELS = new Set(['Matte', 'Long Stay', 'Velvet', 'Non-Transfer', 'Liquid', 'Crayon'])

function specKeyForAttribute(label) {
  const t = String(label ?? '').trim()
  if (!t) return 'Detail'
  if (attributeIsFabric(t)) return 'Fabric'
  if (attributeIsVolume(t)) return 'Capacity'
  if (PACK_LABEL_RE.test(t)) return 'Pack Size'
  if (SIZE_LABELS.has(t)) return 'Size'
  if (FINISH_LABELS.has(t)) return 'Finish'
  if (/insulated|bpa/i.test(t)) return 'Feature'
  if (/aluminium|steel|non-stick|induction|canvas|leather|mesh|synthetic/i.test(t)) return 'Material'
  if (/regular|slim|a-line|printed|casual/i.test(t)) return 'Style'
  return 'Type'
}

/** Two product-detail rows from PLP attribute chip data. */
export function getProductDetailRows(product, globalIndex = 0) {
  if (product?.specs?.length >= 2) {
    return product.specs.slice(0, 2).map((s) => ({ key: s.key, value: s.value }))
  }

  const pack = inferPackFromProduct(product)
  const attrs = pickAttributeLabels(product, 2, globalIndex, pack)
  if (!attrs.length) return []

  const rows = []
  const usedKeys = new Set()
  for (const label of attrs) {
    let key = specKeyForAttribute(label)
    if (usedKeys.has(key)) key = 'Detail'
    usedKeys.add(key)
    rows.push({ key, value: label })
    if (rows.length >= 2) break
  }
  return rows
}

/** NDD — “More options” horizontal carousel (deterministic per product). */
export function getNddCarouselVariants(product, { heroImg, displayPrice, ratingValue, ratingCount }) {
  const img = heroImg || ''
  const basePrice = Math.round(displayPrice) || 0
  const baseRating = ratingValue || 4
  const baseCount = ratingCount ?? 0

  let s = seedFromId(product?.product_id, 13) || 1
  const next = () => {
    s = (s * 1103515245 + 12345) >>> 0
    return (s % 65536) / 65536
  }
  const rand = (min, max) => min + next() * (max - min)
  const randPrice = () => Math.round(basePrice * rand(0.92, 1.08))
  const randRating = () => Math.min(4.9, Math.round(baseRating * rand(0.96, 1.04) * 10) / 10)
  const randCount = () => Math.max(0, Math.round(baseCount * rand(0.85, 1.15)))

  const formatCount = (n) => {
    if (n >= 10000) return `${Math.round(n / 1000)}K`
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`
    return String(n)
  }

  return [
    { image: img, price: basePrice, rating: baseRating, reviewCount: formatCount(randCount()) },
    { image: img, price: randPrice(), rating: randRating(), reviewCount: formatCount(randCount()) },
    { image: img, price: randPrice(), rating: randRating(), reviewCount: formatCount(randCount()) },
    { image: img, price: randPrice(), rating: randRating(), reviewCount: formatCount(randCount()) },
  ]
}

/** First multi-option functional layer used for NDD size context. */
function getNddSizeLayer(product) {
  const sizeLayers =
    product?.vsku?.layers?.filter((l) => l.layer_type === 'FUNCTIONAL' || l.layer_type === 'VALUE') ?? []
  return sizeLayers.find((l) => (l.options?.length ?? 0) > 1) ?? sizeLayers[0] ?? null
}

/**
 * Selected size option, or a stable per-product default when none is chosen yet.
 */
export function getNddDefaultSizeOption(product, selectedOptions, oosOptionIds) {
  const layer = getNddSizeLayer(product)
  if (!layer?.options?.length) return null

  const selectedId = selectedOptions[layer.axis_id]
  if (selectedId) {
    return layer.options.find((o) => o.option_id === selectedId) ?? null
  }

  const oos = oosOptionIds instanceof Set ? oosOptionIds : new Set()
  const available = layer.options.filter((o) => !oos.has(o.option_id))
  const pool = available.length > 0 ? available : layer.options
  const idx = seedFromId(product?.product_id ?? product?.productId, 29) % pool.length
  return pool[idx] ?? null
}

export function getNddSizeLabel(product, selectedOptions, oosOptionIds) {
  return getNddDefaultSizeOption(product, selectedOptions, oosOptionIds)?.label ?? null
}

/** Options merged with default size for NDD pricing when user has not picked a size yet. */
export function getNddEffectiveOptions(product, selectedOptions, oosOptionIds) {
  const layer = getNddSizeLayer(product)
  if (!layer || selectedOptions[layer.axis_id]) return selectedOptions
  const defaultOpt = getNddDefaultSizeOption(product, selectedOptions, oosOptionIds)
  if (!defaultOpt) return selectedOptions
  return { ...selectedOptions, [layer.axis_id]: defaultOpt.option_id }
}
