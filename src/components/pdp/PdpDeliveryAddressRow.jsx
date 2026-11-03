import './PdpDeliveryAddressRow.css'

export default function PdpDeliveryAddressRow({
  deliveryEta,
  addressSnippet,
  onChangeAddress,
  freeDelivery = true,
}) {
  if (!deliveryEta) return null

  return (
    <section className="pdp-delivery-address-row" aria-label={`Delivery by ${deliveryEta}`}>
      <div className="pdps-delivery__info">
        <p className="pdp-delivery-address-row__text pdps-delivery__eta">
          {freeDelivery && <span className="pdp-delivery-address-row__free">Free </span>}
          Delivery by <strong>{deliveryEta}</strong>
        </p>
        {addressSnippet && (
          <p className="pdps-delivery__address">at {addressSnippet}</p>
        )}
      </div>
      <button type="button" className="pdp-delivery-address-row__change" onClick={onChangeAddress}>
        Change
      </button>
    </section>
  )
}
