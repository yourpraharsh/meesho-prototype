import { useState } from 'react'
import { getPaymentMethodIdsForCohort } from '../../utils/paymentMethods'
import { PaymentMethodCard } from './PaymentMethodCards'
import './PaymentMethodSection.css'

export default function PaymentMethodSection({
  paymentOptions,
  selectedId,
  onSelect,
  qrSeed,
  cohort = 'cod',
  showHeading = true,
}) {
  const [showOffers, setShowOffers] = useState(false)
  const methodIds = getPaymentMethodIdsForCohort(cohort)

  return (
    <section className="review-shell-section payment-method-section" aria-label="Select payment method">
      {showHeading && <h2 className="payment-method-heading">Select Payment Method</h2>}

      <div className="payment-method-list">
        {methodIds.map((id) => {
          const option = paymentOptions[id]
          if (!option) return null
          return (
            <PaymentMethodCard
              key={id}
              option={option}
              selected={selectedId === id}
              onSelect={onSelect}
              onViewOffers={() => setShowOffers(true)}
              qrSeed={qrSeed}
            />
          )
        })}
      </div>

      {showOffers && (
        <div className="payment-offers-backdrop" onClick={() => setShowOffers(false)} aria-hidden="true">
          <div
            className="payment-offers-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-offers-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* glass close (shown in the iPhone Duo layouts) */}
            <button type="button" className="sheet-x payment-offers-x" aria-label="Close" onClick={() => setShowOffers(false)}>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </button>
            <h3 id="payment-offers-title">Bank offers</h3>
            <p>Extra discount with select bank cards and UPI apps at payment.</p>
            <button type="button" className="payment-offers-close" onClick={() => setShowOffers(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
