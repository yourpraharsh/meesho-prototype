import '../../styles/cart-sot/step-pill.css'

/**
 * Cart flow progress: a "STEP n/3" pill at the right end of the top nav on Cart, Review and
 * Payment, on every skin. Replaces the Cart · Review · Payment stepper and the offer band
 * (neither is in the app). Figma self-pickup-v3 · self pickup at cart.
 */
export default function CartStepPill({ current, total = 3 }) {
  return (
    <span className="cart-step-pill" aria-label={`Step ${current} of ${total}`}>
      Step {current}/{total}
    </span>
  )
}
