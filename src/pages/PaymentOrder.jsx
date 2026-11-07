import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom'
import { getProductById } from '../data/products'
import { computeOrder } from '../utils/computeOrder'
import { computeCartOrder } from '../utils/computeCartOrder'
import { scrollRootTo } from '../utils/scrollRoot'
import { CART_ADDRESS_KEY, useCart } from '../context/CartContext'
import { getDeliveryEtaForPin, isBuyNowSizeSelectionValid } from '../utils/checkoutConfig'
import { getBuyNowFunctionalLayer } from '../utils/pdpPricing'
import { getOutOfStockIds } from '../components/BuyNowSheet'
import {
  buildExtendedPaymentRows,
  canPlaceOrderOnUnifiedCheckout,
  computePaymentOptions,
  getPayableForSelection,
  getOrderOfferLabel,
  getPaymentCtaLabel,
  getUnifiedCheckoutCtaLabel,
} from '../utils/paymentMethods'
import { goToOrderSuccess } from '../utils/orderSuccess'
import { recordPlacedOrder } from '../utils/orders'
import { getHeroImageForProduct } from '../data/categoryProductImages'
import { applyDeliveryType, DELIVERY_TYPE, getPickupStores } from '../utils/deliveryTypes'
import { CodSwitchConfirmSheet } from '../components/review/CodSwitchSheet'
import { getDefaultPaymentMethod, getUserPaymentCohort } from '../utils/userPaymentProfile'
import { REVIEW_VARIANT } from '../constants/reviewVariants'
import PaymentPage from '../components/review/PaymentPage'
import { ReviewConfirmButton } from '../components/review/ReviewShell'
import AddressPicker from '../components/review/AddressPicker'
import { useCheckoutAddress } from '../components/review/useCheckoutAddress'
import '../components/review/PaymentPage.css'
import '../components/review/PaymentMethodSection.css'
import '../components/review/CheckoutAddressSection.css'

/** Cart flow stepper (cart Figma 1:834): Cart · Review · Payment, Payment current. */
const CART_STEPS = ['Cart', 'Review', 'Payment']

/**
 * Payment step — step 2/2 for V1/V2/V3 prepaid (Figma 1766:17467) or V4 legacy default layout.
 * `cart` (route /cart/payment): step 3/3 of the cart flow. The whole cart is one order
 * (computeCartOrder), so pickup pricing, payment options, the COD switch and the success
 * payload all run on its totals exactly as for a single product.
 */
export default function PaymentOrder({ cart = false }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { items: cartItems, clear: clearCart } = useCart()
  const product = cart ? null : getProductById(id)

  const checkoutState = location.state?.checkout
  const selectedOptions = checkoutState?.selectedOptions ?? {}
  const returnTypeId = checkoutState?.returnTypeId ?? 'all_easy'

  const functionalLayer = useMemo(
    () => getBuyNowFunctionalLayer(product?.vsku?.layers ?? []),
    [product?.vsku?.layers],
  )
  const oosOptionIds = useMemo(
    () => (product ? getOutOfStockIds(product, selectedOptions) : new Set()),
    [product, selectedOptions],
  )

  const cohort = getUserPaymentCohort(
    location.state?.cohort ?? searchParams.get('cohort'),
    product?.categoryId,
  )
  /* the cart review is the default (Self-pickup v2) flow, i.e. the V1 prepaid payment step */
  const reviewVariant = cart
    ? location.state?.reviewVariant ?? REVIEW_VARIANT.CLARITY
    : location.state?.reviewVariant ??
      (Number.isFinite(Number(searchParams.get('variant')))
        ? Number(searchParams.get('variant'))
        : null)

  /** Figma 1766:17467 — payment-only step (no address block); V1, V2, V3 prepaid. */
  const useStep2PaymentLayout =
    reviewVariant === REVIEW_VARIANT.CLARITY ||
    reviewVariant === REVIEW_VARIANT.CHECK_ADDRESS ||
    (reviewVariant === REVIEW_VARIANT.PAYMENT_INLINE && cohort === 'prepaid')

  /** V1/V2 always show full prepaid method set (COD, Pay Online, Pay Later) on step 2. */
  const isV1OrV2Payment =
    reviewVariant === REVIEW_VARIANT.CLARITY || reviewVariant === REVIEW_VARIANT.CHECK_ADDRESS
  const paymentCohort = isV1OrV2Payment ? 'prepaid' : cohort

  /** Pickup delivery discount (Self-pickup v2 review) carries into payment totals. */
  /* Confirming the COD switch commits home delivery — pickup pricing/notes revert. */
  const [deliveryTypeId, setDeliveryTypeId] = useState(location.state?.deliveryTypeId ?? null)
  const isPickup = deliveryTypeId === DELIVERY_TYPE.PICKUP
  /** Cart flow: the one pickup store chosen on review (whole order), carried back and into My Orders. */
  const storeId = location.state?.storeId ?? null

  /** Home-delivery totals — COD always prices against these (cash needs home delivery). */
  /* Cart mode: the cart summed into one order (null when it has no lines left). */
  const cartOrder = useMemo(() => (cart ? computeCartOrder(cartItems) : null), [cart, cartItems])
  const baseOrder = useMemo(() => {
    if (cart) return cartOrder.lines.length ? cartOrder : null
    return product ? computeOrder(product, selectedOptions, returnTypeId) : null
  }, [cart, cartOrder, product, selectedOptions, returnTypeId])

  const order = useMemo(
    () => (baseOrder ? applyDeliveryType(baseOrder, deliveryTypeId) : null),
    [baseOrder, deliveryTypeId],
  )

  /**
   * With pickup active, online methods price on the store-discounted order while
   * COD prices on home delivery (Figma 2094:109461) and says so in its note.
   */
  const paymentOptions = useMemo(() => {
    if (!order) return null
    const options = computePaymentOptions(order, paymentCohort)
    if (!isPickup || !baseOrder) return options
    const homeOptions = computePaymentOptions(baseOrder, paymentCohort)
    const codPayable = homeOptions.cod.payable
    return {
      ...options,
      cod: {
        ...homeOptions.cod,
        note: { tone: 'warn', text: 'Only Delivery to Home' },
      },
      pay_online: {
        ...options.pay_online,
        compareAt: codPayable,
        savingsVsCod: Math.max(0, codPayable - options.pay_online.payable),
      },
    }
  }, [order, baseOrder, paymentCohort, isPickup])

  const extendedRows = useMemo(
    () => (paymentOptions ? buildExtendedPaymentRows(paymentOptions) : null),
    [paymentOptions],
  )

  /* Home-delivery entries start with no method selected — the user must choose. */
  const entryIsHomeDelivery =
    (location.state?.deliveryTypeId ?? null) === DELIVERY_TYPE.HOME
  const [paymentMethodId, setPaymentMethodId] = useState(
    () =>
      location.state?.paymentMethodId ??
      (entryIsHomeDelivery ? null : getDefaultPaymentMethod(paymentCohort)),
  )
  const [showCodSwitch, setShowCodSwitch] = useState(false)

  /** Effective order for the current selection — COD forfeits the pickup discount. */
  const getEffectiveOrder = (methodId) =>
    isPickup && methodId === 'cod' ? baseOrder : order

  const offerLabel = order ? getOrderOfferLabel(getEffectiveOrder(paymentMethodId)) : null

  /** Cash needs home delivery — COD after pickup selection asks for re-confirmation first. */
  const handleSelectPaymentMethod = (methodId) => {
    if (methodId === 'cod' && isPickup && paymentMethodId !== 'cod') {
      setShowCodSwitch(true)
      return
    }
    setPaymentMethodId(methodId)
  }

  useEffect(() => {
    if (location.state?.paymentMethodId) return
    if (entryIsHomeDelivery) return
    setPaymentMethodId(getDefaultPaymentMethod(paymentCohort))
  }, [paymentCohort, location.state?.paymentMethodId, entryIsHomeDelivery])

  const {
    address,
    showPicker,
    setShowPicker,
    justUpdated,
    selectAddress,
    saveAddress,
    addresses,
    addressId,
  } = useCheckoutAddress('home', cart ? { persistKey: CART_ADDRESS_KEY } : undefined)

  const deliveryEta = getDeliveryEtaForPin(address.pin)

  /* Cart mode: an empty cart has nothing to pay for — back to the cart. Skipped once the
     order is placed, since placing it empties the cart on the way to success. */
  const orderPlacedRef = useRef(false)

  /* cart mode opens at its top, not at the review's scroll position */
  useEffect(() => {
    if (cart) scrollRootTo(0)
  }, [cart])

  useEffect(() => {
    if (!cart || baseOrder || orderPlacedRef.current) return
    navigate(`/cart${location.search}`, { replace: true })
  }, [cart, baseOrder, navigate, location.search])

  useEffect(() => {
    if (cart || !product) return
    if (!checkoutState) {
      navigate(`/product/${id}`, { replace: true })
      return
    }
    if (!isBuyNowSizeSelectionValid(functionalLayer, selectedOptions, oosOptionIds)) {
      navigate(`/product/${id}`, {
        replace: true,
        state: { returnTo: location.state?.returnTo, openBuyNow: true },
      })
    }
  }, [cart, product, checkoutState, functionalLayer, selectedOptions, oosOptionIds, id, navigate, location.state?.returnTo])

  if ((!cart && !product) || !order || !paymentOptions || !extendedRows) return null

  const handleBack = () => {
    if (cart) {
      navigate(`/cart/review${location.search}`, {
        state: { cohort: location.state?.cohort, paymentMethodId, deliveryTypeId, storeId },
      })
      return
    }
    navigate(`/product/${id}/review`, {
      state: {
        returnTo: location.state?.returnTo,
        checkout: checkoutState,
        cohort,
        paymentMethodId,
        deliveryTypeId,
      },
    })
  }

  const ctaLabel = useStep2PaymentLayout ? getUnifiedCheckoutCtaLabel() : getPaymentCtaLabel(paymentMethodId)
  const canPlaceOrder = useStep2PaymentLayout
    ? canPlaceOrderOnUnifiedCheckout(paymentMethodId, extendedRows)
    : true
  const needsPayOnlineInstrument = useStep2PaymentLayout && paymentMethodId === 'pay_online'
  const qrSeed = cart ? `cart-${order.orderTotal}` : `${product.product_id ?? product.id}-${order.orderTotal}`

  /**
   * Cart: one My Orders entry per line (OLP / ODP show one product per order). The payable
   * and savings split by each line's share of the cart total, the last line taking the
   * remainder; method, delivery type, ETA (and the pickup store) are shared.
   */
  const recordCartOrders = ({ payable, saved }) => {
    const { lines, orderTotal } = baseOrder
    const placedAt = Date.now()
    const cartOrderId = `ord-${placedAt}`
    const store = isPickup ? getPickupStores().find((s) => s.id === storeId) : null
    let payableLeft = payable
    let savedLeft = saved
    const entries = lines.map((line, i) => {
      const isLast = i === lines.length - 1
      const share = orderTotal > 0 ? line.order.orderTotal / orderTotal : 1 / lines.length
      const linePayable = isLast ? payableLeft : Math.min(payableLeft, Math.round(payable * share))
      const lineSaved = isLast ? savedLeft : Math.min(savedLeft, Math.round(saved * share))
      payableLeft -= linePayable
      savedLeft -= lineSaved
      return {
        /* own id per line (recordPlacedOrder keeps a passed id); cartOrderId groups them */
        id: `${cartOrderId}-${i + 1}`,
        cartOrderId,
        placedAt,
        productId: String(line.product.product_id ?? line.product.id),
        title: line.product.title,
        image: line.image || '',
        sizeLabel: line.sizeLabel ?? null,
        qty: line.qty,
        payable: linePayable,
        saved: lineSaved,
        returnTypeId: line.returnTypeId,
        paymentMethodId,
        deliveryTypeId: deliveryTypeId ?? DELIVERY_TYPE.HOME,
        etaLabel: deliveryEta,
        ...(store ? { storeId: store.id, storeName: store.name } : {}),
      }
    })
    /* each record goes to the top of the list: record backwards so My Orders reads in cart order */
    entries.reverse().forEach((entry) => recordPlacedOrder(entry))
  }

  const handlePlaceOrder = async () => {
    /* With pickup, savings-vs-COD already carries the pickup discount, so the
       success order keeps only home-order discounts to avoid double counting. */
    const successOrder = isPickup
      ? paymentMethodId === 'cod'
        ? baseOrder
        : { ...order, totalDiscount: baseOrder.totalDiscount }
      : order
    /* OLP / ODP (My Orders) list what was placed in this session */
    const payable = getPayableForSelection(paymentOptions, paymentMethodId)
    const saved = (successOrder.totalDiscount ?? 0) + Math.max(0, paymentOptions.cod.payable - payable)
    if (cart) {
      recordCartOrders({ payable, saved })
    } else {
      recordPlacedOrder({
        productId: String(product.product_id ?? product.id),
        title: product.title,
        image: getHeroImageForProduct(product) || product?.hero_image_url || '',
        sizeLabel: checkoutState?.sizeLabel ?? null,
        qty: 1,
        payable,
        saved,
        returnTypeId,
        paymentMethodId,
        deliveryTypeId: deliveryTypeId ?? DELIVERY_TYPE.HOME,
        etaLabel: deliveryEta,
      })
    }
    const placed = await goToOrderSuccess(navigate, { paymentMethodId, paymentOptions, order: successOrder })
    /* the cart is bought: empty it (after the success navigation, so this page never redirects) */
    if (cart && placed) {
      orderPlacedRef.current = true
      clearCart()
    }
  }

  return (
    <div className="review-page">
      <PaymentPage
        layout={useStep2PaymentLayout ? 'prepaid-v3' : 'default'}
        cohort={paymentCohort}
        offerLabel={offerLabel}
        address={useStep2PaymentLayout ? null : address}
        addressConfirmed={justUpdated}
        deliveryEta={useStep2PaymentLayout ? null : deliveryEta}
        paymentOptions={paymentOptions}
        extendedRows={extendedRows}
        selectedId={paymentMethodId}
        onSelect={handleSelectPaymentMethod}
        onChangeAddress={() => setShowPicker(true)}
        onBack={handleBack}
        qrSeed={qrSeed}
        steps={cart ? CART_STEPS : undefined}
        showSteps={cart}
        footer={
          <>
            {(needsPayOnlineInstrument || !paymentMethodId) && (
              <p className="payment-page-footer-nudge" role="status">
                Select a payment method to place order
              </p>
            )}
            {/* Figma 167:26493 — Action bar / Info + 1 CTA */}
            <div className="pays-actionbar">
              <div className="pays-actionbar-info">
                <span className="pays-actionbar-total">
                  ₹{getPayableForSelection(paymentOptions, paymentMethodId)}
                </span>
                <button
                  type="button"
                  className="pays-actionbar-link"
                  onClick={() =>
                    document
                      .getElementById('pays-price-details')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }
                >
                  View Price Details
                </button>
              </div>
              <ReviewConfirmButton
                label={ctaLabel}
                disabled={!canPlaceOrder}
                onClick={handlePlaceOrder}
              />
            </div>
          </>
        }
      />
      {showPicker && (
        <AddressPicker
          addresses={addresses}
          selectedId={addressId}
          onSelect={selectAddress}
          onSaveAddress={saveAddress}
          onClose={() => setShowPicker(false)}
        />
      )}
      {showCodSwitch && (
        <CodSwitchConfirmSheet
          storePayable={order.orderTotal}
          homePayable={paymentOptions.cod.payable}
          onPayCash={() => {
            setPaymentMethodId('cod')
            setDeliveryTypeId(DELIVERY_TYPE.HOME)
            setShowCodSwitch(false)
          }}
          onDismiss={() => setShowCodSwitch(false)}
        />
      )}
    </div>
  )
}
