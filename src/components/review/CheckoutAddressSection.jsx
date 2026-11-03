import DeliveryRibbon from './DeliveryRibbon'
import './CheckoutAddressSection.css'
import './DeliveryRibbon.css'

export function getAddressLines(address) {
  const city = address.city ?? 'Bangalore'
  let street = (address.line ?? '').trim()
  const citySuffix = new RegExp(`[,\\s]*${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i')
  street = street.replace(citySuffix, '').trim()
  return {
    street: street || address.line,
    cityLine: `${city}, Karnataka - ${address.pin}`,
  }
}

/**
 * Shared delivery address block — Figma address row used on payment step + inline review.
 * @param {'button' | 'link'} [changeStyle]
 */
export default function CheckoutAddressSection({
  address,
  addressConfirmed,
  deliveryEta,
  onChangeAddress,
  changeStyle = 'button',
  className = '',
}) {
  if (!address) return null

  const { street, cityLine } = getAddressLines(address)

  return (
    <section
      className={`checkout-address-section${
        deliveryEta ? ' checkout-address-section--has-delivery' : ''
      }${className ? ` ${className}` : ''}`}
    >
      {deliveryEta && <DeliveryRibbon deliveryEta={deliveryEta} variant="address" />}

      <div className="checkout-address-head">
        <h3>Delivery Address</h3>
        {changeStyle === 'link' && (
          <button type="button" className="checkout-address-change-link" onClick={onChangeAddress}>
            Change
          </button>
        )}
      </div>
      <p className="checkout-address-name">
        <span>{address.name}</span>
        <span className="checkout-address-sep" aria-hidden />
        <span>{address.phone}</span>
      </p>
      <p className="checkout-address-line">{street}</p>
      <p className="checkout-address-line checkout-address-city">{cityLine}</p>
      {addressConfirmed && (
        <p className="checkout-address-confirmed" role="status">
          Address updated
        </p>
      )}
      {changeStyle === 'button' && (
        <button type="button" className="checkout-address-btn" onClick={onChangeAddress}>
          Add/ Change Address
        </button>
      )}
    </section>
  )
}
