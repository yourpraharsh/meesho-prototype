import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DELIVERY_TYPE,
  PICKUP_HOLD_DAYS,
  applyDeliveryType,
  getPickupSavings,
  getPickupStores,
} from '../../utils/deliveryTypes'
import DeliveryTruckIcon from './DeliveryTruckIcon'
import ClosingStoreIcon from './ClosingStoreIcon'
import { getPickupWindow, parseHoursRange } from '../../utils/pickupVariants'
import { getPickupVariantComponents } from './pickupVariants/registry'
import { isCodTestUser } from '../../utils/testPincode'
import { UpiOnlyStrip, UpiOnlySheet } from './CodUpiEducation'
import metaPinIcon from '../../assets/review-sot/meta-pin.svg'
import metaWalkIcon from '../../assets/review-sot/meta-walk.svg'
import actionMapIcon from '../../assets/review-sot/action-map.svg'
import actionCallIcon from '../../assets/review-sot/action-call.svg'
import chevronDownIcon from '../../assets/review-sot/chevron-down.svg'
/* store FAQ sheet icons: Visual Library informative multi-tone set (Figma yjtiUIeUX7iqKQG2NOYbHZ) */
import faqBoxIcon from '../../assets/store-faq/faq-box-closed.svg'
import faqShieldIcon from '../../assets/store-faq/faq-shield-check.svg'
import faqShopIcon from '../../assets/store-faq/faq-shop.svg'
import faqLocationIcon from '../../assets/store-faq/faq-location.svg'
import faqTruckIcon from '../../assets/store-faq/faq-truck.svg'
import faqCalendarIcon from '../../assets/store-faq/faq-calendar.svg'
import pickupSceneImage from '../../assets/store-faq/pickup-store-scene.jpg'
import './ReviewShell.css'
import './DeliveryTypeReview.css'
import { publicUrl } from '../../utils/publicUrl'

/*
 * "Select Delivery Type" (Self-pickup v2, Figma H1GW5y6IAWYTrscEJHvRK4 · 3695:105372): Deliver
 * to Home vs Deliver to Meesho Pickup Store with the store card, See More Stores sheet, the COD
 * cohort's UPI-only education and the pickup-variant lab slots. Shared by the review page
 * (DeliveryTypeReview) and the cart (Cart), so both show and price the choice the same way.
 * Its styles are scoped to `.dtr` — render it (and DeliveryTypeSheets) inside a `.dtr` element.
 */

export const ChevronRightIcon = () => (
  <svg viewBox="0 0 8 16" fill="none" width="8" height="16" aria-hidden>
    <path d="M2 2L6 8L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const RadioCheck = ({ selected }) =>
  selected ? (
    <span className="dtr-radio dtr-radio--on" aria-hidden>
      <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
        <circle cx="12" cy="12" r="12" fill="var(--jamun-base)" />
        <path
          d="M7 12.5L10.2 15.5L17 8.5"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  ) : (
    <span className="dtr-radio" aria-hidden />
  )

/** Store meta icons — Figma Self-pickup v2 (famicons) inside the 16px blue bubble. */
const PinIcon = () => (
  <span className="dtr-meta-icon" aria-hidden>
    <img src={metaPinIcon} alt="" width={16} height={16} />
  </span>
)

const WalkIcon = () => (
  <span className="dtr-meta-icon" aria-hidden>
    <img src={metaWalkIcon} alt="" width={16} height={16} />
  </span>
)

const MapIcon = () => (
  <img className="dtr-action-icon" src={actionMapIcon} alt="" width={16} height={16} aria-hidden />
)

const PhoneIcon = () => (
  <img className="dtr-action-icon" src={actionCallIcon} alt="" width={16} height={16} aria-hidden />
)

/** Demo store photo (real kirana storefront) — fallback when a store has none. */
const DEMO_STORE_PHOTO = publicUrl('/stores/demo-store.png')

const StorePhoto = ({ src }) => (
  <img
    className="dtr-store-photo"
    src={src || DEMO_STORE_PHOTO}
    alt=""
    loading="lazy"
    onError={(e) => {
      if (e.currentTarget.src !== window.location.origin + DEMO_STORE_PHOTO) {
        e.currentTarget.src = DEMO_STORE_PHOTO
      }
    }}
  />
)

/** Official m-store badge asset (Figma frame 2147226012). */
const StoreBadge = () => (
  <img className="dtr-store-badge" src={publicUrl('/badges/m-store.svg')} alt="Meesho Store" height={16} />
)

function StoreCard({ store, radio = false, selected = false, onCallStore = null }) {
  const mapsHref =
    store.mapsHref ??
    `https://www.google.com/maps/search/${encodeURIComponent(`${store.name} ${store.landmark}`)}`
  return (
    <div className="dtr-store">
      <StorePhoto src={store.photo} />
      <div className="dtr-store-body">
        <h3 className="dtr-store-name">{store.name}</h3>
        <StoreBadge />
        <p className="dtr-store-meta">
          <PinIcon /> {store.landmark}
        </p>
        <p className="dtr-store-meta">
          <WalkIcon /> {store.walk}
        </p>
        {/* no store-hours row (Self-pickup v2): the hours live in the Call Store sheet */}
        <div className="dtr-store-actions">
          <a
            className="dtr-store-action"
            href={mapsHref}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <MapIcon /> See Map
          </a>
          {/* Call Store opens the store FAQ sheet first (most questions have a ready answer);
              its own CTA dials the store */}
          {onCallStore ? (
            <button
              type="button"
              className="dtr-store-action"
              onClick={(e) => {
                e.stopPropagation()
                onCallStore()
              }}
            >
              <PhoneIcon /> Call Store
            </button>
          ) : (
            store.phone && (
              <a
                className="dtr-store-action"
                href={`tel:${store.phone.replace(/\s/g, '')}`}
                onClick={(e) => e.stopPropagation()}
              >
                <PhoneIcon /> Call Store
              </a>
            )
          )}
        </div>
      </div>
      {radio && (
        <span className="dtr-store-radio-col">
          <RadioCheck selected={selected} />
        </span>
      )}
    </div>
  )
}

const SheetCloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="20" height="20" aria-hidden>
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const GreyPinIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" width="15" height="15" aria-hidden>
    <path
      d="M8 14.5S2.5 9.2 2.5 5.5A5.5 5.5 0 1 1 13.5 5.5C13.5 9.2 8 14.5 8 14.5Z"
      fill="var(--grey-t1)"
    />
    <circle cx="8" cy="5.5" r="2" fill="#fff" />
  </svg>
)

/** "See More Stores" bottom sheet — radio-select rows, committed via Confirm Store. */
function StorePickerSheet({ stores, activeId, addressLine, onConfirm, onClose, onCallStore }) {
  const [pendingId, setPendingId] = useState(activeId)
  return (
    <div className="dtr-stores-backdrop" onClick={onClose}>
      <div
        className="dtr-stores-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dtr-stores-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dtr-stores-head">
          <h3 id="dtr-stores-title" className="dtr-stores-title">
            Select Meesho Pickup Store
          </h3>
          <button type="button" className="dtr-stores-close" onClick={onClose} aria-label="Close">
            <SheetCloseIcon />
          </button>
        </div>

        {addressLine && (
          <div className="dtr-stores-addr">
            <GreyPinIcon />
            <span className="dtr-stores-addr-text">
              Showing stores near <strong>{addressLine}</strong>
            </span>
            <ChevronRightIcon />
          </div>
        )}

        <div className="dtr-stores-trust">
          Delivering to Trusted Meesho Stores <StoreBadge />
        </div>

        <div className="dtr-stores-list" role="radiogroup" aria-label="Pickup stores">
          {stores.map((store) => (
            <div
              key={store.id}
              className={`dtr-store-option${pendingId === store.id ? ' dtr-store-option--selected' : ''}`}
              role="radio"
              aria-checked={pendingId === store.id}
              tabIndex={0}
              onClick={() => setPendingId(store.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setPendingId(store.id)
              }}
            >
              <StoreCard
                store={store}
                radio
                selected={pendingId === store.id}
                onCallStore={onCallStore ? () => onCallStore(store) : null}
              />
            </div>
          ))}
        </div>

        <div className="dtr-stores-footer">
          <button
            type="button"
            className="dtr-stores-confirm"
            onClick={() => onConfirm(pendingId)}
          >
            Confirm Store
          </button>
        </div>
      </div>
    </div>
  )
}

/* A store takes calls in its opening hours ("8:30am-9:30pm", "10.30am-09.30pm"); 10 AM to 10 PM
   when it has none. For demos, ?storeTime=HH:MM (e.g. ?storeTime=23:00) pretends it is that time. */
const STORE_CALLS_FROM = 10
const STORE_CALLS_UNTIL = 22
const CLOCK_RE = /(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)/gi

function storeClockHours() {
  const forced = new URLSearchParams(window.location.search).get('storeTime')
  const m = forced && /^(\d{1,2})(?::?(\d{2}))?$/.exec(forced)
  if (m) return Number(m[1]) + Number(m[2] || 0) / 60
  const now = new Date()
  return now.getHours() + now.getMinutes() / 60
}

/** "8:30am" → 8.5 and "8:30 AM"; "12pm" → "12 noon" (12 PM confuses people) */
function parseClock(m) {
  const h = Number(m[1])
  const min = Number(m[2] || 0)
  const pm = /pm/i.test(m[3])
  if (h < 1 || h > 12 || min > 59) return null
  const label =
    h === 12 && min === 0 ? (pm ? '12 noon' : '12 midnight') : `${h}${min ? `:${m[2]}` : ''} ${pm ? 'PM' : 'AM'}`
  return { value: (h % 12) + (pm ? 12 : 0) + min / 60, label }
}

function storeCallWindow(store) {
  const times = [...String(store?.hours ?? '').matchAll(CLOCK_RE)].map(parseClock)
  const open = times[0]
  const close = times[times.length - 1]
  if (times.length < 2 || !open || !close || open.value === close.value) {
    return { open: STORE_CALLS_FROM, close: STORE_CALLS_UNTIL, openLabel: '10 AM' }
  }
  return { open: open.value, close: close.value, openLabel: open.label }
}

/**
 * Closed for calls now, and when calls open again. "tomorrow" only between closing time and
 * midnight; after midnight there is just one opening time coming, so no day word.
 */
export function storeCallStatus(store) {
  const now = storeClockHours()
  const { open, close, openLabel } = storeCallWindow(store)
  /* second branch: hours that run past midnight */
  const closed = close > open ? now < open || now >= close : now >= close && now < open
  return { closed, openLabel, tomorrow: closed && now >= open }
}

/* how the closed status is shown (exploration): hero (default: big and centred, with an Okay
   CTA) · header · strip · card */
const CLOSED_UIS = ['hero', 'header', 'strip', 'card']
const getClosedUi = () => {
  const forced = new URLSearchParams(window.location.search).get('closedUi')
  return CLOSED_UIS.includes(forced) ? forced : 'hero'
}

/* FAQ sheet variant (getStoreFaqVariantForProduct: alternate feed cards, or ?faq=): the store
   pickup story (15s, no sound) plays at the top of the answers */
/* v2: the pink intro recoloured to the story's yellow/cream, so it melts into the sheet */
const STORY_VIDEO = publicUrl('/videos/self-pickup-story-v2.mp4')
const STORY_POSTER = publicUrl('/videos/self-pickup-story-poster.jpg')
const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches


/**
 * What shoppers most often ask about a pickup store, answered by Meesho (the shopkeeper is
 * spoken of in the third person) so the sheet can be scanned: the
 * question in bold, a short answer, then one line of detail. Every line fits one line on a 360px
 * phone with ~12% to spare (also beside See Map), so no row is cut and every row is the same height. Icons are the Visual Library's
 * informative multi-tone set (information, not actions), used as drawn.
 */
function storeFaqs(store, deliveryEta) {
  const mapsHref =
    store.mapsHref ??
    `https://www.google.com/maps/search/${encodeURIComponent(`${store.name} ${store.landmark ?? ''}`)}`
  return [
    {
      icon: faqBoxIcon,
      q: 'Will my parcel wait for me?',
      lead: `Yes, for ${PICKUP_HOLD_DAYS} days after delivery`,
      detail: store.hours ? `Collect any day, ${store.hours}` : 'Collect any day, in store hours',
    },
    {
      icon: faqShieldIcon,
      q: 'Is my parcel safe there?',
      lead: 'Yes, it stays sealed',
      detail: 'Handed only to you, with your OTP',
    },
    {
      icon: faqShopIcon,
      q: 'Will it be delivered home?',
      lead: 'No, pick it up from the store',
      detail: 'Want it home? Pick Deliver to Home',
    },
    {
      icon: faqLocationIcon,
      q: "Where's the store?",
      lead: `${store.walk} away`,
      /* the store's name is on the card behind; a long one would not fit beside See Map */
      detail: 'Directions on the map',
      action: (
        <a className="dtr-faq-map" href={mapsHref} target="_blank" rel="noreferrer">
          {/* the store card's own See Map glyph, tinted jamun to match the outline CTA */}
          <span className="dtr-faq-map-icon" aria-hidden style={{ '--faq-icon': `url("${actionMapIcon}")` }} />
          See Map
        </a>
      ),
    },
    {
      icon: faqTruckIcon,
      q: 'When will it reach the store?',
      lead: deliveryEta ? `By ${deliveryEta}` : 'We will message you',
      detail: "You'll get an SMS when it's ready",
    },
    {
      iconText: 'OTP',
      q: 'Who do I share the OTP with?',
      lead: 'Only the shopkeeper, at the counter',
      detail: 'Never share it on a call',
    },
  ]
}

/**
 * "Call Store" sheet: the questions shoppers usually call a store about, each answered at a
 * glance, then "Still have questions?" with a Call Store CTA. While the store is closed (outside
 * its hours) the sheet opens on that status and the CTA explains instead of dialling. Built on the store picker's sheet classes, so every skin
 * and Duo posture places it like the other self-pickup sheets.
 */
export function StoreFaqSheet({ store, deliveryEta, variant = 'plain', onClose }) {
  const faqs = useMemo(() => storeFaqs(store, deliveryEta), [store, deliveryEta])
  const [callStatus, setCallStatus] = useState(() => storeCallStatus(store))
  const { closed, openLabel, tomorrow } = callStatus
  const [closedUi] = useState(getClosedUi)
  /* Call Store taps while the store can't take them: each one replays the status nudge */
  const [nudge, setNudge] = useState(0)
  const [stillVideo] = useState(prefersReducedMotion)
  /* 'video': the pickup story on top · 'accordion': questions only, one answer open at a time ·
     'video-accordion': both · 'image': a still from the story (text removed) on top of the plain answers */
  const withStory = variant === 'video' || variant === 'video-accordion'
  const withImage = variant === 'image'
  /* image and video variants open on the story, edge to edge, with no title or store row */
  const withScene = withStory || withImage
  const collapsible = variant === 'accordion' || variant === 'video-accordion'
  const [openIndex, setOpenIndex] = useState(-1)

  /* the sheet can stay open across opening / closing time */
  useEffect(() => {
    const id = window.setInterval(() => setCallStatus(storeCallStatus(store)), 30000)
    return () => window.clearInterval(id)
  }, [store])
  /* reset when the store opens or closes (during render, so no frame shows the wrong note) */
  const [nudgedWhileClosed, setNudgedWhileClosed] = useState(closed)
  if (nudgedWhileClosed !== closed) {
    setNudgedWhileClosed(closed)
    setNudge(0)
  }

  /* focus moves into the sheet (screen readers then read the status first) and back on close */
  const sheetRef = useRef(null)
  useEffect(() => {
    const opener = document.activeElement
    sheetRef.current?.focus({ preventScroll: true })
    return () => opener?.focus?.({ preventScroll: true })
  }, [])

  const tel = store.phone ? `tel:${store.phone.replace(/\s/g, '')}` : null

  /* Closed: the first thing the sheet says is that the store is closed and when to call */
  const statusAt = closed ? closedUi : null
  const when = (b) => (
    <>
      You can call {tomorrow ? 'tomorrow ' : ''}
      <span className="dtr-faq-when">
        from {b}
      </span>
    </>
  )
  const status = (extra) => (
    <div className={`dtr-faq-status dtr-faq-status--${closedUi}`} id="dtr-faq-status">
      <span key={`icon-${nudge}`} className={`dtr-faq-status-icon${nudge ? ' is-nudged' : ''}`} aria-hidden>
        {/* hero: the store's doors closing, on a loop */}
        {closedUi === 'hero' ? <ClosingStoreIcon /> : <img src={faqCalendarIcon} alt="" />}
      </span>
      <div className="dtr-faq-status-text">
        <p className="dtr-faq-status-p0">Store is closed now</p>
        <p className="dtr-faq-status-p1" id="dtr-faq-status-when">
          {when(
            <b key={`time-${nudge}`} className={nudge ? 'is-nudged' : undefined}>
              {openLabel}
            </b>,
          )}
        </p>
        {extra}
      </div>
    </div>
  )

  return (
    <div className="dtr-stores-backdrop dtr-faq-backdrop" onClick={onClose}>
      <div
        ref={sheetRef}
        tabIndex={-1}
        className={`dtr-stores-sheet dtr-faq-sheet${withScene ? ' dtr-faq-sheet--scene' : ''}${
          statusAt ? ` dtr-faq-sheet--closed dtr-faq-sheet--closed-${statusAt}` : ''
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dtr-faq-title"
        aria-describedby={statusAt ? 'dtr-faq-status' : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {/* B · a slim notice above everything */}
        {statusAt === 'strip' && status()}

        <div
          className={`dtr-stores-head${statusAt === 'header' ? ' dtr-faq-head--closed' : ''}${
            statusAt === 'hero' ? ' dtr-faq-head--hero' : ''
          }`}
        >
          {/* A · the status takes the title's place (the title stays for screen readers);
              hero · the same, big and centred */}
          {(statusAt === 'header' || statusAt === 'hero') && status()}
          <h3 id="dtr-faq-title" className="dtr-stores-title">
            Frequently Asked Questions
          </h3>
          <button type="button" className="dtr-stores-close" onClick={onClose} aria-label="Close">
            <SheetCloseIcon />
          </button>
        </div>

        <ul
          className={`dtr-stores-list dtr-faq-list${withScene ? ' dtr-faq-list--video dtr-faq-list--scene' : ''}${
            collapsible ? ' dtr-faq-list--accordion' : ''
          }${statusAt === 'card' ? ' dtr-faq-list--closed' : ''}`}
        >
          {/* C · a card that hands over to the answers */}
          {statusAt === 'card' && (
            <li className="dtr-faq-status-row" role="none">
              {status(<p className="dtr-faq-status-p2">Till then, find answers below.</p>)}
            </li>
          )}
          {/* inside the scrolling list, so on short screens it scrolls away and the answers and
              Call Store stay reachable */}
          {withStory && (
            <li className={`dtr-faq-video dtr-faq-scene${stillVideo ? ' dtr-faq-scene--controls' : ''}`}>
              <video
                src={STORY_VIDEO}
                poster={STORY_POSTER}
                autoPlay={!stillVideo}
                controls={stillVideo}
                muted
                loop
                playsInline
                preload="auto"
                aria-label="How store pickup works"
              />
            </li>
          )}
          {withImage && (
            <li className="dtr-faq-video dtr-faq-scene">
              <img src={pickupSceneImage} alt="A shopper collecting her parcel from the shopkeeper at a kirana store" />
            </li>
          )}
          {faqs.map((item, i) => {
            const icon = (
              <span className="dtr-faq-icon" aria-hidden>
                {item.iconText ? (
                  <span className="dtr-faq-icon-text">{item.iconText}</span>
                ) : (
                  <img src={item.icon} alt="" />
                )}
              </span>
            )
            if (collapsible) {
              const open = openIndex === i
              return (
                <li
                  key={item.q}
                  className={`dtr-faq-item dtr-faq-item--accordion${item.action ? ' dtr-faq-item--action' : ''}${
                    open ? ' is-open' : ''
                  }`}
                >
                  {/* outside the button: decorative, and the button's ::after makes the whole row tappable */}
                  {icon}
                  <div className="dtr-faq-acc-body">
                    <button
                      type="button"
                      id={`dtr-faq-q-${i}`}
                      className="dtr-faq-toggle"
                      aria-expanded={open}
                      aria-controls={`dtr-faq-answer-${i}`}
                      onClick={() => setOpenIndex(open ? -1 : i)}
                    >
                      <span className="dtr-faq-q">{item.q}</span>
                      <span className="dtr-faq-chevron" aria-hidden style={{ '--faq-icon': `url("${chevronDownIcon}")` }} />
                    </button>
                    {/* stays mounted so it can slide open; hidden from tab order and readers while shut.
                        A sibling of the button, so See Map is never nested inside it */}
                    <div
                      id={`dtr-faq-answer-${i}`}
                      className="dtr-faq-answer"
                      role="region"
                      aria-labelledby={`dtr-faq-q-${i}`}
                    >
                      <div className="dtr-faq-answer-inner">
                        <div className="dtr-faq-answer-body">
                          <div className="dtr-faq-text">
                            <p className="dtr-faq-lead">{item.lead}</p>
                            <p className="dtr-faq-detail">{item.detail}</p>
                          </div>
                          {item.action && <div className="dtr-faq-action">{item.action}</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              )
            }
            return (
            <li key={item.q} className={`dtr-faq-item${item.action ? ' dtr-faq-item--action' : ''}`}>
              {icon}
              <div className="dtr-faq-text">
                <p className="dtr-faq-q">{item.q}</p>
                <p className="dtr-faq-lead">{item.lead}</p>
                <p className="dtr-faq-detail">{item.detail}</p>
              </div>
              {/* a row's own CTA sits on the right, so the row keeps the same height as the rest */}
              {item.action && <div className="dtr-faq-action">{item.action}</div>}
            </li>
            )
          })}
        </ul>

        <div className="dtr-stores-footer dtr-faq-footer">
          {/* hero: nothing can be called while closed, so the one action is to acknowledge it */}
          {statusAt !== 'hero' && (
            /* a tap the store can't take explains itself here, in the status's own words */
            <div className="dtr-faq-still-slot" aria-live="polite">
              {nudge > 0 ? (
                <div className="dtr-faq-tapnote">
                  <img src={faqCalendarIcon} alt="" aria-hidden />
                  {closed || tel ? (
                    <div>
                      <p>Store is closed now</p>
                      <p>{when(<b>{openLabel}</b>)}</p>
                    </div>
                  ) : (
                    <p>The shopkeeper&apos;s number is not available right now.</p>
                  )}
                </div>
              ) : (
                <p className="dtr-faq-still">Still have questions?</p>
              )}
            </div>
          )}
          {/* never disabled, and one element in every state (focus survives opening time):
              open, it dials; closed, it explains (hero: Okay closes the sheet) */}
          <button
            type="button"
            className={`dtr-stores-confirm dtr-faq-call${statusAt === 'hero' ? ' dtr-faq-okay' : ''}`}
            aria-describedby={closed ? 'dtr-faq-status-when' : undefined}
            onClick={() => {
              if (statusAt === 'hero') onClose()
              else if (closed || !tel) setNudge((n) => n + 1)
              else window.location.href = tel
            }}
          >
            {statusAt === 'hero' ? (
              'Okay'
            ) : (
              <>
                <PhoneIcon /> Call Store
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * State behind the section: the pickup store (closest pre-selected, or `initialStoreId`), the
 * pickup price on this order, the pickup-variant slots and the sheets.
 * `onStoreChange(id)` reports a new store; `autoOpenEdu` opens a variant's education sheet on
 * mount (off where the user already chose on an earlier page).
 */
export function useDeliveryTypeChoice({
  order,
  address,
  deliveryTypeId,
  onSelectDeliveryType,
  pickupVariant = null,
  initialStoreId = null,
  onStoreChange = null,
  autoOpenEdu = true,
  deliveryEta = null,
  faqVariant = 'plain',
}) {
  /* Real stores (<1km, closest first) for the tester's pincode */
  const pickupStores = useMemo(() => getPickupStores(), [])
  const [showStoreSheet, setShowStoreSheet] = useState(false)
  const [storeId, setStoreIdState] = useState(
    () => pickupStores.find((s) => s.id === initialStoreId)?.id ?? pickupStores[0].id,
  )
  const setStoreId = (id) => {
    setStoreIdState(id)
    onStoreChange?.(id)
  }
  const [eduSheetOpen, setEduSheetOpen] = useState(false)
  const [eduSheetSeen, setEduSheetSeen] = useState(false)
  /* COD cohort — plain pickup card with the UPI-only strip instead of variants. */
  const codUser = isCodTestUser()
  const [upiSheetOpen, setUpiSheetOpen] = useState(false)
  /* the store whose Call Store FAQ sheet is open (from the pickup card or the store list) */
  const [faqStore, setFaqStore] = useState(null)

  const isPickup = deliveryTypeId === DELIVERY_TYPE.PICKUP
  const pickupSavings = getPickupSavings(order)
  const pickupTotal = Math.max(0, order.orderTotal - pickupSavings)
  const effectiveOrder = applyDeliveryType(order, deliveryTypeId)

  const activeStore = pickupStores.find((s) => s.id === storeId) ?? pickupStores[0]

  /* Pickup-anytime lab (Figma 2146:110053) — variant slots around the pickup card. */
  const variantComponents = getPickupVariantComponents(pickupVariant?.key)
  /* Band and hours copy follow the selected store's real timings when known. */
  const pickupWindow = useMemo(() => {
    const window_ = getPickupWindow(address?.pin)
    const storeRange = parseHoursRange(activeStore?.hours)
    return storeRange ? { ...window_, ...storeRange } : window_
  }, [address?.pin, activeStore])
  const variantProps = {
    window: pickupWindow,
    store: activeStore,
    homeTotal: order.orderTotal,
    pickupTotal,
    pickupSavings,
    isPickup,
    onSelectPickup: () => onSelectDeliveryType(DELIVERY_TYPE.PICKUP),
    onSelectHome: () => onSelectDeliveryType(DELIVERY_TYPE.HOME),
  }

  /* Card treatment: ETA eyebrows on the cards, per-card price hiding. */
  const treatment = variantComponents?.cardTreatment ?? null
  const showHomePrice = !(treatment?.hidePrices || treatment?.hideHomePrice)
  const showPickupPrice = !(treatment?.hidePrices || treatment?.hidePickupPrice)
  const pickupLabel = treatment?.pickupLabel ?? 'Deliver to Meesho Pickup Store'

  /** Education sheet (1B) opens as soon as the user lands on the page. */
  useEffect(() => {
    if (variantComponents?.Sheet && autoOpenEdu) {
      setEduSheetOpen(true)
      setEduSheetSeen(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, [])

  /** Fallback: if the sheet was somehow not seen yet, first pickup tap opens it. */
  const handlePickupTap = () => {
    if (variantComponents?.Sheet && !isPickup && !eduSheetSeen) {
      setEduSheetOpen(true)
      return
    }
    /* COD cohort: pickup selects immediately; the UPI-only sheet opens on top
       as education, every time. Closing it changes nothing — only reselecting
       home delivery undoes the choice. */
    if (codUser && !isPickup) setUpiSheetOpen(true)
    onSelectDeliveryType(DELIVERY_TYPE.PICKUP)
  }

  return {
    order,
    address,
    onSelectDeliveryType,
    pickupStores,
    storeId,
    setStoreId,
    activeStore,
    isPickup,
    pickupSavings,
    pickupTotal,
    effectiveOrder,
    variantComponents,
    variantProps,
    treatment,
    showHomePrice,
    showPickupPrice,
    pickupLabel,
    codUser,
    handlePickupTap,
    showStoreSheet,
    setShowStoreSheet,
    upiSheetOpen,
    setUpiSheetOpen,
    eduSheetOpen,
    setEduSheetOpen,
    setEduSheetSeen,
    faqStore,
    setFaqStore,
    deliveryEta,
    faqVariant,
  }
}

/** The "Select Delivery Type" section for a useDeliveryTypeChoice() result. */
export function DeliveryTypeSection({ choice, deliveryEta, onChangeAddress }) {
  const {
    order,
    address,
    onSelectDeliveryType,
    activeStore,
    isPickup,
    pickupSavings,
    pickupTotal,
    variantComponents,
    variantProps,
    treatment,
    showHomePrice,
    showPickupPrice,
    pickupLabel,
    codUser,
    handlePickupTap,
    setShowStoreSheet,
    setUpiSheetOpen,
    setFaqStore,
  } = choice
  const pickupInner = (
    <>
      <div className="dtr-card-head">
        {treatment?.PickupPrice ? (
          <treatment.PickupPrice {...variantProps} />
        ) : (
          showPickupPrice && (
            <span className="dtr-card-price dtr-card-price--pickup">
              <span className="dtr-card-mrp">₹{order.orderTotal}</span>
              <span className="dtr-card-amount dtr-card-amount--save">₹{pickupTotal}</span>
              <span className="dtr-card-save-chip">Save ₹{pickupSavings}</span>
            </span>
          )
        )}
        <span className="dtr-card-label">
          {pickupLabel}
          {treatment?.showSaveHint && pickupSavings > 0 && (
            <span className="dtr-card-save-chip dtr-card-save-chip--inline">
              Save ₹{pickupSavings}
            </span>
          )}
          {treatment?.PickupSubLabel && (
            <span className="dtr-card-sublabel">
              <treatment.PickupSubLabel {...variantProps} />
            </span>
          )}
        </span>
        <RadioCheck selected={isPickup} />
      </div>
      {codUser && (
        <UpiOnlyStrip
          onOpen={() => {
            /* Strip tap = choosing pickup too — select, then educate. */
            onSelectDeliveryType(DELIVERY_TYPE.PICKUP)
            setUpiSheetOpen(true)
          }}
        />
      )}
      {/* Collapsed arm: store details reveal only once pickup is selected */}
      {!(treatment?.collapseUntilSelected && !isPickup) && (
        <div className="dtr-card-body">
      <div className="dtr-card-divider" aria-hidden />
      {variantComponents?.Panel && <variantComponents.Panel {...variantProps} />}
      <StoreCard store={activeStore} onCallStore={() => setFaqStore(activeStore)} />
      <div className="dtr-card-divider" aria-hidden />
      <button
        type="button"
        className="dtr-more-stores"
        onClick={(e) => {
          e.stopPropagation()
          setShowStoreSheet(true)
        }}
      >
        See More Stores
        <ChevronRightIcon />
      </button>
        </div>
      )}
    </>
  )

  return (
    <section className="review-shell-section dtr-delivery" aria-label="Select delivery type">
      <h2 className="dtr-delivery-heading">Select Delivery Type</h2>
      {deliveryEta && !treatment?.hideEtaLine && (
        <p className="dtr-delivery-eta">
          <DeliveryTruckIcon />
          <span>
            Order will reach by <strong>{deliveryEta}</strong>
          </span>
        </p>
      )}

      {/* Deliver to Home */}
      <div
        className={`dtr-card${!isPickup ? ' dtr-card--selected' : ''}`}
        role="radio"
        aria-checked={!isPickup}
        tabIndex={0}
        onClick={() => onSelectDeliveryType(DELIVERY_TYPE.HOME)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onSelectDeliveryType(DELIVERY_TYPE.HOME)
        }}
      >
        {treatment?.HomeEyebrow && <treatment.HomeEyebrow {...variantProps} />}
        <div className="dtr-card-head">
          {showHomePrice && (
            <span className="dtr-card-price">
              <span className="dtr-card-amount">₹{order.orderTotal}</span>
            </span>
          )}
          <span className="dtr-card-label">Deliver to Home</span>
          <RadioCheck selected={!isPickup} />
        </div>
        <div className="dtr-card-divider" aria-hidden />
        <div className="dtr-card-address">
          <span className="dtr-card-address-line">{address?.line}</span>
          <button
            type="button"
            className="dtr-card-change"
            onClick={(e) => {
              e.stopPropagation()
              onChangeAddress?.()
            }}
          >
            Change
          </button>
        </div>
      </div>

      {/* Deliver to Meesho Pickup Store */}
      {variantComponents?.Banner && <variantComponents.Banner {...variantProps} />}
      <div
        className={`dtr-card${isPickup ? ' dtr-card--selected' : ''}${
          treatment?.pickupCardClass ? ` ${treatment.pickupCardClass}` : ''
        }${treatment?.panelBody ? ' dil-panel-card' : ''}`}
        role="radio"
        aria-checked={isPickup}
        tabIndex={0}
        onClick={handlePickupTap}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handlePickupTap()
        }}
      >
        {treatment?.PickupEyebrow && <treatment.PickupEyebrow {...variantProps} />}
        {/* Self-pickup v2 card edge (cart review): the band sits under a separate body with
            8px corners and the border, which overlaps the band by 9px */}
        {treatment?.panelBody ? <div className="dtr-card-panel">{pickupInner}</div> : pickupInner}
      </div>
    </section>
  )
}

/** The section's sheets (stores, store FAQ, COD UPI-only, variant education); render at the page root. */
export function DeliveryTypeSheets({ choice }) {
  const {
    address,
    onSelectDeliveryType,
    pickupStores,
    storeId,
    setStoreId,
    isPickup,
    variantComponents,
    variantProps,
    codUser,
    showStoreSheet,
    setShowStoreSheet,
    upiSheetOpen,
    setUpiSheetOpen,
    eduSheetOpen,
    setEduSheetOpen,
    setEduSheetSeen,
    faqStore,
    setFaqStore,
    deliveryEta,
    faqVariant,
  } = choice
  return (
    <>
      {showStoreSheet && (
        <StorePickerSheet
          stores={pickupStores}
          activeId={storeId}
          addressLine={address?.line}
          onConfirm={(id) => {
            setStoreId(id)
            setShowStoreSheet(false)
            /* Confirm Store also enters pickup — same UPI education for COD testers. */
            if (codUser && !isPickup) setUpiSheetOpen(true)
            onSelectDeliveryType(DELIVERY_TYPE.PICKUP)
          }}
          onClose={() => setShowStoreSheet(false)}
          onCallStore={setFaqStore}
        />
      )}

      {/* after the store list, so it opens on top of it */}
      {faqStore && (
        <StoreFaqSheet
          store={faqStore}
          deliveryEta={deliveryEta}
          variant={faqVariant}
          onClose={() => setFaqStore(null)}
        />
      )}

      {/* Pickup is already selected underneath — closing is purely dismissive. */}
      {upiSheetOpen && <UpiOnlySheet onClose={() => setUpiSheetOpen(false)} />}

      {eduSheetOpen && variantComponents?.Sheet && (
        <variantComponents.Sheet
          {...variantProps}
          onConfirm={() => {
            setEduSheetSeen(true)
            setEduSheetOpen(false)
            onSelectDeliveryType(DELIVERY_TYPE.PICKUP)
          }}
          onDismiss={() => {
            setEduSheetSeen(true)
            setEduSheetOpen(false)
          }}
        />
      )}
    </>
  )
}
