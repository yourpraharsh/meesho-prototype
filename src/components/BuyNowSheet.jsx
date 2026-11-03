import { useMemo, useState } from 'react'
import { RETURN_TYPES, buildCheckoutState, isBuyNowSizeSelectionValid } from '../utils/checkoutConfig'
import { computeOrder } from '../utils/computeOrder'
import '../components/VskuPills.css'
import './BuyNowSheet.css'
import '../styles/pdp-sot/buy-now-sheet.css'

function getOutOfStockIds(product, selectedOptions) {
  const oos = new Set()
  if (!product?.outOfStock) return oos
  const visualLayers = (product.vsku?.layers ?? []).filter((l) => l.layer_type === 'VISUAL')
  visualLayers.forEach((vLayer) => {
    const selectedVisualId = selectedOptions[vLayer.axis_id]
    if (!selectedVisualId) return
    const map = product.outOfStock[vLayer.axis_id]
    const list = map?.[selectedVisualId]
    if (Array.isArray(list)) list.forEach((id) => oos.add(id))
  })
  return oos
}

const CheckBadgeIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" width="10" height="10" aria-hidden>
    <path d="M3 8.5 6.5 12 13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="24" height="24" aria-hidden>
    <path
      d="M18 6L6 18M6 6l12 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const OfferIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" width="12" height="12" aria-hidden>
    <path
      d="M2 2h8v8H2V2Zm1.2 1.2v1.2h1.2V3.2H3.2Zm3.6 0v1.2h1.2V3.2H6.8ZM3.2 6.8v1.2h1.2V6.8H3.2Zm3.6 0v1.2h1.2V6.8H6.8Z"
      fill="currentColor"
    />
  </svg>
)

/**
 * Figma 1766:14540 — size + return type bottom sheet on Buy Now.
 * Add to Cart opens the same sheet with `ctaLabel="Add to Cart"`; `onConfirm` gets the
 * checkout state (buildCheckoutState) either way.
 */
export default function BuyNowSheet({
  product,
  functionalLayer,
  selectedOptions,
  onSelectOption,
  oosOptionIds,
  onClose,
  onConfirm,
  ctaLabel = 'Buy Now',
}) {
  const [returnTypeId, setReturnTypeId] = useState('all_easy')

  const sheetSelectedOptions = selectedOptions
  const order = useMemo(
    () => computeOrder(product, sheetSelectedOptions, returnTypeId),
    [product, sheetSelectedOptions, returnTypeId],
  )

  const sizeOptionId = functionalLayer ? sheetSelectedOptions[functionalLayer.axis_id] : null
  const canConfirm = isBuyNowSizeSelectionValid(functionalLayer, sheetSelectedOptions, oosOptionIds)

  const sheetTitle = functionalLayer
    ? `Select ${functionalLayer.axis_label}`
    : 'Select Return Type'
  const showReturnSectionHeading = Boolean(functionalLayer)

  const handleConfirm = () => {
    if (!canConfirm) return
    onConfirm(
      buildCheckoutState(
        product,
        product?.vsku?.layers,
        sheetSelectedOptions,
        returnTypeId,
        functionalLayer,
      ),
    )
  }

  return (
    <div className="buy-now-sheet-backdrop" onClick={onClose} aria-hidden="true">
      <div
        className="buy-now-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="buy-now-sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="buy-now-sheet-handle" aria-hidden />

        <div className="buy-now-sheet-header">
          <h2 id="buy-now-sheet-title" className="buy-now-sheet-title">
            {sheetTitle}
          </h2>
          <button type="button" className="buy-now-sheet-close" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        {functionalLayer && (
          <>
            <div className="pdp-vsku-options-wrap buy-now-sheet-size-options">
              <div className="pdp-vsku-options">
                {functionalLayer.options?.map((opt) => {
                  const isSelected = opt.option_id === sizeOptionId
                  const isOos = oosOptionIds?.has(opt.option_id)
                  return (
                    <div key={opt.option_id} className="pdp-vsku-option-wrap">
                      <button
                        type="button"
                        disabled={isOos}
                        className={`pdp-vsku-pill${isSelected ? ' selected' : ''}${isOos ? ' oos' : ''}`}
                        onClick={() => onSelectOption(functionalLayer.axis_id, opt.option_id)}
                      >
                        {opt.label}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="buy-now-sheet-divider" aria-hidden />
          </>
        )}

        <section className="buy-now-sheet-section buy-now-sheet-section--returns" aria-label="Select Return Type">
          {showReturnSectionHeading && (
            <h3 className="buy-now-sheet-section-label">Select Return Type</h3>
          )}
          <div className="buy-now-sheet-return-grid">
            {RETURN_TYPES.map((rt) => {
              const rtOrder = computeOrder(product, sheetSelectedOptions, rt.id)
              const isSelected = returnTypeId === rt.id
              const showOffer = rt.savingsRatio > 0 && rtOrder.returnSavings > 0
              return (
                <button
                  key={rt.id}
                  type="button"
                  className={`buy-now-sheet-return-card${isSelected ? ' buy-now-sheet-return-card--selected' : ''}${showOffer ? ' buy-now-sheet-return-card--has-offer' : ''}`}
                  onClick={() => setReturnTypeId(rt.id)}
                >
                  {isSelected && (
                    <span className="buy-now-sheet-return-check" aria-hidden>
                      <CheckBadgeIcon />
                    </span>
                  )}
                  <div className="buy-now-sheet-return-card-top">
                    <div className="buy-now-sheet-return-meta">
                      <span className="buy-now-sheet-return-badge">{rt.badge}</span>
                      <span className="buy-now-sheet-return-desc">{rt.label}</span>
                    </div>
                  </div>
                  <div className="buy-now-sheet-return-price">₹{rtOrder.orderTotal}</div>
                  <div className="buy-now-sheet-return-offer-slot">
                    {showOffer && (
                      <div className="buy-now-sheet-return-offer">
                        <OfferIcon />
                        <span>Special Offer | Save ₹{rtOrder.returnSavings}</span>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <button
          type="button"
          className="buy-now-sheet-cta"
          disabled={!canConfirm}
          onClick={handleConfirm}
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  )
}

export { getOutOfStockIds }
