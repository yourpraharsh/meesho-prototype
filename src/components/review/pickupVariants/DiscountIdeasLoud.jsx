/**
 * Discount-salience lab, LOUD round — research: users pass straight through
 * the review page to payment, never noticing the pickup discount. These
 * variants interrupt the first glance instead of decorating the card:
 *   1 spotlight         page dims, pickup card is spotlit with a callout
 *   2 save-flash        spotlight's eyebrow + green flash, without the dim-out
 *   3 spotlight-collapsed  spotlight on a header-only card; store card expands as it settles
 *   4 auto-sheet        offer bottom sheet opens the moment they land
 *   5 swing-tag         oversized swinging ₹OFF price tag on the card
 *   6 blink-banner      flashing LOWEST PRICE banner + pointer at the card
 *   7 footer-interrupt  sticky "you're skipping ₹ OFF" bar above Continue
 * Round three — new levers:
 *   8 scratch-card      scratch-to-reveal the discount, then Apply
 *   9 countdown         ₹OFF ends in mm:ss — ticking urgency strip
 *  10 confetti          "PRICE DROPPED" celebration burst on landing
 *  11 vernacular        Hinglish "₹ बचाओ!" yellow banner
 *  12 pre-selected      pickup applied by default, with an opt-out
 *  13 coupon-apply      perforated coupon ticket with an APPLY button
 *  14 compare-bars      animated price bars: home vs store, delta badge
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './DiscountIdeasLoud.css'

const pickupCardRect = () => {
  const card = document.querySelectorAll('.dtr-card')[1]
  return card ? card.getBoundingClientRect() : null
}

/* ---- 1. Spotlight takeover → "Save ₹" eyebrow ---- */

const SPOTLIGHT_RUNS_KEY = 'meesho-spotlight-runs'
const SPOTLIGHT_MAX_RUNS = 3
const TRANSITION_MS = 500 // every state hand-off: ease-in-out, 500ms
/** Default beats (variants 1 & 2). The collapsed arm overrides with the spec's stamps. */
const DEFAULT_TIMING = { spotMs: 1000, holdMs: 600, reveal: false }
/** Collapsed arm — F1 hold 800 · T1 release 500 · T2 reveal 500 · F3 mint hold 400 · T3 settle 500 */
const COLLAPSED_TIMING = { spotMs: 800, holdMs: 400, reveal: true }

/** Spotlight quota: runs only for a user's first three landings; ?spot=reset clears it.
 *  Each spotlight arm keeps its own counter so testing one card doesn't spend another's. */
function readSpotlightRuns(key = SPOTLIGHT_RUNS_KEY) {
  try {
    if (new URLSearchParams(window.location.search).get('spot') === 'reset') {
      window.localStorage.removeItem(key)
    }
    return Number(window.localStorage.getItem(key) ?? 0)
  } catch {
    return 0
  }
}

function recordSpotlightRun(key = SPOTLIGHT_RUNS_KEY) {
  try {
    window.localStorage.setItem(key, String(readSpotlightRuns(key) + 1))
  } catch {
    /* quota just won't persist */
  }
}

/**
 * Sequence (each hand-off eases in-out over 500ms):
 *   spot    — page dims; the pickup card, already wearing its "Save ₹40"
 *             eyebrow, is spotlit and gently lifted (scaled up)
 *   leaving — T1 release: the dim fades while the card settles back to rest
 *   reveal  — T2 (collapsed arm only): card expands, store block fades in, body → mint
 *   flash   — mint holds (variants 1/2 also do their mint-in here), then
 *   done    — T3 settle: eases back to white; the eyebrow stays
 * Landings after the third skip the spotlight and behave exactly like the
 * flash-only card: 500ms settle, then the eyebrow grows in with the green flash.
 */
export function SpotlightEyebrow({
  pickupSavings,
  spotlight = true,
  runsKey = SPOTLIGHT_RUNS_KEY,
  timing = DEFAULT_TIMING,
}) {
  const rootRef = useRef(null)
  const counted = useRef(false)
  /* read-only here (StrictMode double-invokes initializers); the increment
     happens once in the mount effect below */
  const [phase, setPhase] = useState(() =>
    spotlight && readSpotlightRuns(runsKey) < SPOTLIGHT_MAX_RUNS ? 'spot' : 'leaving',
  )
  const [rect, setRect] = useState(null)
  /* did the spotlight run on THIS landing? (after the quota, behave like card 2) */
  const ranSpotlight = useRef(phase === 'spot').current

  const cardRect = () => rootRef.current?.closest('.dtr-card')?.getBoundingClientRect() ?? null

  useEffect(() => {
    if (phase === 'spot' && !counted.current) {
      counted.current = true
      recordSpotlightRun(runsKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- count the landing once
  }, [])

  useEffect(() => {
    if (phase !== 'spot') return undefined
    const measure = () => setRect(cardRect())
    const start = window.setTimeout(measure, 250)
    const stop = window.setTimeout(() => setPhase('leaving'), timing.spotMs)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.clearTimeout(start)
      window.clearTimeout(stop)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [phase])

  /* leaving (T1 release) → [reveal (T2)] → flash (F3 mint hold) → done (T3 settle).
     Without a reveal beat, the mint-in transition happens inside "flash". */
  useEffect(() => {
    const next = {
      leaving: [timing.reveal ? 'reveal' : 'flash', TRANSITION_MS],
      reveal: ['flash', TRANSITION_MS],
      flash: ['done', timing.reveal ? timing.holdMs : TRANSITION_MS + timing.holdMs],
    }[phase]
    if (!next) return undefined
    const t = window.setTimeout(() => setPhase(next[0]), next[1])
    return () => window.clearTimeout(t)
  }, [phase, timing])

  /* Any tap on the page while the dim is lifting or the card is flashing
     stops the choreography and lands on the final state (the tap itself
     still does its normal job). While the dim is up, the overlay handles it. */
  useEffect(() => {
    if (phase !== 'leaving' && phase !== 'reveal' && phase !== 'flash') return undefined
    const finish = () => setPhase('done')
    window.addEventListener('pointerdown', finish, true)
    return () => window.removeEventListener('pointerdown', finish, true)
  }, [phase])

  const overlayUp = phase === 'spot' || phase === 'leaving'
  /* while the spotlight runs the eyebrow is on the card from the first frame;
     otherwise (card 2, or card 1 past its quota) it grows in with the green flash */
  const eyebrowIn = ranSpotlight || phase === 'reveal' || phase === 'flash' || phase === 'done'

  return (
    <div ref={rootRef} className={`dil-spot-eyebrow dil-spot-eyebrow--${phase}`}>
      {/* Self-pickup v2 (3695:105372): the band reads "₹X OFF" */}
      <div className={`dil-save-eyebrow${eyebrowIn ? ' dil-save-eyebrow--in' : ''}`}>
        ₹{pickupSavings} OFF
      </div>
      {/* the dim lives on <body>: the lifted card is transformed, which would
          otherwise trap a fixed overlay inside it */}
      {overlayUp &&
        rect &&
        createPortal(
          <div
            className={`dil-spot${phase === 'leaving' ? ' dil-spot--leaving' : ''}`}
            role="presentation"
            onClick={(e) => {
              e.stopPropagation() /* swallow the tap — don't select the card underneath */
              setPhase('done') /* a tap skips straight to the final state */
            }}
          >
            <div
              className="dil-spot-hole"
              style={{
                top: rect.top - 6,
                left: rect.left - 6,
                width: rect.width + 12,
                height: rect.height + 12,
              }}
            />
          </div>,
          document.body,
        )}
    </div>
  )
}

export const treatmentSpotlight = {
  pickupCardClass: 'dil-spot-card',
  PickupEyebrow: SpotlightEyebrow,
}

/* Variant 3 — spotlight with the pickup card COLLAPSED (header only) while it is
   spotlit; the store card expands into view as the card settles. Own FTUX budget. */
const SpotlightCollapsedEyebrow = (props) => (
  <SpotlightEyebrow {...props} runsKey="meesho-spotlight-collapsed-runs" timing={COLLAPSED_TIMING} />
)

export const treatmentSpotlightCollapsed = {
  pickupCardClass: 'dil-spot-card dil-spot-collapse',
  PickupEyebrow: SpotlightCollapsedEyebrow,
}

/* Variant 2 — the same eyebrow + green-flash choreography, never any dim-out. */
const SaveFlashEyebrow = (props) => <SpotlightEyebrow {...props} spotlight={false} />

export const treatmentSaveFlash = {
  pickupCardClass: 'dil-spot-card',
  PickupEyebrow: SaveFlashEyebrow,
}

/* ---- Steady State (cart review, every landing) ----
   Self-pickup v2, section 3695:105372, row "Steady State" — its prototype, frame by frame:
     rest   3695:106363  plain pickup card (no band, grey stroke)      holds 0.3s
     band   3695:106611  T1 0.5s: the "₹X OFF" band grows out of the card's top edge and
                         the stroke turns Green Base; the body stays white  holds 0.3s
     flash  3695:106115  T2 0.2s: the body flashes #F2FFF1                  holds 0.2s
     done   3695:107355  T3 0.5s: back to white; band and green stroke stay
   Every hand-off is Smart Animate, ease in-out; the durations live in review.css. No quota and
   no dim — it plays on every landing. A tap anywhere jumps to the final state (the tap still
   does its job); reduced motion lands on it directly. */
const STEADY_BEATS = { rest: ['band', 300], band: ['flash', 500 + 300], flash: ['done', 200 + 200] }

const prefersReducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

function SteadyEyebrow({ pickupSavings, isPickup }) {
  /* landing with pickup already chosen (Back from Payment, a remembered cart choice) shows the
     selected state straight away — the beats start from Home selected. Read once, on mount. */
  const [phase, setPhase] = useState(() => (isPickup || prefersReducedMotion() ? 'done' : 'rest'))

  useEffect(() => {
    const beat = STEADY_BEATS[phase]
    if (!beat) return undefined
    const t = window.setTimeout(() => setPhase(beat[0]), beat[1])
    return () => window.clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (phase === 'done') return undefined
    const finish = () => setPhase('done')
    window.addEventListener('pointerdown', finish, true)
    return () => window.removeEventListener('pointerdown', finish, true)
  }, [phase])

  return (
    <div className={`dil-spot-eyebrow dil-spot-eyebrow--${phase}`}>
      <div className={`dil-save-eyebrow${phase === 'rest' ? '' : ' dil-save-eyebrow--in'}`}>
        ₹{pickupSavings} OFF
      </div>
    </div>
  )
}

/* ---- Cart review FTUX: the first 3 landings per card variant, then the Steady State ----
   Figma self-pickup-v3 · self pickup at cart · "First-visit FTUX: highlight for both variants":
     lift   hold 0.8s  page dims #353543 @70%, hole exactly at the card; the card, band already on,
                       scaled ×1.0427 (328 → 342px). No ring, glow, gap or shadow
     settle 0.5s       the card scales back to 1 (the dim stays; its hole follows), hold 0.2s
     mint   0.3s       body → #F2FFF1, hold 0.4s
     fade   0.5s       the dim and the mint fade out together
     done              rest: band + green frame stay. Any tap skips here. Nothing expands. */
const CART_FTUX_MAX_RUNS = 3
const CART_FTUX_BEATS = { lift: ['settle', 800], settle: ['mint', 500 + 200], mint: ['fade', 300 + 400], fade: ['done', 500] }
const CARD_RADIUS = 8

/* Quota: ?spot=reset is cleared once per page load by testPincode.js (FTUX_KEYS), not on every
   read: the cart routes carry location.search, so a clear-on-read would replay it every landing. */
function readFtuxRuns(key) {
  try {
    return Number(window.localStorage.getItem(key) ?? 0)
  } catch {
    return 0
  }
}

function recordFtuxRun(key) {
  try {
    window.localStorage.setItem(key, String(readFtuxRuns(key) + 1))
  } catch {
    /* quota just won't persist */
  }
}

function CartFtuxEyebrow({ pickupSavings, runsKey }) {
  const rootRef = useRef(null)
  const holeRef = useRef(null)
  const counted = useRef(false)
  const [phase, setPhase] = useState('lift')
  const dimUp = phase !== 'done'

  useEffect(() => {
    /* spend this landing once (the ref survives StrictMode's double effect) */
    if (counted.current) return
    counted.current = true
    recordFtuxRun(runsKey)
  }, [runsKey])

  useEffect(() => {
    const beat = CART_FTUX_BEATS[phase]
    if (!beat) return undefined
    const t = window.setTimeout(() => setPhase(beat[0]), beat[1])
    return () => window.clearTimeout(t)
  }, [phase])

  /* The hole IS the card's edge on every frame: getBoundingClientRect includes the in-flight
     scale, so the hole follows the settle, the scroll-to-top and late layout. Written straight to
     the DOM, so nothing re-renders per frame; placed before the first paint. */
  useLayoutEffect(() => {
    if (!dimUp) return undefined
    const card = rootRef.current?.closest('.dtr-card')
    let raf = 0
    const place = () => {
      const hole = holeRef.current
      if (card && hole) {
        const r = card.getBoundingClientRect()
        const s = card.offsetWidth ? r.width / card.offsetWidth : 1
        Object.assign(hole.style, {
          top: `${r.top}px`,
          left: `${r.left}px`,
          width: `${r.width}px`,
          height: `${r.height}px`,
          borderRadius: `${CARD_RADIUS * s}px`,
        })
      }
      raf = window.requestAnimationFrame(place)
    }
    place()
    return () => window.cancelAnimationFrame(raf)
  }, [dimUp])

  /* during the fade the dim lets taps through: a tap lands on rest AND does its job */
  useEffect(() => {
    if (phase !== 'fade') return undefined
    const finish = () => setPhase('done')
    window.addEventListener('pointerdown', finish, true)
    return () => window.removeEventListener('pointerdown', finish, true)
  }, [phase])

  useEffect(() => {
    if (!dimUp) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setPhase('done')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dimUp])

  return (
    <div ref={rootRef} className={`dil-spot-eyebrow dil-ftux dil-ftux--${phase}`}>
      {/* mounts already --in: the band is on from the first frame (no grow) */}
      <div className="dil-save-eyebrow dil-save-eyebrow--in">₹{pickupSavings} OFF</div>
      {dimUp &&
        createPortal(
          <div
            className={`dil-ftux-dim${phase === 'fade' ? ' dil-ftux-dim--fade' : ''}`}
            role="presentation"
            aria-hidden
            onClick={(e) => {
              e.stopPropagation() /* portal clicks bubble to the card: don't select pickup */
              setPhase('done') /* a tap skips straight to rest */
            }}
          >
            <div ref={holeRef} className="dil-ftux-hole" />
          </div>,
          document.body,
        )}
    </div>
  )
}

/* Decided once per landing: the FTUX while this variant's quota lasts and pickup isn't already
   chosen (Back from Payment, a remembered cart choice); otherwise the Steady State. The
   initialiser only reads (StrictMode calls it twice); the run is spent in CartFtuxEyebrow. */
function CartPickupEyebrow({ runsKey, ...props }) {
  const [ftux] = useState(() => !props.isPickup && readFtuxRuns(runsKey) < CART_FTUX_MAX_RUNS)
  return ftux ? <CartFtuxEyebrow {...props} runsKey={runsKey} /> : <SteadyEyebrow {...props} />
}

const CartOpenEyebrow = (props) => <CartPickupEyebrow {...props} runsKey="meesho-cart-ftux-open-runs" />
const CartClosedEyebrow = (props) => <CartPickupEyebrow {...props} runsKey="meesho-cart-ftux-closed-runs" />

/* Cart review, Variant 1 (default): card always open. FTUX on the first 3 landings, then the
   Steady State; Self-pickup v2 card edge (panelBody). */
export const treatmentSteady = {
  pickupCardClass: 'dil-spot-card dil-steady-card dil-ftux-card',
  PickupEyebrow: CartOpenEyebrow,
  panelBody: true,
}

/* Cart review, Variant 2 (test gate: "Card closed until tapped", or ?card=closed): band + header only until pickup is chosen; choosing
   pickup opens the card, choosing Home closes it. Same FTUX and Steady State as Variant 1. */
export const treatmentSteadyClosed = {
  ...treatmentSteady,
  PickupEyebrow: CartClosedEyebrow,
  collapseUntilSelected: true,
}

/* ---- 2. Fly-in OFF banner ---- */

export function FlyInBanner({ pickupSavings }) {
  const [stage, setStage] = useState('hidden') // hidden → drop → fly → gone
  const [target, setTarget] = useState(null)

  useEffect(() => {
    const t1 = window.setTimeout(() => setStage('drop'), 350)
    const t2 = window.setTimeout(() => {
      const rect = pickupCardRect()
      if (rect) {
        setTarget({
          dx: rect.left + rect.width / 2 - window.innerWidth / 2,
          dy: rect.top + rect.height / 2 - window.innerHeight * 0.36,
        })
      }
      setStage('fly')
    }, 1900)
    const t3 = window.setTimeout(() => setStage('gone'), 2800)
    return () => [t1, t2, t3].forEach(window.clearTimeout)
  }, [])

  if (stage === 'hidden' || stage === 'gone') return null
  const flyStyle =
    stage === 'fly' && target
      ? { transform: `translate(calc(-50% + ${target.dx}px), calc(-50% + ${target.dy}px)) scale(0.12)`, opacity: 0.15 }
      : undefined
  return (
    <div className={`dil-fly dil-fly--${stage}`} style={flyStyle} aria-hidden>
      <span className="dil-fly-amount">₹{pickupSavings} OFF</span>
      <span className="dil-fly-sub">unlocked on Store Pickup</span>
    </div>
  )
}

/* ---- 3. Hero card ---- */

const HeroRibbon = ({ pickupSavings, pickupTotal }) => (
  <div className="dil-hero-strip dtr-shimmer">
    <span className="dil-hero-flag">CHEAPEST OPTION</span>
    <span className="dil-hero-copy">
      ₹{pickupTotal} only · <strong>Save ₹{pickupSavings}</strong>
    </span>
  </div>
)

export const treatmentHeroCard = {
  pickupCardClass: 'dil-hero',
  PickupEyebrow: HeroRibbon,
}

/* ---- 4. Auto-opening offer sheet ---- */

export function OfferSheet({ pickupSavings, pickupTotal, homeTotal, onConfirm, onDismiss }) {
  return (
    <div className="dil-sheet-backdrop" onClick={onDismiss} aria-hidden="true">
      <div
        className="dil-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dil-sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* glass close (shown in the iPhone Duo layouts) */}
        <button type="button" className="sheet-x dil-sheet-x" aria-label="Close" onClick={onDismiss}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>
        <div className="dil-sheet-burst" aria-hidden>
          ₹{pickupSavings}
          <span>OFF</span>
        </div>
        <h3 id="dil-sheet-title" className="dil-sheet-title">
          Don&apos;t miss ₹{pickupSavings} OFF on this order
        </h3>
        <p className="dil-sheet-copy">
          Deliver to a Meesho Pickup Store near you and pay{' '}
          <strong>
            ₹{pickupTotal} instead of ₹{homeTotal}
          </strong>
        </p>
        <button type="button" className="dil-sheet-cta" onClick={onConfirm}>
          Get ₹{pickupSavings} OFF — Pickup from Store
        </button>
        <button type="button" className="dil-sheet-skip" onClick={onDismiss}>
          Keep Home Delivery
        </button>
      </div>
    </div>
  )
}

/* ---- 5. Swinging price tag ---- */

const SwingTag = ({ pickupSavings }) => (
  <span className="dil-tag-wrap" aria-hidden>
    <span className="dil-tag">
      <span className="dil-tag-hole" />₹{pickupSavings} OFF
    </span>
  </span>
)

export const treatmentSwingTag = {
  pickupCardClass: 'dil-tag-card',
  PickupSubLabel: SwingTag,
}

/* ---- 6. Flashing lowest-price banner + pointer ---- */

export const BlinkBanner = ({ pickupTotal }) => (
  <div className="dil-blink" role="note">
    <span className="dil-blink-text">
      LOWEST PRICE <strong>₹{pickupTotal}</strong> — TAP BELOW
    </span>
    <span className="dil-blink-pointer" aria-hidden>
      👇
    </span>
  </div>
)

/* ---- 7. Footer interrupt bar ---- */

export function FooterInterrupt({ pickupSavings, isPickup, onSelectPickup }) {
  if (isPickup) return null
  return (
    <div className="dil-footbar" role="status">
      <span className="dil-footbar-text">
        You&apos;re skipping <strong>₹{pickupSavings} OFF</strong>
      </span>
      <button type="button" className="dil-footbar-cta" onClick={onSelectPickup}>
        Get it
      </button>
    </div>
  )
}

/* ======================= Round three ======================= */

/* ---- 8. Scratch card ---- */

const SCRATCH_RADIUS = 22
const REVEAL_RATIO = 0.42

export function ScratchCard({ pickupSavings, isPickup, onSelectPickup }) {
  const canvasRef = useRef(null)
  const strokes = useRef(0)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    const foil = ctx.createLinearGradient(0, 0, rect.width, rect.height)
    foil.addColorStop(0, '#c6cad5')
    foil.addColorStop(0.5, '#eceef3')
    foil.addColorStop(1, '#b3b8c6')
    ctx.fillStyle = foil
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.fillStyle = '#4b5162'
    ctx.font = '800 15px Mier, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('SCRATCH HERE  ✦', rect.width / 2, rect.height / 2 + 5)
  }, [])

  const scratchAt = (clientX, clientY) => {
    if (revealed) return
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(clientX - rect.left, clientY - rect.top, SCRATCH_RADIUS, 0, Math.PI * 2)
    ctx.fill()
    strokes.current += 1
    if (strokes.current % 5 === 0) {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let clear = 0
      let total = 0
      for (let i = 3; i < data.length; i += 4 * 12) {
        total += 1
        if (data[i] === 0) clear += 1
      }
      if (clear / total > REVEAL_RATIO) setRevealed(true)
    }
  }

  return (
    <div className={`dil-scratch${revealed ? ' dil-scratch--revealed' : ''}`}>
      <div className="dil-scratch-prize">
        <span className="dil-scratch-amount">₹{pickupSavings} OFF</span>
        <span className="dil-scratch-sub">on Store Pickup — yours to use</span>
        {isPickup ? (
          <span className="dil-scratch-applied">Applied ✓</span>
        ) : (
          <button type="button" className="dil-scratch-apply" onClick={onSelectPickup}>
            Apply now
          </button>
        )}
      </div>
      {!revealed && (
        <canvas
          ref={canvasRef}
          className="dil-scratch-foil"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            scratchAt(e.clientX, e.clientY)
          }}
          onPointerMove={(e) => {
            if (e.buttons > 0) scratchAt(e.clientX, e.clientY)
          }}
        />
      )}
    </div>
  )
}

/* ---- 9. Countdown urgency strip ---- */

const COUNTDOWN_START_S = 10 * 60

function CountdownStrip({ pickupSavings }) {
  const [left, setLeft] = useState(COUNTDOWN_START_S)
  useEffect(() => {
    const timer = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  return (
    <div className="dil-count">
      <span className="dil-count-text">
        ⏱ <strong>₹{pickupSavings} OFF</strong> on Store Pickup ends in
      </span>
      <span className="dil-count-timer">
        {mm}:{ss}
      </span>
    </div>
  )
}

export const treatmentCountdown = {
  pickupCardClass: 'dil-count-card',
  PickupEyebrow: CountdownStrip,
}

/* ---- 10. Confetti price-drop celebration ---- */

const CONFETTI_PIECES = Array.from({ length: 16 }, (_, i) => i)

const ConfettiStrip = ({ homeTotal, pickupTotal }) => (
  <div className="dil-confetti">
    <span className="dil-confetti-text">
      🎉 PRICE DROPPED &nbsp;<s>₹{homeTotal}</s> → <strong>₹{pickupTotal}</strong>
    </span>
    <span className="dil-confetti-layer" aria-hidden>
      {CONFETTI_PIECES.map((i) => (
        <i key={i} className="dil-confetti-piece" style={{ '--i': i }} />
      ))}
    </span>
  </div>
)

export const treatmentConfetti = {
  pickupCardClass: 'dil-confetti-card',
  PickupEyebrow: ConfettiStrip,
}

/* ---- 11. Vernacular banner ---- */

export const VernacularBanner = ({ pickupSavings }) => (
  <div className="dil-vern" role="note">
    <span className="dil-vern-coins" aria-hidden>
      🪙
    </span>
    <span className="dil-vern-text">
      <span className="dil-vern-big">₹{pickupSavings} बचाओ!</span>
      <span className="dil-vern-sub">Meesho Store se pickup karo</span>
    </span>
  </div>
)

/* ---- 12. Pre-selected default with opt-out ---- */

export function PreselectedBanner({ pickupSavings, isPickup, onSelectPickup, onSelectHome }) {
  useEffect(() => {
    onSelectPickup()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- apply the default once on landing
  }, [])
  return isPickup ? (
    <div className="dil-pre dil-pre--on" role="status">
      <span className="dil-pre-text">
        ✓ <strong>₹{pickupSavings} OFF applied</strong> — we picked the cheaper option for you
      </span>
      <button type="button" className="dil-pre-link" onClick={onSelectHome}>
        Prefer home delivery?
      </button>
    </div>
  ) : (
    <div className="dil-pre dil-pre--off" role="status">
      <span className="dil-pre-text">
        You gave up <strong>₹{pickupSavings} OFF</strong>
      </span>
      <button type="button" className="dil-pre-link" onClick={onSelectPickup}>
        Get it back
      </button>
    </div>
  )
}

/* ---- 13. Coupon ticket with APPLY ---- */

export const CouponTicket = ({ pickupSavings, isPickup, onSelectPickup }) => (
  <div className={`dil-ticket${isPickup ? ' dil-ticket--applied' : ''}`} role="note">
    <span className="dil-ticket-amount">
      ₹{pickupSavings}
      <small>OFF</small>
    </span>
    <span className="dil-ticket-body">
      <span className="dil-ticket-title">Store Pickup Coupon</span>
      <span className="dil-ticket-sub">Only on Deliver to Meesho Pickup Store</span>
    </span>
    {isPickup ? (
      <span className="dil-ticket-done">APPLIED ✓</span>
    ) : (
      <button type="button" className="dil-ticket-apply" onClick={onSelectPickup}>
        APPLY
      </button>
    )}
  </div>
)

/* ---- 14. Comparison bars ---- */

export function CompareBars({ homeTotal, pickupTotal, pickupSavings, onSelectPickup }) {
  const [grown, setGrown] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setGrown(true), 250)
    return () => window.clearTimeout(t)
  }, [])
  const pickupPct = Math.round((pickupTotal / homeTotal) * 100)
  return (
    <div className="dil-bars" role="note">
      <p className="dil-bars-title">Which costs less?</p>
      <div className="dil-bars-row">
        <span className="dil-bars-label">Home delivery</span>
        <span className="dil-bars-track">
          <span className="dil-bars-fill dil-bars-fill--home" style={{ width: grown ? '100%' : '0%' }}>
            ₹{homeTotal}
          </span>
        </span>
      </div>
      <button type="button" className="dil-bars-row dil-bars-row--pickup" onClick={onSelectPickup}>
        <span className="dil-bars-label">Store pickup</span>
        <span className="dil-bars-track">
          <span
            className="dil-bars-fill dil-bars-fill--pickup"
            style={{ width: grown ? `${pickupPct}%` : '0%' }}
          >
            ₹{pickupTotal}
          </span>
          <span className={`dil-bars-delta${grown ? ' dil-bars-delta--in' : ''}`}>₹{pickupSavings} cheaper</span>
        </span>
      </button>
    </div>
  )
}
