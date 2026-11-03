/**
 * Uses images from assets category JSON (mens, kitchen_utility) for product cards and PDP.
 * Prefer: (1) product.hero_image_url, (2) productIdToHeroUrl map, (3) curated, (4) category JSON.
 * For realistic user testing: set hero_image_url on each product in productsData.js, or add
 * product_id → URL entries below so each card shows the correct image.
 */
import categoryProductImages from './categoryProductImages.json'
import { getCuratedHeroForProduct, getCuratedCategoryImageList } from './curatedProductImages'

/** product_id → hero image URL. Overrides category/curated so each product can have the correct image for testing. */
export const productIdToHeroUrl = {
  'WB-10291': 'https://images.meesho.com/images/products/4128468/1.jpg', // Water Bottle – matches title
  // Add one URL per product_id for realistic testing, e.g. 'KU-77810': 'https://...kurti.jpg'
}

const jsonProductsByCategory = (categoryProductImages.products || []).reduce((acc, p) => {
  const c = (p.category || '').toLowerCase().trim()
  if (!c) return acc
  if (!acc[c]) acc[c] = []
  if (p.images?.hero) acc[c].push({ id: p.id, hero: p.images.hero, gallery: p.images.gallery || [], category: c })
  return acc
}, {})

/** Curated water_bottle product id – exclude from kitchen_utility when app category is Bedsheets/Diaper so they don't show bottle */
const CURATED_WATER_BOTTLE_IDS = new Set(['4128468'])

/** App categories that must not use cross-category pools (no matching image set) – show placeholder so title and image don't mismatch */
const NO_MATCH_CATEGORIES = new Set(['Kurti', 'Lipstick', 'Diaper'])

/** Mens product IDs whose hero image is not apparel (e.g. size chart) – exclude when picking for Shirts/Shoes/Men */
const MENS_BLOCKED_IDS = new Set([])

/** All hero images from category JSON – used as fallback so every product gets an image */
const allHeroImages = (categoryProductImages.products || [])
  .map((p) => p.images?.hero)
  .filter(Boolean)

/** Map app product category (from productsData) to JSON category key – cover all products so every card has an image */
const APP_CATEGORY_TO_JSON = {
  'Men Shirt': 'mens',
  'Men': 'mens',
  'Shirts': 'mens',
  'Shoes': 'mens',
  'Water Bottle': 'kitchen_utility',
  'Bedsheet': 'kitchen_utility',
  'Bedsheets': 'kitchen_utility',
  'Kitchen': 'kitchen_utility',
  'Kurti': 'mens',
  'Lipstick': 'mens',
  'Diaper': 'kitchen_utility',
}

function hashProductId(id) {
  let h = 0
  const s = String(id)
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

/** Filter category list so image matches product type (exclude bottles for Bedsheets/Diaper, exclude non-apparel for mens). */
function getCategoryListForProduct(product, list, jsonCategory) {
  if (!list?.length) return []
  const appCat = (product?.category || '').toLowerCase()
  if (appCat.includes('bedsheet')) {
    const filtered = list.filter((item) => !CURATED_WATER_BOTTLE_IDS.has(String(item.id)))
    return filtered.length > 0 ? filtered : list
  }
  if (jsonCategory === 'mens') {
    const filtered = list.filter((item) => !MENS_BLOCKED_IDS.has(String(item.id)))
    return filtered.length > 0 ? filtered : list
  }
  return list
}

/**
 * Returns hero image URL: prefers product.hero_image_url, then productIdToHeroUrl, then curated, then category JSON.
 */
export function getHeroImageForProduct(product) {
  if (product?.hero_image_url) return product.hero_image_url
  const direct = product?.product_id && productIdToHeroUrl[product.product_id]
  if (direct) return direct
  const curated = getCuratedHeroForProduct(product)
  if (curated) return curated
  if (NO_MATCH_CATEGORIES.has(product?.category)) return null
  const jsonCategory = product?.category && APP_CATEGORY_TO_JSON[product.category]
  if (jsonCategory) {
    const list = getCategoryListForProduct(product, jsonProductsByCategory[jsonCategory], jsonCategory)
    if (list?.length) {
      const index = hashProductId(product.product_id || '') % list.length
      const hero = list[index].hero
      if (hero) return hero
    }
  }
  if (allHeroImages.length > 0) {
    const index = hashProductId(product?.product_id || '') % allHeroImages.length
    return allHeroImages[index]
  }
  return null
}

/**
 * Returns gallery image URLs from category JSON if product's category is mapped; else null.
 * Kurti, Lipstick, Diaper return null (no matching pool).
 */
export function getGalleryForProduct(product) {
  if (!product?.category) return null
  if (NO_MATCH_CATEGORIES.has(product.category)) return null
  const jsonCategory = APP_CATEGORY_TO_JSON[product.category]
  if (!jsonCategory) return null
  const list = getCategoryListForProduct(product, jsonProductsByCategory[jsonCategory], jsonCategory)
  if (!list?.length) return null
  const index = hashProductId(product.product_id || '') % list.length
  const gallery = list[index].gallery
  return Array.isArray(gallery) && gallery.length > 0 ? gallery : null
}

/**
 * Returns array of images (hero + gallery) for the product's category – 2–3+ as colours.
 * Kurti, Lipstick, Diaper return [] (no matching pool).
 */
export function getCategoryImageList(product) {
  const curated = getCuratedCategoryImageList(product)
  if (curated.length > 0) return curated
  if (NO_MATCH_CATEGORIES.has(product?.category)) return []
  const jsonCategory = product?.category && APP_CATEGORY_TO_JSON[product.category]
  if (jsonCategory) {
    const list = getCategoryListForProduct(product, jsonProductsByCategory[jsonCategory], jsonCategory)
    if (list?.length) {
      const sameCategoryOnly = list.filter((item) => item.category === jsonCategory)
      const heroes = sameCategoryOnly.map((item) => item.hero).filter(Boolean)
      const galleries = sameCategoryOnly.flatMap((item) => item.gallery || []).filter(Boolean)
      if (heroes.length || galleries.length) return [...heroes, ...galleries]
    }
  }
  return allHeroImages.length > 0 ? [...allHeroImages] : []
}
