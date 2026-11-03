import { useDealTimer } from '../../hooks/useDealTimer'
import './PlpPriceMarkers.css'
import { publicUrl } from '../../utils/publicUrl'

function SaleBoltIcon() {
  return (
    <svg
      className="plp-marker-sale-bolt"
      width="7"
      height="9"
      viewBox="0 0 7 9"
      fill="none"
      aria-hidden
    >
      <path d="M4.62 0L0 5.18H2.77L2.15 9L7 3.54H4.23L4.62 0Z" fill="#FEEF98" />
    </svg>
  )
}

export function PlpUpiMarker({ amountOff }) {
  return (
    <span className="plp-marker plp-marker--upi">
      {amountOff > 0 && <span className="plp-marker-upi-amt">₹{amountOff} off</span>}
      <span className="plp-marker-upi-label">UPI</span>
    </span>
  )
}

export function PlpSaleMarker() {
  return (
    <span className="plp-marker plp-marker--sale">
      <span className="plp-marker-sale-label">SALE</span>
      <SaleBoltIcon />
    </span>
  )
}

export function PlpComboMarker() {
  return (
    <span className="plp-marker plp-marker--combo">
      <span className="plp-marker-combo-bold">COMBO</span>
      <span className="plp-marker-combo-soft">OFFER</span>
    </span>
  )
}

function PriceDropShrinkIcon() {
  return (
    <img
      className="plp-marker-less-today-icon"
      src={publicUrl('/badges/price-drop-shrink-icon.svg')}
      alt=""
      width={14}
      height={14}
      decoding="async"
      aria-hidden
    />
  )
}

export function PlpDealTimerMarker({ productId, globalIndex }) {
  const label = useDealTimer(productId, globalIndex, true)
  if (!label) return <span className="plp-marker plp-marker--deal-timer">Deal timer</span>
  return (
    <span className="plp-marker plp-marker--deal-timer">
      <span className="plp-marker-deal-timer-icon" aria-hidden>
        ⏱
      </span>
      {label}
    </span>
  )
}

export function PlpPriceConsiderationMarker({ tag, label }) {
  if (tag === 'less_today') {
    return (
      <span className="plp-marker plp-marker--less-today">
        <span className="plp-marker-less-today-icon-wrap" aria-hidden>
          <PriceDropShrinkIcon />
        </span>
        <span className="plp-marker-less-today-label">{label}</span>
      </span>
    )
  }

  if (tag === 'price_drop') {
    return <span className="plp-marker plp-marker--price-drop">Price Drop!</span>
  }

  return <span className="plp-marker plp-marker--consideration">{label}</span>
}

export function PlpReturnOfferMarker({ label }) {
  return <span className="plp-marker plp-marker--return-offer">{label}</span>
}

export function PlpProductDiscountMarker({ label }) {
  return <span className="plp-marker plp-marker--plain">{label}</span>
}

/**
 * Renders the PLP price marker for a review discount line.
 */
export function ReviewDiscountMarker({ line, productId, globalIndex }) {
  const flavour = line.flavour
  const amountOff = line.amount

  switch (line.marker) {
    case 'upi':
      return <PlpUpiMarker amountOff={flavour?.saleAmountOff ?? amountOff} />
    case 'sale':
      return <PlpSaleMarker />
    case 'combo_offer':
      return <PlpComboMarker />
    case 'deal_timer':
      return <PlpDealTimerMarker productId={productId} globalIndex={globalIndex} />
    case 'price_drop':
    case 'less_today':
    case 'lowest_price_30d':
      return <PlpPriceConsiderationMarker tag={line.marker} label={line.label} />
    case 'return_offer':
      return <PlpReturnOfferMarker label={line.label} />
    default:
      return <PlpProductDiscountMarker label={line.label ?? 'Discount'} />
  }
}
