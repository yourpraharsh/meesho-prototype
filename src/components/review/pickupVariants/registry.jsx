/**
 * Pickup-variant registry — discount-salience lab (post-UT round 2): the
 * "Save ₹" eyebrow and its FTUX spotlight on the review page's pickup card.
 * Slots per entry: Banner (renders above the pickup card) / Panel / Sheet /
 * cardTreatment (eyebrows, price slot, price visibility, sub-label).
 * (The retired convenience set's components remain in PickupIdea* modules.)
 */

import * as DIL from './DiscountIdeasLoud'

/* Subtle round parked in ./DiscountIdeas — superseded: users passed through
   the page without noticing. This LOUD set interrupts the first glance. */
const REGISTRY = {
  '1-spotlight': { cardTreatment: DIL.treatmentSpotlight },
  '2-save-flash': { cardTreatment: DIL.treatmentSaveFlash },
  '3-spotlight-collapsed': { cardTreatment: DIL.treatmentSpotlightCollapsed },
  /* not a lab arm: the cart review's default (Self-pickup v2 "Steady State") */
  steady: { cardTreatment: DIL.treatmentSteady },
  /* cart review Variant 2 (?card=closed): card closed until pickup is chosen */
  'steady-closed': { cardTreatment: DIL.treatmentSteadyClosed },
  /* 4–14 (offer sheet, swing tag, banners, scratch card, countdown, confetti…) removed */
}

/** @returns {{ Banner?: Function, Panel?: Function, Sheet?: Function, cardTreatment?: object } | null} */
export function getPickupVariantComponents(key) {
  if (!key) return null
  return REGISTRY[key] ?? null
}
