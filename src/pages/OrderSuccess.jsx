import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import circleImg from '../assets/order-sot/confirmed-circle.svg'
import shadowImg from '../assets/order-sot/confirmed-shadow.svg'
import checkImg from '../assets/order-sot/confirmed-check.svg'
import './OrderSuccess.css'

/** Splash stays up this long (the tick finishes drawing at ~1.1s), then home. */
const HOME_AFTER_MS = 3200

/* The check (Figma 9656:133978) is revealed through a mask whose stroke runs along its centre
   line, so it draws on like a pen stroke: short leg first, then the long one. The path starts
   and ends past the check's rounded ends so they are fully revealed. */
const CHECK_W = 43.7868
const CHECK_H = 32.6042
const CHECK_STROKE_PATH = 'M-0.3 12.6 L14.4 27.9 L44.3 -0.2'

/**
 * Order Confirmed splash (Figma fdR1rJfu0Yszfeb1Em0Hma · 167:27187): green screen, white
 * disc with an offset darker shadow, the green tick drawing itself, then "Order Confirmed!".
 */
export default function OrderSuccess() {
  const navigate = useNavigate()
  const location = useLocation()
  const payload = location.state

  useEffect(() => {
    if (payload?.payable == null) {
      navigate('/', { replace: true })
      return undefined
    }
    const homeTimer = window.setTimeout(() => navigate('/', { replace: true }), HOME_AFTER_MS)
    return () => clearTimeout(homeTimer)
  }, [navigate, payload?.payable])

  if (payload?.payable == null) return null

  return (
    <div className="order-success" role="status" aria-live="polite">
      <div className="order-success-badge" aria-hidden>
        <img className="order-success-badge-shadow" src={shadowImg} alt="" />
        <img className="order-success-badge-circle" src={circleImg} alt="" />
        <svg
          className="order-success-badge-check"
          width={CHECK_W}
          height={CHECK_H}
          viewBox={`0 0 ${CHECK_W} ${CHECK_H}`}
        >
          <defs>
            <mask id="order-success-check-reveal" maskUnits="userSpaceOnUse" x="-8" y="-8" width="60" height="50">
              <path className="order-success-check-stroke" d={CHECK_STROKE_PATH} pathLength="1" />
            </mask>
          </defs>
          <image href={checkImg} width={CHECK_W} height={CHECK_H} mask="url(#order-success-check-reveal)" />
        </svg>
      </div>
      <h1 className="order-success-title">Order Confirmed!</h1>
    </div>
  )
}
