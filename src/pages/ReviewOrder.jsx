import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom'
import { getProductById } from '../data/products'
import { computeOrder } from '../utils/computeOrder'
import { getDeliveryEtaForPin, getReturnTypeById, isBuyNowSizeSelectionValid } from '../utils/checkoutConfig'
import { getBuyNowFunctionalLayer } from '../utils/pdpPricing'
import { getOutOfStockIds } from '../components/BuyNowSheet'
import {
  computePaymentOptions,
  getOrderOfferLabel,
  getPaymentCtaLabel,
  shouldNavigateToPaymentStep,
} from '../utils/paymentMethods'
import { goToOrderSuccess } from '../utils/orderSuccess'
import { getDefaultPaymentMethod, getUserPaymentCohort } from '../utils/userPaymentProfile'
import { REVIEW_VARIANT } from '../constants/reviewVariants'
import ReviewShell, { ReviewConfirmButton } from '../components/review/ReviewShell'
import DeliveryTypeReview from '../components/review/DeliveryTypeReview'
import SkinText from '../components/SkinText'
import { DELIVERY_TYPE } from '../utils/deliveryTypes'
import { getPickupVariantById, getPickupVariantForProduct } from '../utils/pickupVariants'
import { isCodTestUser } from '../utils/testPincode'
import AddressPicker from '../components/review/AddressPicker'
import PaymentMethodSection from '../components/review/PaymentMethodSection'
import UnifiedCheckoutV4 from '../components/review/UnifiedCheckoutV4'
import { useCheckoutAddress } from '../components/review/useCheckoutAddress'
import '../components/review/ReviewShell.css'
import '../components/review/PaymentMethodSection.css'
import '../components/review/UnifiedCheckoutV4.css'
import '../components/review/PaymentPage.css'
/* Self-pickup v2 review screen (Figma H1GW5y6IAWYTrscEJHvRK4 · 3695:105372) */
import '../styles/review-sot/review.css'

/**
 * Post–Buy Now review route. Default = Self-pickup v2 delivery-type review (Figma 779:50287);
 * legacy variants 1–4 stay reachable via an explicit ?variant= param.
 */
export default function ReviewOrder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const product = getProductById(id)

  const checkoutState = location.state?.checkout
  const selectedOptions = checkoutState?.selectedOptions ?? {}
  const returnTypeId = checkoutState?.returnTypeId ?? 'all_easy'
  const sizeLabel = checkoutState?.sizeLabel ?? null

  const functionalLayer = useMemo(
    () => getBuyNowFunctionalLayer(product?.vsku?.layers ?? []),
    [product?.vsku?.layers],
  )
  const oosOptionIds = useMemo(
    () => (product ? getOutOfStockIds(product, selectedOptions) : new Set()),
    [product, selectedOptions],
  )

  const variantOverride = Number(searchParams.get('variant'))
  const cohort = getUserPaymentCohort(searchParams.get('cohort'), product?.categoryId)
  /** null → updated delivery-type review page (default for every category). */
  const variant = Number.isFinite(variantOverride) && variantOverride >= 1 && variantOverride <= 4
    ? variantOverride
    : null

  const order = useMemo(
    () => (product ? computeOrder(product, selectedOptions, returnTypeId) : null),
    [product, selectedOptions, returnTypeId],
  )

  const paymentOptions = useMemo(
    () => (order ? computePaymentOptions(order, cohort) : null),
    [order, cohort],
  )

  const [paymentMethodId, setPaymentMethodId] = useState(
    () => location.state?.paymentMethodId ?? getDefaultPaymentMethod(cohort),
  )

  const [deliveryTypeId, setDeliveryTypeId] = useState(
    () => location.state?.deliveryTypeId ?? DELIVERY_TYPE.HOME,
  )

  useEffect(() => {
    if (location.state?.paymentMethodId) {
      setPaymentMethodId(location.state.paymentMethodId)
      return
    }
    setPaymentMethodId(getDefaultPaymentMethod(cohort))
  }, [cohort, location.state?.paymentMethodId])

  const returnTypeLabel =
    getReturnTypeById(returnTypeId).reviewLabel ??
    checkoutState?.returnTypeLabel ??
    order?.returnTypeLabel

  const {
    address,
    showPicker,
    setShowPicker,
    justUpdated,
    selectAddress,
    saveAddress,
    addresses,
    addressId,
  } = useCheckoutAddress('home')

  const deliveryEta = getDeliveryEtaForPin(address.pin)

  useEffect(() => {
    if (!product) return
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
  }, [product, checkoutState, functionalLayer, selectedOptions, oosOptionIds, id, navigate, location.state?.returnTo])

  if (!product || !order) return null

  const handleBack = () => {
    navigate(`/product/${id}`, { state: { returnTo: location.state?.returnTo } })
  }

  const goToPaymentStep = (extraState = {}) => {
    const isLegacyV3OrV4 =
      variant === REVIEW_VARIANT.PAYMENT_INLINE || variant === REVIEW_VARIANT.PAYMENT_STEP
    navigate(`/product/${id}/payment`, {
      state: {
        returnTo: location.state?.returnTo,
        checkout: checkoutState,
        cohort,
        reviewVariant: variant ?? REVIEW_VARIANT.CLARITY,
        /* Non-legacy: every payment entry re-applies the delivery-type rule —
           pickup → pay-online default, home → nothing selected. No carry-over. */
        paymentMethodId: isLegacyV3OrV4 ? paymentMethodId : null,
        ...extraState,
      },
    })
  }

  const handleReviewPaymentCta = async () => {
    if (shouldNavigateToPaymentStep(paymentMethodId)) {
      goToPaymentStep()
      return
    }
    if (paymentOptions) {
      await goToOrderSuccess(navigate, { paymentMethodId, paymentOptions, order })
    }
  }

  if (variant === REVIEW_VARIANT.CHECK_ADDRESS) {
    return (
      <div className="review-page">
        <ReviewShell
          title="CHECK ADDRESS"
          layout="address-first"
          deliveryEta={deliveryEta}
          product={product}
          order={order}
          sizeLabel={sizeLabel}
          returnTypeLabel={returnTypeLabel}
          address={address}
          addressConfirmed={justUpdated}
          onBack={handleBack}
          onAddNewAddress={() => setShowPicker(true)}
          onDeliverToAddress={goToPaymentStep}
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

  const qrSeed = product ? `${product.product_id ?? product.id}-${order.orderTotal}` : 'checkout'

  if (variant === REVIEW_VARIANT.PAYMENT_INLINE) {
    const ctaLabel = getPaymentCtaLabel(paymentMethodId)
    const offerLabel = cohort === 'prepaid' ? getOrderOfferLabel(order) : null

    return (
      <div className="review-page">
        <ReviewShell
          title={<SkinText ios="REVIEW YOUR ORDER" android="REVIEW ORDER" />}
          layout="payment-inline"
          cohort={cohort}
          offerLabel={offerLabel}
          deliveryEta={deliveryEta}
          product={product}
          order={order}
          sizeLabel={sizeLabel}
          returnTypeLabel={returnTypeLabel}
          address={address}
          addressConfirmed={justUpdated}
          onBack={handleBack}
          onChangeAddress={() => setShowPicker(true)}
          footer={
            <ReviewConfirmButton
              label={ctaLabel}
              onClick={handleReviewPaymentCta}
            />
          }
        >
          {paymentOptions && (
            <PaymentMethodSection
              paymentOptions={paymentOptions}
              selectedId={paymentMethodId}
              onSelect={setPaymentMethodId}
              qrSeed={qrSeed}
              cohort={cohort}
            />
          )}
        </ReviewShell>
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

  if (variant === REVIEW_VARIANT.PAYMENT_STEP) {
    if (!paymentOptions) return null

    return (
      <div className="review-page">
        <UnifiedCheckoutV4
          cohort={cohort}
          product={product}
          order={order}
          address={address}
          addressConfirmed={justUpdated}
          deliveryEta={deliveryEta}
          paymentOptions={paymentOptions}
          onBack={handleBack}
          onChangeAddress={() => setShowPicker(true)}
          addresses={addresses}
          addressId={addressId}
          onSelectAddress={selectAddress}
          onSaveAddress={saveAddress}
        />
      </div>
    )
  }

  if (variant === REVIEW_VARIANT.CLARITY) {
    return (
      <div className="review-page">
        <ReviewShell
          title={<SkinText ios="REVIEW YOUR ORDER" android="REVIEW ORDER" />}
          layout="clarity"
          deliveryEta={deliveryEta}
          product={product}
          order={order}
          sizeLabel={sizeLabel}
          returnTypeLabel={returnTypeLabel}
          address={address}
          addressConfirmed={justUpdated}
          onBack={handleBack}
          onChangeAddress={() => setShowPicker(true)}
          footer={
            <ReviewConfirmButton
              label="Confirm Order"
              onClick={() => goToPaymentStep()}
            />
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
      </div>
    )
  }

  /* Default — Self-pickup v2 delivery-type review (Figma 779:50287).
     Pickup-anytime lab (Figma 2146:110053): first 8 feed products each carry
     one education variant; ?pv=1..8 overrides for demos. COD-cohort testers
     see the plain card instead — their education is the UPI-only strip. */
  const pickupVariant = isCodTestUser()
    ? null
    : getPickupVariantById(searchParams.get('pv')) ??
      getPickupVariantForProduct(product.product_id ?? product.id)

  return (
    <div className="review-page">
      <DeliveryTypeReview
        product={product}
        order={order}
        sizeLabel={sizeLabel}
        returnTypeLabel={returnTypeLabel}
        deliveryEta={deliveryEta}
        address={address}
        deliveryTypeId={deliveryTypeId}
        onSelectDeliveryType={setDeliveryTypeId}
        onBack={handleBack}
        onChangeAddress={() => setShowPicker(true)}
        onContinue={() => goToPaymentStep({ deliveryTypeId })}
        pickupVariant={pickupVariant}
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
