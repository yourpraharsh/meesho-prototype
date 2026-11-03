import DeliveryTruckIcon from './DeliveryTruckIcon'
import './DeliveryRibbon.css'

/**
 * Figma delivery ribbon — shared band + tucked corner ears.
 * @param {'product' | 'address' | 'dock'} [variant] — placement; product = card overlay, address/dock = section header slot
 */
export default function DeliveryRibbon({ deliveryEta, variant = 'address' }) {
  if (!deliveryEta) return null

  const ribbon = (
    <div
      className={`delivery-ribbon delivery-ribbon--${variant}`}
      aria-label={`Delivery by ${deliveryEta}`}
      role="status"
    >
      <div className="delivery-ribbon-band">
        <DeliveryTruckIcon />
        <span className="delivery-ribbon-text">
          Delivery by <strong>{deliveryEta}</strong>
        </span>
      </div>
    </div>
  )

  if (variant === 'product') return ribbon

  const slotClass =
    variant === 'dock' ? 'delivery-ribbon-slot delivery-ribbon-slot--dock' : 'delivery-ribbon-slot'

  return <div className={slotClass}>{ribbon}</div>
}
