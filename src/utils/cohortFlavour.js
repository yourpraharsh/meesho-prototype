/**
 * Cohort flavour options — maps feeds to DEMO_PROFILES indices in plpCardData.js.
 */

/** @typedef {import('../constants/cohortNavigation.js').CohortTagId} CohortTagId */

const TAGGED_COHORT_IDS = new Set(['western-tags', 'shoes-tags'])

/** FMCG cohort — mix clean retail with occasional mall / fast slots. */
export const FMCG_MALL_PROFILE_INDICES = [0, 1, 4, 7, 8, 3, 11, 17, 19, 12, 2, 16, 24]

/** Plain retail — no price / quality / deal consideration signals. */
const TAGGED_COHORT_BASELINE = [0, 1, 3, 7, 16, 24, 25]

/** One signal per card — price OR quality OR deal, not stacked pairs. */
const TAGGED_COHORT_CONSIDERATION = [
  17, // price_drop
  19, // gold
  21, // less_returned
  22, // top_quality
  4, // mall + m_trusted
  11, // sale
  13, // deal timer
  2, // baseline + fast
  12, // sale + fast
  18, // price_drop + fast
  20, // m_trusted + fast
]

/** ~45% of shoes / western cards show a consideration signal (stable per product + index). */
const TAGGED_CONSIDERATION_RATE = 0.45

function seedFromKey(id, salt = 0) {
  let h = salt >>> 0
  const s = String(id ?? '')
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

/**
 * Pseudo-random profile pick for shoes & western — varied tags, stable across reloads.
 * @param {object} product
 * @param {number} globalIndex
 * @returns {number}
 */
export function pickTaggedCategoryProfileIndex(product, globalIndex = 0) {
  const key = product?.product_id ?? product?.productId ?? globalIndex
  const roll = (seedFromKey(key, globalIndex * 17 + 3) % 1000) / 1000
  const pick = seedFromKey(key, globalIndex * 31 + 11)

  if (roll < TAGGED_CONSIDERATION_RATE) {
    return TAGGED_COHORT_CONSIDERATION[pick % TAGGED_COHORT_CONSIDERATION.length]
  }
  return TAGGED_COHORT_BASELINE[pick % TAGGED_COHORT_BASELINE.length]
}

/**
 * @param {string | null | undefined} cohortId
 * @param {CohortTagId | null | undefined} _tagId
 * @returns {{ profileIndices?: number[] }}
 */
export function getCohortFlavourOptions(cohortId, _tagId) {
  if (cohortId === 'fmcg-mall') {
    return { profileIndices: FMCG_MALL_PROFILE_INDICES }
  }
  return {}
}
