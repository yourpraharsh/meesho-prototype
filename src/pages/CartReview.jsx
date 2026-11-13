import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { CART_ADDRESS_KEY, useCart } from '../context/CartContext'
import { computeCartOrder } from '../utils/computeCartOrder'
import { scrollRootTo } from '../utils/scrollRoot'
import { getDeliveryEtaForPin } from '../utils/checkoutConfig'
import { getUserPaymentCohort } from '../utils/userPaymentProfile'
import { REVIEW_VARIANT } from '../constants/reviewVariants'
import DeliveryTypeReview from '../components/review/DeliveryTypeReview'
import { DELIVERY_TYPE } from '../utils/deliveryTypes'
import { STEADY_CLOSED_VARIANT, STEADY_STATE_VARIANT, getPickupVariantById } from '../utils/pickupVariants'
import { getSelectedCardVariant, isCodTestUser } from '../utils/testPincode'
import AddressPicker from '../components/review/AddressPicker'
import { useCheckoutAddress } from '../components/review/useCheckoutAddress'
import '../components/review/ReviewShell.css'
import '../components/review/PaymentMethodSection.css'
import '../components/review/UnifiedCheckoutV4.css'
import '../components/review/PaymentPage.css'
/* Self-pickup v2 review screen (Figma H1GW5y6IAWYTrscEJHvRK4 · 3695:105372) */
import '../styles/review-sot/review.css'
/* Cart parts on top: stepper, compact item rows, Price Details (cart file utVjj3B1srPjlUd1kWDvGs · 1:949) */
import '../styles/cart-sot/review.css'

/**
 * Cart review route (/cart/review): the Self-pickup v2 delivery-type review (same as the
 * Buy Now default) for every cart line. Store pickup applies to the whole order — one store,
 * and pickup savings are computed once on the cart total.
 */
export default function CartReview() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { items, delivery, setDelivery } = useCart()

  const order = useMemo(() => computeCartOrder(items), [items])
  const lines = order.lines
  const firstProduct = lines[0]?.product ?? null

  const cohort = getUserPaymentCohort(searchParams.get('cohort'), firstProduct?.categoryId)

  /* starts on the choice made here before (back to the cart and in again, or payment's Back);
     every change is remembered with the cart */
  const [deliveryTypeId, setDeliveryTypeIdState] = useState(
    () => location.state?.deliveryTypeId ?? delivery.deliveryTypeId ?? DELIVERY_TYPE.HOME,
  )
  const setDeliveryTypeId = (id) => {
    setDeliveryTypeIdState(id)
    setDelivery({ deliveryTypeId: id })
  }
  const initialStoreId = location.state?.storeId ?? delivery.storeId ?? null
  /* payment's Back can bring a different choice (its COD switch moves pickup to home): the
     remembered choice follows it */
  useEffect(() => {
    const { deliveryTypeId: stateType, storeId: stateStore } = location.state ?? {}
    if (stateType) setDelivery({ deliveryTypeId: stateType, ...(stateStore ? { storeId: stateStore } : {}) })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on arrival only
  }, [])

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

  /* opens at its top, not at the cart's scroll position */
  useEffect(() => {
    scrollRootTo(0)
  }, [])

  /* Nothing to review (empty cart, or products no longer found) → back to the cart. */
  useEffect(() => {
    if (lines.length === 0) navigate({ pathname: '/cart', search: location.search }, { replace: true })
  }, [lines.length, navigate, location.search])

  if (lines.length === 0) return null

  /* Back is a real Back: pushing /cart here stacked Cart → Review → Cart, so the cart's own Back
     returned to this review. Opened some other way (a link, a reload): replace with the cart. */
  const handleBack = () => {
    if (location.state?.fromCart && (window.history.state?.idx ?? 0) > 0) navigate(-1)
    else navigate({ pathname: '/cart', search: location.search }, { replace: true })
  }

  const goToPaymentStep = ({ storeId = null } = {}) => {
    /* mark this review's history entry first: Back from Payment (the button or the browser's)
       returns to it, and a `settled` entry shows the pickup card at rest — no FTUX, no beats */
    navigate(
      { pathname: location.pathname, search: location.search },
      { replace: true, state: { ...(location.state ?? {}), settled: true } },
    )
    navigate(
      { pathname: '/cart/payment', search: location.search },
      {
        state: {
          fromReview: true,
          cohort,
          reviewVariant: REVIEW_VARIANT.CLARITY,
          /* Every payment entry re-applies the delivery-type rule —
             pickup → pay-online default, home → nothing selected. No carry-over. */
          paymentMethodId: null,
          deliveryTypeId,
          storeId,
        },
      },
    )
  }

  /* Pickup card, two variants (Figma self-pickup v3 · self pickup at cart), picked by the moderator
     in the test gate (or ?card=open|closed): Variant 1 card always open (also the default);
     Variant 2 card closed until pickup is chosen (tapping it opens it). Both play the first-visit
     FTUX on the first 3 landings (?spot=reset replays it), then the Self-pickup v2 "Steady State"
     (band grows in, mint flash, rest). ?pv=1..3 still demos a lab arm; COD-cohort testers see the
     plain card (their education is the UPI-only strip). */
  const cardVariant = getSelectedCardVariant() === 'closed' ? STEADY_CLOSED_VARIANT : STEADY_STATE_VARIANT
  const pickupVariant = isCodTestUser()
    ? null
    : getPickupVariantById(searchParams.get('pv')) ?? cardVariant

  return (
    <div className="review-page">
      <DeliveryTypeReview
        items={lines}
        order={order}
        deliveryEta={deliveryEta}
        address={address}
        deliveryTypeId={deliveryTypeId}
        onSelectDeliveryType={setDeliveryTypeId}
        onBack={handleBack}
        onChangeAddress={() => setShowPicker(true)}
        onContinue={goToPaymentStep}
        pickupVariant={pickupVariant}
        initialStoreId={initialStoreId}
        onStoreChange={(id) => setDelivery({ storeId: id })}
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
    </div>
  )
}
