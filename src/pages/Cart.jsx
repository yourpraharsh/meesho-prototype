import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CART_ADDRESS_KEY, useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useWishlist } from '../context/WishlistContext'
import { useRailActions } from '../context/RailContext'
import { computeCartOrder } from '../utils/computeCartOrder'
import { scrollRootTo } from '../utils/scrollRoot'
import { getDeliveryEtaForPin } from '../utils/checkoutConfig'
import { getBuyNowFunctionalLayer } from '../utils/pdpPricing'
import { getOutOfStockIds } from '../components/BuyNowSheet'
import SkinText from '../components/SkinText'
import CartStepPill from '../components/cart/CartStepPill'
import AddressPicker from '../components/review/AddressPicker'
import { useCheckoutAddress } from '../components/review/useCheckoutAddress'
import CartItemCard from '../components/cart/CartItemCard'
import CartOptionSheet from '../components/cart/CartOptionSheet'
import appbarBack from '../assets/cart-sot/cart-appbar-back.svg'
import locationPin from '../assets/cart-sot/cart-location-pin.svg'
import wishlistHeart from '../assets/cart-sot/cart-heart-outline-24.svg'
import rowChevron from '../assets/cart-sot/cart-row-chevron-right.svg'
import savingsConfetti from '../assets/cart-sot/savings-confetti.svg'
import emptyCartIcon from '../assets/pdp-sot/top/appbar-cart.svg'
/* review-shell header base + its iOS glass / Duo rules (glassNav.css, duoLayout.css) */
import '../components/review/ReviewShell.css'
/* Cart page (Figma cart file utVjj3B1srPjlUd1kWDvGs · 1:1215) */
import '../styles/cart-sot/cart.css'

const QTY_OPTIONS = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, label: String(i + 1) }))
/* snackbars sit 8px above the 68px footer (Figma 1:2055); 16px once the cart is empty */
const TOAST_OFFSET = 76
const TOAST_OFFSET_EMPTY = 16
/* the page the cart was opened from (PDP / Home pass it as state.returnTo); kept for the
   session so Back still lands there after a round trip through /cart/review */
const RETURN_KEY = 'meesho-cart-return'

function rememberReturnTo(path) {
  try {
    window.sessionStorage.setItem(RETURN_KEY, path)
  } catch {
    /* storage unavailable: Back falls back to history */
  }
}

function readReturnTo() {
  try {
    return window.sessionStorage.getItem(RETURN_KEY)
  } catch {
    return null
  }
}

/* the glass skin's back glyph (same as the review / payment headers) */
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

/**
 * Cart (/cart) — Figma cart file utVjj3B1srPjlUd1kWDvGs · 1:1215, toasts 1:2055 / 1:2802.
 * App bar with a STEP 1/3 pill → Delivery at strip → one card per cart line →
 * Wishlist row → Price Details → sticky footer. Continue goes to /cart/review, where home
 * delivery vs store pickup is chosen for the whole cart.
 */
export default function Cart() {
  const navigate = useNavigate()
  const location = useLocation()
  const { items, removeItem, setQty, updateItem } = useCart()
  const { has, toggle } = useWishlist()
  const { show } = useToast()
  /* the snackbar's "Add to Wishlist" can run after a re-render: read the latest list */
  const hasRef = useRef(has)
  hasRef.current = has
  const priceRef = useRef(null)
  /* { type: 'size' | 'qty', key } while a line picker is open */
  const [sheet, setSheet] = useState(null)

  const order = useMemo(() => computeCartOrder(items), [items])
  const { lines } = order
  const isEmpty = lines.length === 0

  const {
    address,
    showPicker,
    setShowPicker,
    selectAddress,
    saveAddress,
    addresses,
    addressId,
  } = useCheckoutAddress('home', { persistKey: CART_ADDRESS_KEY })
  const deliveryEta = getDeliveryEtaForPin(address.pin)
  /* saved lines mostly end in their city already; add it only when missing */
  const addressText =
    address.city && !address.line.includes(address.city) ? `${address.line}, ${address.city}` : address.line

  /* each step of the cart flow opens at its top, not at the last page's scroll */
  useEffect(() => {
    scrollRootTo(0)
  }, [])

  const stateReturnTo = location.state?.returnTo
  useEffect(() => {
    if (stateReturnTo) rememberReturnTo(stateReturnTo)
  }, [stateReturnTo])

  const handleBack = () => {
    const canGoBack = (window.history.state?.idx ?? 0) > 0
    /* opened straight from that page: a real Back */
    if (stateReturnTo && canGoBack) {
      navigate(-1)
      return
    }
    const returnTo = stateReturnTo ?? readReturnTo()
    if (returnTo) navigate(returnTo)
    else if (canGoBack) navigate(-1)
    else navigate({ pathname: '/', search: location.search })
  }

  useRailActions([{ id: 'back', icon: 'back', label: 'Back', onClick: handleBack }])

  const toastOffsetAfterRemoval = () => (lines.length <= 1 ? TOAST_OFFSET_EMPTY : TOAST_OFFSET)

  const addToWishlist = (productId) => {
    if (!hasRef.current(productId)) toggle(productId)
  }

  const handleMoveToWishlist = (line) => {
    const offset = toastOffsetAfterRemoval()
    addToWishlist(line.productId)
    removeItem(line.key)
    show({ text: 'Product has been added to wishlist', icon: 'heart', offset })
  }

  const handleRemove = (line) => {
    const offset = toastOffsetAfterRemoval()
    const removed = removeItem(line.key)
    show({
      text: 'Product has been removed',
      icon: 'info',
      offset,
      action: {
        label: 'Add to Wishlist',
        onClick: () => {
          if (!removed) return
          addToWishlist(removed.productId)
          /* the host hides the snackbar right after this handler, so confirm on the next tick */
          window.setTimeout(() => show({ text: 'Product has been added to wishlist', icon: 'heart', offset }), 0)
        },
      },
    })
  }

  const openProduct = (line) => {
    navigate(
      { pathname: `/product/${line.productId}`, search: location.search },
      { state: { returnTo: `${location.pathname}${location.search}` } },
    )
  }

  const handleViewPriceDetails = () => {
    priceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  /* fromCart: the review's Back can then pop back here instead of stacking a new cart page */
  const handleContinue = () => {
    navigate({ pathname: '/cart/review', search: location.search }, { state: { fromCart: true } })
  }

  const goShopping = (state) => {
    navigate({ pathname: '/', search: location.search }, state ? { state } : undefined)
  }

  /* ---- line picker sheet ---- */
  const sheetLine = sheet ? lines.find((l) => l.key === sheet.key) : null
  const sheetLayer =
    sheetLine && sheet.type === 'size' ? getBuyNowFunctionalLayer(sheetLine.product?.vsku?.layers ?? []) : null
  let sheetEl = null
  if (sheetLine && sheet.type === 'qty') {
    sheetEl = (
      <CartOptionSheet
        key={`qty-${sheetLine.key}`}
        title="Select Quantity"
        options={QTY_OPTIONS}
        selectedId={sheetLine.qty}
        onConfirm={(qty) => {
          setQty(sheetLine.key, qty)
          setSheet(null)
        }}
        onClose={() => setSheet(null)}
      />
    )
  } else if (sheetLine && sheetLayer) {
    sheetEl = (
      <CartOptionSheet
        key={`size-${sheetLine.key}`}
        title={/quantity/i.test(sheetLayer.axis_label ?? '') ? 'Select Pack Size' : `Select ${sheetLayer.axis_label || 'Size'}`}
        options={sheetLayer.options.map((o) => ({ id: o.option_id, label: o.label }))}
        selectedId={sheetLine.selectedOptions[sheetLayer.axis_id] ?? null}
        disabledIds={getOutOfStockIds(sheetLine.product, sheetLine.selectedOptions)}
        onConfirm={(optionId) => {
          const option = sheetLayer.options.find((o) => o.option_id === optionId)
          updateItem(sheetLine.key, {
            selectedOptions: { ...sheetLine.selectedOptions, [sheetLayer.axis_id]: optionId },
            sizeLabel: option?.label ?? null,
          })
          setSheet(null)
        }}
        onClose={() => setSheet(null)}
      />
    )
  }

  const productCount = order.qtyTotal

  return (
    <div className={`review-page cart-page${isEmpty ? ' cart-page--empty' : ''}`}>
      <header className="review-shell-header cart-header">
        <div className="review-shell-header-main cart-header-main">
          <button type="button" className="review-shell-back cart-back" onClick={handleBack} aria-label="Back">
            <SkinText ios={<BackIcon />} android={<img className="cart-appbar-back" src={appbarBack} alt="" aria-hidden />} />
          </button>
          <h1 className="review-shell-title cart-title">Cart</h1>
          {/* no stepper (not in the app): a STEP pill at the right of the nav */}
          {isEmpty ? <span className="glass-nav-spacer" aria-hidden /> : <CartStepPill current={1} />}
        </div>
      </header>

      {isEmpty ? (
        <div className="cart-empty">
          <img className="cart-empty-icon" src={emptyCartIcon} alt="" aria-hidden />
          <h2 className="cart-empty-title">Your cart is empty</h2>
          <p className="cart-empty-text">Add products you like and check out all of them together.</p>
          <button type="button" className="cart-empty-cta" onClick={() => goShopping()}>
            Shop now
          </button>
        </div>
      ) : (
        <>
          <div className="cart-body">
            {/* Delivery at (1:1255) */}
            <section className="cart-address" aria-label="Delivery address">
              <span className="cart-address-icon" aria-hidden>
                <img src={locationPin} alt="" />
              </span>
              <div className="cart-address-text-wrap">
                <p className="cart-address-text">
                  {/* floated onto the last line, so the clamp's "..." lands before the pincode */}
                  <span className="cart-address-pin">{address.pin}</span>
                  <strong className="cart-address-lead">Delivery at </strong>
                  {addressText}
                </p>
              </div>
              <button type="button" className="cart-ghost-btn cart-address-change" onClick={() => setShowPicker(true)}>
                Change
              </button>
            </section>

            {/* Items (1:1301) */}
            <div className="cart-items">
              {lines.map((line) => {
                const sizeLayer = getBuyNowFunctionalLayer(line.product?.vsku?.layers ?? [])
                return (
                  <CartItemCard
                    key={line.key}
                    line={line}
                    sizeAxisLabel={sizeLayer ? sizeLayer.axis_label || 'Size' : null}
                    deliveryEta={deliveryEta}
                    onOpenProduct={() => openProduct(line)}
                    onEditSize={() => setSheet({ type: 'size', key: line.key })}
                    onEditQty={() => setSheet({ type: 'qty', key: line.key })}
                    onMoveToWishlist={() => handleMoveToWishlist(line)}
                    onRemove={() => handleRemove(line)}
                  />
                )
              })}
            </div>

            {/* Wishlist row (1:1291) */}
            <button type="button" className="cart-wishlist" onClick={() => goShopping({ openWishlist: true })}>
              <span className="cart-wishlist-icon" aria-hidden>
                <img src={wishlistHeart} alt="" />
              </span>
              <span className="cart-wishlist-label">Wishlist</span>
              <span className="cart-wishlist-chevron" aria-hidden>
                <img src={rowChevron} alt="" />
              </span>
            </button>

            {/* Price Details (1:1217) */}
            <section ref={priceRef} className="cart-price" aria-label="Price details">
              <h2 className="cart-price-heading">
                Price Details ({productCount} {productCount === 1 ? 'Product' : 'Products'})
              </h2>
              <div className="cart-price-rows">
                <div className="cart-price-row">
                  <span>Total Price</span>
                  <span className="cart-price-value">+ ₹{order.mrp}</span>
                </div>
                {order.totalDiscount > 0 && (
                  <div className="cart-price-row cart-price-row--discount">
                    <span className="cart-price-link">Total Discount</span>
                    <span>- ₹{order.totalDiscount}</span>
                  </div>
                )}
                <div className="cart-price-divider" aria-hidden />
                <div className="cart-price-row cart-price-row--total">
                  <span>Order Total</span>
                  <span>₹{order.orderTotal}</span>
                </div>
              </div>
              {order.totalDiscount > 0 && (
                <p className="cart-price-banner">
                  <img src={savingsConfetti} alt="" aria-hidden />
                  Yay! Your total discount is ₹{order.totalDiscount}
                </p>
              )}
            </section>
          </div>

          {/* Sticky footer (1:1279) */}
          <footer className="cart-footer">
            <div className="cart-footer-left">
              <span className="cart-footer-price">₹{order.orderTotal}</span>
              <button type="button" className="cart-footer-details" onClick={handleViewPriceDetails}>
                View Price Details
              </button>
            </div>
            <button type="button" className="cart-footer-continue" onClick={handleContinue}>
              Continue
            </button>
          </footer>
        </>
      )}

      {sheetEl}

      {showPicker && (
        <AddressPicker
          addresses={addresses}
          selectedId={addressId}
          onSelect={selectAddress}
          onSaveAddress={saveAddress}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
