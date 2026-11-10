import { useEffect, useState } from 'react'
import { useRailActions } from '../context/RailContext'
import { scrollRootTo } from '../utils/scrollRoot'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { deliveryOtp, etaDay, getOrderById, isOutForDelivery, orderNumber, shortDate, shortEta, updateOrder } from '../utils/orders'
import { DELIVERY_TYPE, getPickupSavings, getPickupStores, PICKUP_HOLD_DAYS } from '../utils/deliveryTypes'
import { getReturnTypeById } from '../utils/checkoutConfig'
import { parseHoursRange } from '../utils/pickupVariants'
import { getProductById } from '../data/products'
import { useCheckoutAddress } from '../components/review/useCheckoutAddress'
import { SceneArt } from '../components/odp/Illustrations'
import SkinText from '../components/SkinText'
import { CopyIcon, OtpBlocks } from '../components/order/DeliveryOtp'
import { useFlash } from '../hooks/useFlash'
import { copyText, deliveryOtpMessage } from '../utils/deliveryOtp'
/* Figma Self-pickup v2 · ODP 3996:8524 (the plain ODP) — exported icons */
import appbarBackSrc from '../assets/payment-sot/top/appbar-back.svg'
import chevronRightSrc from '../assets/review-sot/chevron-right-grey.svg'
import metaPinSrc from '../assets/review-sot/meta-pin.svg'
import metaWalkSrc from '../assets/review-sot/meta-walk.svg'
import actionMapSrc from '../assets/review-sot/action-map.svg'
import actionCallSrc from '../assets/review-sot/action-call.svg'
import helpSrc from '../assets/odp-sot/help.svg'
import mallLogoSrc from '../assets/odp-sot/mall-logo.svg'
import statusIconSrc from '../assets/odp-sot/status-on-the-way.svg'
import tickSrc from '../assets/odp-sot/tick.svg'
import tooltipStatusSrc from '../assets/odp-sot/tooltip-status.svg'
import tooltipChevronSrc from '../assets/odp-sot/tooltip-chevron.svg'
import truckBodySrc from '../assets/odp-sot/truck-body.svg'
import truckCabSrc from '../assets/odp-sot/truck-cab.svg'
import truckWheelSrc from '../assets/odp-sot/truck-wheel.svg'
import locationSrc from '../assets/odp-sot/location.svg'
import cardSrc from '../assets/odp-sot/card.svg'
import shareSrc from '../assets/pdp-sot/info/share.svg'
import './OrderDetails.css'
import '../styles/odp-sot/odp.css'
import { publicUrl } from '../utils/publicUrl'

const IMAGE_FALLBACK = 'https://placehold.co/400x400/e2e8f0/64748b?text=Product'
const DEMO_STORE_PHOTO = publicUrl('/stores/demo-store.png')
const STATE_BY_CITY = { Nagpur: 'Maharashtra', Bangalore: 'Karnataka', Bengaluru: 'Karnataka' }
const HOLD_DAYS = PICKUP_HOLD_DAYS

/* ---------- icons ---------- */

const BackIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
    <path className="glass-chevron" d="m15 5-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    <path className="glass-arrow" d="M10 17L5 12L9.99996 7M5 12H19" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
  </svg>
)

const HelpIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
    <path d="M9.5 3.5 11 7l-2 1.5a10 10 0 0 0 6.5 6.5L17 13l3.5 1.5V19a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.1 1.5 1.5 0 0 1 5 3.5h4.5Z" strokeLinejoin="round" />
    <path d="M13 3.5h7v5h-4l-2 2v-2h-1v-5Z" strokeLinejoin="round" />
  </svg>
)


/* timeline mark: 18px disc (green when done, T3 when not) with a white 1.5px ring and the 14px tick */
const CheckNode = ({ done }) => (
  <span className={`odp-mark${done ? ' odp-mark--done' : ''}`} aria-hidden>
    <img src={tickSrc} alt="" />
  </span>
)

/* the current-position lorry (progress/position5): 20x16 white tile, parts as exported */
const TruckIcon = () => (
  <span className="odp-lorry" aria-hidden>
    <img className="odp-lorry-body" src={truckBodySrc} alt="" />
    <img className="odp-lorry-cab" src={truckCabSrc} alt="" />
    <img className="odp-lorry-wheel odp-lorry-wheel--back" src={truckWheelSrc} alt="" />
    <img className="odp-lorry-wheel odp-lorry-wheel--front" src={truckWheelSrc} alt="" />
  </span>
)

const StatusIcon = () => <img className="odp-status-icon" src={statusIconSrc} alt="" aria-hidden />



const StoreIcon = ({ size = 30 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
    <path d="M3 9.5 5 4h14l2 5.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z" fill="var(--jamun-base)" />
    <path d="M4.5 12.5V20h15v-7.5" fill="none" stroke="var(--jamun-base)" strokeWidth="2" strokeLinejoin="round" />
    <rect x="10" y="14.5" width="4" height="5.5" fill="var(--jamun-base)" />
  </svg>
)

const HomeSmallIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
    <path d="M4 11 12 4l8 7v9H4v-9Z" strokeLinejoin="round" />
    <path d="M10 20v-6h4v6" strokeLinejoin="round" />
  </svg>
)







const CashIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
    <rect x="2.5" y="6" width="19" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.6" />
    <path d="M6 9.5v5M18 9.5v5" strokeLinecap="round" />
  </svg>
)

const StorePhoto = ({ src, className }) => (
  <img
    className={className}
    src={src || DEMO_STORE_PHOTO}
    alt=""
    onError={(e) => {
      if (!e.currentTarget.src.endsWith(DEMO_STORE_PHOTO)) e.currentTarget.src = DEMO_STORE_PHOTO
    }}
  />
)

/* ---------- switch sheet (shared by every idea) ---------- */

function SwitchToPickupSheet({ store, savings, eta, onConfirm, onClose }) {
  return (
    <div className="odp-sheet-backdrop" onClick={onClose} aria-hidden="true">
      <div className="odp-sheet" role="dialog" aria-modal="true" aria-labelledby="odp-sheet-title" onClick={(e) => e.stopPropagation()}>
        <span className="odp-sheet-handle" aria-hidden />
        {/* glass close (shown in the iPhone Duo layouts) */}
        <button type="button" className="sheet-x odp-sheet-x" aria-label="Close" onClick={onClose}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>
        <h3 id="odp-sheet-title" className="odp-sheet-title">
          Switch to Store Pickup
        </h3>
        <p className="odp-sheet-sub">
          Reaches the store by <strong>{eta}</strong> · collect any day within {HOLD_DAYS} days · show the OTP at the counter
        </p>
        <div className="odp-sheet-store">
          <StorePhoto src={store.photo} className="odp-sheet-store-img" />
          <div className="odp-sheet-store-body">
            <span className="odp-sheet-store-name">{store.name}</span>
            <span className="odp-sheet-store-meta">{store.landmark}</span>
            <span className="odp-sheet-store-meta">
              {store.walk}
              {store.hours ? ` · ${store.hours}` : ''}
            </span>
          </div>
        </div>
        <p className="odp-sheet-refund">
          Store pickup is ₹{savings} cheaper. <strong>₹{savings} refunded</strong> to your payment method in 3–5 days.
        </p>
        <button type="button" className="odp-sheet-cta" onClick={onConfirm}>
          Confirm Store Pickup
        </button>
        <button type="button" className="odp-sheet-skip" onClick={onClose}>
          Keep Home Delivery
        </button>
      </div>
    </div>
  )
}

/* ---------- the switch ideas ---------- */

const ASKED_KEY = 'meesho-odp-asked'
const readAsked = () => {
  try {
    return JSON.parse(window.sessionStorage.getItem(ASKED_KEY) || '{}')
  } catch {
    return {}
  }
}
const markAsked = (id) => {
  try {
    window.sessionStorage.setItem(ASKED_KEY, JSON.stringify({ ...readAsked(), [id]: true }))
  } catch {
    /* noop */
  }
}

function StoreRow({ store }) {
  return (
    <div className="odp-idea-banner-head">
      <StorePhoto src={store.photo} className="odp-idea-banner-img" />
      <div className="odp-idea-banner-body">
        <span className="odp-idea-banner-title">{store.name}</span>
        <span className="odp-idea-banner-meta">
          {store.walk}
          {store.hours ? ` · ${store.hours}` : ''}
        </span>
        <span className="odp-idea-banner-meta">Collect anytime in {HOLD_DAYS} days</span>
      </div>
    </div>
  )
}

/* 1 · scene */
function InlineCta({ store, eta, onOpen }) {
  return (
    <div className="odp-idea odp-idea-inline">
      <div className="odp-idea-inline-row">
        <SceneArt day={eta.split(' ')[0]} size={126} />
        <p className="odp-idea-inline-copy">
          <strong>Not home on {eta}?</strong> Collect from {store.name} ({store.walk}) anytime in {HOLD_DAYS} days.
        </p>
      </div>
      <button type="button" className="odp-idea-primary" onClick={onOpen}>
        <StoreIcon size={20} /> Switch to Store Pickup
      </button>
    </div>
  )
}

/* 2 · before / after, inside the address section */
function StoreBannerInline({ store, savings, eta, onOpen }) {
  return (
    <div className="odp-idea-banner">
      <div className="odp-idea-inline-row">
        <SceneArt day={eta.split(' ')[0]} size={104} />
        <p className="odp-idea-banner-eyebrow">Won&apos;t be home on {eta}? Collect from a store instead</p>
      </div>
      <StoreRow store={store} />
      <button type="button" className="odp-idea-primary" onClick={onOpen}>
        Switch to Store Pickup · ₹{savings} refund
      </button>
    </div>
  )
}

/* 3 · comic strip above the question */
function HomeQuestion({ eta, store, savings, onOpen }) {
  const [answer, setAnswer] = useState(null)
  return (
    <section className="odp-section odp-idea-question" aria-label="Will you be home">
      <div className="odp-q-head">
        <SceneArt day={eta.split(' ')[0]} size={112} />
        <p className="odp-idea-question-title">Will you be home on {eta}?</p>
      </div>
      {answer === 'yes' && <p className="odp-idea-question-ok">Great — we&apos;ll deliver to your home as planned.</p>}
      {answer === 'no' && (
        <div className="odp-idea-reveal">
          <p className="odp-idea-reveal-title">No problem — collect it from a store near you</p>
          <StoreRow store={store} />
          <button type="button" className="odp-idea-primary" onClick={onOpen}>
            Switch to Store Pickup · ₹{savings} refund
          </button>
          <button type="button" className="odp-sheet-skip" onClick={() => setAnswer(null)}>
            Keep home delivery
          </button>
        </div>
      )}
      {!answer && (
        <div className="odp-idea-question-row">
          <button type="button" className="odp-idea-choice odp-idea-choice--primary" onClick={() => setAnswer('yes')}>
            Yes, I&apos;ll be home
          </button>
          <button type="button" className="odp-idea-choice odp-idea-choice--no" onClick={() => setAnswer('no')}>
            No
          </button>
        </div>
      )}
    </section>
  )
}

/* 4 · animated loop in the sticky bar */
function StickyBar({ eta, onOpen }) {
  return (
    <div className="odp-sticky" role="region" aria-label="Switch to store pickup">
      <SceneArt day={eta.split(' ')[0]} size={72} />
      <span className="odp-sticky-text">Not going to be home?</span>
      <button type="button" className="odp-sticky-cta" onClick={onOpen}>
        Switch to Store Pickup
      </button>
    </div>
  )
}

/* 5 · big pictograms on the Deliver-to cards */
function DeliverToToggle({ store, savings, address, state, onOpen }) {
  return (
    <section className="odp-section" aria-label="Deliver to">
      <p className="odp-address-title">Deliver to</p>
      <div className="odp-toggle">
        <div className="odp-toggle-card odp-toggle-card--on">
          <span className="odp-toggle-head">
            <HomeSmallIcon /> Home
            <span className="odp-toggle-badge">Selected</span>
          </span>
          <span className="odp-toggle-address">
            <b>{address?.name}</b>
            {address?.line}
            {state} - {address?.pin}
            <br />
            {address?.phone}
          </span>
        </div>
        <button type="button" className="odp-toggle-card" onClick={onOpen}>
          <span className="odp-toggle-head">
            <StoreIcon size={22} /> Meesho Store
            <span className="odp-toggle-badge odp-toggle-badge--save">₹{savings} cheaper</span>
          </span>
          <span className="odp-toggle-address">
            <b>{store.name}</b>
            {store.landmark}
            <br />
            {store.walk}
            {store.hours ? ` · ${store.hours}` : ''}
          </span>
          <span className="odp-toggle-hint">Tap to switch</span>
        </button>
      </div>
    </section>
  )
}

/* 6 · character + icon speech bubble, on landing */
function AskSheet({ eta, onYes, onNo }) {
  return (
    <div className="odp-sheet-backdrop" onClick={onYes} aria-hidden="true">
      <div className="odp-sheet" role="dialog" aria-modal="true" aria-labelledby="odp-ask-title" onClick={(e) => e.stopPropagation()}>
        <span className="odp-sheet-handle" aria-hidden />
        <div className="odp-art-center">
          <SceneArt day={eta.split(' ')[0]} size={168} />
        </div>
        <h3 id="odp-ask-title" className="odp-sheet-title odp-sheet-title--center">
          Will you be home on {eta}?
        </h3>
        <button type="button" className="odp-sheet-cta" onClick={onNo}>
          No — hold it at a store near me
        </button>
        <button type="button" className="odp-idea-choice odp-ask-yes" onClick={onYes}>
          Yes, I&apos;ll be home
        </button>
      </div>
    </div>
  )
}

/* 7 · animated knock scene for the missed first attempt */
function MissedDelivery({ store, eta, onOpen }) {
  return (
    <section className="odp-section odp-idea-missed" aria-label="We missed you">
      <div className="odp-art-center">
        <SceneArt day={eta.split(' ')[0]} size={168} />
      </div>
      <div className="odp-missed-captions">
        <span>Missed today · next try in 2 days</span>
        <span className="odp-missed-captions-store">Any day for 3 days · {store.walk}</span>
      </div>
      <button type="button" className="odp-idea-primary" onClick={onOpen}>
        Hold at store
      </button>
    </section>
  )
}

/* out for delivery: the OTP in one block per digit, to read out at the door, then COPY and
   SHARE side by side at the foot. SHARE opens the phone's share sheet, so someone else at home
   can receive the parcel; where there is no share sheet the message is copied instead. */
function DeliveryOtpCard({ otp }) {
  const [done, flash] = useFlash() /* 'copy' | 'share' — that button reads "Copied" for 2s */
  const copy = async () => {
    await copyText(otp)
    flash('copy')
  }
  const share = async () => {
    const text = deliveryOtpMessage(otp)
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Delivery OTP', text })
      } catch {
        /* sheet closed without sharing */
      }
      return
    }
    await copyText(text)
    flash('share')
  }
  return (
    <section className="odp-section odp-otp-card" aria-label="Delivery OTP">
      <p className="odp-otp-card-title">Delivery OTP</p>
      <OtpBlocks otp={otp} className="odp-otp-blocks" blockClassName="odp-otp-block" />
      <p className="odp-otp-card-sub">Share it with the delivery partner at your door</p>
      <div className="odp-otp-card-actions" aria-live="polite">
        <button type="button" className="odp-otp-card-btn" onClick={copy}>
          <CopyIcon className="odp-otp-card-icon" />
          {done === 'copy' ? 'Copied' : 'Copy'}
        </button>
        <button type="button" className="odp-otp-card-btn" onClick={share}>
          <span className="odp-otp-card-icon odp-otp-card-icon--mask" style={{ '--icon': `url(${shareSrc})` }} aria-hidden />
          {done === 'share' ? 'Copied' : 'Share'}
        </button>
      </div>
    </section>
  )
}

/* 8 · time pressure: truck leaving + hourglass */
function Countdown({ eta, onOpen }) {
  const [left, setLeft] = useState(5 * 3600 + 20 * 60)
  useEffect(() => {
    const id = window.setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000)
    return () => window.clearInterval(id)
  }, [])
  const h = Math.floor(left / 3600)
  const m = String(Math.floor((left % 3600) / 60)).padStart(2, '0')
  const sec = String(left % 60).padStart(2, '0')
  return (
    <div className="odp-idea odp-idea-count">
      <div className="odp-idea-count-row">
        <SceneArt day={eta.split(' ')[0]} size={84} />
        <span className="odp-idea-count-copy">
          Not going to be home? Switch to store pickup <strong>before it ships</strong>
        </span>
        <span className="odp-idea-count-timer" aria-label="time left to switch">
          {h}h {m}:{sec}
        </span>
      </div>
      <button type="button" className="odp-idea-primary" onClick={onOpen}>
        Switch to Store Pickup
      </button>
    </div>
  )
}

/* 9 · pictogram comparison + how-pickup-works strip */
const CmpCalendar = ({ days }) => (
  <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden>
    <rect x="4" y="7" width="24" height="21" rx="3" fill="currentColor" opacity=".18" />
    <rect x="4" y="7" width="24" height="6" rx="3" fill="currentColor" />
    <text x="16" y="24.5" textAnchor="middle" fill="currentColor" style={{ font: '800 11px var(--font-mier)' }}>
      {days}
    </text>
  </svg>
)
const CmpPerson = () => (
  <svg viewBox="0 0 32 32" width="30" height="30" fill="currentColor" aria-hidden>
    <circle cx="16" cy="9" r="5" />
    <path d="M6 28a10 10 0 0 1 20 0Z" />
  </svg>
)
const CmpClock = () => (
  <svg viewBox="0 0 32 32" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
    <circle cx="16" cy="16" r="11" />
    <path d="M16 9v7l5 3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const CmpRetry = () => (
  <svg viewBox="0 0 32 32" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
    <path d="M25 16a9 9 0 1 1-3-6.7" strokeLinecap="round" />
    <path d="M25 6v6h-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const CmpShield = () => (
  <svg viewBox="0 0 32 32" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
    <path d="M16 4 6 8v8c0 6 4.3 10.4 10 12 5.7-1.6 10-6 10-12V8l-10-4Z" strokeLinejoin="round" />
    <path d="m11.5 16 3 3 6-6.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const CmpRupee = () => (
  <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden>
    <circle cx="16" cy="16" r="12" fill="currentColor" opacity=".18" />
    <text x="16" y="21.5" textAnchor="middle" fill="currentColor" style={{ font: '800 15px var(--font-mier)' }}>
      ₹
    </text>
  </svg>
)

function CompareVisual({ store, savings, onOpen }) {
  const rows = [
    [<CmpCalendar days="1" />, '1 day', <CmpCalendar days="3" />, '3 days'],
    [<CmpPerson />, 'Be at home', <CmpClock />, 'Any time'],
    [<CmpRetry />, 'Missed? +2 days', <CmpShield />, 'Kept safe'],
    [<CmpRupee />, '₹0', <CmpRupee />, `₹${savings} back`],
  ]
  return (
    <section className="odp-section odp-idea-compare" aria-label="Home delivery vs store pickup">
      <div className="odp-cmp-head">
        <span className="odp-cmp-col">
          <HomeSmallIcon /> Home
        </span>
        <span className="odp-cmp-col odp-cmp-col--store">
          <StoreIcon size={20} /> Store · {store.walk}
        </span>
      </div>
      {rows.map(([hi, hl, si, sl]) => (
        <div key={hl} className="odp-cmp-row">
          <span className="odp-cmp-cell">
            {hi}
            <span>{hl}</span>
          </span>
          <span className="odp-cmp-cell odp-cmp-cell--store">
            {si}
            <span>{sl}</span>
          </span>
        </div>
      ))}
      <button type="button" className="odp-idea-primary" onClick={onOpen}>
        Choose Store
      </button>
    </section>
  )
}

/* ---------- page ---------- */

/** Order Details Page (ODP) — opened from an OLP card. */
export default function OrderDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  /* opened from My Orders → back to it; from Home's out-for-delivery bar → back to Home */
  const returnTo = useLocation().state?.returnTo ?? '/orders'
  const backLabel = returnTo === '/orders' ? 'Back to My Orders' : 'Back'
  const goBack = () => navigate(returnTo)
  useRailActions([{ id: 'back', icon: 'back', label: backLabel, onClick: goBack }])
  const [, setVersion] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const order = getOrderById(id)
  const { address } = useCheckoutAddress('home')
  /* idea 6 interrupts once per order; afterwards it behaves like a plain ODP */
  const [askOpen, setAskOpen] = useState(
    () =>
      order?.switchIdea === 'auto-ask' &&
      order.deliveryTypeId !== DELIVERY_TYPE.PICKUP &&
      order.paymentMethodId !== 'cod' &&
      !readAsked()[order.id],
  )

  useEffect(() => {
    if (!toast) return undefined
    const id2 = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(id2)
  }, [toast])

  if (!order) {
    return (
      <div className="odp">
        <header className="odp-header">
          <button type="button" className="odp-back" onClick={goBack} aria-label="Back">
            <BackIcon />
          </button>
          <h1 className="odp-title">Order Details</h1>
          <span className="glass-nav-spacer" aria-hidden />
        </header>
        <p className="odp-missing">This order isn&apos;t in your list any more.</p>
      </div>
    )
  }

  const isCod = order.paymentMethodId === 'cod'
  const isPickup = order.deliveryTypeId === DELIVERY_TYPE.PICKUP
  const store = getPickupStores().find((s) => s.id === order.storeId) ?? getPickupStores()[0]
  const savings = getPickupSavings({ orderTotal: order.payable, qty: order.qty })
  const eta = etaDay(order.etaLabel)
  const returnLabel = getReturnTypeById(order.returnTypeId ?? 'all_easy').reviewLabel
  const product = getProductById(order.productId)
  const baseSaved = order.saved ?? Math.max(0, (product?.price_summary?.mrp ?? 0) - (order.payable ?? 0))
  const saved = baseSaved + (order.refund ?? 0)
  const state = STATE_BY_CITY[address?.city] ? `, ${STATE_BY_CITY[address.city]}` : ''
  const closeTime = (parseHoursRange(store?.hours)?.closeTime ?? '9 PM').replace(' ', '')
  const mapsHref =
    store?.mapsHref ?? `https://www.google.com/maps/search/${encodeURIComponent(`${store?.name} ${store?.landmark}`)}`
  const idea = !isPickup && !isCod ? order.switchIdea : null
  const missed = idea === 'missed-delivery'
  /* out for delivery today: the lorry stands at its stop and its bubble carries the OTP */
  const outForDelivery = !missed && isOutForDelivery(order)
  const shipped = missed || outForDelivery
  const openSheet = () => setSheetOpen(true)

  const confirmSwitch = () => {
    updateOrder(order.id, {
      deliveryTypeId: DELIVERY_TYPE.PICKUP,
      storeName: store.name,
      switchedAt: Date.now(),
      refund: savings,
    })
    setSheetOpen(false)
    setVersion((v) => v + 1)
    setToast(`Switched to Store Pickup. ₹${savings} refund is on its way.`)
    scrollRootTo(0, 'smooth')
  }

  return (
    <div className={`odp${idea === 'sticky-bar' ? ' odp--with-sticky' : ''}`}>
      <header className="odp-header">
        <button type="button" className="odp-back" onClick={goBack} aria-label={backLabel}>
          <SkinText ios={<BackIcon />} android={<img className="odp-appbar-back" src={appbarBackSrc} alt="" aria-hidden />} />
        </button>
        <h1 className="odp-title">Order Details</h1>
        <button type="button" className="odp-help">
          <SkinText ios={<HelpIcon />} android={<img className="odp-help-icon" src={helpSrc} alt="" aria-hidden />} /> Help
        </button>
      </header>

      {/* Product */}
      <button type="button" className="odp-section odp-product" onClick={() => navigate(`/product/${order.productId}`)}>
        <span className="odp-product-media">
          <img
            className="odp-product-img"
            src={order.image || IMAGE_FALLBACK}
            alt=""
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.src = IMAGE_FALLBACK
            }}
          />
          <span className="odp-mall-chip">
            <img src={mallLogoSrc} alt="Mall" />
          </span>
          <span className="odp-qty-tag">x{order.qty ?? 1}</span>
        </span>
        <span className="odp-product-body">
          <span className="odp-order-no">Order #{orderNumber(order)}</span>
          <span className="odp-product-title">{order.title}</span>
          <span className="odp-product-line">
            {order.sizeLabel ?? 'Free Size'}
            <span className="odp-dot" aria-hidden />
            {isCod ? 'Cash' : 'Prepaid'} ₹{order.payable}
          </span>
          <span className="odp-product-line">{returnLabel}</span>
        </span>
        <span className="odp-chevron" aria-hidden>
          <img src={chevronRightSrc} alt="" />
        </span>
      </button>

      {isPickup ? (
        <>
          <section className="odp-section odp-status" aria-label="Order status">
            <div className="odp-status-head">
              <StatusIcon />
              <div>
                <p className="odp-status-title">Reaching Store</p>
                <p className="odp-status-sub">Will reach store before {closeTime}</p>
              </div>
            </div>

            <div className="odp-track odp-track--pickup">
              <span className="odp-tooltip odp-tooltip--pickup">
                <span className="odp-tooltip-row">
                  <img className="odp-tooltip-dot" src={tooltipStatusSrc} alt="" aria-hidden />
                  {address?.city ?? 'Nagpur'}
                </span>
                <span className="odp-tooltip-link">
                  <span className="odp-tooltip-link-text">View Details</span>
                  <img src={tooltipChevronSrc} alt="" />
                </span>
              </span>
              <span className="odp-line" aria-hidden />
              <span className="odp-line odp-line--done odp-line--done-pickup" aria-hidden />
              <span className="odp-node odp-node--p1"><CheckNode done /></span>
              <span className="odp-node odp-node--p2"><CheckNode done /></span>
              <span className="odp-truck odp-truck--pickup" aria-hidden><TruckIcon /></span>
              <span className="odp-node odp-node--p3"><CheckNode /></span>
            </div>

            <div className="odp-steps odp-steps--pickup">
              <span className="odp-step odp-step--done">
                <b>Ordered</b>
                <span>{shortDate(order.placedAt)}</span>
              </span>
              <span className="odp-step odp-step--done">
                <b>Shipped</b>
                <span>{shortDate(order.placedAt, 2)}</span>
              </span>
              <span className="odp-step odp-step--end">
                <b>Reached Store</b>
                <span>{eta}</span>
              </span>
            </div>
          </section>

          <section className="odp-section odp-cancel">
            <span className="odp-cancel-text">Cancellation not available post shipping</span>
            <button type="button" className="odp-link">
              Know More
            </button>
          </section>

          <section className="odp-section odp-store-section" aria-label="Pickup store">
            <div className="odp-address-head">
              <span className="odp-address-title">
                <img className="odp-address-icon" src={locationSrc} alt="" aria-hidden />
                Delivery Address (Store)
              </span>
            </div>
            <p className="odp-store-sub">Pickup your order once it reaches this store</p>
            <div className="odp-store">
              <StorePhoto src={store.photo} className="odp-store-photo" />
              <div className="odp-store-body">
                <p className="odp-store-name">{order.storeName ?? store.name}</p>
                <p className="odp-store-meta">
                  <span className="odp-meta-icon">
                    <img src={metaPinSrc} alt="" />
                  </span>
                  {store.landmark}
                </p>
                <p className="odp-store-meta">
                  <span className="odp-meta-icon">
                    <img src={metaWalkSrc} alt="" />
                  </span>
                  {store.walk}
                </p>
                <div className="odp-store-actions">
                  <a className="odp-store-action" href={mapsHref} target="_blank" rel="noreferrer">
                    <img className="odp-action-icon" src={actionMapSrc} alt="" aria-hidden /> See Map
                  </a>
                  {store.phone && (
                    <a className="odp-store-action" href={`tel:${store.phone.replace(/\s/g, '')}`}>
                      <img className="odp-action-icon" src={actionCallSrc} alt="" aria-hidden /> Call Store
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="odp-howto">
              <span className="odp-cancel-text">See how to pickup your order</span>
              <button type="button" className="odp-link">
                View Details
              </button>
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="odp-section odp-status" aria-label="Order status">
            <div className="odp-status-head">
              <StatusIcon />
              <div>
                <p className="odp-status-title">{missed ? 'Delivery attempted' : outForDelivery ? 'Out for Delivery' : 'Order Placed'}</p>
                <p className="odp-status-sub">
                  {missed ? 'No one was home today' : outForDelivery ? 'Arriving today' : `Delivery by ${shortEta(order.etaLabel)}`}
                </p>
              </div>
            </div>

            {idea === 'inline-cta' && <InlineCta store={store} eta={eta} onOpen={openSheet} />}
            {idea === 'countdown' && <Countdown eta={eta} onOpen={openSheet} />}

            {/* out for delivery: no bubble over the lorry — the OTP has its own card below */}
            <div className={`odp-track${outForDelivery ? ' odp-track--no-tip' : ''}`}>
              {!outForDelivery && (
                <span className={`odp-tooltip${missed ? ' odp-tooltip--missed' : ''}`}>
                  <img className="odp-tooltip-dot" src={tooltipStatusSrc} alt="" aria-hidden />
                  {missed ? 'We missed you' : 'Shipping Soon!'}
                </span>
              )}
              <span className="odp-line" aria-hidden />
              <span className={`odp-line odp-line--done${shipped ? ' odp-line--done-missed' : ''}`} aria-hidden />
              <span className="odp-node odp-node--1"><CheckNode done /></span>
              {!missed && <span className={`odp-truck${outForDelivery ? ' odp-truck--ofd' : ''}`} aria-hidden><TruckIcon /></span>}
              <span className="odp-node odp-node--2"><CheckNode done={shipped} /></span>
              {/* the lorry stands on the Out for Delivery stop itself */}
              {!outForDelivery && <span className="odp-node odp-node--3"><CheckNode done={missed} /></span>}
              <span className="odp-node odp-node--4"><CheckNode /></span>
            </div>

            <div className="odp-steps">
              <span className="odp-step odp-step--done">
                <b>Ordered</b>
                <span>{shortDate(order.placedAt)}</span>
              </span>
              <span className={`odp-step${shipped ? ' odp-step--done' : ''}`}>
                <b>Shipped</b>
                <span>{shortDate(order.placedAt, 2)}</span>
              </span>
              <span className={`odp-step${shipped ? ' odp-step--done' : ''}`}>
                <b>Out for Delivery</b>
                <span>{shipped ? 'Today' : '----'}</span>
              </span>
              <span className="odp-step odp-step--end">
                <b>Delivery</b>
                <span>{missed ? 'Re-attempt' : outForDelivery ? 'Today' : eta}</span>
              </span>
            </div>
          </section>

          {idea === 'missed-delivery' && <MissedDelivery store={store} eta={eta} onOpen={openSheet} />}
          {idea === 'home-question' && <HomeQuestion eta={eta} store={store} savings={savings} onOpen={openSheet} />}
          {idea === 'compare' && <CompareVisual store={store} savings={savings} onOpen={openSheet} />}

          <section className="odp-section odp-cancel">
            <span className="odp-cancel-text">
              {shipped ? 'Cancellation not available post shipping' : 'Cancellation available till shipping'}
            </span>
            {shipped ? (
              <button type="button" className="odp-link">
                Know More
              </button>
            ) : (
              <button type="button" className="odp-cancel-btn">
                Cancel Order
              </button>
            )}
          </section>

          {outForDelivery && <DeliveryOtpCard otp={deliveryOtp(order)} />}

          {idea === 'deliver-to-toggle' ? (
            <DeliverToToggle store={store} savings={savings} address={address} state={state} onOpen={openSheet} />
          ) : (
            <section className="odp-section odp-address" aria-label="Delivery address">
              <div className="odp-address-head">
                <span className="odp-address-title">
                  <img className="odp-address-icon" src={locationSrc} alt="" aria-hidden />
                  Delivery Address
                </span>
                <button type="button" className="odp-link">
                  Change
                </button>
              </div>
              <p className="odp-address-body">
                <span className="odp-address-name">{address?.name}</span>
                {address?.line}
                {state} - {address?.pin}
                <br />
                {address?.phone}
              </p>
              {idea === 'store-banner' && <StoreBannerInline store={store} savings={savings} eta={eta} onOpen={openSheet} />}
            </section>
          )}
        </>
      )}

      {/* Price */}
      <section className="odp-section odp-price" aria-label="Price">
        <div className="odp-price-row">
          <span className="odp-price-title">Total Product Price</span>
          <span className="odp-price-total">₹{order.payable}</span>
        </div>
        <div className="odp-price-row">
          <span className="odp-price-saved">
            You saved <b>₹{Number(saved).toFixed(2)}</b>
          </span>
          <button type="button" className="odp-link">
            View Bill
          </button>
        </div>
        <div className="odp-pay-card">
          <div className="odp-pay-row">
            <span className="odp-pay-label">
              {isCod ? <CashIcon /> : <img className="odp-pay-icon" src={cardSrc} alt="" aria-hidden />}
              {isCod ? 'Cash on Delivery' : 'Prepaid'}
            </span>
            <span className="odp-pay-amount">₹{order.payable}</span>
          </div>
        </div>
      </section>

      {idea === 'sticky-bar' && <StickyBar eta={eta} onOpen={openSheet} />}

      {askOpen && !sheetOpen && (
        <AskSheet
          eta={eta}
          onYes={() => {
            markAsked(order.id)
            setAskOpen(false)
          }}
          onNo={() => {
            markAsked(order.id)
            setAskOpen(false)
            setSheetOpen(true)
          }}
        />
      )}

      {sheetOpen && (
        <SwitchToPickupSheet store={store} savings={savings} eta={eta} onConfirm={confirmSwitch} onClose={() => setSheetOpen(false)} />
      )}

      {toast && (
        <div className="odp-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
