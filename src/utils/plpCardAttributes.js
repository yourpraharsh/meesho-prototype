/**
 * SSCAT-aware pack + attribute chips for PLP comprehension rows.
 * Data source: assets/plp-card-attributes.csv (Excel-friendly).
 */

import attributesCsv from '../../assets/plp-card-attributes.csv?raw'

/** @typedef {{ group: string, packOptions: string[], attributeOptions: string[], titleKeywords: string[] }} CategoryAttributeConfig */

/** @type {Map<string, CategoryAttributeConfig>} */
let configByCategory = null

function parseCsvLine(line) {
  const cells = []
  let cell = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (ch === ',' && !inQuotes) {
      cells.push(cell.trim())
      cell = ''
      continue
    }
    cell += ch
  }
  cells.push(cell.trim())
  return cells
}

function splitPipeList(value) {
  return String(value ?? '')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)
}

function loadConfig() {
  if (configByCategory) return configByCategory
  configByCategory = new Map()

  const lines = attributesCsv.trim().split(/\r?\n/).slice(1)
  for (const line of lines) {
    if (!line.trim()) continue
    const [categoryId, group, packOptions, attributeOptions, titleKeywords] = parseCsvLine(line)
    if (!categoryId) continue
    configByCategory.set(categoryId, {
      group: group || 'other',
      packOptions: splitPipeList(packOptions),
      attributeOptions: splitPipeList(attributeOptions),
      titleKeywords: splitPipeList(titleKeywords),
    })
  }
  return configByCategory
}

function seedFromId(id, salt = 0) {
  let h = salt >>> 0
  const s = String(id ?? '')
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function pickFromPool(pool, id, offset = 0) {
  if (!pool?.length) return null
  return pool[(seedFromId(id, offset) + offset) % pool.length]
}

function getConfig(product) {
  const map = loadConfig()
  const categoryId = product?.categoryId
  if (categoryId && map.has(categoryId)) return map.get(categoryId)

  const sscat = String(product?.sscat ?? product?.category ?? '').toLowerCase()
  if (sscat.includes('diaper')) return map.get('baby_diaper')
  if (sscat.includes('lipstick')) return map.get('beauty_lipstick')
  if (sscat.includes('shampoo')) return map.get('beauty_shampoo')
  if (sscat.includes('hair oil') || sscat.includes('hairoil')) return map.get('beauty_hair_oil')
  if (sscat.includes('bottle')) return map.get('kitchen_water_bottle')
  if (sscat.includes('bedsheet')) return map.get('home_bedsheets')
  if (sscat.includes('cooker')) return map.get('kitchen_cooker')
  if (sscat.includes('shoe')) return map.get('mens_shoes')
  if (sscat.includes('saree')) return map.get('women_saree')
  if (sscat.includes('kurti')) return map.get('women_kurti')
  if (sscat.includes('shirt')) return map.get('mens_shirts')
  if (sscat.includes('top') && sscat.includes('bottom')) return map.get('lod_top_bottom_sets')

  return { group: 'other', packOptions: [], attributeOptions: [], titleKeywords: [] }
}

/** Material / fabric chips — at most one per comprehension card (Figma VD rule). */
const FABRIC_ATTRIBUTE_LABELS = new Set([
  'Rayon',
  'Cotton',
  'Silk Blend',
  'Georgette',
  'Chiffon',
  'Crepe',
  'Polyester',
  'Linen',
  'Rayon Blend',
  'Denim',
  'Oxford Cotton',
  'Polyester Blend',
  'Silk',
  'Banarasi',
  'Art Silk',
  'PU Leather',
  'Canvas',
  'Mesh',
  'Synthetic',
])

function isFabricAttribute(label) {
  return FABRIC_ATTRIBUTE_LABELS.has(String(label ?? '').trim())
}

/** @param {string} label */
export function attributeIsFabric(label) {
  return isFabricAttribute(label)
}

/**
 * Deterministic fabric chip for fashion SSCATs (group === fashion).
 * @param {object} product
 * @param {number} [globalIndex]
 * @returns {string|null}
 */
export function pickFabricLabel(product, globalIndex = 0) {
  const config = getConfig(product)
  const fabricPool = config.attributeOptions.filter(isFabricAttribute)
  if (!fabricPool.length) return null

  for (const label of inferFromTitle(product, config)) {
    if (isFabricAttribute(label)) return label
  }

  const id = product?.product_id ?? product?.productId ?? globalIndex
  return pickFromPool(fabricPool, id, globalIndex)
}

export function isFashionProduct(product) {
  return getConfig(product).group === 'fashion'
}

const VOLUME_LABEL_RE = /^(\d+(\.\d+)?)\s*(ml|l|litre|liter)$/i

function isVolumeAttribute(label) {
  const t = String(label ?? '').trim()
  if (!t) return false
  if (VOLUME_LABEL_RE.test(t)) return true
  return /^\d+(\.\d+)?(ml|l)$/i.test(t.replace(/\s+/g, ''))
}

/** @param {string} label */
export function attributeIsVolume(label) {
  return isVolumeAttribute(label)
}

export function isBottleProduct(product) {
  return product?.categoryId === 'kitchen_water_bottle'
}

export function isCookerProduct(product) {
  const cat = product?.categoryId
  if (cat === 'kitchen_cooker' || cat === 'kitchen_cooker_volume') return true
  const haystack = `${product?.sscat ?? ''} ${product?.category ?? ''}`.toLowerCase()
  return haystack.includes('cooker')
}

export function needsVolumeAttribute(product) {
  return isBottleProduct(product) || isCookerProduct(product)
}

function matchVolumeOption(label, options) {
  const t = String(label ?? '').trim()
  if (!t || !options?.length) return null
  if (options.includes(t)) return t
  const compact = t.replace(/\s+/g, '').toLowerCase()
  return options.find((opt) => opt.replace(/\s+/g, '').toLowerCase() === compact) ?? null
}

/**
 * Deterministic volume chip for bottles (750ml / 1L …) and cookers (2L / 3L / 5L).
 * @param {object} product
 * @param {number} [globalIndex]
 * @returns {string|null}
 */
export function pickVolumeAttributeLabel(product, globalIndex = 0) {
  const config = getConfig(product)
  if (!needsVolumeAttribute(product)) return null
  const volumePool = config.attributeOptions.filter(isVolumeAttribute)
  if (!volumePool.length) return null

  for (const label of inferFromTitle(product, config)) {
    const matched = matchVolumeOption(label, volumePool)
    if (matched) return matched
  }

  for (const layer of product?.vsku?.layers ?? []) {
    if (layer.layer_type !== 'FUNCTIONAL') continue
    if (layer.axis_id !== 'volume' && layer.axis_id !== 'capacity') continue
    for (const opt of layer.options ?? []) {
      const matched = matchVolumeOption(opt?.label, volumePool)
      if (matched) return matched
    }
  }

  const id = product?.product_id ?? product?.productId ?? globalIndex
  return pickFromPool(volumePool, id, globalIndex)
}

/** @deprecated Use pickVolumeAttributeLabel */
export function pickCookerVolumeLabel(product, globalIndex = 0) {
  return pickVolumeAttributeLabel(product, globalIndex)
}

function hasFabricAttribute(used) {
  for (const label of used) {
    if (isFabricAttribute(label)) return true
  }
  return false
}

function canAddAttribute(label, used) {
  if (!isFabricAttribute(label)) return true
  return !hasFabricAttribute(used)
}

function getListingGalleryCount(product) {
  if (Array.isArray(product?.images?.gallery) && product.images.gallery.length) {
    return product.images.gallery.length
  }
  if (Array.isArray(product?.gallery) && product.gallery.length) {
    return product.gallery.length
  }
  return 0
}

/**
 * Infer pack chip from listing signals (gallery count, title). Returns null if unsupported.
 * @param {object} product
 * @returns {string|null}
 */
export function inferPackFromProduct(product) {
  const config = getConfig(product)
  if (!config.packOptions.length) return null

  if (isMensShirtComboProduct(product)) {
    return inferMensShirtPackLabel(product)
  }

  if (isDiaperProduct(product)) {
    return inferDiaperPackLabel(product)
  }

  const title = String(product?.title ?? product?.legacyTitle ?? '')
  const titleMatch = title.match(/\b(?:pack|combo|set) of (\d+)\b/i)
  if (titleMatch) {
    const label = `Pack of ${titleMatch[1]}`
    if (config.packOptions.includes(label)) return label
  }

  if (product?.categoryId === 'beauty_lipstick') {
    const galleryCount = getListingGalleryCount(product)
    if (galleryCount >= 3 && config.packOptions.includes('Pack of 3')) return 'Pack of 3'
    if (galleryCount === 2 && config.packOptions.includes('Pack of 2')) return 'Pack of 2'
  }

  return null
}

function inferFromTitle(product, config) {
  const title = String(product?.title ?? product?.legacyTitle ?? '').toLowerCase()
  if (!title) return []

  const hits = []
  for (const keyword of config.titleKeywords ?? []) {
    if (title.includes(keyword.toLowerCase())) {
      const match = config.attributeOptions.find((opt) =>
        opt.toLowerCase().includes(keyword.toLowerCase()),
      )
      if (match && !hits.includes(match)) hits.push(match)
    }
  }

  for (const opt of config.attributeOptions) {
    if (title.includes(opt.toLowerCase()) && !hits.includes(opt)) hits.push(opt)
  }

  const out = []
  for (const label of hits) {
    if (!canAddAttribute(label, new Set(out))) continue
    out.push(label)
  }
  return out
}

function inferFromVsku(product, config) {
  const attrs = []
  const group = config.group

  for (const layer of product?.vsku?.layers ?? []) {
    if (layer.layer_type !== 'FUNCTIONAL' || !layer.options?.length) continue
    const opt = layer.options[seedFromId(product.product_id ?? product.productId, 3) % layer.options.length]
    const label = opt?.label
    if (!label) continue

    if (layer.axis_id === 'net_qty' && group === 'baby') {
      attrs.push(label)
      continue
    }
    if (layer.axis_id === 'volume' || layer.axis_id === 'capacity') {
      if (group === 'kitchen' || group === 'fmcg') attrs.push(label)
      continue
    }
    if (layer.axis_id === 'size') {
      if (group === 'baby' || group === 'home') attrs.push(label)
      continue
    }
    if (layer.axis_id === 'quantity' && group === 'beauty') {
      attrs.push(label)
    }
  }

  return attrs
}

function lipstickGalleryImages(product) {
  if (Array.isArray(product?.images?.gallery) && product.images.gallery.length) {
    return product.images.gallery
  }
  if (Array.isArray(product?.gallery) && product.gallery.length) {
    return product.gallery
  }
  return []
}

function countLipstickShades(product) {
  const gallery = lipstickGalleryImages(product)
  const galleryCount = gallery.length
  if (galleryCount > 0) {
    const hasHero =
      Boolean(product?.images?.hero) ||
      Boolean(product?.hero_image_url) ||
      Boolean(product?.base_media?.hero_image)
    return galleryCount + (hasHero ? 1 : 0)
  }
  const visualLayer = product?.vsku?.layers?.find((l) => l.layer_type === 'VISUAL')
  if (visualLayer?.options?.length) return visualLayer.options.length
  return product?.hero_image_url || product?.base_media?.hero_image ? 1 : 0
}

/** Multi-shade lipstick listings (3+ swatches in gallery) → finish + quantity chips. */
function inferFromLipstickGallery(product, config) {
  if (product?.categoryId !== 'beauty_lipstick' || config.group !== 'beauty') return []
  if (countLipstickShades(product) < 3) return []

  const used = new Set()
  const attrs = []

  for (const label of inferFromTitle(product, config)) {
    if (attrs.length >= 1) break
    if (!used.has(label)) {
      used.add(label)
      attrs.push(label)
    }
  }

  for (const label of inferFromVsku(product, config)) {
    if (attrs.length >= 2) break
    if (!used.has(label)) {
      used.add(label)
      attrs.push(label)
    }
  }

  const finishFallback = ['Matte', 'Long Stay', 'Velvet']
  for (const pick of finishFallback) {
    if (attrs.length >= 2) break
    if (config.attributeOptions.includes(pick) && !used.has(pick)) {
      used.add(pick)
      attrs.push(pick)
    }
  }

  return attrs.slice(0, 2)
}

function fillFromPool(product, config, count, used) {
  const id = product?.product_id ?? product?.productId ?? '0'
  const out = []
  let offset = 0
  let pool = [...config.attributeOptions]
  if (!hasFabricAttribute(used)) {
    const fabrics = pool.filter(isFabricAttribute)
    const rest = pool.filter((label) => !isFabricAttribute(label))
    pool = [...fabrics, ...rest]
  } else {
    pool = pool.filter((label) => !isFabricAttribute(label))
  }
  while (out.length < count && pool.length) {
    const pick = pickFromPool(pool, id, offset)
    offset += 1
    const idx = pool.indexOf(pick)
    if (idx === -1 || used.has(pick) || !canAddAttribute(pick, used)) {
      if (idx !== -1) pool.splice(idx, 1)
      continue
    }
    used.add(pick)
    out.push(pick)
    pool.splice(idx, 1)
  }
  return out
}

/**
 * Pick a pack chip label relevant to the product SSCAT, or null if unsupported.
 * @param {object} product
 * @param {number} globalIndex
 */
export function pickPackLabel(product, globalIndex) {
  const config = getConfig(product)
  if (!config.packOptions.length) return null
  const id = product?.product_id ?? product?.productId ?? globalIndex
  return pickFromPool(config.packOptions, id, globalIndex)
}

/**
 * Pick 0–N attribute chips scoped to the product SSCAT / VSKU / title.
 * @param {object} product
 * @param {number} count
 * @param {number} globalIndex
 * @returns {string[]}
 */
export function pickAttributeLabels(product, count, globalIndex, packLabel = null) {
  if (!count || count <= 0) return []

  const config = getConfig(product)
  if (!config.attributeOptions.length) return []

  const used = new Set()
  const attrs = []
  const packCount = packLabel ? parseMultiUnitCount(packLabel) : null

  for (const label of inferFromLipstickGallery(product, config)) {
    if (attrs.length >= count) break
    if (!used.has(label) && canAddAttribute(label, used)) {
      used.add(label)
      attrs.push(label)
    }
  }

  if (
    packCount != null &&
    packCount > 1 &&
    product?.categoryId === 'beauty_lipstick' &&
    attrs.length < count
  ) {
    const quantityLabels = inferFromVsku(product, config).filter((label) => /\d+\s*gm\b/i.test(label))
    for (const label of quantityLabels) {
      if (attrs.length >= count) break
      if (!used.has(label) && canAddAttribute(label, used)) {
        used.add(label)
        attrs.push(label)
      }
    }
  }

  for (const label of inferFromVsku(product, config)) {
    if (attrs.length >= count) break
    if (!used.has(label) && canAddAttribute(label, used)) {
      used.add(label)
      attrs.push(label)
    }
  }

  for (const label of inferFromTitle(product, config)) {
    if (attrs.length >= count) break
    if (!used.has(label) && canAddAttribute(label, used)) {
      used.add(label)
      attrs.push(label)
    }
  }

  if (attrs.length < count) {
    attrs.push(...fillFromPool(product, config, count - attrs.length, used))
  }

  return attrs.slice(0, count)
}

export function supportsPackChip(product) {
  return getConfig(product).packOptions.length > 0
}

export function getAttributeGroup(product) {
  return getConfig(product).group
}

const COMBO_OFFER_EXCLUDED_CATEGORY_IDS = new Set(['baby_diaper'])

/** All mens shirt listings in this proto are combo offers (Pack of 2 / 3). */
export function isMensShirtComboProduct(product) {
  return product?.categoryId === 'mens_shirts'
}

function inferMensShirtPackLabel(product) {
  const config = getConfig(product)
  if (!isMensShirtComboProduct(product) || !config.packOptions.length) return null
  const id = String(product?.product_id ?? product?.productId ?? product?.id ?? '0')
  const bucket = seedFromId(id, 11) % 10
  if (bucket < 3 && config.packOptions.includes('Pack of 3')) return 'Pack of 3'
  if (config.packOptions.includes('Pack of 2')) return 'Pack of 2'
  return config.packOptions[0] ?? null
}

/** All diaper listings show a pack-size chip (Pack of 40 / 56 / 64 / 72 / 80). */
export function inferDiaperPackLabel(product, globalIndex = 0) {
  const config = getConfig(product)
  if (!isDiaperProduct(product) || !config.packOptions.length) return null

  const title = String(product?.title ?? product?.legacyTitle ?? '')
  const titleMatch = title.match(/\b(?:pack|combo|set) of (\d+)\b/i)
  if (titleMatch) {
    const label = `Pack of ${titleMatch[1]}`
    if (config.packOptions.includes(label)) return label
  }

  for (const layer of product?.vsku?.layers ?? []) {
    if (layer.layer_type !== 'FUNCTIONAL' || layer.axis_id !== 'net_qty') continue
    for (const opt of layer.options ?? []) {
      const label = String(opt?.label ?? '').trim()
      if (config.packOptions.includes(label)) return label
    }
  }

  const id = product?.product_id ?? product?.productId ?? globalIndex
  return pickFromPool(config.packOptions, id, globalIndex)
}

const COORD_SET_CATEGORY_IDS = new Set(['women_top_bottom_sets', 'lod_top_bottom_sets'])

function parseMultiUnitCount(label) {
  const match = String(label ?? '').match(/\b(?:pack|combo|set) of (\d+)\b/i)
  if (!match) return null
  const n = Number(match[1])
  return Number.isFinite(n) ? n : null
}

export function isDiaperProduct(product) {
  if (COMBO_OFFER_EXCLUDED_CATEGORY_IDS.has(product?.categoryId)) return true
  const haystack = `${product?.sscat ?? ''} ${product?.category ?? ''}`.toLowerCase()
  return haystack.includes('diaper')
}

function isCoordSetProduct(product) {
  if (COORD_SET_CATEGORY_IDS.has(product?.categoryId)) return true
  const haystack = `${product?.sscat ?? ''} ${product?.category ?? ''}`.toLowerCase()
  return (
    haystack.includes('co-ord') ||
    haystack.includes('coord set') ||
    (haystack.includes('top') && haystack.includes('bottom'))
  )
}

function hasMultiItemSignal(product, packChip = null) {
  if (isMensShirtComboProduct(product)) return true

  const packCount = packChip ? parseMultiUnitCount(packChip) : null
  if (packCount != null && packCount > 1) return true

  for (const layer of product?.vsku?.layers ?? []) {
    if (layer.axis_id === 'combo' || layer.layer_type === 'VALUE') return true
    for (const opt of layer.options ?? []) {
      const n = parseMultiUnitCount(opt?.label)
      if (n != null && n > 1) return true
    }
  }

  const title = String(product?.title ?? product?.legacyTitle ?? '')
  if (/\b(?:pack|combo|set) of [2-9]\d*\b/i.test(title)) return true

  return false
}

function isBundleComboLabel(label) {
  return /\s+\+\s+/.test(String(label ?? ''))
}

/** Combo offer for multi-item products, co-ord sets, and bundle labels; never on diapers. */
export function supportsComboOffer(product, packChip = null, comprehensionLabel = null) {
  if (isDiaperProduct(product)) return false
  if (isBundleComboLabel(comprehensionLabel)) return true
  if (isCoordSetProduct(product)) return true
  return hasMultiItemSignal(product, packChip)
}
