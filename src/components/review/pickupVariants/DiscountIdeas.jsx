/**
 * Discount-salience lab (post-UT round 2) — research showed users don't
 * notice the pickup discount on the review page. Seven ways of surfacing it,
 * one per feed product:
 *   1 save-eyebrow      green savings strip on the pickup card
 *   2 price-motion      the price visibly strikes and drops, on a loop
 *   3 coupon-banner     coupon between the two delivery cards
 *   4 save-ticket       SAVE ticket right under the pickup label
 *   5 applied-toast     "discount applied" toast on landing
 *   6 compare-eyebrows  standard vs lowest price framing on both cards
 *   7 offer-band-plus   the top offer band advertises the extra pickup OFF
 */

import { useEffect, useState } from 'react'
import './DiscountIdeas.css'

/* Scalloped % seal — discount language used across the app */
const PercentSeal = ({ size = 30 }) => (
  <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
    <path
      d="M16 1.5l3.2 2.4 3.9-.8 1.7 3.6 3.9 1-.1 4 3 2.6-2 3.5 2 3.5-3 2.6.1 4-3.9 1-1.7 3.6-3.9-.8-3.2 2.4-3.2-2.4-3.9.8-1.7-3.6-3.9-1 .1-4-3-2.6 2-3.5-2-3.5 3-2.6-.1-4 3.9-1L8.9 3l3.9.8L16 1.5Z"
      fill="var(--green-base)"
    />
    <path
      d="M12 20l8-8M12.6 13.4a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6ZM19.4 21.2a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6Z"
      stroke="#fff"
      strokeWidth="1.7"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
)

const CheckSeal = () => (
  <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden>
    <circle cx="10" cy="10" r="9" fill="#fff" opacity="0.22" />
    <circle cx="10" cy="10" r="7" fill="#fff" />
    <path
      d="m6.6 10.2 2.3 2.3 4.5-4.8"
      stroke="var(--green-base)"
      strokeWidth="1.9"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/* ---- 1. Green savings eyebrow ---- */

const SaveEyebrow = ({ pickupSavings, pickupTotal }) => (
  <div className="di-eyebrow dtr-shimmer">
    <span className="di-eyebrow-text">
      Save <strong>₹{pickupSavings}</strong> with Store Pickup
    </span>
    <span className="di-eyebrow-chip">₹{pickupTotal} only</span>
  </div>
)

export const treatmentSaveEyebrow = { PickupEyebrow: SaveEyebrow }

/* ---- 2. Price strike motion (loops) ---- */

function MotionPrice({ homeTotal, pickupTotal, pickupSavings }) {
  /** 0 = full price · 1 = struck · 2 = discounted price landed */
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      setPhase(2)
      return undefined
    }
    let timers = []
    const run = () => {
      setPhase(0)
      timers.push(window.setTimeout(() => setPhase(1), 900))
      timers.push(window.setTimeout(() => setPhase(2), 1500))
      timers.push(window.setTimeout(run, 6200))
    }
    run()
    return () => timers.forEach(window.clearTimeout)
  }, [])

  return (
    <span
      className={`dtr-card-price dtr-card-price--pickup di-motion di-motion--p${phase}`}
      aria-label={`₹${pickupTotal} after ₹${pickupSavings} store pickup discount`}
    >
      <span className="di-motion-mrp">
        ₹{homeTotal}
        <span className="di-motion-strike" aria-hidden />
      </span>
      <span className="di-motion-amount">₹{pickupTotal}</span>
      <span className="dtr-card-save-chip di-motion-chip">Save ₹{pickupSavings}</span>
    </span>
  )
}

export const treatmentPriceMotion = { PickupPrice: MotionPrice }

/* ---- 3. Coupon banner between the cards ---- */

export const CouponBanner = ({ pickupSavings }) => (
  <div className="di-coupon dtr-shimmer" role="note">
    <PercentSeal />
    <span className="di-coupon-text">
      <strong>Extra ₹{pickupSavings} OFF</strong>
      <span>on Deliver to Meesho Pickup Store</span>
    </span>
  </div>
)

/* ---- 4. SAVE ticket under the pickup label ---- */

const SaveTicket = ({ pickupSavings }) => (
  <span className="di-ticket-wrap">
    <span className="di-ticket">SAVE ₹{pickupSavings}</span>
    <span className="di-ticket-sub">cheaper than home delivery</span>
  </span>
)

export const treatmentSaveTicket = { PickupSubLabel: SaveTicket }

/* ---- 5. "Discount applied" toast on landing ---- */

export function AppliedToast({ pickupSavings }) {
  const [stage, setStage] = useState('hidden')

  useEffect(() => {
    const tIn = window.setTimeout(() => setStage('in'), 600)
    const tOut = window.setTimeout(() => setStage('out'), 4800)
    return () => {
      window.clearTimeout(tIn)
      window.clearTimeout(tOut)
    }
  }, [])

  if (stage === 'hidden') return null
  return (
    <div className={`di-toast${stage === 'out' ? ' di-toast--out' : ''}`} role="status">
      <CheckSeal />
      <span>
        Store Pickup discount applied · You save <strong>₹{pickupSavings}</strong>
      </span>
    </div>
  )
}

/* ---- 6. Standard vs lowest price eyebrows ---- */

const StdHomeEyebrow = ({ homeTotal }) => (
  <div className="di-cmp di-cmp--home">
    <span className="di-cmp-label">Standard price</span>
    <strong className="di-cmp-price">₹{homeTotal}</strong>
  </div>
)

const LowPickupEyebrow = ({ pickupTotal, pickupSavings }) => (
  <div className="di-cmp di-cmp--pickup dtr-shimmer">
    <span className="di-cmp-label">
      Lowest price · <strong>Save ₹{pickupSavings}</strong>
    </span>
    <strong className="di-cmp-price">₹{pickupTotal}</strong>
  </div>
)

export const treatmentCompareEyebrows = {
  hidePrices: true,
  HomeEyebrow: StdHomeEyebrow,
  PickupEyebrow: LowPickupEyebrow,
}

/* ---- 7. Top offer band advertises the pickup discount ---- */

const OfferBandPlus = ({ pickupSavings }) => (
  <p className="di-band-plus">
    + Extra <strong>₹{pickupSavings} OFF</strong> with Store Pickup
    <span className="di-band-plus-arrow" aria-hidden>
      ↓
    </span>
  </p>
)

export const treatmentOfferBandPlus = { OfferBandExtra: OfferBandPlus }
