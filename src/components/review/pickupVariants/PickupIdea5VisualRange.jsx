/**
 * Pickup-anytime — day/night gradient family (final UT board, Figma 3030:57250).
 * Shared band (sun → moon) with two eyebrow forms:
 *   BandChipEyebrow  — the "Pickup Anytime in 3 days" pill rides the band
 *   DayNightEyebrow  — band + relative 3-day timeline
 * Relative copy on purpose — the EDD is P90, so calendar dates would promise
 * a window end we can't guarantee.
 */

import './PickupIdea5VisualRange.css'

/** '10 AM' → '10am' so the store-hours meta reads compact ("10am-10pm"). */
const compactTime = (time) => String(time ?? '').replace(/\s+/g, '').toLowerCase()

const SunIcon = () => (
  <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden>
    <circle cx="10" cy="10" r="4.2" fill="#F4B619" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
      <line
        key={deg}
        x1="10"
        y1="1.6"
        x2="10"
        y2="4"
        stroke="#F4B619"
        strokeWidth="1.6"
        strokeLinecap="round"
        transform={`rotate(${deg} 10 10)`}
      />
    ))}
  </svg>
)

const MoonIcon = () => (
  <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden>
    <path d="M15.5 12.6A7 7 0 0 1 7.4 4.5a7 7 0 1 0 8.1 8.1Z" fill="#F4D06F" />
  </svg>
)

const NodeCheckIcon = () => (
  <svg viewBox="0 0 10 10" width="8" height="8" aria-hidden>
    <path
      d="M1.8 5.2 4 7.4 8.2 2.8"
      stroke="#fff"
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const TIMELINE_DAYS = 3

/** Morning → night gradient band; center defaults to the caps label. */
function DayNightBand({ open, close, center }) {
  return (
    <div className="pi5-band" aria-hidden>
      <span className="pi5-band-edge pi5-band-edge--sun">
        <SunIcon />
        <span className="pi5-band-time">{open}</span>
      </span>
      {center ?? <span className="pi5-band-arc">Pickup Timings</span>}
      <span className="pi5-band-edge pi5-band-edge--moon">
        <span className="pi5-band-time">{close}</span>
        <MoonIcon />
      </span>
    </div>
  )
}

/** 3-day relative timeline — every day is a valid, check-marked pickup option */
function DayTimeline({ open, close }) {
  return (
    <div
      className="pi5-timeline"
      role="img"
      aria-label={`Pickup on any day — delivery day plus 2 more, open ${open} to ${close}`}
    >
      <p className="pi5-timeline-caption">Pickup on any of these days</p>
      <div className="pi5-grid">
        <span className="pi5-track-line" aria-hidden />
        {Array.from({ length: TIMELINE_DAYS }, (_, index) => (
          <span key={index} className="pi5-col">
            <span className="pi5-node-slot">
              <span className={`pi5-node${index === 0 ? ' pi5-node--first' : ''}`}>
                <NodeCheckIcon />
              </span>
            </span>
            <span className={`pi5-label${index === 0 ? ' pi5-label--first' : ''}`}>
              {index === 0 ? 'Delivery Day' : `Day ${index + 1}`}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

/** Band with the anytime chip riding it — no timeline. */
function BandChipEyebrow({ window: win }) {
  return (
    <div className="pi5-eyebrow pi5-eyebrow--band-only">
      <DayNightBand
        open={win.openTime}
        close={win.closeTime}
        center={
          <span className="pi5-band-chip">
            <span className="pi5-band-chip-text">
              Pickup Anytime in {win.holdDays} days
            </span>
          </span>
        }
      />
    </div>
  )
}

/** Band + timeline eyebrow. */
function DayNightEyebrow({ window: win }) {
  return (
    <div className="pi5-eyebrow">
      <DayNightBand open={win.openTime} close={win.closeTime} />
      <DayTimeline open={win.openTime} close={win.closeTime} />
    </div>
  )
}

const storeHours = (win) => `${compactTime(win.openTime)}-${compactTime(win.closeTime)}`

/** Variant 1 — band + anytime chip, prices on both cards. */
export const treatmentBandChipPriced = {
  PickupEyebrow: BandChipEyebrow,
  storeHours,
}

/** Variant 2 — band + anytime chip, no price columns, inline save chip. */
export const treatmentBandChipQuiet = {
  hidePrices: true,
  showSaveHint: true,
  PickupEyebrow: BandChipEyebrow,
  storeHours,
}

/** Variant 8 — band + timeline, pickup priced, home price hidden. */
export const treatmentDayNightDays = {
  hideHomePrice: true,
  PickupEyebrow: DayNightEyebrow,
  storeHours,
}
