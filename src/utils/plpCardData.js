/**
 * Synthesized PLP card flavour for the optimized (VD) card structure.
 * Cycles demo profiles by globalIndex so the Home feed showcases every variant.
 */

import {
  pickAttributeLabels,
  pickPackLabel,
  pickFabricLabel,
  pickVolumeAttributeLabel,
  getAttributeGroup,
  attributeIsFabric,
  attributeIsVolume,
  needsVolumeAttribute,
  supportsComboOffer,
  supportsPackChip,
  inferPackFromProduct,
  isMensShirtComboProduct,
  isDiaperProduct,
  inferDiaperPackLabel,
} from './plpCardAttributes'
import { pickTaggedCategoryProfileIndex } from './cohortFlavour'

const TAGGED_CATEGORY_IDS = new Set(['mens_shoes', 'lod_top_bottom_sets'])

/** Hide UPI primary price tag on PLP/PDP (temporary). */
export const SHOW_PLP_UPI_PRIMARY_TAG = false

/** @typedef {'new_arrival'} ConsiderationTag */
/** @typedef {'upi' | 'sale' | 'combo_offer'} PrimaryPriceTag */
/** @typedef {'price_drop' | 'less_today' | 'lowest_price_30d'} PriceConsiderationTag */
/**
 * One quality/trust slot. Existing: gold, m_trusted, less_returned, top_quality.
 * Appended (Bengaluru LoD): sold_recently, bought_this_week, image_reviews, geo_velocity.
 * @typedef {'gold' | 'm_trusted' | 'less_returned' | 'top_quality' | 'sold_recently' | 'bought_this_week' | 'image_reviews' | 'geo_velocity'} QualityTag
 */
/**
 * One selection slot, rendered as the leading chip in the comprehension/title row.
 * @typedef {'best_of_2026' | 'trending_bengaluru' | 'number_in_sscat' | 'bengaluru_trend'} SelectionTag
 */

/**
 * Organic quality/social-proof tags for the 2/10 quality grid (Gold / m-Trusted sit outside).
 * top_quality keeps its rating gating in applyConsiderationTagPolicy; the rest pass through.
 */
const QUALITY_CONSIDERATION_CYCLE = /** @type {const} */ ([
  'less_returned',
  'top_quality',
  'sold_recently',
  'bought_this_week',
  'image_reviews',
  'geo_velocity',
])

/** Selection tags surfaced organically on the ~3/10 selection grid. */
const SELECTION_TAG_CYCLE = /** @type {const} */ ([
  'best_of_2026',
  'trending_bengaluru',
  'number_in_sscat',
])

/** Ethnic / fashion catalogues get the local Bengaluru-trend selection tag. */
const TREND_CATEGORY_IDS = new Set([
  'women_saree',
  'women_kurti',
  'women_top_bottom_sets',
  'lod_top_bottom_sets',
])

const SSCAT_RANK_MIN = 3
const SSCAT_RANK_MAX = 18

/** Fast delivery row — 4 of every 10 cards (independent of consideration slots). */
const FAST_DELIVERY_SLOTS = new Set([0, 2, 4, 6])

function normalizePriceConsiderationTag(tag) {
  if (tag === 'less_today' || tag === 'lowest_price_30d') return 'price_drop'
  return tag ?? null
}

/** Hard rule: at most one of sale, combo offer, or price drop per card. Priority: Sale > Combo > Price Drop. */
function enforceExclusivePricePromo(primaryPriceTag, priceConsiderationTag) {
  const promoPrimary =
    primaryPriceTag === 'sale' || primaryPriceTag === 'combo_offer' ? primaryPriceTag : null
  const hasPriceDrop = priceConsiderationTag === 'price_drop'

  if (promoPrimary) {
    return {
      primaryPriceTag: promoPrimary,
      priceConsiderationTag: hasPriceDrop ? null : priceConsiderationTag,
    }
  }

  if (hasPriceDrop) {
    return {
      primaryPriceTag: primaryPriceTag === 'upi' ? 'upi' : null,
      priceConsiderationTag: 'price_drop',
    }
  }

  return { primaryPriceTag, priceConsiderationTag }
}

function hasExclusivePromoPrimaryTag(primaryPriceTag) {
  return primaryPriceTag === 'sale' || primaryPriceTag === 'combo_offer'
}

const TOP_QUALITY_MIN_RATING = 4.5
const TOP_QUALITY_MIN_COUNT = 20000
const RATING_COUNT_MIN = 29
const RATING_COUNT_MAX = 99999

/** Stable pseudo-random rating count — realistic spread from 29 to 99,999. */
export function resolveRatingCount(product, globalIndex = 0, { topQuality = false } = {}) {
  const key = product?.product_id ?? product?.productId ?? globalIndex
  const seed = seedFromKey(key, globalIndex * 23 + 11)

  if (topQuality) {
    const span = RATING_COUNT_MAX - TOP_QUALITY_MIN_COUNT + 1
    return TOP_QUALITY_MIN_COUNT + (seedFromKey(key, globalIndex * 37 + 3) % span)
  }

  const tier = seed % 100
  let count
  if (tier < 30) {
    count = RATING_COUNT_MIN + (seedFromKey(key, 1) % 271)
  } else if (tier < 55) {
    count = 300 + (seedFromKey(key, 2) % 2701)
  } else if (tier < 75) {
    count = 3001 + (seedFromKey(key, 3) % 6999)
  } else if (tier < 90) {
    count = 10000 + (seedFromKey(key, 4) % 9999)
  } else {
    count = TOP_QUALITY_MIN_COUNT + (seedFromKey(key, 5) % (RATING_COUNT_MAX - TOP_QUALITY_MIN_COUNT + 1))
  }

  return Math.min(RATING_COUNT_MAX, Math.max(RATING_COUNT_MIN, count))
}
const KEEP_RATE_MIN = 96
const KEEP_RATE_MAX = 99

/** Buy Now CTA — lipsticks & diapers only; ~2/3 visible per eligible category. */
const BUY_NOW_CATEGORY_IDS = new Set(['beauty_lipstick', 'baby_diaper'])
const BUY_NOW_VISIBILITY_NUMERATOR = 2
const BUY_NOW_VISIBILITY_DENOMINATOR = 3

function seedFromKey(id, salt = 0) {
  let h = salt >>> 0
  const s = String(id ?? '')
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

const PURCHASE_COUNT_MIN = 120
const PURCHASE_COUNT_MAX = 4800

/** Stable pseudo-random "X purchased" count for the purchase social-proof tag. */
export function resolvePurchaseCount(product, globalIndex = 0) {
  const key = product?.product_id ?? product?.productId ?? globalIndex
  const span = PURCHASE_COUNT_MAX - PURCHASE_COUNT_MIN + 1
  return PURCHASE_COUNT_MIN + (seedFromKey(key, globalIndex * 71 + 13) % span)
}

/** Compact count copy — 340 → "340", 1240 → "1.2K". */
export function formatPurchaseCount(count) {
  const n = Math.max(0, Math.round(Number(count ?? 0)))
  if (n >= 1000) {
    const k = n / 1000
    return `${k >= 10 ? Math.round(k) : k.toFixed(1)}K`
  }
  return String(n)
}

/** Stable keep-rate percent for less-returned tags — always > 95. */
export function getKeepRatePercent(product, globalIndex = 0) {
  const key = product?.product_id ?? product?.productId ?? globalIndex
  const span = KEEP_RATE_MAX - KEEP_RATE_MIN + 1
  return KEEP_RATE_MIN + (seedFromKey(key, globalIndex * 19 + 7) % span)
}

function normalizeKeepRatePercent(keepRatePercent) {
  return Math.max(KEEP_RATE_MIN, Math.round(Number(keepRatePercent ?? KEEP_RATE_MIN)))
}

/** PLP less-returned chip — short copy for narrow cards. */
export function formatPlpKeepRateLabel(keepRatePercent) {
  return `${normalizeKeepRatePercent(keepRatePercent)}% keep it`
}

/** PDP less-returned chip — fuller copy on product detail. */
export function formatPdpKeepRateLabel(keepRatePercent) {
  return `${normalizeKeepRatePercent(keepRatePercent)}% people keep it`
}

/** Stable per product — ~67% of lipstick/diaper cards show Buy Now; never on other categories. */
export function resolveShowBuyNow(product, globalIndex = 0) {
  const categoryId = product?.categoryId
  if (!categoryId || !BUY_NOW_CATEGORY_IDS.has(categoryId)) return false

  const key = product?.product_id ?? product?.productId ?? globalIndex
  const bucket = seedFromKey(key, globalIndex * 43 + 29) % BUY_NOW_VISIBILITY_DENOMINATOR
  return bucket < BUY_NOW_VISIBILITY_NUMERATOR
}

/**
 * Quality-heavy grid for the LoD validation: quality on 6/10 cards, price on 3/10
 * (slot 2 overlaps). Bumped up so reviewers see the new quality tags frequently.
 */
function getConsiderationSlotFlags(globalIndex) {
  const slot = globalIndex % 10
  if (slot === 0) return { showQuality: true, showPrice: false }
  if (slot === 1) return { showQuality: false, showPrice: true }
  if (slot === 2) return { showQuality: true, showPrice: true }
  if (slot === 3) return { showQuality: true, showPrice: false }
  if (slot === 4) return { showQuality: true, showPrice: false }
  if (slot === 5) return { showQuality: false, showPrice: true }
  if (slot === 6) return { showQuality: true, showPrice: false }
  if (slot === 7) return { showQuality: true, showPrice: false }
  return { showQuality: false, showPrice: false }
}

function pickQualityConsiderationTag(product, globalIndex) {
  const key = product?.product_id ?? product?.productId ?? globalIndex
  const pick = seedFromKey(key, globalIndex * 19 + 5) % QUALITY_CONSIDERATION_CYCLE.length
  return QUALITY_CONSIDERATION_CYCLE[pick]
}

/** Gold / m-Trusted — independent of the 2/10 consideration grid. */
function resolveQualityMarkerTag(product, globalIndex) {
  const key = product?.product_id ?? product?.productId ?? globalIndex
  const roll = seedFromKey(key, globalIndex * 47 + 13) % 10
  if (roll === 0 || roll === 1) return 'gold'
  if (roll === 2 || roll === 3) return 'm_trusted'
  return null
}

/** Stable rank (3–18) for the "#N in <sscat>" selection tag. */
function resolveSscatRank(product, globalIndex) {
  const key = product?.product_id ?? product?.productId ?? globalIndex
  const span = SSCAT_RANK_MAX - SSCAT_RANK_MIN + 1
  return SSCAT_RANK_MIN + (seedFromKey(key, globalIndex * 53 + 17) % span)
}

/**
 * One selection tag on ~3/10 cards. Ethnic/fashion catalogues → a named Bengaluru
 * trend; everything else cycles Best of 2026 / Top in Bengaluru / #N in sscat.
 * Independent of the quality grid; Gold/Mall/Fast sit outside it.
 */
function resolveSelectionTag(product, globalIndex) {
  const slot = globalIndex % 10
  if (slot !== 3 && slot !== 5 && slot !== 8) return null
  if (TREND_CATEGORY_IDS.has(product?.categoryId)) return 'bengaluru_trend'
  const key = product?.product_id ?? product?.productId ?? globalIndex
  const pick = seedFromKey(key, globalIndex * 61 + 9) % SELECTION_TAG_CYCLE.length
  return SELECTION_TAG_CYCLE[pick]
}

/**
 * Named, catalogue-matched fashion trends for the Bengaluru-trend selection tag —
 * real trend names (not a generic "trend" label). Picked stably per product.
 */
const TREND_NAMES_BY_CATEGORY = {
  women_kurti: ['Trendy prints', 'Chikankari', 'Anarkali fits', 'Pastel picks'],
  women_saree: ['Organza trend', 'Ruffle sarees', 'Pastel drapes', 'Trendy prints'],
  women_top_bottom_sets: ['Baggy co-ords', 'Cargo co-ords', 'Cord-set trend', 'Linen co-ords'],
  lod_top_bottom_sets: ['Baggy co-ords', 'Cargo co-ords', 'Cord-set trend', 'Linen co-ords'],
}
const TREND_NAMES_FALLBACK = ['Trendy prints', 'Street style', 'Pastel picks']

function pickTrendName(product, globalIndex) {
  const pool = TREND_NAMES_BY_CATEGORY[product?.categoryId] ?? TREND_NAMES_FALLBACK
  const key = product?.product_id ?? product?.productId ?? globalIndex
  return pool[seedFromKey(key, globalIndex * 29 + 3) % pool.length]
}

/** Mall chip — FMCG-eligible only; not limited by consideration slots. */
function resolveShowMall(product, globalIndex) {
  if (!isMallEligibleProduct(product)) return false
  const key = product?.product_id ?? product?.productId ?? globalIndex
  // Lower frequency — Mall shows on ~1 in 12 eligible (FMCG) cards.
  return seedFromKey(key, globalIndex * 59 + 21) % 12 === 0
}

/** One quality/trust slot — Gold > m-Trusted > consideration tags. */
function resolveQualityTag(qualityMarkerTag, qualityConsiderationTag) {
  if (qualityMarkerTag === 'gold') return 'gold'
  if (qualityMarkerTag === 'm_trusted') return 'm_trusted'
  return qualityConsiderationTag ?? null
}

/** Mall and Gold are mutually exclusive — never show both on one card. */
function resolveMallAndQualityTag({ isMall, qualityTag, qualityConsiderationTag }) {
  if (!isMall || qualityTag !== 'gold') {
    return { isMall, qualityTag }
  }
  return {
    isMall,
    qualityTag: qualityConsiderationTag ?? null,
  }
}

export function shouldShowFastDelivery(globalIndex) {
  return FAST_DELIVERY_SLOTS.has(globalIndex % 10)
}

/**
 * Consideration grid — 2/10 quality, 2/10 price, 1/10 overlap.
 * Gold, m-Trusted, Mall, Fast sit outside this grid.
 */
function applyConsiderationTagPolicy(product, globalIndex, { dealTimer, primaryPriceTag }) {
  const { showQuality, showPrice } = getConsiderationSlotFlags(globalIndex)

  let qualityConsiderationTag =
    showQuality && !dealTimer ? pickQualityConsiderationTag(product, globalIndex) : null
  let nextPriceConsideration =
    showPrice && !dealTimer && !hasExclusivePromoPrimaryTag(primaryPriceTag) && primaryPriceTag !== 'upi'
      ? 'price_drop'
      : null

  let ratingValue = Math.min(4.9, Number(product.rating?.value ?? 0))
  let ratingCountRaw = resolveRatingCount(product, globalIndex)

  if (qualityConsiderationTag === 'top_quality') {
    ratingCountRaw = resolveRatingCount(product, globalIndex, { topQuality: true })
    if (ratingValue < TOP_QUALITY_MIN_RATING || ratingCountRaw < TOP_QUALITY_MIN_COUNT) {
      ratingValue = Math.max(TOP_QUALITY_MIN_RATING, ratingValue)
      ratingCountRaw = Math.max(TOP_QUALITY_MIN_COUNT, ratingCountRaw)
    }
    if (ratingValue < TOP_QUALITY_MIN_RATING || ratingCountRaw < TOP_QUALITY_MIN_COUNT) {
      qualityConsiderationTag = 'less_returned'
    }
  }

  return {
    qualityConsiderationTag,
    priceConsiderationTag: normalizePriceConsiderationTag(nextPriceConsideration),
    ratingValue,
    ratingCountRaw,
  }
}

const SSCAT_BY_CATEGORY = {
  mens_shirts: 'Shirts',
  kitchen_water_bottle: 'Bottle',
  mens_shoes: 'Shoes',
  beauty_lipstick: 'Lipstick',
  beauty_shampoo: 'Shampoo',
  beauty_hair_oil: 'Hair Oil',
  baby_diaper: 'Diaper',
  women_kurti: 'Kurti',
  women_top_bottom_sets: 'Co-ord Set',
  lod_top_bottom_sets: 'Co-ord Set',
  women_saree: 'Saree',
  home_bedsheets: 'Bedsheet',
  kitchen_cooker: 'Cooker',
  kitchen_cooker_volume: 'Cooker',
}

const SSCAT_STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'bottom',
  'classic',
  'designer',
  'feminine',
  'for',
  'men',
  'mens',
  'pretty',
  'premium',
  'quality',
  'set',
  'sets',
  'stylish',
  'the',
  'top',
  'trendy',
  'with',
  'women',
  'womens',
])

const SSCAT_MAX_WORDS = 2
const SSCAT_MAX_CHARS = 14

/** Mall badge — FMCG / personal care only (not fashion apparel). */
const MALL_ELIGIBLE_CATEGORY_IDS = new Set([
  'beauty_lipstick',
  'beauty_shampoo',
  'beauty_hair_oil',
  'baby_diaper',
])

function isMallEligibleProduct(product) {
  const categoryId = product?.categoryId
  return categoryId != null && MALL_ELIGIBLE_CATEGORY_IDS.has(categoryId)
}

/** Left masonry column card [16] — curated Ad · Mall · Lipstick · Pack of 3 showcase. */
export const PLP_PACK_DEMO_GLOBAL_INDEX = 32

/** Row-2 shirts combo showcase — Pack of 2 + COMBO OFFER + deal timer (product 16896398). */
export const PLP_SHIRTS_COMBO_DEMO_GLOBAL_INDEX = 14

const PACK_DEMO_PROFILE = {
  isAd: true,
  isMall: true,
  sscat: true,
  pack: 'Pack of 3',
  attributeCount: 2,
  primaryPriceTag: null,
  qualityTag: null,
  showBuyNow: false,
}

const SHIRTS_COMBO_DEMO_PROFILE = {
  sscat: true,
  pack: 'Pack of 2',
  primaryPriceTag: 'combo_offer',
  dealTimer: true,
  qualityTag: null,
  showBuyNow: false,
}

/**
 * Demo profiles — each row is one full card flavour shown in the VD board.
 * `pack: true` and `attributeCount: N` resolve per SSCAT via plp-card-attributes.csv.
 */
const DEMO_PROFILES = [
  { sscat: true, primaryPriceTag: null, qualityTag: null, fastDelivery: null, showBuyNow: false },
  { considerationTags: ['new_arrival'], sscat: true, primaryPriceTag: null, qualityTag: null, showBuyNow: false },
  { sscat: true, primaryPriceTag: null, qualityTag: null, fastDelivery: true, showBuyNow: false },
  { isAd: true, sscat: true, primaryPriceTag: null, qualityTag: null, showBuyNow: false },
  { isMall: true, sscat: true, primaryPriceTag: null, qualityTag: 'm_trusted', showBuyNow: false },
  {
    isAd: true,
    isMall: true,
    sscat: true,
    pack: 'Pack of 3',
    attributeCount: 2,
    primaryPriceTag: null,
    qualityTag: null,
    fastDelivery: true,
    showBuyNow: false,
  },
  { isAd: true, sscat: true, primaryPriceTag: 'upi', qualityTag: null, fastDelivery: true, showBuyNow: false },
  { isMall: true, sscat: true, pack: true, primaryPriceTag: null, qualityTag: null, showBuyNow: false },
  {
    isMall: true,
    sscat: true,
    pack: true,
    attributeCount: 1,
    primaryPriceTag: null,
    qualityTag: null,
    fastDelivery: true,
    showBuyNow: false,
  },
  {
    isAd: true,
    isMall: true,
    sscat: true,
    pack: true,
    attributeCount: 2,
    considerationTags: ['new_arrival'],
    primaryPriceTag: 'upi',
    dealTimer: true,
    qualityTag: null,
    fastDelivery: true,
    showBuyNow: true,
  },
  { sscat: true, primaryPriceTag: 'upi', qualityTag: null, showBuyNow: false },
  { sscat: true, primaryPriceTag: 'sale', qualityTag: null, fastDelivery: true, showBuyNow: false },
  { sscat: true, pack: true, primaryPriceTag: 'combo_offer', qualityTag: null, showBuyNow: false },
  { sscat: true, primaryPriceTag: null, dealTimer: true, qualityTag: null, showBuyNow: false },
  { sscat: true, primaryPriceTag: 'sale', dealTimer: true, qualityTag: null, fastDelivery: true, showBuyNow: false },
  {
    sscat: true,
    pack: true,
    primaryPriceTag: 'combo_offer',
    dealTimer: true,
    qualityTag: null,
    showBuyNow: false,
  },
  {
    sscat: true,
    primaryPriceTag: 'upi',
    qualityTag: null,
    showBuyNow: false,
  },
  { sscat: true, primaryPriceTag: null, priceConsiderationTag: 'price_drop', qualityTag: null, showBuyNow: false },
  {
    sscat: true,
    primaryPriceTag: null,
    priceConsiderationTag: 'price_drop',
    qualityTag: null,
    fastDelivery: true,
    showBuyNow: false,
  },
  { sscat: true, primaryPriceTag: null, qualityTag: 'gold', showBuyNow: false },
  { sscat: true, primaryPriceTag: null, qualityTag: 'm_trusted', fastDelivery: true, showBuyNow: false },
  { sscat: true, primaryPriceTag: null, qualityTag: 'less_returned', showBuyNow: false },
  { sscat: true, primaryPriceTag: null, qualityTag: 'top_quality', fastDelivery: true, showBuyNow: false },
  {
    sscat: 'Bottle + Glass',
    primaryPriceTag: 'combo_offer',
    qualityTag: null,
    fastDelivery: true,
    showBuyNow: true,
  },
  { isAd: true, sscat: true, primaryPriceTag: 'upi', qualityTag: null, showBuyNow: false },
  { comprehensionNone: true, sscat: false, pack: false, attributeCount: 0, useLegacyTitle: false, primaryPriceTag: null, qualityTag: null, showBuyNow: false },
  // --- Bengaluru LoD selection tags (leading chip in title row) — indices 27–30 ---
  { selectionTag: 'best_of_2026', sscat: true, primaryPriceTag: null, qualityTag: null, showBuyNow: false },
  { selectionTag: 'trending_bengaluru', sscat: true, primaryPriceTag: null, qualityTag: null, showBuyNow: false },
  { selectionTag: 'number_in_sscat', sscat: true, primaryPriceTag: null, qualityTag: null, showBuyNow: false },
  { selectionTag: 'bengaluru_trend', sscat: true, primaryPriceTag: null, qualityTag: null, showBuyNow: false },
  // New tag relocated into the title chips (next to Mall) — index 31 ---
  { considerationTags: ['new_arrival'], isMall: true, sscat: true, selectionTag: null, primaryPriceTag: null, qualityTag: null, showBuyNow: false },
  // --- Appended quality tags — indices 32–35 ---
  { selectionTag: null, sscat: true, primaryPriceTag: null, qualityTag: 'sold_recently', showBuyNow: false },
  { selectionTag: null, sscat: true, primaryPriceTag: null, qualityTag: 'bought_this_week', fastDelivery: true, showBuyNow: false },
  { selectionTag: null, sscat: true, primaryPriceTag: null, qualityTag: 'image_reviews', showBuyNow: false },
  { selectionTag: null, sscat: true, primaryPriceTag: null, qualityTag: 'geo_velocity', showBuyNow: false },
]

/**
 * Interleaved profile cycle — baseline cards between showcase slots; avoids tag stacking.
 * Front-loaded (indices 27–35) so every Bengaluru-LoD tag surfaces on the first screen.
 */
const PLP_PROFILE_ROTATION = [
  27, 32, 1, 28, 33, 3, 29, 34, 12, 30, 35, 7, 31, 19, 2, 14,
  0, 16, 4, 13, 8, 21, 1, 15, 24, 3, 9, 22, 0, 20, 6, 25,
]

export const FAST_DELIVERY_PROFILE_INDICES = DEMO_PROFILES.reduce((acc, profile, index) => {
  if (profile.fastDelivery) acc.push(index)
  return acc
}, /** @type {number[]} */ ([]))

function getDefaultProfileIndex(globalIndex) {
  const rotated = PLP_PROFILE_ROTATION[globalIndex % PLP_PROFILE_ROTATION.length]
  return DEMO_PROFILES[rotated] != null ? rotated : 0
}

const TITLE_STOP_WORDS = new Set([
  ...[...SSCAT_STOP_WORDS].filter((w) => !['top', 'bottom', 'set', 'sets'].includes(w)),
  'partywear',
  'glamorous',
  'retro',
  'modern',
  'latest',
  'elegant',
  'graceful',
  'ravishing',
  'sensational',
  'fashionable',
  'comfy',
  'urbane',
  'classy',
  'fancy',
  'casual',
  'formal',
  'fabulous',
  'chic',
  'ethnic',
  'new',
  'wear',
  'fabric',
])

const TITLE_MAX_WORDS = 2
const TITLE_MAX_CHARS = 22

function shortenMeaningfulLabel(label, stopWords, maxWords, maxChars) {
  const raw = String(label ?? '').trim()
  if (!raw) return ''

  const words = raw.split(/[\s&/|,+-]+/).filter(Boolean)
  const meaningful = words.filter((w) => !stopWords.has(w.toLowerCase()))
  const picked = (meaningful.length ? meaningful : words).slice(0, maxWords)
  let result = picked
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')

  if (!result) return ''
  if (result.length > maxChars) {
    const first = picked[0] ?? words[0]
    result = first ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : ''
  }
  return result
}

function shortenSscatLabel(label) {
  const result = shortenMeaningfulLabel(label, SSCAT_STOP_WORDS, SSCAT_MAX_WORDS, SSCAT_MAX_CHARS)
  return result || 'Product'
}

function shortenTitleLabel(label) {
  return shortenMeaningfulLabel(label, TITLE_STOP_WORDS, TITLE_MAX_WORDS, TITLE_MAX_CHARS)
}

function getSscatLabel(product) {
  if (product.categoryId && SSCAT_BY_CATEGORY[product.categoryId]) {
    return SSCAT_BY_CATEGORY[product.categoryId]
  }
  if (product.sscat) return shortenSscatLabel(product.sscat)
  if (product.category) return shortenSscatLabel(product.category)
  return 'Product'
}

/** Demo profiles with hardcoded SSCAT strings only apply to matching catalog rows. */
function normalizeProfileForProduct(product, profile) {
  if (!profile) return DEMO_PROFILES[0]
  if (typeof profile.sscat !== 'string') return profile
  const demoSscat = profile.sscat.trim()
  if (demoSscat === 'Bottle + Glass' && product?.categoryId !== 'kitchen_water_bottle') {
    return {
      ...profile,
      sscat: true,
      primaryPriceTag: null,
      showBuyNow: false,
      fastDelivery: null,
    }
  }
  return profile
}

function resolveSscat(product, profile) {
  if (profile.comprehensionNone || profile.sscat === false) return null
  if (typeof profile.sscat === 'string') {
    const demoSscat = profile.sscat.trim()
    if (demoSscat === 'Bottle + Glass' && product?.categoryId === 'kitchen_water_bottle') {
      return demoSscat
    }
    return getSscatLabel(product)
  }
  return getSscatLabel(product)
}

function resolvePack(product, profile, globalIndex) {
  if (profile.pack === false && !isDiaperProduct(product)) return null
  const inferred = inferPackFromProduct(product)

  let pack = null
  if (profile.pack === true || typeof profile.pack === 'string') {
    if (!supportsPackChip(product)) pack = null
    else if (typeof profile.pack === 'string') pack = profile.pack
    else pack = inferred || pickPackLabel(product, globalIndex)
  } else {
    pack = inferred
  }

  if (isDiaperProduct(product) && !pack && supportsPackChip(product)) {
    pack = inferDiaperPackLabel(product, globalIndex) || pickPackLabel(product, globalIndex)
  }

  return pack
}

function resolveAttributes(product, profile, globalIndex, packLabel = null) {
  const isFashion = getAttributeGroup(product) === 'fashion'
  const needsVolume = needsVolumeAttribute(product)
  const count = profile.attributeCount ?? (profile.attributes?.length ?? 0)
  const effectiveCount = isFashion || needsVolume ? Math.max(count, 1) : count
  if (effectiveCount <= 0) return []

  let attrs = pickAttributeLabels(product, effectiveCount, globalIndex, packLabel)

  if (isFashion && !attrs.some(attributeIsFabric)) {
    const fabric = pickFabricLabel(product, globalIndex)
    if (fabric) {
      const rest = attrs.filter((label) => !labelsMatch(label, fabric))
      attrs = [fabric, ...rest].slice(0, effectiveCount)
    }
  }

  if (needsVolume && !attrs.some(attributeIsVolume)) {
    const volume = pickVolumeAttributeLabel(product, globalIndex)
    if (volume) {
      const rest = attrs.filter((label) => !labelsMatch(label, volume))
      attrs = [volume, ...rest].slice(0, effectiveCount)
    }
  }

  return attrs
}

export function formatRatingCount(count) {
  const n = Math.max(0, Math.round(Number(count ?? 0)))
  return String(n)
}

/**
 * @param {object} product
 * @param {number} globalIndex
 * @param {{ profileIndices?: number[] }} [options]
 */
export function getPlpCardData(product, globalIndex, options = {}) {
  const { profileIndices } = options
  const profileIndex = profileIndices?.length
    ? profileIndices[globalIndex % profileIndices.length]
    : TAGGED_CATEGORY_IDS.has(product?.categoryId)
      ? pickTaggedCategoryProfileIndex(product, globalIndex)
      : getDefaultProfileIndex(globalIndex)
  const baseProfile = DEMO_PROFILES[profileIndex] ?? DEMO_PROFILES[0]
  let profile =
    globalIndex === PLP_PACK_DEMO_GLOBAL_INDEX
      ? { ...baseProfile, ...PACK_DEMO_PROFILE }
      : globalIndex === PLP_SHIRTS_COMBO_DEMO_GLOBAL_INDEX
        ? { ...baseProfile, ...SHIRTS_COMBO_DEMO_PROFILE }
        : baseProfile
  profile = normalizeProfileForProduct(product, profile)
  const ps = product.price_summary ?? {}
  const price = ps.price ?? 0
  const mrp = ps.mrp ?? null
  const discountPct = ps.discount_percent ?? (mrp && price ? Math.round(((mrp - price) / mrp) * 100) : null)
  const saleAmountOff = mrp != null && price != null ? Math.max(mrp - price, 0) : null

  const sscat = resolveSscat(product, profile)
  let pack = resolvePack(product, profile, globalIndex)
  const attributes = resolveAttributes(product, profile, globalIndex, pack)

  let primaryPriceTag = profile.primaryPriceTag ?? null
  if (isDiaperProduct(product)) {
    pack = pack || inferDiaperPackLabel(product, globalIndex) || pickPackLabel(product, globalIndex)
  }
  // Combo offer removed from the proto — never surface it as a primary price tag.
  if (primaryPriceTag === 'combo_offer') {
    primaryPriceTag = null
  }
  if (!SHOW_PLP_UPI_PRIMARY_TAG && primaryPriceTag === 'upi') {
    primaryPriceTag = null
  }

  const dealTimer = profile.dealTimer ? true : null

  const tagPolicy = applyConsiderationTagPolicy(product, globalIndex, {
    dealTimer,
    primaryPriceTag,
  })
  const qualityMarkerTag = resolveQualityMarkerTag(product, globalIndex)
  const qualityConsiderationTag = tagPolicy.qualityConsiderationTag
  const qualityTag = resolveQualityTag(qualityMarkerTag, qualityConsiderationTag)
  const keepRatePercent =
    qualityTag === 'less_returned' ? getKeepRatePercent(product, globalIndex) : null

  let priceConsiderationTag =
    profile.priceConsiderationTag != null
      ? normalizePriceConsiderationTag(profile.priceConsiderationTag)
      : tagPolicy.priceConsiderationTag

  const exclusivePromo = enforceExclusivePricePromo(primaryPriceTag, priceConsiderationTag)
  primaryPriceTag = exclusivePromo.primaryPriceTag
  priceConsiderationTag = exclusivePromo.priceConsiderationTag

  // Price-Drop treatment alternates in index BANDS (blocks of 12) rather than
  // per-card, so a single viewport shows only one type — inline pill OR own-row
  // badge — never both mixed together.
  const PRICE_DROP_BAND = 50
  const priceDropInline =
    priceConsiderationTag === 'price_drop'
      ? Math.floor(globalIndex / PRICE_DROP_BAND) % 2 === 0
      : false

  const considerationTags = profile.considerationTags ?? []
  const hasNewTag = considerationTags.includes('new_arrival')
  let selectionTag =
    profile.selectionTag !== undefined ? profile.selectionTag : resolveSelectionTag(product, globalIndex)
  if (profile.comprehensionNone) selectionTag = null
  // "New" and a selection tag never co-exist on one card.
  if (hasNewTag) selectionTag = null
  const selectionRank = selectionTag === 'number_in_sscat' ? resolveSscatRank(product, globalIndex) : null
  const selectionTrendLabel =
    selectionTag === 'bengaluru_trend' ? pickTrendName(product, globalIndex) : null

  // No Mall chip on fashion/apparel — Mall stays FMCG-only.
  const isFashion = getAttributeGroup(product) === 'fashion'
  const isMall = !isFashion && (Boolean(profile.isMall) || resolveShowMall(product, globalIndex))
  const resolvedQualityTag = profile.qualityTag != null ? profile.qualityTag : qualityTag
  const mallQuality = resolveMallAndQualityTag({
    isMall,
    qualityTag: resolvedQualityTag,
    qualityConsiderationTag,
  })

  const purchaseCount =
    mallQuality.qualityTag === 'geo_velocity' ? resolvePurchaseCount(product, globalIndex) : null

  return {
    considerationTags,
    selectionTag,
    selectionRank,
    selectionTrendLabel,
    purchaseCount,
    priceDropInline,
    isAd: Boolean(profile.isAd),
    isMall: mallQuality.isMall,
    brand: profile.brand ?? null,
    sscat,
    pack,
    attributes,
    useLegacyTitle: Boolean(profile.useLegacyTitle),
    price,
    mrp,
    discountPct,
    primaryPriceTag,
    saleAmountOff,
    dealTimer,
    priceConsiderationTag,
    lessTodayAmount: profile.lessTodayAmount ?? 24,
    lowestPriceDays: profile.lowestPriceDays ?? 30,
    rating: tagPolicy.ratingValue,
    ratingCount: formatRatingCount(tagPolicy.ratingCountRaw),
    ratingCountRaw: tagPolicy.ratingCountRaw,
    qualityTag: mallQuality.qualityTag,
    keepRatePercent,
    fastDelivery: shouldShowFastDelivery(globalIndex) ? true : null,
    showBuyNow: resolveShowBuyNow(product, globalIndex),
    legacyTitle: product.title ?? '',
    comprehensionNone: Boolean(profile.comprehensionNone),
  }
}

function truncateChipLabel(text, maxLen = 28) {
  const t = String(text ?? '').trim()
  if (t.length <= maxLen) return t
  return `${t.slice(0, maxLen - 1).trim()}…`
}

function formatBrandOrTitleLabel(text) {
  const shortened = shortenTitleLabel(text)
  return shortened || truncateChipLabel(text, TITLE_MAX_CHARS)
}

function labelsMatch(a, b) {
  return String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase()
}

/**
 * Label for the single selection tag (leading title chip). Null when none.
 * PLP copy is short (narrow chip, Bharat-readable). Pass `{ full: true }` for the
 * roomy PDP where we spell it out fully.
 */
export function getSelectionTagLabel(flavour, { full = false } = {}) {
  switch (flavour?.selectionTag) {
    case 'best_of_2026':
      return full ? 'Among the Best of 2026' : 'Best of 2026'
    case 'trending_bengaluru':
      return full ? 'Trending in Bengaluru' : 'Top in Bengaluru'
    case 'bengaluru_trend': {
      // A named, catalogue-matched trend (e.g. "Baggy co-ords", "Trendy prints").
      const trend = flavour.selectionTrendLabel || 'Trendy prints'
      return full ? `${trend} · trending in Bengaluru` : trend
    }
    case 'number_in_sscat': {
      const rank = flavour.selectionRank ?? 12
      const category = truncateChipLabel(flavour.sscat || 'category', full ? 24 : 12)
      return full ? `#${rank} bestseller in ${category}` : `#${rank} in ${category}`
    }
    default:
      return null
  }
}

/**
 * Build comprehension chips in priority order; trim lowest-priority from the end.
 * @returns {{ type: string, label: string }[]}
 */
export function buildComprehensionChips(flavour) {
  /** @type {{ type: string, label: string }[]} */
  const chips = []

  // Ad always leads the comprehension layer.
  if (flavour.isAd) {
    chips.push({ type: 'ad', label: 'Ad' })
  }

  // Selection tag — leading discovery chip (right after Ad).
  const selectionLabel = getSelectionTagLabel(flavour)
  if (selectionLabel) {
    chips.push({ type: 'selection', label: selectionLabel })
  }

  let brandLabel = null
  if (flavour.isMall) {
    chips.push({ type: 'mall', label: 'Mall' })
    if (flavour.useLegacyTitle) {
      brandLabel = formatBrandOrTitleLabel(flavour.legacyTitle)
    }
  } else if (flavour.brand) {
    brandLabel = formatBrandOrTitleLabel(flavour.brand)
  } else if (flavour.useLegacyTitle) {
    brandLabel = formatBrandOrTitleLabel(flavour.legacyTitle)
  }

  if (brandLabel && !labelsMatch(brandLabel, flavour.sscat)) {
    chips.push({ type: 'brand', label: brandLabel })
  }

  // "New" relocated from the image overlay into the title chips (next to Mall).
  if (flavour.considerationTags?.includes('new_arrival')) {
    chips.push({ type: 'new', label: 'New' })
  }

  if (flavour.sscat) chips.push({ type: 'sscat', label: flavour.sscat })
  if (flavour.pack) chips.push({ type: 'pack', label: flavour.pack })
  for (const attr of flavour.attributes ?? []) {
    if (labelsMatch(attr, flavour.sscat) || labelsMatch(attr, brandLabel)) continue
    chips.push({ type: 'attribute', label: attr })
  }

  return chips
}

const COMPREHENSION_CHIP_GAP = 3
// Real rendered content width on a 375px viewport is ~171px (measured). Keep a
// small margin so rows wrap instead of clipping the last chip.
const COMPREHENSION_ROW_WIDTH = 170
const COMPREHENSION_MAX_ROWS = 2

/**
 * Approximate chip width (px) for 2-row packing — calibrated to the 10px chip
 * font from measured rendered widths, biased slightly high so we never clip.
 */
function estimateChipWidth(chip) {
  if (chip.type === 'ad') return 27
  if (chip.type === 'mall') return 42
  if (chip.type === 'new') return 34
  const len = String(chip.label ?? '').length
  if (chip.type === 'selection') return Math.ceil(20 + len * 5.2)
  return Math.ceil(10 + len * 5)
}

function packChipsIntoRows(chips, rowWidth, maxRows) {
  const rows = []
  let row = []
  let rowUsed = 0

  for (const chip of chips) {
    const chipW = estimateChipWidth(chip)
    const gap = row.length > 0 ? COMPREHENSION_CHIP_GAP : 0
    const wouldOverflow = row.length > 0 && rowUsed + gap + chipW > rowWidth

    if (wouldOverflow) {
      rows.push(row)
      row = []
      rowUsed = 0
      if (rows.length >= maxRows) break
    }

    const joinGap = row.length > 0 ? COMPREHENSION_CHIP_GAP : 0
    row.push(chip)
    rowUsed += joinGap + chipW
  }

  if (row.length && rows.length < maxRows) rows.push(row)
  return rows
}

/**
 * Pack chips left→right; row 2 only when row 1 is full (MD §4.2).
 * Drops lowest-priority chips from the end if they cannot fit in 2 rows.
 */
export function splitComprehensionRows(chips, rowWidth = COMPREHENSION_ROW_WIDTH) {
  if (!chips?.length) return []

  let list = [...chips]
  while (list.length) {
    const rows = packChipsIntoRows(list, rowWidth, COMPREHENSION_MAX_ROWS)
    const placedCount = rows.reduce((n, row) => n + row.length, 0)
    if (placedCount === list.length) return rows.filter((row) => row.length)
    list = list.slice(0, -1)
  }
  return []
}

export function hasComprehensionContent(flavour) {
  return buildComprehensionChips(flavour).length > 0
}

/** MD §4.2 — plain title when no comprehension chips and not the explicit no-title variant. */
export function getLegacyTitleDisplay(flavour) {
  if (flavour.comprehensionNone || hasComprehensionContent(flavour)) return null
  const title = String(flavour.legacyTitle ?? '').trim()
  if (!title) return null
  return formatBrandOrTitleLabel(title)
}

export function shouldShowComprehensionBlock(flavour) {
  return hasComprehensionContent(flavour) || Boolean(getLegacyTitleDisplay(flavour))
}

export function getPriceConsiderationLabel(flavour) {
  if (!flavour.priceConsiderationTag) return null
  return 'Price Drop'
}

/** PLP/PDP price floor — final → MRP → % off (MRP only when above final price). */
export function getOptimizedPriceFloor(flavour) {
  const price = flavour.price
  const mrp = flavour.mrp
  const showMrp = mrp != null && mrp > price
  const discountPct =
    flavour.discountPct ??
    (showMrp ? Math.round(((mrp - price) / mrp) * 100) : null)
  const showPctOff = showMrp && discountPct != null && discountPct > 0

  return { showMrp, showPctOff, discountPct }
}

/** Price Drop inline on row 1 when it wins the exclusive promo slot (no sale/combo). */
export function shouldShowPriceDropRow(flavour) {
  if (flavour.dealTimer) return false
  if (hasExclusivePromoPrimaryTag(flavour.primaryPriceTag)) return false
  return flavour.priceConsiderationTag === 'price_drop'
}

export const PLP_DEMO_PROFILE_COUNT = DEMO_PROFILES.length
