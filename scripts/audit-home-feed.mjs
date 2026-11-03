/**
 * Sanity audit — first N mixed Home feed cards (images, titles, comprehension).
 * Run: npm run audit:feed
 */
import { getProductsForGrid } from '../src/data/products.js'
import { getHeroImageForProduct } from '../src/data/categoryProductImages.js'
import { buildMixedFeed } from '../src/utils/cohortFeed.js'
import {
  getPlpCardData,
  buildComprehensionChips,
} from '../src/utils/plpCardData.js'
import {
  inferPackFromProduct,
  supportsComboOffer,
  isDiaperProduct,
  isMensShirtComboProduct,
  attributeIsFabric,
  attributeIsVolume,
  getAttributeGroup,
  isCookerProduct,
  isBottleProduct,
} from '../src/utils/plpCardAttributes.js'

const FABRICS = new Set([
  'Rayon', 'Cotton', 'Silk Blend', 'Georgette', 'Chiffon', 'Crepe',
  'Polyester', 'Linen', 'Rayon Blend', 'Denim', 'Oxford Cotton',
  'Polyester Blend', 'Silk', 'Banarasi', 'Art Silk',
])

const EXPECTED_SSCAT = {
  mens_shirts: 'Shirts',
  kitchen_water_bottle: 'Bottle',
  mens_shoes: 'Shoes',
  beauty_lipstick: 'Lipstick',
  baby_diaper: 'Diaper',
  women_kurti: 'Kurti',
  lod_top_bottom_sets: 'Co-ord Set',
  women_saree: 'Saree',
  home_bedsheets: 'Bedsheet',
  kitchen_cooker: 'Cooker',
  kitchen_cooker_volume: 'Cooker',
}

const LIMIT = 200
const feed = buildMixedFeed(getProductsForGrid()).slice(0, LIMIT)
const issues = []

function fabricCount(labels) {
  return labels.filter((l) => FABRICS.has(l)).length
}

function push(issue) {
  issues.push(issue)
}

feed.forEach((product, index) => {
  const flavour = getPlpCardData(product, index)
  const chips = buildComprehensionChips(flavour)
  const chipLabels = chips.map((c) => c.label)
  const attrs = flavour.attributes ?? []
  const hero = getHeroImageForProduct(product) || product.images?.hero || ''
  const title = String(product.title ?? '').trim()
  const catId = product.categoryId ?? ''

  if (!hero || hero.includes('placehold.co')) {
    push({ index, id: product.product_id, rule: 'missing-hero-image', detail: `cat=${catId}, title=${title.slice(0, 40)}` })
  }

  const expectedSscat = EXPECTED_SSCAT[catId]
  if (expectedSscat && flavour.sscat && flavour.sscat !== expectedSscat && flavour.sscat !== 'Bottle + Glass') {
    push({
      index,
      id: product.product_id,
      rule: 'sscat-mismatch',
      detail: `expected=${expectedSscat}, got=${flavour.sscat}, cat=${catId}`,
    })
  }

  if (chipLabels.includes('Bottle + Glass') && catId !== 'kitchen_water_bottle') {
    push({ index, id: product.product_id, rule: 'bottle-glass-on-wrong-product', detail: `cat=${catId}, title=${title.slice(0, 40)}` })
  }

  if (getAttributeGroup(product) === 'fashion') {
    const hasFabric = attrs.some(attributeIsFabric) || chipLabels.some((l) => FABRICS.has(l))
    if (!hasFabric) {
      push({ index, id: product.product_id, rule: 'fashion-missing-fabric', detail: `attrs=${attrs.join('|') || 'none'}` })
    }
  }

  if (isDiaperProduct(product) && !flavour.pack) {
    push({ index, id: product.product_id, rule: 'diaper-missing-pack', detail: 'no pack chip' })
  }

  if (isBottleProduct(product) || isCookerProduct(product)) {
    const hasVolume = attrs.some(attributeIsVolume) || chipLabels.some((l) => /^\d+(\.\d+)?(ml|l)$/i.test(l.replace(/\s+/g, '')))
    if (!hasVolume) {
      push({ index, id: product.product_id, rule: 'home-decor-missing-volume', detail: `attrs=${attrs.join('|') || 'none'}` })
    }
  }

  if (product.categoryId === 'beauty_lipstick') {
    const galleryCount = product.gallery?.length ?? product.images?.gallery?.length ?? 0
    if (galleryCount >= 3 && !flavour.pack) {
      push({
        index,
        id: product.product_id,
        rule: 'lipstick-gallery-needs-pack',
        detail: `gallery=${galleryCount}`,
      })
    }
  }

  const fabricInChips = chipLabels.filter((l) => FABRICS.has(l))
  if (fabricInChips.length > 1) {
    push({ index, id: product.product_id, rule: 'double-fabric', detail: fabricInChips.join(' + ') })
  }

  if (flavour.primaryPriceTag === 'combo_offer' && !supportsComboOffer(product, flavour.pack, flavour.sscat)) {
    push({ index, id: product.product_id, rule: 'invalid-combo-offer', detail: `sscat=${flavour.sscat}` })
  }

  if (isDiaperProduct(product) && flavour.primaryPriceTag === 'combo_offer') {
    push({ index, id: product.product_id, rule: 'diaper-combo', detail: 'combo on diaper' })
  }

  if (isMensShirtComboProduct(product) && (!flavour.pack || flavour.primaryPriceTag !== 'combo_offer')) {
    push({
      index,
      id: product.product_id,
      rule: 'shirt-combo-missing-labels',
      detail: `pack=${flavour.pack ?? 'none'}, tag=${flavour.primaryPriceTag ?? 'none'}`,
    })
  }

  if (flavour.primaryPriceTag === 'upi' && flavour.priceConsiderationTag === 'price_drop') {
    push({ index, id: product.product_id, rule: 'upi-price-drop-conflict', detail: 'UPI + price_drop' })
  }

  if (flavour.isMall && !['beauty_lipstick', 'beauty_shampoo', 'beauty_hair_oil', 'baby_diaper'].includes(catId)) {
    push({ index, id: product.product_id, rule: 'mall-on-ineligible', detail: `cat=${catId}` })
  }

  const titleLower = title.toLowerCase()
  if (catId === 'women_kurti' && (titleLower.includes('bottle') || titleLower.includes('diaper'))) {
    push({ index, id: product.product_id, rule: 'title-category-mismatch', detail: title })
  }
  if (catId === 'kitchen_water_bottle' && titleLower.includes('kurti')) {
    push({ index, id: product.product_id, rule: 'title-category-mismatch', detail: title })
  }
})

const byRule = issues.reduce((acc, i) => {
  acc[i.rule] = (acc[i.rule] ?? 0) + 1
  return acc
}, {})

if (issues.length) {
  console.error(`Home feed sanity FAILED — ${issues.length} issue(s) in first ${feed.length} cards:\n`)
  Object.entries(byRule)
    .sort((a, b) => b[1] - a[1])
    .forEach(([rule, count]) => console.error(`  ${rule}: ${count}`))
  console.error('')
  issues.slice(0, 40).forEach((i) => {
    console.error(`  [${i.index}] ${i.id} — ${i.rule}: ${i.detail}`)
  })
  if (issues.length > 40) console.error(`  … and ${issues.length - 40} more`)
  process.exit(1)
}

console.log(`Home feed sanity PASSED — first ${feed.length} mixed-feed cards OK.`)
