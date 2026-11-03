import './PdpFastDeliveryBand.css'

export default function PdpFastDeliveryBand({ deliveryEta, addressSnippet, onChangeAddress }) {
  if (!deliveryEta) return null

  return (
    <section className="pdp-fast-delivery-band" aria-label={`Delivery by ${deliveryEta}`}>
      <div className="pdp-fast-delivery-band__row">
        <div className="pdp-fast-delivery-band__copy">
          <p className="pdp-fast-delivery-band__eta">
            Free Delivery by <strong>{deliveryEta}</strong>
          </p>
          {addressSnippet && (
            <p className="pdp-fast-delivery-band__address">at {addressSnippet}</p>
          )}
        </div>
        <button type="button" className="pdp-fast-delivery-band__change" onClick={onChangeAddress}>
          Change
        </button>
      </div>
    </section>
  )
}
