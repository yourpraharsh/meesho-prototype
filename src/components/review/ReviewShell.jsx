import { useMemo, useState } from 'react'
import { useRailActions } from '../../context/RailContext'
import GlassStepper from '../GlassStepper'
import { Link } from 'react-router-dom'
import { getHeroImageForProduct } from '../../data/categoryProductImages'
import { ReviewDiscountMarker } from '../plp/PlpPriceMarkers'
import { buildOrderDiscountLines, getPlpIndexForProduct } from '../../utils/orderDiscountLines'
import { getPlpCardData } from '../../utils/plpCardData'
import CheckoutAddressSection from './CheckoutAddressSection'
import DeliveryRibbon from './DeliveryRibbon'
import './ReviewShell.css'
import './CheckoutAddressSection.css'
import './DeliveryRibbon.css'

const IMAGE_FALLBACK = 'https://placehold.co/400x400/e2e8f0/64748b?text=Product'

const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="24" height="24" aria-hidden>
    <path
      className="glass-chevron"
      d="M15 18L9 12L15 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  <path className="glass-arrow" d="M10 17L5 12L9.99996 7M5 12H19" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
  </svg>
)

const LocationPinIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" width="16" height="16" aria-hidden>
    <path
      d="M8 14.5S2.5 9.2 2.5 5.5A5.5 5.5 0 1 1 13.5 5.5C13.5 9.2 8 14.5 8 14.5Z"
      fill="#90B1FB"
    />
    <circle cx="8" cy="5.5" r="2" fill="#3A66CF" />
  </svg>
)

const ChevronDownIcon = ({ expanded }) => (
  <svg
    viewBox="0 0 8 16"
    fill="none"
    width="8"
    height="16"
    aria-hidden
    className={expanded ? 'review-shell-chevron review-shell-chevron--open' : 'review-shell-chevron'}
  >
    <path d="M2 2L6 8L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const DiscountChipIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <g clipPath="url(#review_discount_chip_clip)">
      <path
        d="M0.312756 15.5298L3.23186 4.15418C3.33083 3.76847 3.82018 3.64816 4.08981 3.9412C7.39991 7.5387 9.93019 9.88009 11.7377 11.7893C11.9904 12.0563 11.8696 12.4919 11.5175 12.5977L0.656944 15.8603C0.452692 15.9216 0.259747 15.7364 0.312756 15.5298Z"
        fill="#F4B619"
      />
      <path
        d="M8.79357 7.19724C10.5353 5.57595 11.8235 4.80167 14.8046 6.19052"
        stroke="#5585F8"
        strokeLinecap="round"
      />
      <path
        d="M9.54102 1.4541C9.9058 3.4619 8.58353 4.6293 7.53874 5.46134"
        stroke="#23BB75"
        strokeLinecap="round"
      />
      <path
        d="M11.291 8.53223C11.779 8.59719 12.5565 8.90374 13.0626 9.57531"
        stroke="#23BB75"
        strokeLinecap="round"
      />
      <path
        d="M5.84805 0.918333C5.64601 0.727991 5.34037 0.745352 5.16541 0.957112C4.99044 1.16887 5.0124 1.49484 5.21445 1.68518L5.53125 1.30176L5.84805 0.918333ZM5.82071 3.80175C5.80685 4.08577 6.01199 4.33226 6.27891 4.35228C6.54583 4.37231 6.77344 4.15829 6.7873 3.87426L6.30401 3.838L5.82071 3.80175ZM5.53125 1.30176L5.21445 1.68518C5.46128 1.91771 5.88347 2.51581 5.82071 3.80175L6.30401 3.838L6.7873 3.87426C6.86427 2.29721 6.33836 1.38024 5.84805 0.918333L5.53125 1.30176Z"
        fill="#5585F8"
      />
      <circle cx="13.9094" cy="12.3889" r="0.8" fill="#5585F8" />
      <circle cx="13.4491" cy="2.37598" r="0.75" fill="#5585F8" />
      <circle cx="2.97644" cy="2.2041" r="0.75" fill="#5585F8" />
    </g>
    <defs>
      <clipPath id="review_discount_chip_clip">
        <rect width="16" height="16" fill="white" />
      </clipPath>
    </defs>
  </svg>
)

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10" aria-hidden>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

function parseOfferLabel(offerLabel) {
  if (!offerLabel) return null
  const match = offerLabel.match(/^(₹\d+\s+OFF)\s*(.*)$/i)
  if (!match) return { highlight: offerLabel, rest: '' }
  return { highlight: match[1], rest: match[2] || 'on this order' }
}

/**
 * Shared review chrome — Figma review-order clarity baseline.
 */
export default function ReviewShell({
  title,
  step,
  layout = 'clarity',
  offerLabel,
  cohort,
  deliveryEta,
  product,
  order,
  sizeLabel,
  returnTypeLabel,
  address,
  addressConfirmed,
  onBack,
  onChangeAddress,
  onAddNewAddress,
  onDeliverToAddress,
  children,
  footer,
}) {
  useRailActions([{ id: 'back', icon: 'back', label: 'Back', onClick: onBack }])
  const isAddressFirst = layout === 'address-first'
  const isPaymentInline = layout === 'payment-inline'
  const isPrepaidSummary = layout === 'prepaid-summary'
  const isClarity = layout === 'clarity'
  const useFlatProductCard = isAddressFirst || isPaymentInline || isPrepaidSummary
  const useExpandedPrice = isAddressFirst || isPrepaidSummary
  const showProductReturnMeta = !isPaymentInline
  const [priceExpanded, setPriceExpanded] = useState(useExpandedPrice)
  const showInlineAddress = address && !isAddressFirst
  const showPriceDetails = !isPaymentInline
  const heroSrc = getHeroImageForProduct(product) || product?.hero_image_url || IMAGE_FALLBACK
  const ratingValue = Math.min(4.9, Number(product?.rating?.value ?? 0))
  const plpIndex = useMemo(() => (product ? getPlpIndexForProduct(product) : 0), [product])
  const ratingCount = product ? getPlpCardData(product, plpIndex).ratingCountRaw : 0
  const discountLines = useMemo(
    () => (product && order ? buildOrderDiscountLines(product, order) : []),
    [product, order],
  )
  const productId = product?.product_id ?? product?.productId ?? product?.id
  const discountCalloutText =
    order?.totalDiscount > 0
      ? `${order.savingsLabel ?? `₹${order.totalDiscount} discount applied`}!`
      : null

  const discountCallout = discountCalloutText ? (
    <div className="review-shell-price-details-inset">
      <p className="review-shell-discount-chip">
        {!isPrepaidSummary && (
          <span className="review-shell-discount-chip-icon" aria-hidden>
            <DiscountChipIcon />
          </span>
        )}
        {discountCalloutText}
      </p>
    </div>
  ) : null

  const offerParts = parseOfferLabel(offerLabel)

  return (
    <div
      className={`review-shell${isClarity ? ' review-shell--clarity' : ''}${
        isAddressFirst ? ' review-shell--address-first' : ''
      }${isPaymentInline ? ' review-shell--payment-inline' : ''}${
        isPaymentInline && cohort === 'prepaid' ? ' review-shell--payment-inline-prepaid' : ''
      }${isPrepaidSummary ? ' review-shell--prepaid-summary' : ''}`}
    >
      <header className="review-shell-header">
        <div className="review-shell-header-main">
          <button type="button" className="review-shell-back" onClick={onBack} aria-label="Back">
            <BackIcon />
          </button>
          <h1 className="review-shell-title">{title}</h1>
          <span className="glass-nav-spacer" aria-hidden />
        </div>
        {step ? (
          <span className="review-shell-step">
            <span className="review-shell-step-label">Step</span>
            <span className="review-shell-step-value">{step}</span>
          </span>
        ) : (
          <span className="review-shell-step-spacer" aria-hidden />
        )}
        <GlassStepper current={1} />
      </header>

      {offerParts && (
        <div className="review-shell-offer-scallop" role="status">
          <p className="review-shell-offer-scallop-text">
            <span className="review-shell-offer-highlight">{offerParts.highlight}</span>
            <span className="review-shell-offer-rest">{offerParts.rest}</span>
          </p>
        </div>
      )}

      <div className="review-shell-body">
        <article className="review-shell-section review-shell-product-card">
          {useFlatProductCard ? (
            <div className="review-shell-item">
              <img className="review-shell-item-img" src={heroSrc} alt="" />
              <div className="review-shell-item-body">
                <h2 className="review-shell-item-title">{product?.title}</h2>
                <div className="review-shell-item-price-row">
                  <span className="review-shell-item-price">₹{order.orderTotal}</span>
                  {order.mrp > order.orderTotal && (
                    <span className="review-shell-item-mrp">₹{order.mrp}</span>
                  )}
                  {order.discountPercent > 0 && (
                    <span className="review-shell-item-off">{order.discountPercent}% off</span>
                  )}
                </div>
                {(sizeLabel || (returnTypeLabel && showProductReturnMeta)) && (
                  <p className="review-shell-item-meta">
                    {sizeLabel && <span>Size: {sizeLabel}</span>}
                    {sizeLabel && returnTypeLabel && showProductReturnMeta && (
                      <span className="review-shell-meta-dot" aria-hidden />
                    )}
                    {returnTypeLabel && showProductReturnMeta && <span>{returnTypeLabel}</span>}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="review-shell-product-card-inner">
              <DeliveryRibbon deliveryEta={deliveryEta} variant="product" />

              <div className="review-shell-item">
                <img className="review-shell-item-img" src={heroSrc} alt="" />
                <div className="review-shell-item-body">
                  <h2 className="review-shell-item-title">{product?.title}</h2>
                  <div className="review-shell-item-price-row">
                    <span className="review-shell-item-price">₹{order.orderTotal}</span>
                    {order.mrp > order.orderTotal && (
                      <span className="review-shell-item-mrp">₹{order.mrp}</span>
                    )}
                    {order.discountPercent > 0 && (
                      <span className="review-shell-item-off">{order.discountPercent}% off</span>
                    )}
                  </div>
                  {(sizeLabel || returnTypeLabel) && (
                    <p className="review-shell-item-meta">
                      {sizeLabel && <span>Size: {sizeLabel}</span>}
                      {sizeLabel && returnTypeLabel && (
                        <span className="review-shell-meta-dot" aria-hidden />
                      )}
                      {returnTypeLabel && <span>{returnTypeLabel}</span>}
                    </p>
                  )}
                  {ratingValue > 0 && (
                    <div className="review-shell-item-rating">
                      <span className="review-shell-rating-pill">
                        {ratingValue} <StarIcon />
                      </span>
                      <span className="review-shell-rating-count">({ratingCount.toLocaleString()})</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </article>

        {showPriceDetails && (
        <section className="review-shell-section review-shell-price-details" aria-label="Price details">
          {useExpandedPrice ? (
            <h2 className="review-shell-price-heading">Price Details (1 Product)</h2>
          ) : (
            <button
              type="button"
              className="review-shell-price-summary"
              aria-expanded={priceExpanded}
              onClick={() => setPriceExpanded((open) => !open)}
            >
              <span>Price Details</span>
              <span className="review-shell-price-summary-right">
                ₹{order.orderTotal}
                <ChevronDownIcon expanded={priceExpanded} />
              </span>
            </button>
          )}

          {discountCallout && !useExpandedPrice && discountCallout}

          {(priceExpanded || useExpandedPrice) && (
            <div className={`review-shell-price-breakdown${useExpandedPrice ? ' review-shell-price-breakdown--address-first' : ''}`}>
              <div className="review-shell-price-row">
                <span>{useExpandedPrice ? 'Product Charges (1 Product)' : 'Total Price'}</span>
                <span>{useExpandedPrice ? `₹${order.mrp}` : `+ ₹${order.mrp}`}</span>
              </div>
              {discountLines.length > 0 && (
                <>
                  {discountLines.map((line) => (
                    <div
                      key={line.id}
                      className="review-shell-price-row review-shell-price-row--discount review-shell-price-row--marker"
                    >
                      <span className="review-shell-price-marker">
                        <ReviewDiscountMarker
                          line={line}
                          productId={productId}
                          globalIndex={plpIndex}
                        />
                      </span>
                      <span>{useExpandedPrice ? `− ₹${line.amount}` : `−₹${line.amount}`}</span>
                    </div>
                  ))}
                </>
              )}
              {useExpandedPrice && <div className="review-shell-price-divider" aria-hidden />}
              <div className="review-shell-price-row review-shell-price-row--total">
                <span>Order Total</span>
                <span>₹{order.orderTotal}</span>
              </div>
            </div>
          )}

          {discountCallout && useExpandedPrice && discountCallout}
        </section>
        )}

        {showInlineAddress && (
          <CheckoutAddressSection
            address={address}
            addressConfirmed={addressConfirmed}
            deliveryEta={isClarity ? null : deliveryEta}
            onChangeAddress={onChangeAddress}
            changeStyle="button"
            className={`review-shell-section${
              isPaymentInline || isPrepaidSummary ? ' review-shell-address-v3' : ' review-shell-address-inline'
            }`}
          />
        )}

        {children}
      </div>

      {isAddressFirst && address && (
        <footer className="review-shell-address-dock">
          <div className={`review-shell-address-dock-panel${deliveryEta ? ' review-shell-address-dock-panel--has-delivery' : ''}`}>
            <DeliveryRibbon deliveryEta={deliveryEta} variant="dock" />
            <div className="review-shell-address-head">
              <LocationPinIcon />
              <h3>Delivery Address</h3>
            </div>
            <p className="review-shell-address-name">
              <span>{address.name}</span>
              <span className="review-shell-address-sep" aria-hidden />
              <span>{address.phone}</span>
            </p>
            <p className="review-shell-address-line">
              {address.line}, {address.city ?? 'Bangalore'}, Karnataka - {address.pin}
            </p>
            {addressConfirmed && (
              <p className="review-shell-address-confirmed" role="status">
                Address updated
              </p>
            )}
          </div>
          <div className="review-shell-address-dock-actions">
            <button
              type="button"
              className="review-shell-address-add-new"
              onClick={onAddNewAddress ?? onChangeAddress}
            >
              + Add New
            </button>
            <button
              type="button"
              className="review-shell-deliver-btn"
              onClick={onDeliverToAddress}
            >
              Deliver to this address
            </button>
          </div>
        </footer>
      )}

      {footer && !isAddressFirst && <footer className="review-shell-footer">{footer}</footer>}
    </div>
  )
}

export function ReviewConfirmButton({ label, onClick, disabled }) {
  const [placing, setPlacing] = useState(false)

  const handleClick = async () => {
    if (disabled || placing || !onClick) return
    setPlacing(true)
    try {
      await onClick()
    } finally {
      setPlacing(false)
    }
  }

  return (
    <button
      type="button"
      className={`review-shell-confirm${placing ? ' review-shell-confirm--placing' : ''}`}
      disabled={disabled || placing}
      onClick={handleClick}
    >
      {placing ? 'Placing order…' : label}
    </button>
  )
}

export function ReviewVariantPending({ variant, title }) {
  return (
    <div className="review-shell-pending">
      <p className="review-shell-pending-title">{title}</p>
      <p className="review-shell-pending-desc">
        Variant {variant} screen — awaiting Figma. Use Kurti or Shirts to preview the clarity baseline.
      </p>
      <Link to="/" className="review-shell-pending-link">
        Back to Home
      </Link>
    </div>
  )
}
