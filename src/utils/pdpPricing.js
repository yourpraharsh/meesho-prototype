/** Shared PDP price resolution — used by PDP, BuyNow sheet, and review checkout. */

export function resolveDisplayPrice(product, selectedOptions) {
  if (!product?.price_summary) return 0
  const layers = product.vsku?.layers || []
  let unitPrice = product.price_summary.price
  let unitMrp = product.price_summary.mrp

  layers.forEach((layer) => {
    const optId = selectedOptions[layer.axis_id]
    const opt = layer.options?.find((o) => o.option_id === optId)
    if (!opt?.delta) return
    if (layer.layer_type === 'VALUE') {
      if (opt.delta.price != null) return
      return
    }
    if (opt.delta.price != null) unitPrice = opt.delta.price
    if (opt.delta.mrp != null) unitMrp = opt.delta.mrp
  })

  const valueLayer = layers.find((l) => l.layer_type === 'VALUE')
  const valueOptId = valueLayer && selectedOptions[valueLayer.axis_id]
  const valueOpt = valueLayer?.options?.find((o) => o.option_id === valueOptId)
  if (valueOpt?.delta?.price != null) return valueOpt.delta.price
  return unitPrice
}

export function resolveDisplayMrp(product, selectedOptions) {
  if (!product?.price_summary) return null
  const layers = product.vsku?.layers || []
  let unitMrp = product.price_summary.mrp
  layers.forEach((layer) => {
    const optId = selectedOptions[layer.axis_id]
    const opt = layer.options?.find((o) => o.option_id === optId)
    if (!opt?.delta) return
    if (layer.layer_type === 'VALUE') {
      if (opt.delta.mrp != null) return
      return
    }
    if (opt.delta.mrp != null) unitMrp = opt.delta.mrp
  })
  const valueLayer = layers.find((l) => l.layer_type === 'VALUE')
  const valueOptId = valueLayer && selectedOptions[valueLayer.axis_id]
  const valueOpt = valueLayer?.options?.find((o) => o.option_id === valueOptId)
  if (valueOpt?.delta?.mrp != null) return valueOpt.delta.mrp
  return unitMrp
}

export function getOptionPrice(product, selectedOptions, layer, option) {
  const layers = product.vsku?.layers || []
  if (layer.layer_type === 'VALUE' && option.delta?.price != null) return option.delta.price
  let unit = product.price_summary?.price ?? 0
  layers.forEach((l) => {
    if (l.layer_type === 'VALUE') return
    const o = l.options?.find((op) => op.option_id === selectedOptions[l.axis_id])
    if (o?.delta?.price != null) unit = o.delta.price
  })
  if (layer.layer_type === 'VALUE') return unit
  return option.delta?.price ?? unit
}

function getFunctionalLayer(layers) {
  const func = (layers ?? []).filter((l) => l.layer_type === 'FUNCTIONAL')
  const priority = ['size', 'volume', 'capacity', 'quantity', 'net_qty']
  for (const axis of priority) {
    const found = func.find((l) => l.axis_id === axis)
    if (found?.options?.length) return found
  }
  return func.find((l) => l.options?.length) ?? null
}

/** Size/volume picker in Buy Now — skipped when only one option (auto-selected on PDP). */
export function getBuyNowFunctionalLayer(layers) {
  const layer = getFunctionalLayer(layers)
  if (!layer || layer.options.length <= 1) return null
  return layer
}

export function getFunctionalOptionLabel(layers, selectedOptions) {
  const layer = getFunctionalLayer(layers)
  if (!layer) return null
  const optId = selectedOptions[layer.axis_id]
  const opt = layer.options?.find((o) => o.option_id === optId)
  return opt?.label ?? null
}
