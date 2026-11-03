/** URL params for cohort user-test navigation. */
export const COHORT_PARAM = 'cohort'
export const COHORT_TAG_PARAM = 'tag'

/** Minimum PLP products per cohort variant (user-test scroll depth). */
export const MIN_COHORT_PRODUCTS = 50

/** No cohort param — interleaved mixed feed; no nav chip selected. */
export const MIXED_COHORT_ID = null

/** @typedef {'speed' | 'price' | 'quality' | 'fast' | 'buy-now'} CohortTagId */

/** @typedef {{ id: string, label: string, categoryIds: string[], tags: CohortTagId[] | null, description?: string }} CohortDef */

/** @typedef {{ id: CohortTagId, label: string }} CohortTagDef */

export const COHORT_TAGS = /** @type {Record<CohortTagId, CohortTagDef>} */ ({
  speed: { id: 'speed', label: 'Speed related tags' },
  price: { id: 'price', label: 'Price related tags' },
  quality: { id: 'quality', label: 'Quality related tags' },
  fast: { id: 'fast', label: 'Fast tags' },
  'buy-now': { id: 'buy-now', label: 'Buy Now' },
})

/**
 * Six user-test cohorts — each maps to one or more catalog categoryIds.
 * Pools smaller than 50 are expanded by stable cycling in cohortFeed.js.
 */
export const COHORTS = /** @type {CohortDef[]} */ ([
  {
    id: 'fashion-kurti',
    label: 'Fashion - Kurti',
    categoryIds: ['women_kurti'],
    tags: null,
  },
  {
    id: 'fashion-shirts',
    label: 'Fashion - Shirts',
    categoryIds: ['mens_shirts'],
    tags: null,
  },
  {
    id: 'western-tags',
    label: 'WESTERN wear With tags',
    categoryIds: ['lod_top_bottom_sets'],
    tags: null,
  },
  {
    id: 'shoes-tags',
    label: 'Shoes with tags',
    categoryIds: ['mens_shoes'],
    tags: null,
  },
  {
    id: 'fmcg-mall',
    label: 'Diapers, shampoo - Mall & non Mall',
    categoryIds: ['baby_diaper', 'beauty_lipstick'],
    tags: null,
    description: 'FMCG — Mall-eligible beauty + diapers',
  },
  {
    id: 'home-decor',
    label: 'Home Decor - bottles & cookers',
    categoryIds: [
      'kitchen_water_bottle',
      'kitchen_cooker',
      'kitchen_cooker_volume',
    ],
    tags: null,
    description: 'Bottles and cookers grouped as Home Decor',
  },
])

const COHORT_BY_ID = new Map(COHORTS.map((c) => [c.id, c]))

/** Old cohort URLs still resolve after renames. */
export const LEGACY_COHORT_ALIASES = /** @type {Record<string, string>} */ ({
  electronics: 'home-decor',
})

export function resolveCohortId(raw) {
  if (!raw) return null
  const id = LEGACY_COHORT_ALIASES[raw] ?? raw
  return isValidCohortId(id) ? id : null
}

export function isValidCohortId(id) {
  return COHORT_BY_ID.has(id)
}

export function isMixedCohort(id) {
  return id == null
}

export function getCohortById(id) {
  if (isMixedCohort(id)) return null
  return COHORT_BY_ID.get(id) ?? null
}

export function isValidCohortTag(tagId, cohort) {
  if (!tagId || !cohort?.tags?.length) return false
  return cohort.tags.includes(tagId)
}
