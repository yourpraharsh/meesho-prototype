/**
 * Consumes assets/products.cursor.json (from your CSV transformer).
 * Regenerate: run transformer with INPUT=assets/Products.csv, OUTPUT=assets/products.cursor.json.
 * Maps to app product shape with realistic Meesho-style title, price, rating.
 */
import cursorData from '../../assets/products.cursor.json'
import { isMensShirtComboProduct, inferPackFromProduct } from '../utils/plpCardAttributes'
import { isGalleryLookLayer, isGalleryLookVisual, mergeGalleryImageUrls } from '../utils/vskuGalleryLooks'

const { productsById = {}, categoryIndex = {}, categories = [] } = cursorData

/** Deterministic seed from string id */
function seed(id) {
  let h = 0
  const s = String(id)
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

/** Meesho-style price ranges by categoryId (min, max price; mrp ~1.4–2x) */
const PRICE_BY_CATEGORY = {
  mens_shirts: [299, 599],
  kitchen_water_bottle: [199, 449],
  mens_shoes: [399, 899],
  beauty_lipstick: [199, 399],
  baby_diaper: [499, 899],
  women_kurti: [349, 799],
  women_top_bottom_sets: [250, 600],
  lod_top_bottom_sets: [250, 600],
  women_saree: [399, 999],
  home_bedsheets: [399, 899],
  kitchen_cooker: [499, 999],
  kitchen_cooker_volume: [599, 1299],
}
const DEFAULT_PRICE = [199, 499]

/** Rating value 3.2–4.9, count 1k–60k; ~20% high-trust (4.5+, 20k+ reviews). */
function realisticRating(categoryId, id) {
  const s = seed(id)
  const highTrust = s % 5 === 0
  const value = highTrust
    ? 4.5 + (s % 5) / 10
    : 3.2 + (s % 18) / 10
  const count = highTrust ? 20000 + (s % 40000) : 1000 + (s % 19000)
  return { value: Math.min(4.9, Math.round(value * 10) / 10), count }
}

function realisticPrice(categoryId, id) {
  const [minP, maxP] = PRICE_BY_CATEGORY[categoryId] || DEFAULT_PRICE
  const s = seed(id)
  const price = minP + (s % (maxP - minP + 1))
  const mrp = Math.round(price * (1.2 + (s % 30) / 100))
  const discountPercent = Math.round((1 - price / mrp) * 100)
  return { price, mrp, discount_percent: discountPercent }
}

/** Meesho-style titles by category (pick by id seed) */
const TITLE_TEMPLATES = {
  mens_shirts: [
    "Men's Solid Casual Shirt",
    "Men's Printed Formal Shirt",
    "Men's Slim Fit Cotton Shirt",
    "Men's Checkered Casual Shirt",
    "Men's Striped Regular Fit Shirt",
  ],
  kitchen_water_bottle: [
    "Fitness Sports Water Bottle with Straw 1L",
    "Insulated Water Bottle 750 ml",
    "Gym Water Bottle with Handle 1.25L",
    "Plastic Water Bottle BPA Free",
  ],
  mens_shoes: [
    "Men's Casual Sneakers",
    "Men's Sports Running Shoes",
    "Men's Formal Loafers",
    "Men's Slip-On Casual Shoes",
  ],
  beauty_lipstick: [
    "Matte Lipstick (Non-Transferable)",
    "Long Stay Lipstick - 12hr",
    "Liquid Lipstick - Velvet Finish",
    "Crayon Lipstick Set of 3",
  ],
  baby_diaper: [
    "Baby Diapers - Soft & Dry (Pack of 40)",
    "Newborn Diaper Pants (Small)",
    "Baby Dry Diapers - Economy Pack",
  ],
  women_kurti: [
    "Women Rayon Printed Kurti with Round Neck",
    "Women's A-Line Kurti with Short Sleeves",
    "Floral Print Kurti - Casual Wear",
  ],
  women_top_bottom_sets: [
    "Women Top & Bottom Sets",
    "Trendy Women Top & Bottom Sets",
    "Classic Women Top & Bottom Sets",
  ],
  lod_top_bottom_sets: [
    "Women Top & Bottom Sets",
    "Trendy Women Top & Bottom Sets",
    "Classic Women Top & Bottom Sets",
  ],
  women_saree: [
    "Women's Printed Saree with Blouse",
    "Cotton Saree - Traditional Wear",
    "Designer Saree with Border",
  ],
  home_bedsheets: [
    "Double Bedsheet with 2 Pillow Covers",
    "King Size Bedsheet Set - Cotton",
    "Single Bedsheet with Pillow Cover",
  ],
  kitchen_cooker: [
    "Pressure Cooker - Aluminium",
    "Non-Stick Pressure Cooker",
  ],
  kitchen_cooker_volume: [
    "Stainless Steel Pressure Cooker",
    "Stainless Steel Cooker with Whistle",
  ],
}

function realisticTitle(categoryId, id) {
  const list = TITLE_TEMPLATES[categoryId]
  if (!list?.length) return cursorData.categories?.find((c) => c.id === categoryId)?.label || 'Product'
  return list[seed(id) % list.length]
}

/** categoryId → app category label (used by PDP/Home for filtering and display) */
const CATEGORY_ID_TO_LABEL = {
  mens_shirts: 'Shirts',
  kitchen_water_bottle: 'Home Decor',
  kitchen_cooker: 'Home Decor',
  kitchen_cooker_volume: 'Home Decor',
  mens_shoes: 'Shoes',
  beauty_lipstick: 'Lipstick',
  baby_diaper: 'Diaper',
  women_kurti: 'Kurti',
  women_top_bottom_sets: 'Top & Bottom Sets',
  lod_top_bottom_sets: 'Top & Bottom Sets',
  women_saree: 'Saree',
  home_bedsheets: 'Bedsheets',
}

function getCategoryLabel(categoryId) {
  return CATEGORY_ID_TO_LABEL[categoryId] || categoryId || 'Product'
}

/** Delivery/offer text – Meesho style */
function deliveryAndOffer(price, id) {
  const s = seed(id)
  const cashPrice = price + (s % 50)
  if (s % 3 === 0) return { delivery: '₹40 Delivery Fee', offerText: `₹${cashPrice} with CASH` }
  return { delivery: 'Free Delivery', offerText: `₹${cashPrice} with CASH` }
}

/** VSKU: realistic options per category (Flipkart/Amazon style). Kurti: Colors, Size. Water Bottle: Colors, Volume. etc. */
const VSKU_COLORS = {
  women_kurti: ['Navy Blue', 'Maroon', 'Black', 'Red', 'Green', 'Pink', 'Grey', 'White', 'Mustard', 'Sky Blue'],
  women_top_bottom_sets: ['Navy Blue', 'Maroon', 'Black', 'Red', 'Green', 'Pink', 'Grey', 'White', 'Mustard', 'Sky Blue'],
  lod_top_bottom_sets: ['Navy Blue', 'Maroon', 'Black', 'Red', 'Green', 'Pink', 'Grey', 'White', 'Mustard', 'Sky Blue'],
  kitchen_water_bottle: ['Blue', 'Green', 'Pink', 'Black', 'Silver', 'Purple', 'Red', 'White'],
  kitchen_cooker: ['Black', 'Silver'],
  kitchen_cooker_volume: ['Black', 'Silver'],
  beauty_lipstick: ['Red', 'Pink', 'Nude', 'Maroon', 'Brown', 'Coral', 'Berry', 'Wine', 'Burgundy'],
  mens_shirts: ['White', 'Black', 'Navy Blue', 'Light Blue', 'Grey', 'Maroon', 'Beige', 'Olive', 'Pink', 'Yellow'],
  mens_shoes: ['Black', 'White', 'Brown', 'Blue', 'Grey', 'Navy', 'Tan'],
  home_bedsheets: ['White', 'Blue', 'Grey', 'Pink', 'Yellow', 'Maroon', 'Green', 'Beige'],
  women_saree: ['Red', 'Maroon', 'Green', 'Blue', 'Pink', 'Yellow', 'Black', 'Navy', 'Orange'],
  baby_diaper: [], // no color layer
}

const VSKU_FUNCTIONAL = {
  women_kurti: { axis_id: 'size', axis_label: 'Size', options: ['S', 'M', 'L', 'XL', 'XXL'] },
  women_top_bottom_sets: { axis_id: 'size', axis_label: 'Size', options: ['S', 'M', 'L', 'XL', 'XXL'] },
  lod_top_bottom_sets: { axis_id: 'size', axis_label: 'Size', options: ['S', 'M', 'L', 'XL', 'XXL'] },
  kitchen_water_bottle: { axis_id: 'volume', axis_label: 'Volume', options: ['750 ml', '1 Litre', '1.25 Litre', '2 Litre'] },
  kitchen_cooker: { axis_id: 'volume', axis_label: 'Volume', options: ['3 L', '5 L'] },
  kitchen_cooker_volume: { axis_id: 'volume', axis_label: 'Volume', options: ['3 L', '5 L'] },
  beauty_lipstick: { axis_id: 'quantity', axis_label: 'Quantity', options: ['5 gm', '10 gm', '15 gm'] },
  baby_diaper: [
    { axis_id: 'size', axis_label: 'Size', options: ['Small', 'Medium', 'Large'] },
    { axis_id: 'net_qty', axis_label: 'Net Quantity', options: ['Pack of 56', 'Pack of 64', 'Pack of 72', 'Pack of 80'] },
  ],
  mens_shirts: { axis_id: 'size', axis_label: 'Size', options: ['S', 'M', 'L', 'XL', 'XXL'] },
  mens_shoes: { axis_id: 'size', axis_label: 'Size', options: ['IND-6', 'IND-7', 'IND-8', 'IND-9', 'IND-10'] },
  home_bedsheets: { axis_id: 'size', axis_label: 'Size', options: ['Single', 'Double', 'Queen', 'King'] },
  women_saree: { axis_id: 'size', axis_label: 'Size', options: ['Free Size'] },
}

/** Categories that show different products as color/design variants (thumbnails = distinct products, not same product angles) */
const THUMBNAIL_VARIANT_CATEGORIES = new Set([
  'women_kurti',
  'women_top_bottom_sets',
  'lod_top_bottom_sets',
  'mens_shirts',
  'kitchen_water_bottle',
  'home_bedsheets',
])

/** JSON functional rows that are placeholders — use category defaults instead. */
function isPlaceholderFunctional(functional) {
  if (!functional?.length) return true
  if (functional.length === 1) {
    const label = String(functional[0]?.label ?? '').trim().toLowerCase()
    if (label === 'default' || label === 'standard' || label === 'one size') return true
  }
  return false
}

function functionalAxisFromEntry(entry) {
  const type = String(entry?.type ?? '').toLowerCase()
  if (type === 'volume' || type === 'capacity') return { axis_id: 'volume', axis_label: 'Volume' }
  if (type === 'quantity' || type === 'net_qty') return { axis_id: 'quantity', axis_label: 'Quantity' }
  if (type === 'size') return { axis_id: 'size', axis_label: 'Size' }
  const id = String(entry?.id ?? '')
  if (id.includes('volume') || id.includes('litre') || id.includes('_l')) {
    return { axis_id: 'volume', axis_label: 'Volume' }
  }
  if (id.includes('size') || id.includes('uk_')) return { axis_id: 'size', axis_label: 'Size' }
  return { axis_id: 'size', axis_label: 'Size' }
}

function buildFunctionalLayersFromJson(functional) {
  if (!functional?.length) return []
  const { axis_id, axis_label } = functionalAxisFromEntry(functional[0])
  const options = functional.map((o) => ({
    option_id: o.id,
    label: o.label,
    delta: {
      ...(o.overrides?.images?.hero != null ? { heroImage: o.overrides.images.hero } : {}),
      ...(o.overrides?.price != null ? { price: o.overrides.price } : {}),
      ...(o.overrides?.mrp != null ? { mrp: o.overrides.mrp } : {}),
    },
  }))
  return [{
    layer_type: 'FUNCTIONAL',
    axis_id,
    axis_label,
    render_hint: 'CHIPS',
    default_option_id: options[0].option_id,
    options,
  }]
}

/** Build Color layer from 2–3 different products in same category (per design: distinct designs/patterns, not same product angles) */
function buildColorLayerFromVariants(categoryId, currentId, productsById, categoryIndex) {
  const colors = VSKU_COLORS[categoryId]
  if (!colors?.length) return null
  const idsInCategory = categoryIndex[categoryId] || []
  const otherIds = idsInCategory.filter((id) => String(id) !== String(currentId))
  const variantCount = Math.min(3, 1 + otherIds.length)
  const productIds = [currentId, ...otherIds.slice(0, variantCount - 1)]
  const options = productIds.map((pid, i) => {
    const p = productsById[String(pid)]
    const hero = p?.images?.hero || ''
    const label = colors[i % colors.length]
    return {
      option_id: `color_${pid}`,
      label,
      image: { type: 'URL', url: hero || 'https://placehold.co/80x80/e2e8f0/64748b?text=Color' },
      delta: {},
      variant_product_id: pid,
    }
  })
  if (options.length <= 1) return null
  return {
    layer_type: 'VISUAL',
    axis_id: 'color',
    axis_label: 'Color',
    render_hint: 'THUMBNAIL',
    default_option_id: options[0].option_id,
    options,
  }
}

/** Build VISUAL (Color) layer using same-product gallery (fallback when no variants) */
function buildColorLayer(categoryId, imageUrls) {
  const colors = VSKU_COLORS[categoryId]
  if (!colors?.length) return null
  const urls = imageUrls?.filter(Boolean) ?? []
  // Single image — no synthetic multi-color picker
  if (urls.length <= 1) return null
  const optionCount = Math.min(colors.length, urls.length)
  const options = colors.slice(0, optionCount).map((label, i) => ({
    option_id: `color_${i}`,
    label,
    image: { type: 'URL', url: urls[i] },
    delta: {},
  }))
  if (options.length <= 1) return null
  return {
    layer_type: 'VISUAL',
    axis_id: 'color',
    axis_label: 'Color',
    render_hint: 'THUMBNAIL',
    default_option_id: options[0].option_id,
    options,
  }
}

/** Build FUNCTIONAL layer(s) for Size/Volume/Quantity */
function buildFunctionalLayers(categoryId) {
  const spec = VSKU_FUNCTIONAL[categoryId]
  if (!spec) return []
  const arr = Array.isArray(spec) ? spec : [spec]
  return arr.map((s, idx) => {
    const options = s.options.map((label, i) => ({
      option_id: `${s.axis_id}_${i}`,
      label,
      delta: {},
    }))
    return {
      layer_type: 'FUNCTIONAL',
      axis_id: s.axis_id,
      axis_label: s.axis_label,
      render_hint: 'CHIPS',
      default_option_id: options[0].option_id,
      options,
    }
  })
}

/** Lipstick: shade swatches (COLOR type) + quantity */
function buildLipstickLayers(categoryId, imageUrls) {
  if (categoryId !== 'beauty_lipstick') return null
  const shades = VSKU_COLORS.beauty_lipstick
  const urls = imageUrls?.length ? imageUrls : ['https://placehold.co/80x80/e2e8f0/64748b?text=Shade']
  const visualOptions = shades.map((label, i) => ({
    option_id: `shade_${i}`,
    label,
    image: { type: 'URL', url: urls[i % urls.length] },
    delta: {},
  }))
  const visualLayer = {
    layer_type: 'VISUAL',
    axis_id: 'shade',
    axis_label: 'Shade',
    render_hint: 'THUMBNAIL',
    default_option_id: visualOptions[0].option_id,
    options: visualOptions,
  }
  const func = VSKU_FUNCTIONAL.beauty_lipstick
  const funcOptions = func.options.map((label, i) => ({ option_id: `quantity_${i}`, label, delta: {} }))
  const funcLayer = {
    layer_type: 'FUNCTIONAL',
    axis_id: 'quantity',
    axis_label: 'Quantity',
    render_hint: 'CHIPS',
    default_option_id: funcOptions[0].option_id,
    options: funcOptions,
  }
  return [visualLayer, funcLayer]
}

/** Saree: Free Size only — no color/look picker (gallery images stay on hero carousel). */
function buildSareeLayers(categoryId) {
  if (categoryId !== 'women_saree') return null
  return buildFunctionalLayers(categoryId)
}

/** Build all VSKU layers for this product (category-specific) */
function buildVskuLayersForCategory(categoryId, p) {
  const imageUrls = p.images?.gallery?.length
    ? [p.images.hero, ...p.images.gallery].filter(Boolean)
    : (p.images?.hero ? [p.images.hero] : [])
  const urlsForColor = imageUrls.length ? imageUrls : []

  if (categoryId === 'beauty_lipstick') {
    return buildLipstickLayers(categoryId, urlsForColor) || []
  }
  if (categoryId === 'women_saree') {
    return buildSareeLayers(categoryId) || []
  }

  const layers = []
  let colorLayer = null
  if (categoryId !== 'mens_shoes') {
    if (p.vsku?.visual?.length > 0 && !isGalleryLookVisual(p.vsku.visual)) {
      colorLayer = {
        layer_type: 'VISUAL',
        axis_id: 'color',
        axis_label: 'Color',
        render_hint: 'THUMBNAIL',
        default_option_id: p.vsku.defaultVisual ?? p.vsku.visual[0]?.id,
        options: p.vsku.visual.map((v) => ({
          option_id: v.id,
          label: v.label,
          image: v.hero ? { type: 'URL', url: v.hero } : (v.thumb ? { type: 'URL', url: v.thumb } : undefined),
          delta: v.overrides?.images != null ? {
            heroImage: v.overrides.images.hero,
            gallery: v.overrides.images.gallery ?? [],
          } : {},
        })),
      }
    } else if (!isGalleryLookVisual(p.vsku?.visual)) {
      colorLayer = THUMBNAIL_VARIANT_CATEGORIES.has(categoryId)
        ? buildColorLayerFromVariants(categoryId, p.id, productsById, categoryIndex)
        : buildColorLayer(categoryId, urlsForColor)
    }
    if (colorLayer && !isGalleryLookLayer(colorLayer)) layers.push(colorLayer)
  }
  let functionalLayers = []
  const rawFunctional = p.vsku?.functional
  if (rawFunctional?.length > 0 && !isPlaceholderFunctional(rawFunctional)) {
    functionalLayers = buildFunctionalLayersFromJson(rawFunctional)
  } else {
    functionalLayers = buildFunctionalLayers(categoryId)
  }
  layers.push(...functionalLayers)

  if (isMensShirtComboProduct({ id: p.id, categoryId })) {
    const packLabel =
      inferPackFromProduct({
        product_id: p.id,
        categoryId,
        title: p.title,
        images: p.images,
        gallery: p.images?.gallery,
      }) ?? 'Pack of 2'
    const packOptionId = packLabel.toLowerCase().replace(/\s+/g, '_')
    layers.push({
      layer_type: 'VALUE',
      axis_id: 'combo',
      axis_label: 'Pack',
      render_hint: 'CHIPS',
      default_option_id: packOptionId,
      options: [{ option_id: packOptionId, label: packLabel, delta: {} }],
    })
  }

  return layers
}

/** Realistic review data — category-aware, deterministic from product id */
const CATEGORY_REVIEW_POOL = {
  women_kurti: [
    { stars: 5, label: 'Good', date: '8 Jan 2025', text: 'Fabric is soft and colour is same as photos. Fits well for daily wear.', author: '~Priya M.', helpful: 214 },
    { stars: 4, label: 'Good', date: '22 Dec 2024', text: 'Nice kurti for the price. Stitching is neat. Took 4 days to deliver.', author: '~Anita S.', helpful: 67 },
    { stars: 5, label: 'Good', date: '5 Dec 2024', text: 'Loved the print and fabric. True to size — ordered M and it fits perfectly.', author: '~Neha G.', helpful: 142 },
  ],
  mens_shoes: [
    { stars: 4, label: 'Good', date: '12 Jan 2025', text: 'Comfortable for daily use. Sole grip is good. Size chart was accurate.', author: '~Rahul K.', helpful: 98 },
    { stars: 5, label: 'Good', date: '28 Dec 2024', text: 'Lightweight and looks exactly like the pictures. Worth the price.', author: '~Vikram D.', helpful: 156 },
    { stars: 3, label: 'Average', date: '10 Nov 2024', text: 'Okay quality. Slightly tight at the toe — would suggest going one size up.', author: '~Karan P.', helpful: 31 },
  ],
  baby_diaper: [
    { stars: 5, label: 'Good', date: '3 Jan 2025', text: 'Absorbency is good and no rashes. Pack size is value for money.', author: '~Sneha R.', helpful: 189 },
    { stars: 4, label: 'Good', date: '18 Dec 2024', text: 'Soft and fits well. Delivery was quick. Will reorder.', author: '~Rajesh T.', helpful: 74 },
    { stars: 4, label: 'Good', date: '2 Nov 2024', text: 'Good diaper pants. Elastic is gentle. Packaging was intact.', author: '~Priya M.', helpful: 52 },
  ],
  kitchen_water_bottle: [
    { stars: 5, label: 'Good', date: '6 Jan 2025', text: 'Keeps water cold for hours. No leakage. Build quality feels premium.', author: '~Amit S.', helpful: 121 },
    { stars: 4, label: 'Good', date: '20 Dec 2024', text: 'Nice bottle, cap fits tight. Colour same as shown.', author: '~Divya K.', helpful: 45 },
    { stars: 4, label: 'Good', date: '8 Nov 2024', text: 'Good for office use. Lightweight and easy to clean.', author: '~Rahul K.', helpful: 38 },
  ],
}

const SAMPLE_REVIEWS_POOL = [
  { stars: 5, label: 'Good', date: '2 Jan 2025', text: 'Quality is very good and matches the listing. Delivery was on time. Happy with the purchase.', author: '~Priya M.', helpful: 124 },
  { stars: 5, label: 'Good', date: '28 Dec 2024', text: 'Value for money. Product matched the description. Would recommend.', author: '~Rahul K.', helpful: 89 },
  { stars: 4, label: 'Good', date: '15 Dec 2024', text: 'Good quality but delivery was delayed by 2 days. Otherwise satisfied.', author: '~Anita S.', helpful: 56 },
  { stars: 5, label: 'Good', date: '10 Dec 2024', text: 'Excellent product! Exactly as shown in the images. Packaging was good.', author: '~Vikram D.', helpful: 201 },
  { stars: 4, label: 'Good', date: '5 Dec 2024', text: 'Nice product. Size is as expected. Minor issue but overall worth the price.', author: '~Sneha R.', helpful: 43 },
  { stars: 5, label: 'Good', date: '1 Dec 2024', text: 'Best purchase at this price. Quality is top notch. Will buy again.', author: '~Karan P.', helpful: 167 },
  { stars: 3, label: 'Average', date: '25 Nov 2024', text: 'Product is okay. Not great but usable. Delivery was fast.', author: '~Neha G.', helpful: 22 },
  { stars: 4, label: 'Good', date: '20 Nov 2024', text: 'Good quality product. Colour is same as displayed. Happy with my order.', author: '~Rajesh T.', helpful: 78 },
]

const REVIEW_TAGS_POOL = [
  { label: 'Good Quality', type: 'green' },
  { label: 'Value for Money', type: 'green' },
  { label: 'As Described', type: 'green' },
  { label: 'True to Size', type: 'green' },
  { label: 'Ok Packaging', type: 'yellow' },
  { label: 'Late Delivery', type: 'yellow' },
  { label: 'Wrong Size', type: 'red' },
]

function buildRatingBars(id, avgRating) {
  const s = seed(id)
  const r = Math.min(4.9, Math.max(3.2, Number(avgRating) || 4))
  const w5 = Math.round(70 + r * 18 + (s % 35))
  const w4 = Math.round(45 + r * 8 + (s % 25))
  const w3 = Math.round(18 + (5 - r) * 6 + (s % 15))
  const w2 = Math.round(6 + (5 - r) * 4 + (s % 8))
  const w1 = Math.round(2 + (5 - r) * 3 + (s % 5))
  const bars = [
    { label: '5', count: w5, fill: 'green' },
    { label: '4', count: w4, fill: 'green' },
    { label: '3', count: w3, fill: 'orange' },
    { label: '2', count: w2, fill: 'orange' },
    { label: '1', count: w1, fill: 'red' },
  ]
  return { bars, maxBar: Math.max(...bars.map((b) => b.count)) }
}

function buildReviewMeta(id, categoryId, rating) {
  const s = seed(id)
  const pick = (arr, n) => Array.from({ length: n }, (_, i) => arr[(s + i) % arr.length])
  const avg = rating?.value ?? 4
  const totalRatings = rating?.count ?? 5000
  const writtenReviews = Math.max(80, Math.round(totalRatings * (0.12 + (s % 22) / 100)))
  const { bars: ratingBars, maxBar: ratingBarsMax } = buildRatingBars(id, avg)
  const pool = CATEGORY_REVIEW_POOL[categoryId] ?? SAMPLE_REVIEWS_POOL
  const sampleReviews = pick(pool, 3)
  const reviewTags = pick(REVIEW_TAGS_POOL, 3)
  return {
    ratingBars,
    ratingBarsMax,
    sampleReviews,
    reviewTags,
    writtenReviews,
    viewAllReviewsCount: writtenReviews,
    realPhotosCount: 8 + (s % 22),
  }
}

/** Map one cursor product to app product shape. Uses cursor JSON price/rating/title/delivery/offerText/supplier when present. */
function toAppProduct(p) {
  if (!p?.id) return null
  const categoryId = p.categoryId || ''
  const catLabel = getCategoryLabel(categoryId)
  const fallbackPrice = realisticPrice(categoryId, p.id)
  const price = p.price_summary?.price != null ? p.price_summary.price : fallbackPrice.price
  const mrp = p.price_summary?.mrp != null ? p.price_summary.mrp : fallbackPrice.mrp
  const discount_percent = p.price_summary?.discountPercent != null
    ? p.price_summary.discountPercent
    : (p.price_summary?.discount_percent != null ? p.price_summary.discount_percent : fallbackPrice.discount_percent)
  const fallbackDeliveryOffer = deliveryAndOffer(price, p.id)
  const delivery = p.delivery != null && p.delivery !== '' ? p.delivery : fallbackDeliveryOffer.delivery
  const offerText = p.offerText != null && p.offerText !== '' ? p.offerText : fallbackDeliveryOffer.offerText
  const heroUrl = p.images?.hero || ''
  const fallbackRating = realisticRating(categoryId, p.id)
  const rating = (p.rating?.value != null || p.rating?.count != null)
    ? { value: p.rating?.value ?? fallbackRating.value, count: p.rating?.count ?? fallbackRating.count }
    : fallbackRating
  const title = (p.title != null && p.title !== '') ? p.title : realisticTitle(categoryId, p.id)
  const supplier = p.supplier != null ? p.supplier : undefined

  const layers = buildVskuLayersForCategory(categoryId, p)
  /** Realistic pricing: bigger size/volume/quantity = costlier (Flipkart/Amazon style). Apply to all FUNCTIONAL layers. */
  const stepPerOption = 0.10
  layers.forEach((layer) => {
    if (layer.layer_type !== 'FUNCTIONAL' || !layer.options?.length) return
    layer.options.forEach((opt, i) => {
      const mult = 1 + i * stepPerOption
      const existing = opt.delta || {}
      opt.delta = {
        ...existing,
        price: Math.round(price * mult),
        mrp: Math.round(mrp * mult),
      }
    })
  })
  const hasLayers = layers.length > 0
  if (!hasLayers && p.vsku?.visual?.length && !isGalleryLookVisual(p.vsku.visual)) {
    const visualLayer = {
      layer_type: 'VISUAL',
      axis_id: 'look',
      axis_label: 'Look',
      render_hint: 'THUMBNAIL',
      default_option_id: p.vsku.defaultVisual ?? p.vsku.visual[0]?.id,
      options: p.vsku.visual.map((v) => ({
        option_id: v.id,
        label: v.label,
        image: v.hero ? { type: 'URL', url: v.hero } : undefined,
        delta: {},
      })),
    }
    layers.push(visualLayer)
  }
  if (!hasLayers && p.vsku?.functional?.length && !isPlaceholderFunctional(p.vsku.functional)) {
    layers.push(...buildFunctionalLayersFromJson(p.vsku.functional))
  } else if (!hasLayers) {
    layers.push(...buildFunctionalLayers(categoryId))
  }

  const reviewMeta = buildReviewMeta(p.id, categoryId, rating)

  const galleryUrls = mergeGalleryImageUrls(p)
  const gallery = galleryUrls.length > 1 ? galleryUrls.slice(1) : galleryUrls.slice(0, 0)
  const heroFromGallery = galleryUrls[0] ?? heroUrl
  const colorLayer = layers.find((l) => l.layer_type === 'VISUAL' && l.axis_id === 'color')
  const volumeLayer = layers.find((l) => l.layer_type === 'FUNCTIONAL' && (l.axis_id === 'volume' || l.axis_id === 'capacity'))
  let outOfStock = null
  let outOfStockShimmerColorIds = null
  if (categoryId === 'kitchen_water_bottle' && colorLayer?.options?.length >= 3 && volumeLayer?.options?.length >= 2) {
    const secondColorOptionId = colorLayer.options[1].option_id
    const thirdColorOptionId = colorLayer.options[2].option_id
    const sevenFiftyMlOptionId = volumeLayer.options[0].option_id
    const oneLitreOptionId = volumeLayer.options[1].option_id
    outOfStock = {
      color: {
        [secondColorOptionId]: [sevenFiftyMlOptionId],
        // 3rd color: both 750ml and 1L are OOS — only 2L available
        [thirdColorOptionId]: [sevenFiftyMlOptionId, oneLitreOptionId],
      },
    }
    outOfStockShimmerColorIds = [thirdColorOptionId]
  }

  return {
    product_id: p.id,
    title,
    category: catLabel,
    categoryId,
    ...(p.sscat && { sscat: p.sscat }),
    ...(p.superPortfolio && { superPortfolio: p.superPortfolio }),
    base_media: { hero_image: heroFromGallery },
    hero_image_url: heroFromGallery,
    gallery,
    price_summary: { price, mrp, discount_percent },
    rating,
    delivery,
    offerText,
    ...(supplier && { supplier }),
    vsku: { layers },
    outOfStock: outOfStock || undefined,
    outOfStockShimmerColorIds: outOfStockShimmerColorIds || undefined,
    ...reviewMeta,
  }
}

let _cache = null
function getAppProducts() {
  if (_cache) return _cache
  _cache = Object.values(productsById).map(toAppProduct).filter(Boolean)
  return _cache
}

export function getProductById(id) {
  if (id == null) return null
  const p = productsById[String(id)]
  return p ? toAppProduct(p) : null
}

export function getProductsForGrid() {
  return getAppProducts()
}

export function getProductsByCategory(category) {
  if (!category) return []
  return getAppProducts().filter((prod) => prod.category === category)
}
