import DeliveryTruckIcon from './DeliveryTruckIcon'
import { getAddressLines } from './CheckoutAddressSection'
import './V4CheckoutAddress.css'

const LocationPinIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" width="16" height="16" aria-hidden>
    <path
      d="M8 14.5S2.5 9.2 2.5 5.5A5.5 5.5 0 1 1 13.5 5.5C13.5 9.2 8 14.5 8 14.5Z"
      fill="#90B1FB"
    />
    <circle cx="8" cy="5.5" r="2" fill="#3A66CF" />
  </svg>
)

/**
 * Figma 1766:17940 — V4 unified checkout delivery address.
 * Pin + Change in header; delivery ETA band at bottom.
 */
export default function V4CheckoutAddress({
  address,
  addressConfirmed,
  deliveryEta,
  onChangeAddress,
}) {
  if (!address) return null

  const { street } = getAddressLines(address)
  const addressLine = `${street}, ${address.pin}`

  return (
    <section className="v4-checkout-address" aria-label="Delivery address">
      <div className="v4-checkout-address__body">
        <div className="v4-checkout-address__head">
          <div className="v4-checkout-address__title-row">
            <LocationPinIcon />
            <h2 className="v4-checkout-address__title">Delivery Address</h2>
          </div>
          <button type="button" className="v4-checkout-address__change" onClick={onChangeAddress}>
            Change
          </button>
        </div>

        <p className="v4-checkout-address__name">
          <span>{address.name}</span>
          <span className="v4-checkout-address__sep" aria-hidden />
          <span>{address.phone}</span>
        </p>

        <p className="v4-checkout-address__line">{addressLine}</p>

        {addressConfirmed && (
          <p className="v4-checkout-address__confirmed" role="status">
            Address updated
          </p>
        )}
      </div>

      {deliveryEta && (
        <div className="v4-checkout-address__eta" aria-label={`Delivery by ${deliveryEta}`}>
          <DeliveryTruckIcon />
          <span>
            Delivery by <strong>{deliveryEta}</strong>
          </span>
        </div>
      )}
    </section>
  )
}
