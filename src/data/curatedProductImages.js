/**
 * Curated images JSON from assets – each image as product reference;
 * 2–3 images per product as colours (hero + gallery). Match by full product name/category.
 */
import curatedProductImages from './curatedProductImages.json'

const curatedProducts = curatedProductImages.products || []

/** All images (hero + gallery) per category/subCategory key */
const curatedImagesByKey = curatedProducts.reduce((acc, p) => {
  const cat = (p.category || '').toLowerCase().trim()
  const sub = (p.subCategory || '').toLowerCase().trim()
  if (!cat) return acc
  const key = sub ? `${cat}|${sub}` : cat
  if (!acc[key]) acc[key] = []
  if (p.images?.hero) acc[key].push(p.images.hero)
  const gallery = p.images?.gallery
  if (Array.isArray(gallery)) gallery.forEach((url) => { if (url) acc[key].push(url) })
  return acc
}, {})

/**
 * Resolve app product to curated (category|subCategory) only when product type matches.
 * Ensures image and product card match: e.g. bedsheet never gets water_bottle image.
 */
function resolveCuratedKey(product) {
  if (!product) return null
  const cat = (product.category || '').toLowerCase()
  const title = (product.title || '').toLowerCase()

  if (cat.includes('water') || cat.includes('bottle') || title.includes('water') || title.includes('bottle')) {
    return 'kitchen_utility|water_bottle'
  }
  if (cat.includes('shirt') || title.includes('shirt')) {
    return 'mens|shirts'
  }
  if (cat.includes('shoe') || title.includes('shoe')) {
    return 'mens|shoes'
  }
  if (cat === 'men' || cat === 'mens') {
    return 'mens|shirts'
  }
  /* Bedsheets, Diaper, Kurti, Lipstick: no matching curated key – do not map to water_bottle or shirts */
  return null
}

function hashProductId(id) {
  let h = 0
  const s = String(id)
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

/**
 * Hero image from curated JSON when product name/category matches; else null.
 */
export function getCuratedHeroForProduct(product) {
  const key = resolveCuratedKey(product)
  if (!key) return null
  const list = curatedImagesByKey[key]
  if (!list?.length) return null
  const index = hashProductId(product.product_id || '') % list.length
  return list[index] || null
}

/**
 * All images (hero + gallery) for product's category from curated – 2–3+ as colours for thumbs/also viewed.
 * Same category only.
 */
export function getCuratedCategoryImageList(product) {
  const key = resolveCuratedKey(product)
  if (!key) return []
  const list = curatedImagesByKey[key]
  if (!list?.length) return []
  return [...list]
}
