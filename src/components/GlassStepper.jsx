import { useUiTheme } from '../utils/uiTheme'

const STEPS = ['Review', 'Payment']

/**
 * Checkout progress that lives INSIDE the glass header (iOS skin only; the Meesho skin keeps
 * its "Step 1/2" pill). `current` is 1-based; `steps` defaults to Review · Payment (the cart
 * flow passes Cart · Review · Payment). Only the cart flow renders it — Buy Now shows none.
 */
export default function GlassStepper({ current = 1, steps = STEPS }) {
  const [theme] = useUiTheme()
  if (theme !== 'ios') return null
  return (
    <ol className="glass-stepper" aria-label={`Step ${current} of ${steps.length}`}>
      {steps.map((label, i) => {
        const n = i + 1
        const state = n < current ? 'done' : n === current ? 'current' : 'todo'
        return (
          <li key={label} className={`glass-stepper-step glass-stepper-step--${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="glass-stepper-node">{n}</span>
            <span className="glass-stepper-label">{label}</span>
          </li>
        )
      })}
    </ol>
  )
}
