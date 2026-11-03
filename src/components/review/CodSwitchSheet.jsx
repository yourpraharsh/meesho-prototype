import { useEffect, useRef, useState } from 'react'
import lottie from 'lottie-web'
import storeToHomeAnimation from '../../assets/store-to-home.lottie.json'
import { GPayIcon, PhonePeMark, PaytmMark } from './upiBrandMarks'
import './CodSwitchSheet.css'
import { publicUrl } from '../../utils/publicUrl'

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="20" height="20" aria-hidden>
    <path
      d="M6 6l12 12M18 6L6 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

/** Meesho storefront + home icons — user-supplied assets (Frames 2147226017/18). */
const MStoreGlyph = () => (
  <img className="cod-compare-icon" src={publicUrl('/icons/store.svg')} alt="" aria-hidden />
)

const HomeGlyph = () => (
  <img className="cod-compare-icon" src={publicUrl('/icons/home.svg')} alt="" aria-hidden />
)

/** Cash note glyph — pairs with the home card ("Pay Cash"). */
const CashGlyph = () => (
  <svg viewBox="0 0 48 48" width="42" height="42" aria-hidden>
    <rect x="3" y="13" width="42" height="23" rx="3" fill="#2E9E5B" />
    <circle cx="24" cy="24.5" r="7" fill="#57B97E" />
    <text
      x="24"
      y="28.5"
      textAnchor="middle"
      fill="#fff"
      style={{ font: '800 11px var(--font-mier)' }}
    >
      ₹
    </text>
    <rect x="7.5" y="17.5" width="3" height="14" rx="1.5" fill="#57B97E" />
    <rect x="37.5" y="17.5" width="3" height="14" rx="1.5" fill="#57B97E" />
  </svg>
)

/** Small overlapping UPI app icons — pair with the store ("Pay Online"). */
const UpiAppCluster = ({ size = 19 }) => {
  const mini = { width: size, height: size }
  return (
    <span className="cod-compare-minis" aria-hidden>
      <span className="cod-compare-mini" style={mini}>
        <GPayIcon size={Math.round(size * 0.58)} />
      </span>
      <span className="cod-compare-mini" style={mini}>
        <PhonePeMark size={Math.round(size * 0.9)} />
      </span>
      <span className="cod-compare-mini" style={mini}>
        <PaytmMark size={Math.round(size * 0.9)} radius={20} />
      </span>
    </span>
  )
}

const CheckBadge = () => (
  <span className="cod-confirm-badge" aria-hidden>
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none">
      <path
        d="M5.5 12.5 10 17 18.5 8"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
)

/**
 * COD-after-pickup sheet, confirm-selection design (attached mock):
 * "UPI Payment & Delivery to Store" pre-selected next to "Cash Payment &
 * Delivery to Home"; tapping a card moves the selection, Confirm commits it.
 * Confirming the default (store) keeps pickup + online payment; confirming
 * home switches to COD + home delivery. X / backdrop change nothing.
 */
export function CodSwitchConfirmSheet({ storePayable, homePayable, onPayCash, onDismiss }) {
  const [choice, setChoice] = useState('store')

  return (
    <div className="cod-switch-backdrop" onClick={onDismiss} aria-hidden="true">
      <div
        className="cod-switch-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cod-switch-title"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="cod-switch-handle" aria-hidden />
        <button type="button" className="cod-switch-close" onClick={onDismiss} aria-label="Close">
          <CloseIcon />
        </button>

        <h3 id="cod-switch-title" className="cod-switch-title">
          Confirm your selection
        </h3>

        <div className="cod-confirm-options" role="radiogroup" aria-label="Payment and delivery">
          <button
            type="button"
            role="radio"
            aria-checked={choice === 'store'}
            className={`cod-confirm-card${choice === 'store' ? ' cod-confirm-card--selected' : ''}`}
            onClick={() => setChoice('store')}
          >
            {choice === 'store' && <CheckBadge />}
            <span className="cod-confirm-main">
              <span className="cod-confirm-price">₹{storePayable}</span>
              <span className="cod-confirm-icons">
                <img className="cod-compare-icon" src={publicUrl('/icons/store.svg')} alt="" />
                <span className="cod-confirm-plus">+</span>
                <UpiAppCluster size={24} />
              </span>
            </span>
            <span className="cod-confirm-caption">
              UPI Payment &amp;
              <br />
              Delivery to Store
            </span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={choice === 'home'}
            className={`cod-confirm-card${choice === 'home' ? ' cod-confirm-card--selected' : ''}`}
            onClick={() => setChoice('home')}
          >
            {choice === 'home' && <CheckBadge />}
            <span className="cod-confirm-main">
              <span className="cod-confirm-price cod-confirm-price--home">₹{homePayable}</span>
              <span className="cod-confirm-icons">
                <img className="cod-compare-icon" src={publicUrl('/icons/home.svg')} alt="" />
                <span className="cod-confirm-plus">+</span>
                <CashGlyph />
              </span>
            </span>
            <span className="cod-confirm-caption">
              Cash Payment &amp;
              <br />
              Delivery to Home
            </span>
          </button>
        </div>

        <div className="cod-switch-actions">
          <button
            type="button"
            className="cod-switch-cash cod-confirm-cta"
            onClick={() => (choice === 'home' ? onPayCash() : onDismiss())}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * COD-after-pickup sheet, static compare arm (parked — superseded by
 * CodSwitchConfirmSheet after the 25 Aug UT round).
 */
export function CodSwitchCompareSheet({ storePayable, homePayable, onPayCash, onDismiss }) {
  const delta = Math.max(0, homePayable - storePayable)
  return (
    <div className="cod-switch-backdrop" onClick={onDismiss} aria-hidden="true">
      <div
        className="cod-switch-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cod-switch-title"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="cod-switch-handle" aria-hidden />
        <button type="button" className="cod-switch-close" onClick={onDismiss} aria-label="Close">
          <CloseIcon />
        </button>

        <h3 id="cod-switch-title" className="cod-switch-title">
          Switching to Cash Payment &amp; Delivery to Home
        </h3>

        <div className="cod-compare">
          <div className="cod-compare-card">
            <p className="cod-compare-price">₹{storePayable}</p>
            <span className="cod-compare-glyphs">
              <MStoreGlyph />
              <UpiAppCluster />
            </span>
            <p className="cod-compare-caption">Deliver to Store and Pay Online</p>
          </div>
          <svg className="cod-compare-arrow" viewBox="0 0 24 24" width="22" height="22" aria-hidden>
            <path
              d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5"
              stroke="var(--grey-base)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="cod-compare-card">
            <p className="cod-compare-price cod-compare-price--home">
              ₹{homePayable}
              {delta > 0 && <span className="cod-compare-delta">+₹{delta}</span>}
            </p>
            <span className="cod-compare-glyphs">
              <HomeGlyph />
              <CashGlyph />
            </span>
            <p className="cod-compare-caption">Deliver to Home and Pay Cash</p>
          </div>
        </div>

        <p className="cod-compare-note">Cash payment is only available for Delivery to Home</p>

        <div className="cod-switch-actions">
          <button type="button" className="cod-switch-online" onClick={onDismiss}>
            Pay Online
          </button>
          <button type="button" className="cod-switch-cash" onClick={onPayCash}>
            Pay Cash
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * COD-after-pickup sheet, animated flow (Figma 2340:12732).
 * Choreography budget ≤ 3s: store price shows → strikes → COD home price
 * lands in red, while the store morphs into a home (attached Lottie).
 * After a standby hold on the end state, the whole sequence replays.
 */
const STRIKE_AT_MS = 700
const HOME_PRICE_AT_MS = 1300
const LOTTIE_SPEED = 1.05 // 3.02s source → ~2.87s, inside the 3s budget
const STANDBY_MS = 1500 // hold the settled state, then loop

export default function CodSwitchSheet({ storePayable, homePayable, onPayCash, onDismiss }) {
  /** 0 = store price · 1 = struck · 2 = home price in red */
  const [phase, setPhase] = useState(0)
  /** Transitions off for one frame so the loop restart snaps, not rewinds. */
  const [resetting, setResetting] = useState(false)
  const lottieMountRef = useRef(null)

  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    const anim = lottie.loadAnimation({
      container: lottieMountRef.current,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      animationData: storeToHomeAnimation,
    })
    if (reduceMotion) {
      anim.goToAndStop(Math.max(0, anim.totalFrames - 1), true)
      setPhase(2)
      return () => anim.destroy()
    }
    anim.setSpeed(LOTTIE_SPEED)

    let timers = []
    const runCycle = () => {
      setResetting(true)
      setPhase(0)
      window.requestAnimationFrame(() =>
        window.requestAnimationFrame(() => setResetting(false)),
      )
      anim.goToAndStop(0, true)
      anim.play()
      timers.push(window.setTimeout(() => setPhase(1), STRIKE_AT_MS))
      timers.push(window.setTimeout(() => setPhase(2), HOME_PRICE_AT_MS))
    }
    const handleComplete = () => {
      timers.push(window.setTimeout(runCycle, STANDBY_MS))
    }
    anim.addEventListener('complete', handleComplete)
    runCycle()

    return () => {
      timers.forEach(window.clearTimeout)
      anim.removeEventListener('complete', handleComplete)
      anim.destroy()
    }
  }, [])

  return (
    <div className="cod-switch-backdrop" onClick={onDismiss} aria-hidden="true">
      <div
        className="cod-switch-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cod-switch-title"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="cod-switch-handle" aria-hidden />
        <button type="button" className="cod-switch-close" onClick={onDismiss} aria-label="Close">
          <CloseIcon />
        </button>

        <h3 id="cod-switch-title" className="cod-switch-title">
          Switching to Cash Payment &amp; Delivery to Home
        </h3>

        <div className="cod-switch-anim">
          <div
            className={`cod-switch-prices cod-switch-prices--p${phase}${
              resetting ? ' cod-switch-prices--reset' : ''
            }`}
            aria-label={`Store pickup ₹${storePayable} switches to ₹${homePayable} cash on delivery at home`}
          >
            <span className="cod-switch-store-price">
              ₹{storePayable}
              <span className="cod-switch-strike" aria-hidden />
            </span>
            <span className="cod-switch-home-price" aria-hidden={phase < 2}>
              ₹{homePayable}
            </span>
          </div>
          <div ref={lottieMountRef} className="cod-switch-lottie" aria-hidden />
          <p
            className={`cod-switch-caption${phase >= 2 ? ' cod-switch-caption--home' : ''}${
              resetting ? ' cod-switch-caption--reset' : ''
            }`}
          >
            <span className="cod-switch-caption-line cod-switch-caption-line--store">
              Deliver to Meesho Pickup Store
            </span>
            <span className="cod-switch-caption-line cod-switch-caption-line--home">
              Deliver to Home
            </span>
          </p>
        </div>

        <div className="cod-switch-actions">
          <button type="button" className="cod-switch-online" onClick={onDismiss}>
            Pay Online
          </button>
          <button type="button" className="cod-switch-cash" onClick={onPayCash}>
            Pay Cash
          </button>
        </div>
      </div>
    </div>
  )
}
