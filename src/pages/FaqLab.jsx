import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { StoreFaqSheet, storeCallStatus } from '../components/review/DeliveryTypeSection'
import { getPickupStores } from '../utils/deliveryTypes'
import { getDeliveryEtaForPin } from '../utils/checkoutConfig'
import { getSelectedPincode } from '../utils/testPincode'
import './FaqLab.css'

/* the five Call Store FAQ versions, in the order they were added, with the feed cards each gets */
const VARIANTS = [
  { id: 'plain', name: 'Plain answers', cards: 'Odd cards (1st, 7th…)' },
  { id: 'video', name: 'Video on top', cards: 'Even cards (2nd, 14th…)' },
  { id: 'accordion', name: 'Collapsed questions', cards: 'Every 3rd card' },
  { id: 'video-accordion', name: 'Video + collapsed questions', cards: 'Every 4th card' },
  { id: 'image', name: 'Illustration on top', cards: 'Every 5th card' },
]

const CLOCKS = [
  { time: '23:00', label: 'Closed · 11 PM' },
  { time: '01:00', label: 'Closed · 1 AM' },
  { time: '14:00', label: 'Open · 2 PM' },
]

/* how the closed status is shown — the sheet reads ?closedUi itself */
const CLOSED_UIS = [
  { id: 'hero', label: 'Centred · Okay' },
  { id: 'header', label: 'A · Header' },
  { id: 'strip', label: 'B · Strip' },
  { id: 'card', label: 'C · Card' },
]

/**
 * /faq-lab — every Call Store FAQ version side by side, in phone-sized frames, for reviews.
 * ?storeTime=HH:MM sets the store clock (default 11 PM, closed); ?closedUi picks the closed style.
 */
export default function FaqLab() {
  const { search } = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(search)
  const time = params.get('storeTime')
  const closedUi = CLOSED_UIS.some((c) => c.id === params.get('closedUi')) ? params.get('closedUi') : 'hero'

  /* keeps whatever else is in the link (e.g. ?pin=) and fills in the clock + closed style */
  const withParams = (next = {}) => {
    const merged = new URLSearchParams(search)
    merged.set('storeTime', time ?? CLOCKS[0].time)
    merged.set('closedUi', closedUi)
    Object.entries(next).forEach(([k, v]) => merged.set(k, v))
    return `/faq-lab?${merged}`
  }
  const go = (next) => navigate(withParams(next), { replace: true })

  /* the sheets read the store clock from the URL */
  useEffect(() => {
    if (!time) navigate(withParams(), { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- withParams only reads search/time/closedUi
  }, [time, closedUi, search, navigate])
  if (!time) return null

  const store = getPickupStores()[0]
  const { closed } = storeCallStatus(store)
  const eta = getDeliveryEtaForPin(getSelectedPincode())

  return (
    <div className="faq-lab">
      <header className="faq-lab-head">
        <div>
          <h1 className="faq-lab-title">Call Store FAQ · all versions</h1>
          <p className="faq-lab-sub">
            {store.name} · open {store.hours || '10 AM – 10 PM (default)'}.{' '}
            {!closed
              ? 'Open now: Call Store dials the shopkeeper.'
              : closedUi === 'hero'
                ? 'Closed now: the sheet says so first, and its one button is Okay.'
                : 'Closed now: the sheet says so first, and Call Store explains instead of dialling.'}
          </p>
        </div>
        <div className="faq-lab-controls">
          <div className="faq-lab-toggle" role="group" aria-label="Store clock">
            {CLOCKS.map((c) => (
              <button
                key={c.time}
                type="button"
                className={time === c.time ? 'is-active' : ''}
                aria-pressed={time === c.time}
                onClick={() => go({ storeTime: c.time })}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="faq-lab-toggle" role="group" aria-label="Closed style">
            {CLOSED_UIS.map((c) => (
              <button
                key={c.id}
                type="button"
                className={closedUi === c.id ? 'is-active' : ''}
                aria-pressed={closedUi === c.id}
                disabled={!closed}
                onClick={() => go({ closedUi: c.id })}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="faq-lab-grid">
        {VARIANTS.map((v, i) => (
          <figure key={v.id} className="faq-lab-item">
            <figcaption className="faq-lab-caption">
              <strong>
                {i + 1}. {v.name}
              </strong>
              <span>{v.cards}</span>
            </figcaption>
            {/* the frame is the sheet's containing block (transform), so its fixed backdrop fills
                the frame, not the window; remounts when the clock or the closed style changes */}
            <div key={`${v.id}-${time}-${closedUi}`} className="faq-lab-phone">
              <StoreFaqSheet store={store} deliveryEta={eta} variant={v.id} onClose={() => {}} />
            </div>
          </figure>
        ))}
      </div>
    </div>
  )
}
