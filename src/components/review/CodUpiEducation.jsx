/**
 * COD-cohort education — UPI-only strip on the pickup card + info sheet.
 * COD testers see no pickup-anytime variants; instead the plain pickup card
 * carries a light-blue "Only on UPI and online payments" strip whose logo
 * cycles NPCI/UPI → GPay → PhonePe → Paytm (same carousel in the sheet's
 * logo tile). Tapping it opens a bottom sheet with a Dismiss CTA that unlocks
 * only after a 5s fill — the sheet never closes on its own, and every close
 * path selects store pickup.
 */

import { useEffect, useState } from 'react'
import { UpiMark, GPayMark, PhonePeMark, PaytmMark } from './upiBrandMarks'
import './CodUpiEducation.css'

const LOGO_CYCLE_MS = 1600
const CTA_UNLOCK_MS = 5000

/* NPCI first, then the UPI apps the user supplied. */
const LOGOS = [
  () => <UpiMark />,
  () => <GPayMark height={14} />,
  () => <PhonePeMark size={20} />,
  () => <PaytmMark size={20} />,
]

const SHEET_LOGOS = [
  () => <UpiMark width={40} height={14} />,
  () => <GPayMark height={16} />,
  () => <PhonePeMark size={30} />,
  () => <PaytmMark size={30} />,
]

function useLogoCarousel(length) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % length), LOGO_CYCLE_MS)
    return () => clearInterval(timer)
  }, [length])
  return index
}

/** Light-blue strip inside the pickup card; the payment logo keeps switching. */
export function UpiOnlyStrip({ onOpen }) {
  const logoIndex = useLogoCarousel(LOGOS.length)
  const Logo = LOGOS[logoIndex]

  return (
    <button
      type="button"
      className="upi-strip"
      onClick={(e) => {
        e.stopPropagation()
        onOpen()
      }}
    >
      {/* key remounts the slot each cycle so the fade-in replays */}
      <span className="upi-strip-logo" key={logoIndex}>
        <Logo />
      </span>
      <span className="upi-strip-text">Only on UPI and online payments</span>
    </button>
  )
}

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="20" height="20" aria-hidden>
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

/**
 * UPI-only info sheet. Never auto-dismisses; the CTA stays disabled while a
 * magenta fill slides across it for 5s. X, backdrop, and the unlocked CTA all
 * close through onClose (the host selects pickup there).
 */
export function UpiOnlySheet({ onClose }) {
  const [ctaReady, setCtaReady] = useState(false)
  const logoIndex = useLogoCarousel(SHEET_LOGOS.length)
  const Logo = SHEET_LOGOS[logoIndex]

  useEffect(() => {
    const timer = setTimeout(() => setCtaReady(true), CTA_UNLOCK_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="upi-sheet-backdrop" onClick={onClose} aria-hidden="true">
      <div
        className="upi-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upi-sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="upi-sheet-topbar">
          <button type="button" className="upi-sheet-close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="upi-sheet-body">
          <div className="upi-sheet-row">
            <span className="upi-sheet-logo">
              <span className="upi-sheet-logo-slot" key={logoIndex}>
                <Logo />
              </span>
            </span>
            <h3 id="upi-sheet-title" className="upi-sheet-title">
              Only UPI &amp; Online Payment allowed on this Delivery Option
            </h3>
          </div>
          <p className="upi-sheet-copy">
            Cash on Delivery is not available on Deliver to Meesho Pickup Store.
          </p>
        </div>

        <div className="upi-sheet-footer">
          <button
            type="button"
            className={`upi-sheet-cta${ctaReady ? ' upi-sheet-cta--ready' : ''}`}
            disabled={!ctaReady}
            onClick={onClose}
          >
            <span className="upi-sheet-cta-fill" aria-hidden />
            <span className="upi-sheet-cta-label">Dismiss</span>
          </button>
        </div>
      </div>
    </div>
  )
}
