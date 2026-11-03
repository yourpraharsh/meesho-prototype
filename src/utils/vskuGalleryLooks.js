/** Gallery angles (Look 1, Look 2…) — hero carousel only, not color/size VSKU. */

function getVisualOptionImageUrl(option) {
  if (option?.image?.url) return option.image.url
  if (option?.image?.type === 'URL' && option.image.url) return option.image.url
  if (option?.swatch?.type === 'IMAGE' && option.swatch.value) return option.swatch.value
  return null
}

/**
 * Lipstick shade row — only when shades truly differ (swatch, price, or 1:1 unique images).
 * Hides synthetic shade lists that reuse gallery photos via modulo.
 */
export function lipstickShadesHaveDifference(layer) {
  const options = layer?.options ?? []
  if (options.length <= 1) return false

  if (options.some((o) => o.swatch?.type === 'COLOR')) return true

  if (options.some((o) => o.delta?.price != null && o.delta.price !== 0)) return true

  if (options.some((o) => o.delta?.heroImage || (o.delta?.gallery?.length ?? 0) > 0)) return true

  const imageUrls = options.map(getVisualOptionImageUrl).filter(Boolean)
  if (!imageUrls.length) return false

  const uniqueImages = new Set(imageUrls)
  return uniqueImages.size > 1 && uniqueImages.size === options.length
}

/** Whether a VISUAL VSKU row should render on PDP (category-aware). */
export function shouldShowPdpVisualLayer(product, layer) {
  if (!layer || layer.layer_type !== 'VISUAL') return false
  if (isGalleryLookLayer(layer)) return false
  if ((layer.options?.length ?? 0) <= 1) return false

  if (product?.categoryId === 'beauty_lipstick') {
    return lipstickShadesHaveDifference(layer)
  }

  return true
}

export function isGalleryLookOption(option) {
  const id = String(option?.option_id ?? '').toLowerCase()
  const label = String(option?.label ?? '').trim()
  return /^look[_-]?\d+/.test(id) || /^look\s*\d+$/i.test(label)
}

export function isGalleryLookVisual(visual) {
  if (!visual?.length) return false
  return visual.every((entry) =>
    isGalleryLookOption({ option_id: entry?.id, label: entry?.label }),
  )
}

export function isGalleryLookLayer(layer) {
  if (layer?.layer_type !== 'VISUAL') return false
  const options = layer?.options ?? []
  if (!options.length) return false
  return options.every(isGalleryLookOption)
}

/** Deduped hero + gallery URLs from product images and look entries. */
export function mergeGalleryImageUrls(product) {
  const hero = product?.images?.hero
  const gallery = Array.isArray(product?.images?.gallery) ? product.images.gallery : []
  const lookUrls = isGalleryLookVisual(product?.vsku?.visual)
    ? product.vsku.visual.map((v) => v.hero || v.thumb).filter(Boolean)
    : []
  return [...new Set([hero, ...lookUrls, ...gallery].filter(Boolean))]
}
