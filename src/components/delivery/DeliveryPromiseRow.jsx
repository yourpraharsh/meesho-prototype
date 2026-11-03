import FastDeliveryLogo from './FastDeliveryLogo'
import DeliveryTruckMark from './DeliveryTruckMark'
import './DeliveryPromiseRow.css'

/**
 * @param {{ promise: ReturnType<import('../../utils/deliveryPromise').buildDeliveryPromise>, size?: 'plp' | 'pdp', className?: string }} props
 */
export default function DeliveryPromiseRow({ promise, size = 'plp', className = '' }) {
  if (!promise) return null

  return (
    <div
      className={`delivery-promise-row delivery-promise-row--${size}${
        promise.isFast ? ' delivery-promise-row--fast' : ' delivery-promise-row--normal'
      }${className ? ` ${className}` : ''}`}
      aria-label={promise.label}
    >
      <div className="delivery-promise-callout">
        {promise.isFast ? <FastDeliveryLogo /> : <DeliveryTruckMark />}
        <span className="delivery-promise-text">
          <strong>{promise.dayLabel}</strong>
          {' Delivery'}
        </span>
      </div>
    </div>
  )
}
