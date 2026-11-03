/**
 * Pickup-anytime — "comparing EDD and pickup time" (final UT board, Figma 3030:57250).
 * Both delivery cards carry a blue-gradient "Order will reach by {date}"
 * eyebrow; the pickup card adds a solid blue "Pickup Anytime in 3 days" pill.
 * Prices stay on both cards; the global ETA line is hidden (the eyebrows
 * carry it). Chip copy is delivery-relative — the EDD is P90, so a calendar
 * range would promise a window end we can't guarantee.
 */

import './PickupIdea6Compare.css'

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const shortDate = (day) => `${day.dayNum} ${MONTH_SHORT[day.date.getMonth()]}`

const compactTime = (time) => String(time ?? '').replace(/\s+/g, '').toLowerCase()

function Eyebrow({ children, chip, shimmer = false }) {
  return (
    <div className={`pi6-eyebrow${shimmer ? ' dtr-shimmer' : ''}`}>
      <span className="pi6-eyebrow-text">{children}</span>
      {chip && <span className="pi6-chip">{chip}</span>}
    </div>
  )
}

/* No shimmer on the home strip — the highlight belongs to pickup only. */
const HomeEyebrow = ({ window: win }) => (
  <Eyebrow>
    Order will reach by <strong>{shortDate(win.arrival)}</strong>
  </Eyebrow>
)

const PickupEyebrow = ({ window: win }) => (
  <Eyebrow shimmer chip={`Pickup Anytime in ${win.holdDays} days`}>
    Order will reach by <strong>{shortDate(win.arrival)}</strong>
  </Eyebrow>
)

const storeHours = (win) => `${compactTime(win.openTime)}-${compactTime(win.closeTime)}`

/** Variant 7 — EDD comparison eyebrows on both cards, prices on. */
export const treatmentCompare = {
  hideEtaLine: true,
  HomeEyebrow,
  PickupEyebrow,
  storeHours,
}
