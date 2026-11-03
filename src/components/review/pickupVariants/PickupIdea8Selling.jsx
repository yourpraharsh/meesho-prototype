/**
 * Pickup-anytime — "selling" family (final UT board, Figma 3030:57250).
 * Benefit-first copy in Meesho blue:
 *   SellingEyebrow — solid blue strip "Pickup order when you are free" +
 *                    "Anytime in 3 days" chip; home price hidden.
 *   Collapsed arm  — pickup card stays collapsed (no store info) with a blue
 *                    selling pill under the label; expands on selection.
 */

import './PickupIdea8Selling.css'

const compactTime = (time) => String(time ?? '').replace(/\s+/g, '').toLowerCase()

function SellingEyebrow({ window: win }) {
  return (
    <div className="pi8-eyebrow dtr-shimmer">
      <span className="pi8-eyebrow-text">Pickup order when you are free</span>
      <span className="pi8-eyebrow-chip">Anytime in {win.holdDays} days</span>
    </div>
  )
}

/** Blue selling pill rendered under the option label (collapsed arm). */
function SellingPill() {
  return <span className="pi8-pill">Pickup your order when you are free</span>
}

const storeHours = (win) => `${compactTime(win.openTime)}-${compactTime(win.closeTime)}`

/** Variant 5 — selling eyebrow; pickup priced, home price hidden. */
export const treatmentEyebrow = {
  hideHomePrice: true,
  PickupEyebrow: SellingEyebrow,
  storeHours,
}

/** Variant 6 — collapsed pickup card with the selling pill; expands on click. */
export const treatmentCollapsed = {
  collapseUntilSelected: true,
  PickupSubLabel: SellingPill,
  storeHours,
}
