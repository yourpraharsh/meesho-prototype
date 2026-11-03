/**
 * Pickup-anytime — "anytime calendar" family (final UT board, Figma 3030:57250).
 * Light-blue eyebrow: "Pickup in 3 days" + sun/moon hours on the left, three
 * calendar tiles on the right (✓ Delivery Day · Day 2 · Day 3). Relative on
 * purpose — the EDD is P90, so calendar dates would promise a window end we
 * can't guarantee.
 */

import { treatmentCompare } from './PickupIdea6Compare'
import './PickupIdea7Calendar.css'

const compactTime = (time) => String(time ?? '').replace(/\s+/g, '').toLowerCase()

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const MiniSunIcon = () => (
  <svg viewBox="0 0 14 14" width="11" height="11" aria-hidden>
    <circle cx="7" cy="7" r="3" fill="#F4B619" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
      <line
        key={deg}
        x1="7"
        y1="1"
        x2="7"
        y2="2.6"
        stroke="#F4B619"
        strokeWidth="1.2"
        strokeLinecap="round"
        transform={`rotate(${deg} 7 7)`}
      />
    ))}
  </svg>
)

const MiniMoonIcon = () => (
  <svg viewBox="0 0 14 14" width="10" height="10" aria-hidden>
    <path d="M10.8 8.8A4.9 4.9 0 0 1 5.2 3.2a4.9 4.9 0 1 0 5.6 5.6Z" fill="#E8B411" />
  </svg>
)

const TileCheckIcon = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
    <circle cx="8" cy="8" r="7.3" fill="#fff" stroke="rgba(3, 141, 99, 0.35)" strokeWidth="1" />
    <path
      d="M4.8 8.2 7 10.4 11.2 5.6"
      stroke="var(--green-base)"
      strokeWidth="1.7"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

function CalendarEyebrow({ window: win }) {
  return (
    <div
      className="pi7-eyebrow dtr-shimmer"
      role="img"
      aria-label={`Pickup in ${win.holdDays} days, ${win.openTime} to ${win.closeTime}: delivery day plus 2 more`}
    >
      <div className="pi7-left">
        <p className="pi7-title">
          Pickup in <strong>{win.holdDays} days</strong>
        </p>
        <p className="pi7-hours">
          <MiniSunIcon /> {win.openTime} <span className="pi7-hours-dash">-</span>{' '}
          <MiniMoonIcon /> {win.closeTime}
        </p>
      </div>
      <div className="pi7-tiles">
        <span className="pi7-tile pi7-tile--delivery">
          <TileCheckIcon />
          <span className="pi7-tile-delivery-label">
            Delivery
            <br />
            Day
          </span>
        </span>
        {[2, 3].map((day) => (
          <span key={day} className="pi7-tile">
            <span className="pi7-tile-head">
              Day
              <span className="pi7-tile-perf" aria-hidden />
            </span>
            <span className="pi7-tile-num">{day}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/* The exact EDD strip the home card shows — reused so both cards match. */
const EddStrip = treatmentCompare.HomeEyebrow

/**
 * Dated arm (post-UT, 25 Aug 2026) — the home card's "Order will reach by"
 * EDD strip sits on top of the pickup card too (identical look on both
 * cards), then the familiar "Pickup in 3 days" calendar row with the real
 * dates the EDD implies: delivery-day tile shows the EDD date, the next
 * tiles the following days — making it visible that the order only REACHES
 * the store on that date (it isn't sitting there already).
 */
function CalendarDatesEyebrow({ window: win }) {
  const days = win.days.slice(0, win.holdDays)
  const arrival = days[0]
  return (
    <div className="pi7-dates">
      <EddStrip window={win} />
      <div
        className="pi7-eyebrow dtr-shimmer"
        role="img"
        aria-label={`Order reaches the store on ${arrival.label}; pick up any day till ${days[days.length - 1].label}, ${win.openTime} to ${win.closeTime}`}
      >
        <div className="pi7-left">
          <p className="pi7-title">
            Pickup in <strong>{win.holdDays} days</strong>
          </p>
          <p className="pi7-hours">
            <MiniSunIcon /> {win.openTime} <span className="pi7-hours-dash">-</span>{' '}
            <MiniMoonIcon /> {win.closeTime}
          </p>
        </div>
        <div className="pi7-tiles">
          {days.map((day, index) => (
            <span key={day.label} className="pi7-tile">
              <span className="pi7-tile-head">
                Day {index + 1}
                <span className="pi7-tile-perf" aria-hidden />
              </span>
              <span className="pi7-tile-num pi7-tile-date">
                {day.dayNum} {MONTH_SHORT[day.date.getMonth()]}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

const storeHours = (win) => `${compactTime(win.openTime)}-${compactTime(win.closeTime)}`

/** Variant 2 — calendar eyebrow (relative days), prices on both cards. */
export const treatmentPriced = {
  PickupEyebrow: CalendarEyebrow,
  storeHours,
}

/** Variant 3 — dated calendar + the EDD eyebrow inside BOTH delivery cards. */
export const treatmentDates = {
  hideEtaLine: true,
  HomeEyebrow: treatmentCompare.HomeEyebrow,
  PickupEyebrow: CalendarDatesEyebrow,
  storeHours,
}
