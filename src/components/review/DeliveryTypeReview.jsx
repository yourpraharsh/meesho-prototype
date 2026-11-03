import { useMemo, useRef, useState } from 'react'
import { useRailActions } from '../../context/RailContext'
import { getHeroImageForProduct } from '../../data/categoryProductImages'
import { ReviewDiscountMarker } from '../plp/PlpPriceMarkers'
import { buildOrderDiscountLines, getPlpIndexForProduct } from '../../utils/orderDiscountLines'
import GlassStepper from '../GlassStepper'
import { getStoreFaqVariantForProduct } from '../../utils/pickupVariants'
import {
  ChevronRightIcon,
  DeliveryTypeSection,
  DeliveryTypeSheets,
  useDeliveryTypeChoice,
} from './DeliveryTypeSection'
import ratingStarIcon from '../../assets/pdp-sot/info/rating-star.svg'
import savingsConfettiIcon from '../../assets/cart-sot/savings-confetti.svg'
import './ReviewShell.css'
import './DeliveryTypeReview.css'

const IMAGE_FALLBACK = 'https://placehold.co/400x400/e2e8f0/64748b?text=Product'

/** Cart checkout steps (cart review = step 2). The Buy Now flow keeps GlassStepper's Review · Payment. */
const CART_STEPS = ['Cart', 'Review', 'Payment']
const CART_STEP_CURRENT = 2

/** Same rating the PDP and cards show: product rating, capped at 4.9, one decimal. */
const getLineRating = (product) => {
  const value = Math.min(4.9, Number(product?.rating?.value ?? 0))
  return value > 0 ? value.toFixed(1) : null
}

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


/**
 * Android cart stepper band (cart file utVjj3B1srPjlUd1kWDvGs, 1:1190): Cart done, Review
 * current, Payment upcoming. iOS / Duo hide it (CSS) and use GlassStepper / the STEP pill.
 */
function CartStepper() {
  return (
    <ol className="dtr-cstep" aria-label={`Step ${CART_STEP_CURRENT} of ${CART_STEPS.length}`}>
      {CART_STEPS.map((label, i) => {
        const n = i + 1
        const state = n < CART_STEP_CURRENT ? 'done' : n === CART_STEP_CURRENT ? 'current' : 'todo'
        return (
          <li
            key={label}
            className={`dtr-cstep-step dtr-cstep-step--${state}`}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span className="dtr-cstep-node">{state === 'done' ? null : n}</span>
            <span className="dtr-cstep-label">{label}</span>
          </li>
        )
      })}
    </ol>
  )
}

/** Compact cart item row (cart 1:1097): image | title, price, rating · Size / Qty, ETA. */
function CartItemRow({ line, deliveryEta }) {
  const { product } = line
  const rating = getLineRating(product)
  return (
    <div className="review-shell-section dtr-citem">
      <img className="dtr-citem-img" src={line.image || IMAGE_FALLBACK} alt="" />
      <div className="dtr-citem-body">
        <div className="dtr-citem-stack">
          <div className="dtr-citem-info">
            <span className="dtr-citem-title">{product?.title}</span>
            <span className="dtr-citem-price">₹{line.order.orderTotal}</span>
            <span className="dtr-citem-meta">
              {rating && (
                <>
                  <span className="dtr-citem-rating">
                    {rating}
                    <img src={ratingStarIcon} alt="" width={8} height={7.64} aria-hidden />
                  </span>
                  <span className="dtr-citem-dot" aria-hidden />
                </>
              )}
              {line.sizeLabel && (
                <span className="dtr-citem-attr">
                  Size:<strong>{line.sizeLabel}</strong>
                </span>
              )}
              <span className="dtr-citem-attr">
                Qty:<strong>{line.qty}</strong>
              </span>
            </span>
          </div>
          {deliveryEta && (
            <p className="dtr-citem-eta">
              <span className="dtr-citem-truck" aria-hidden />
              <span className="dtr-citem-eta-text">
                Free Delivery by<strong>{deliveryEta}</strong>
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Self-pickup v2 review page — Figma 779:50287 ("REVIEW YOUR ORDER").
 * Header → offer band → item card → Select Delivery Type → Price Details → sticky footer.
 *
 * Cart mode (`items` = computeCartOrder(...).lines, `order` = that cart total): step 2/3 header
 * with the cart stepper, Select Delivery Type at the top, then one compact row per line, a static "Price Details (N Products)" block
 * with one Total Discount row and the savings banner, and Continue calls onContinue({ storeId }).
 * Without `items` (Buy Now) everything renders and behaves as before.
 * The Select Delivery Type section itself is DeliveryTypeSection (shared with the cart);
 * `onStoreChange` reports a store change, `autoOpenEdu` false skips a variant's education
 * sheet on landing.
 */
export default function DeliveryTypeReview({
  product,
  order,
  sizeLabel,
  returnTypeLabel,
  deliveryEta,
  address,
  deliveryTypeId,
  onSelectDeliveryType,
  onBack,
  onChangeAddress,
  onContinue,
  pickupVariant = null,
  items = null,
  initialStoreId = null,
  onStoreChange = null,
  autoOpenEdu = true,
}) {
  useRailActions([{ id: 'back', icon: 'back', label: 'Back', onClick: onBack }])
  const isCart = items != null
  const [priceExpanded, setPriceExpanded] = useState(false)
  const priceRef = useRef(null)
  /* Home vs pickup, the store (the one chosen before when coming back from payment / the
     cart), pickup pricing, the pickup-variant lab and the sheets */
  const choice = useDeliveryTypeChoice({
    order,
    address,
    deliveryTypeId,
    onSelectDeliveryType,
    pickupVariant,
    initialStoreId,
    onStoreChange,
    autoOpenEdu,
    /* the store FAQ's "when will the parcel come" answer */
    deliveryEta,
    /* store FAQ A/B by feed card: plain · story video on top · accordion · video + accordion · still image */
    faqVariant: getStoreFaqVariantForProduct(
      product?.product_id ?? product?.productId ?? product?.id ?? items?.[0]?.productId,
    ),
  })
  const { activeStore, isPickup, pickupSavings, effectiveOrder, treatment, variantProps } = choice

  const heroSrc = isCart
    ? null
    : getHeroImageForProduct(product) || product?.hero_image_url || IMAGE_FALLBACK
  const plpIndex = useMemo(() => (product ? getPlpIndexForProduct(product) : 0), [product])
  const discountLines = useMemo(
    () => (product && order ? buildOrderDiscountLines(product, order) : []),
    [product, order],
  )
  const productId = product?.product_id ?? product?.productId ?? product?.id

  const handleViewPriceDetails = () => {
    setPriceExpanded(true)
    priceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  return (
    <div className={`review-shell dtr${isCart ? ' dtr--cart' : ''}`}>
      <header className="review-shell-header">
        <div className="review-shell-header-main">
          <button type="button" className="review-shell-back" onClick={onBack} aria-label="Back">
            <BackIcon />
          </button>
          <h1 className="review-shell-title">Review Your Order</h1>
          <span className="glass-nav-spacer" aria-hidden />
        </div>
        <span className="review-shell-step-spacer" aria-hidden />
        <span className="review-shell-step review-shell-step--duo">
          <span className="review-shell-step-label">Step</span>
          <span className="review-shell-step-value">
            {isCart ? `${CART_STEP_CURRENT}/${CART_STEPS.length}` : '1/2'}
          </span>
        </span>
        {isCart ? (
          <GlassStepper steps={CART_STEPS} current={CART_STEP_CURRENT} />
        ) : (
          <GlassStepper current={1} />
        )}
      </header>
      {isCart && <CartStepper />}

      {effectiveOrder.totalDiscount > 0 && (
        <div className="dtr-offer" role="status">
          <p className="dtr-offer-text">
            <span className="dtr-offer-highlight">₹{effectiveOrder.totalDiscount} OFF</span>
            <span className="dtr-offer-rest">on this order</span>
          </p>
          {treatment?.OfferBandExtra && <treatment.OfferBandExtra {...variantProps} />}
        </div>
      )}

      <div className="review-shell-body dtr-body">
        {/* Cart: Select Delivery Type comes first — home vs store pickup for the whole cart;
            no "Order will reach by" line (each row already shows its delivery date) */}
        {isCart && <DeliveryTypeSection choice={choice} onChangeAddress={onChangeAddress} />}

        {/* Item card(s) */}
        {isCart ? (
          items.map((line) => <CartItemRow key={line.key} line={line} deliveryEta={deliveryEta} />)
        ) : (
        <button type="button" className="review-shell-section dtr-item" onClick={onBack}>
          <img className="dtr-item-img" src={heroSrc} alt="" />
          <span className="dtr-item-body">
            <span className="dtr-item-title">{product?.title}</span>
            {returnTypeLabel && <span className="dtr-item-line">{returnTypeLabel}</span>}
            <span className="dtr-item-line">
              {sizeLabel && (
                <>
                  Size: {sizeLabel}
                  <span className="review-shell-meta-dot" aria-hidden />
                </>
              )}
              Qty: 1
            </span>
          </span>
          <span className="dtr-item-chevron" aria-hidden>
            <ChevronRightIcon />
          </span>
        </button>
        )}

        {/* Buy Now: Select Delivery Type under the item */}
        {!isCart && (
          <DeliveryTypeSection choice={choice} deliveryEta={deliveryEta} onChangeAddress={onChangeAddress} />
        )}

        {/* Price details — cart: always-open block (cart 1:1149), one Total Discount row */}
        {isCart ? (
          <section ref={priceRef} className="review-shell-section dtr-cprice" aria-label="Price details">
            <h2 className="dtr-cprice-heading">
              Price Details ({order.qtyTotal ?? items.length} {(order.qtyTotal ?? items.length) === 1 ? 'Product' : 'Products'})
            </h2>
            <div className="dtr-cprice-row">
              <span>Total Price</span>
              <span className="dtr-cprice-value">+ ₹{order.mrp}</span>
            </div>
            {order.totalDiscount > 0 && (
              <div className="dtr-cprice-row dtr-cprice-row--discount">
                <span className="dtr-cprice-link">Total Discount</span>
                <span className="dtr-cprice-value">- ₹{order.totalDiscount}</span>
              </div>
            )}
            {isPickup && pickupSavings > 0 && (
              <div className="dtr-cprice-row dtr-cprice-row--discount">
                <span>Pickup store discount</span>
                <span className="dtr-cprice-value">- ₹{pickupSavings}</span>
              </div>
            )}
            <div className="dtr-cprice-divider" aria-hidden />
            <div className="dtr-cprice-row dtr-cprice-row--total">
              <span>Order Total</span>
              <span className="dtr-cprice-value">₹{effectiveOrder.orderTotal}</span>
            </div>
            {effectiveOrder.totalDiscount > 0 && (
              <p className="dtr-cprice-banner">
                <img src={savingsConfettiIcon} alt="" width={16} height={16} aria-hidden />
                Yay! Your total discount is ₹{effectiveOrder.totalDiscount}
              </p>
            )}
          </section>
        ) : (
        <section
          ref={priceRef}
          className="review-shell-section review-shell-price-details"
          aria-label="Price details"
        >
          <button
            type="button"
            className="review-shell-price-summary"
            aria-expanded={priceExpanded}
            onClick={() => setPriceExpanded((open) => !open)}
          >
            <span>Price Details</span>
            <span className="review-shell-price-summary-right">
              ₹{effectiveOrder.orderTotal}
              <ChevronDownIcon expanded={priceExpanded} />
            </span>
          </button>

          {priceExpanded && (
            <div className="review-shell-price-breakdown">
              <div className="review-shell-price-row">
                <span>Total Price</span>
                <span>+ ₹{order.mrp}</span>
              </div>
              {discountLines.map((line) => (
                <div
                  key={line.id}
                  className="review-shell-price-row review-shell-price-row--discount review-shell-price-row--marker"
                >
                  <span className="review-shell-price-marker">
                    <ReviewDiscountMarker line={line} productId={productId} globalIndex={plpIndex} />
                  </span>
                  <span>−₹{line.amount}</span>
                </div>
              ))}
              {isPickup && pickupSavings > 0 && (
                <div className="review-shell-price-row review-shell-price-row--discount">
                  <span>Pickup store discount</span>
                  <span>−₹{pickupSavings}</span>
                </div>
              )}
              <div className="review-shell-price-row review-shell-price-row--total">
                <span>Order Total</span>
                <span>₹{effectiveOrder.orderTotal}</span>
              </div>
            </div>
          )}
        </section>
        )}
      </div>

      {/* Sticky footer */}
      <footer className="dtr-footer">
        <div className="dtr-footer-left">
          <span className="dtr-footer-price-row">
            <span className="dtr-footer-price">₹{effectiveOrder.orderTotal}</span>
            {effectiveOrder.totalDiscount > 0 && (
              <span className="dtr-footer-off-chip">₹{effectiveOrder.totalDiscount} OFF</span>
            )}
          </span>
          <button type="button" className="dtr-footer-view-details" onClick={handleViewPriceDetails}>
            View Price Details
          </button>
        </div>
        <button
          type="button"
          className="dtr-footer-continue"
          onClick={isCart ? () => onContinue?.({ storeId: activeStore?.id ?? null }) : onContinue}
        >
          Continue
        </button>
      </footer>

      <DeliveryTypeSheets choice={choice} />
    </div>
  )
}
