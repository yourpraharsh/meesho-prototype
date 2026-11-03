import { useState } from 'react'
import '../VskuPills.css'
import '../BuyNowSheet.css'
import '../../styles/pdp-sot/buy-now-sheet.css'

/* the Buy Now sheet's close glyph (BuyNowSheet.jsx), so both sheets read the same */
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

/**
 * Cart line pickers (Size pill / Qty pill on the cart item card): a one-choice bottom sheet.
 * Built on the Buy Now sheet's chrome and size pills (BuyNowSheet.css + pdp-sot/buy-now-sheet.css),
 * so it picks up the same SoT pills and every Duo posture rule those classes already carry
 * (full-page Stand sheet, rail-axis close, 24px CTA pill). The choice is held here until Done.
 *
 * @param {{ title: string, options: Array<{ id: string|number, label: string }>,
 *   selectedId: string|number|null, disabledIds?: Set, ctaLabel?: string,
 *   onConfirm: (id) => void, onClose: () => void }} props
 */
export default function CartOptionSheet({
  title,
  options,
  selectedId,
  disabledIds,
  ctaLabel = 'Done',
  onConfirm,
  onClose,
}) {
  const [pendingId, setPendingId] = useState(selectedId)
  const canConfirm = pendingId != null && !disabledIds?.has(pendingId)

  return (
    <div className="buy-now-sheet-backdrop cart-sheet-backdrop" role="presentation" onClick={onClose}>
      <div
        className="buy-now-sheet cart-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="buy-now-sheet-handle" aria-hidden />

        <div className="buy-now-sheet-header">
          <h2 id="cart-sheet-title" className="buy-now-sheet-title">
            {title}
          </h2>
          <button type="button" className="buy-now-sheet-close" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="pdp-vsku-options-wrap buy-now-sheet-size-options">
          <div className="pdp-vsku-options" role="radiogroup" aria-label={title}>
            {options.map((opt) => {
              const isSelected = opt.id === pendingId
              const isDisabled = Boolean(disabledIds?.has(opt.id))
              return (
                <div key={opt.id} className="pdp-vsku-option-wrap">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={isDisabled}
                    className={`pdp-vsku-pill${isSelected ? ' selected' : ''}${isDisabled ? ' oos' : ''}`}
                    onClick={() => setPendingId(opt.id)}
                  >
                    {opt.label}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          className="buy-now-sheet-cta"
          disabled={!canConfirm}
          onClick={() => canConfirm && onConfirm(pendingId)}
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  )
}
