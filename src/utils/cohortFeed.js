import { getCohortById, MIN_COHORT_PRODUCTS } from '../constants/cohortNavigation'
import { applyHomeFeedShowcasePins, buildMixedFeedProducts } from './homeFeedOrder'

/** Session-stable feeds — order does not change when leaving Home for PDP. */
let mixedFeedCache = null
/** @type {Map<string, object[]>} */
const cohortFeedCache = new Map()

/**
 * Stable-expand a product pool to at least minSize by cycling (for scroll-depth testing).
 * @param {object[]} products
 * @param {number} minSize
 */
export function expandToMinProducts(products, minSize = MIN_COHORT_PRODUCTS) {
  if (!products?.length) return []
  if (products.length >= minSize) return [...products]
  const out = [...products]
  let i = 0
  while (out.length < minSize) {
    out.push(products[i % products.length])
    i += 1
  }
  return out
}

/**
 * @param {object[]} allProducts
 * @param {string} cohortId
 */
export function filterProductsForCohort(allProducts, cohortId) {
  const cohort = getCohortById(cohortId)
  if (!cohort) return []
  const allowed = new Set(cohort.categoryIds)
  return allProducts
    .filter((p) => allowed.has(p.categoryId))
    .sort((a, b) => String(a.product_id).localeCompare(String(b.product_id)))
}

/** Default mixed feed — seeded shuffle interleave, cached for the session. */
export function buildMixedFeed(allProducts) {
  if (mixedFeedCache) return mixedFeedCache
  mixedFeedCache = buildMixedFeedProducts(allProducts).map((product, index) => ({
    ...product,
    _feedKey: `${product.product_id}-${index}`,
  }))
  return mixedFeedCache
}

/**
 * Build feed for one cohort variant — filtered, expanded to 50+, stable keys for grid.
 * @param {object[]} allProducts
 * @param {string} cohortId
 */
export function buildCohortFeed(allProducts, cohortId) {
  if (cohortFeedCache.has(cohortId)) return cohortFeedCache.get(cohortId)

  let list = filterProductsForCohort(allProducts, cohortId)
  list = expandToMinProducts(list, MIN_COHORT_PRODUCTS)

  if (cohortId === 'fashion-shirts') {
    list = applyHomeFeedShowcasePins(list)
  }

  const feed = list.map((product, index) => ({
    ...product,
    _feedKey: `${product.product_id}-${index}`,
  }))
  cohortFeedCache.set(cohortId, feed)
  return feed
}

/**
 * @param {object[]} allProducts
 * @param {string | null} cohortId
 */
export function buildHomeFeed(allProducts, cohortId) {
  if (cohortId == null) return buildMixedFeed(allProducts)
  return buildCohortFeed(allProducts, cohortId)
}

/**
 * @param {object[]} allProducts
 * @param {string} cohortId
 */
export function getCohortProductStats(allProducts, cohortId) {
  const unique = filterProductsForCohort(allProducts, cohortId)
  const feed = buildCohortFeed(allProducts, cohortId)
  return {
    uniqueCount: unique.length,
    feedCount: feed.length,
  }
}
