import expandIcon from '../../assets/cart-sot/cart-image-expand.svg'
import starIcon from '../../assets/cart-sot/cart-rating-star.svg'
import dotIcon from '../../assets/cart-sot/item-dot.svg'
import pillChevron from '../../assets/cart-sot/cart-pill-chevron.svg'
import truckIcon from '../../assets/cart-sot/item-truck.svg'
import heartIcon from '../../assets/cart-sot/cart-heart-outline-16.svg'
import removeIcon from '../../assets/cart-sot/cart-remove-x.svg'

const IMAGE_FALLBACK = 'https://placehold.co/400x400/e2e8f0/64748b?text=Product'

/** "Size: L" as in Figma; other axes (volume, net quantity…) show just the option, whose
    label already says what it is ("750 ml", "Pack of 56"), so the pill stays short. */
function sizePillLabel(axisLabel, optionLabel) {
  if (!optionLabel) return `Select ${axisLabel}`
  return axisLabel === 'Size' ? `Size: ${optionLabel}` : optionLabel
}

function OptionPill({ label, onClick, ariaLabel }) {
  return (
    <button type="button" className="cart-pill" onClick={onClick} aria-label={ariaLabel}>
      <span className="cart-pill-text">{label}</span>
      <img className="cart-pill-chevron" src={pillChevron} alt="" aria-hidden />
    </button>
  )
}

/**
 * One cart line (Figma cart file utVjj3B1srPjlUd1kWDvGs · 1:1301): 139px body (115px image,
 * title, line price, rating · Size · Qty pills, delivery date) over the
 * 36px Move to Wishlist | Remove row.
 *
 * @param {{ line: object, sizeAxisLabel: string|null, deliveryEta: string,
 *   onOpenProduct, onEditSize, onEditQty, onMoveToWishlist, onRemove }} props
 * `line` is one of computeCartOrder(items).lines; `sizeAxisLabel` is null when the product has
 * no size layer (no Size pill then).
 */
export default function CartItemCard({
  line,
  sizeAxisLabel,
  deliveryEta,
  onOpenProduct,
  onEditSize,
  onEditQty,
  onMoveToWishlist,
  onRemove,
}) {
  const { product } = line
  const rating = product?.rating?.value

  return (
    <article className="cart-item" aria-label={product?.title}>
      <div className="cart-item-body">
        <button type="button" className="cart-item-media" onClick={onOpenProduct} aria-label={`View ${product?.title ?? 'product'}`}>
          <img className="cart-item-img" src={line.image || IMAGE_FALLBACK} alt="" loading="lazy" />
          <span className="cart-item-expand" aria-hidden>
            <img src={expandIcon} alt="" />
          </span>
        </button>

        <div className="cart-item-info">
          <button type="button" className="cart-item-title" onClick={onOpenProduct}>
            {product?.title}
          </button>
          <p className="cart-item-price">₹{line.order.orderTotal}</p>

          <div className="cart-item-meta">
            {rating != null && (
              <>
                <span className="cart-item-rating" aria-label={`Rated ${rating}`}>
                  {rating}
                  <img src={starIcon} alt="" aria-hidden />
                </span>
                <img className="cart-item-dot" src={dotIcon} alt="" aria-hidden />
              </>
            )}
            {sizeAxisLabel && (
              <OptionPill
                label={sizePillLabel(sizeAxisLabel, line.sizeLabel)}
                ariaLabel={`Change ${sizeAxisLabel.toLowerCase()}, now ${line.sizeLabel ?? 'not selected'}`}
                onClick={onEditSize}
              />
            )}
            <OptionPill label={`Qty: ${line.qty}`} ariaLabel={`Change quantity, now ${line.qty}`} onClick={onEditQty} />
          </div>

          {deliveryEta && (
            <p className="cart-item-delivery">
              <span className="cart-item-truck" aria-hidden>
                <img src={truckIcon} alt="" />
              </span>
              <span>Free Delivery by</span>
              <strong>{deliveryEta}</strong>
            </p>
          )}
        </div>
      </div>

      <div className="cart-item-actions">
        <button type="button" className="cart-item-action" onClick={onMoveToWishlist}>
          <span className="cart-item-action-icon" aria-hidden>
            <img src={heartIcon} alt="" />
          </span>
          Move to Wishlist
        </button>
        <button type="button" className="cart-item-action" onClick={onRemove}>
          <span className="cart-item-action-icon" aria-hidden>
            <img src={removeIcon} alt="" />
          </span>
          Remove
        </button>
      </div>
    </article>
  )
}
