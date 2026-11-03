/**
 * Deterministic Home PLP feed order — stable across reloads for user testing.
 */

import { PLP_PACK_DEMO_GLOBAL_INDEX, PLP_SHIRTS_COMBO_DEMO_GLOBAL_INDEX } from './plpCardData'

/** Curated placements for the first screenful of demo cards (user test). */
export const HOME_FEED_SHOWCASE_PINS = [
  { index: 2, productId: '3152317' },
  { index: 3, productId: '5037149' },
  {
    index: PLP_SHIRTS_COMBO_DEMO_GLOBAL_INDEX,
    productId: '16896398',
  },
  { index: 23, productId: '4128468' },
  {
    index: PLP_PACK_DEMO_GLOBAL_INDEX,
    productId: '3152315',
    title: 'Matte Lipstick (Non-Transferable)',
  },
]

/** Fisher–Yates shuffle with fixed seed — stable across navigations & reloads. */
function hashString(str) {
  let h = 0
  const s = String(str ?? '')
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function seededShuffle(arr, seed = 0) {
  const copy = [...arr]
  let s = seed >>> 0
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * Original Home mixed-feed order — shuffle within each category, then round-robin.
 * Category key order follows insertion order (not sorted).
 */
export function interleaveByCategoryShuffled(products) {
  if (!products?.length) return []
  const byCat = {}
  products.forEach((p) => {
    const c = p.category || 'Other'
    if (!byCat[c]) byCat[c] = []
    byCat[c].push(p)
  })
  const categories = Object.keys(byCat)
  categories.forEach((cat) => {
    byCat[cat] = seededShuffle(byCat[cat], hashString(cat) + 42)
  })
  const result = []
  const maxLen = Math.max(...categories.map((cat) => byCat[cat].length))
  for (let i = 0; i < maxLen; i += 1) {
    categories.forEach((cat) => {
      if (byCat[cat][i] != null) result.push(byCat[cat][i])
    })
  }
  return result
}

/** Round-robin by category; stable sort — for cohort feeds & audits. */
export function interleaveByCategory(products) {
  if (!products?.length) return []
  const byCat = {}
  products.forEach((p) => {
    const c = p.category || 'Other'
    if (!byCat[c]) byCat[c] = []
    byCat[c].push(p)
  })
  const categories = Object.keys(byCat).sort()
  categories.forEach((cat) => {
    byCat[cat].sort((a, b) => String(a.product_id).localeCompare(String(b.product_id)))
  })
  const result = []
  const maxLen = Math.max(...categories.map((cat) => byCat[cat].length))
  for (let i = 0; i < maxLen; i += 1) {
    categories.forEach((cat) => {
      if (byCat[cat][i] != null) result.push(byCat[cat][i])
    })
  }
  return result
}

function applyPin(list, { index, productId, title }) {
  const fromIdx = list.findIndex((p) => String(p.product_id) === String(productId))
  if (fromIdx === -1) return list

  const next = [...list]
  const [raw] = next.splice(fromIdx, 1)
  const item = title ? { ...raw, title } : raw
  const slot = Math.min(index, next.length)
  next.splice(slot, 0, item)
  return next
}

/** Pin hero showcase products at fixed indices without reshuffling the rest randomly. */
export function applyHomeFeedShowcasePins(products) {
  if (!products?.length) return products
  const sortedPins = [...HOME_FEED_SHOWCASE_PINS].sort((a, b) => a.index - b.index)
  return sortedPins.reduce((list, pin) => applyPin(list, pin), products)
}

export function buildHomeFeedProducts(allProducts) {
  return applyHomeFeedShowcasePins(interleaveByCategory(allProducts))
}

/** Mixed Home feed — original shuffle interleave, with showcase pins for first-screen variety. */
export function buildMixedFeedProducts(allProducts) {
  return applyHomeFeedShowcasePins(interleaveByCategoryShuffled(allProducts))
}
