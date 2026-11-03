import { useMemo, useState } from 'react'
import { useRailActions } from '../../context/RailContext'
import { useNavigate } from 'react-router-dom'
import {
  buildExtendedPaymentRows,
  canPlaceOrderOnUnifiedCheckout,
  getOrderOfferLabel,
  getUnifiedCheckoutCtaLabel,
  PAYMENT_METHOD_IDS,
} from '../../utils/paymentMethods'
import { getDefaultPaymentMethod } from '../../utils/userPaymentProfile'
import { goToOrderSuccess } from '../../utils/orderSuccess'
import AddressPicker from './AddressPicker'
import V4CheckoutAddress from './V4CheckoutAddress'
import PaymentBrandIcon from './PaymentBrandIcon'
import { PaymentMethodCard } from './PaymentMethodCards'
import { ReviewConfirmButton } from './ReviewShell'
import './UnifiedCheckoutV4.css'
import './PaymentMethodSection.css'
import './PaymentPage.css'
import './V4CheckoutAddress.css'

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

const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" aria-hidden>
    <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const ChevronDownIcon = ({ open }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    width="20"
    height="20"
    aria-hidden
    className={open ? 'review-v4-chevron review-v4-chevron--open' : 'review-v4-chevron'}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" width="10" height="10" aria-hidden>
    <path
      d="M2.5 6l2.5 2.5 4.5-5"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

function parseOfferLabel(offerLabel) {
  if (!offerLabel) return null
  const match = offerLabel.match(/^(₹\d+\s+OFF)\s*(.*)$/i)
  if (!match) return { highlight: offerLabel, rest: '' }
  return { highlight: match[1], rest: match[2] || 'on this order' }
}

function PaymentCompactRow({ row, selected, onSelect, showOfferLink, showChevron }) {
  return (
    <button
      type="button"
      className={`payment-page-compact-row${selected ? ' payment-page-compact-row--selected' : ''}${
        showChevron ? ' payment-page-compact-row--chevron' : ''
      }`}
      aria-pressed={selected}
      onClick={() => onSelect(row.id)}
    >
      {!showChevron && <span className="payment-page-compact-accent" aria-hidden />}
      <PaymentBrandIcon brand={row.brand} />
      <span className="payment-page-compact-body">
        <span className="payment-page-compact-label">{row.label}</span>
        {row.offerText && showOfferLink && (
          <span className="payment-page-compact-offer payment-page-compact-offer--link">{row.offerText}</span>
        )}
        {row.offerText && !showOfferLink && (
          <span className="payment-page-compact-offer">{row.offerText}</span>
        )}
      </span>
      <span className="payment-page-compact-price-col">
        {row.savings > 0 && (
          <span className="payment-page-compact-compare">₹{row.payable + row.savings}</span>
        )}
        <span
          className={
            row.savings > 0
              ? 'payment-page-compact-price payment-page-compact-price--discount'
              : 'payment-page-compact-price'
          }
        >
          ₹{row.payable}
        </span>
      </span>
      <span
        className={`payment-page-compact-radio${selected ? ' payment-page-compact-radio--on' : ''}`}
        aria-hidden
      >
        {showChevron ? <ChevronRightIcon /> : selected && <CheckIcon />}
      </span>
    </button>
  )
}

function PaymentAccordion({ title, open, onToggle, children }) {
  return (
    <div className="payment-page-accordion">
      <button type="button" className="payment-page-accordion-trigger" aria-expanded={open} onClick={onToggle}>
        <span>{title}</span>
        <ChevronDownIcon open={open} />
      </button>
      {open && <div className="payment-page-accordion-panel">{children}</div>}
    </div>
  )
}

/**
 * Figma 1766:17862 — Variant 4 unified checkout (address + payment on one screen).
 */
export default function UnifiedCheckoutV4({
  cohort = 'cod',
  product,
  order,
  address,
  addressConfirmed,
  deliveryEta,
  paymentOptions,
  onBack,
  onChangeAddress,
  addresses,
  addressId,
  onSelectAddress,
  onSaveAddress,
}) {
  useRailActions([{ id: 'back', icon: 'back', label: 'Back', onClick: onBack }])
  const navigate = useNavigate()
  const [paymentMethodId, setPaymentMethodId] = useState(() => getDefaultPaymentMethod(cohort))
  const [priceOpen, setPriceOpen] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [showOffers, setShowOffers] = useState(false)
  const [upiOpen, setUpiOpen] = useState(false)
  const [cardOpen, setCardOpen] = useState(false)
  const [netBankingOpen, setNetBankingOpen] = useState(false)
  const [walletsOpen, setWalletsOpen] = useState(false)

  const offerLabel = useMemo(() => getOrderOfferLabel(order), [order])
  const offerParts = parseOfferLabel(offerLabel)
  const extendedRows = useMemo(
    () => (paymentOptions ? buildExtendedPaymentRows(paymentOptions) : null),
    [paymentOptions],
  )
  const qrSeed = product ? `${product.product_id ?? product.id}-${order.orderTotal}` : 'checkout'
  const needsLastUsedSelection = paymentMethodId === 'pay_online'
  const canPlaceOrder = extendedRows
    ? canPlaceOrderOnUnifiedCheckout(paymentMethodId, extendedRows)
    : false
  const ctaLabel = getUnifiedCheckoutCtaLabel()

  const openAddressPicker = () => {
    setShowPicker(true)
    onChangeAddress?.()
  }

  if (!order || !paymentOptions || !extendedRows) return null

  return (
    <div className="review-v4">
      <header className="review-v4-header">
        <div className="review-v4-header-main">
          <button type="button" className="review-v4-back" onClick={onBack} aria-label="Back">
            <BackIcon />
          </button>
            <h1 className="review-v4-title">Review Order</h1>
          <span className="glass-nav-spacer" aria-hidden />
        </div>
      </header>

      {offerParts && (
        <div className="review-v4-offer-scallop" role="status">
          <p className="review-v4-offer-scallop-text">
            <span className="review-v4-offer-highlight">{offerParts.highlight}</span>
            <span className="review-v4-offer-rest">{offerParts.rest}</span>
          </p>
        </div>
      )}

      <div className="review-v4-body">
        <V4CheckoutAddress
          address={address}
          addressConfirmed={addressConfirmed}
          deliveryEta={deliveryEta}
          onChangeAddress={openAddressPicker}
        />

        <section className="review-v4-payments" aria-label="Select payment method">
          <h2 className="review-v4-payments-heading">Select payment method</h2>

          <div className="review-v4-payment-list">
            {PAYMENT_METHOD_IDS.map((id) => {
              const option = paymentOptions[id]
              if (!option) return null
              const isPayOnline = id === 'pay_online'
              const selected = paymentMethodId === id

              if (isPayOnline) {
                return (
                  <div
                    key={id}
                    className={`payment-page-pay-online-wrap review-v4-pay-online-wrap${
                      selected ? ' payment-page-pay-online-wrap--selected' : ''
                    }`}
                  >
                    <PaymentMethodCard
                      option={option}
                      selected={selected}
                      onSelect={setPaymentMethodId}
                      onViewOffers={() => setShowOffers(true)}
                      qrSeed={qrSeed}
                      density="payment-page"
                    />
                    {selected && (
                      <div
                        className={`payment-page-pay-online-expanded${
                          needsLastUsedSelection ? ' payment-page-pay-online-expanded--prompt' : ''
                        }`}
                      >
                        <div className="payment-page-inline-divider" aria-hidden />
                        <h3
                          className={`payment-page-inline-heading${
                            needsLastUsedSelection ? ' payment-page-inline-heading--prompt' : ''
                          }`}
                        >
                          Last Used
                          {needsLastUsedSelection && (
                            <span className="payment-page-inline-prompt">Select to continue</span>
                          )}
                        </h3>
                        <div className="payment-page-compact-list payment-page-compact-list--inline">
                          {extendedRows.lastUsed.map((row) => (
                            <PaymentCompactRow
                              key={row.id}
                              row={row}
                              selected={paymentMethodId === row.id}
                              onSelect={setPaymentMethodId}
                              showOfferLink
                              showChevron
                            />
                          ))}
                        </div>
                        <PaymentAccordion
                          title="Pay by any UPI app"
                          open={upiOpen}
                          onToggle={() => setUpiOpen((v) => !v)}
                        >
                          {extendedRows.upiApps.map((row) => (
                            <PaymentCompactRow
                              key={row.id}
                              row={row}
                              selected={paymentMethodId === row.id}
                              onSelect={setPaymentMethodId}
                              showChevron
                            />
                          ))}
                        </PaymentAccordion>
                        <PaymentAccordion
                          title="Debit/Credit Card"
                          open={cardOpen}
                          onToggle={() => setCardOpen((v) => !v)}
                        >
                          {extendedRows.cards.map((row) => (
                            <PaymentCompactRow
                              key={row.id}
                              row={row}
                              selected={paymentMethodId === row.id}
                              onSelect={setPaymentMethodId}
                              showChevron
                            />
                          ))}
                        </PaymentAccordion>
                        <PaymentAccordion
                          title="NET Banking"
                          open={netBankingOpen}
                          onToggle={() => setNetBankingOpen((v) => !v)}
                        />
                        <PaymentAccordion
                          title="Wallets"
                          open={walletsOpen}
                          onToggle={() => setWalletsOpen((v) => !v)}
                        />
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <PaymentMethodCard
                  key={id}
                  option={option}
                  selected={selected}
                  onSelect={setPaymentMethodId}
                  onViewOffers={() => setShowOffers(true)}
                  qrSeed={qrSeed}
                  density="payment-page"
                />
              )
            })}
          </div>
        </section>

        <button type="button" className="review-v4-meta-row">
          <span>Reselling this order?</span>
          <ChevronRightIcon />
        </button>

        <div className="review-v4-price-block">
          <button
            type="button"
            className="review-v4-meta-row"
            aria-expanded={priceOpen}
            onClick={() => setPriceOpen((open) => !open)}
          >
            <span>Price Details</span>
            <ChevronDownIcon open={priceOpen} />
          </button>

          {priceOpen && (
            <div className="review-v4-price-breakdown">
              <div className="review-v4-price-row">
                <span>Product Charges (1 Product)</span>
                <span>₹{order.mrp}</span>
              </div>
              {order.totalDiscount > 0 && (
                <div className="review-v4-price-row review-v4-price-row--discount">
                  <span>Total Discount</span>
                  <span>− ₹{order.totalDiscount}</span>
                </div>
              )}
              <div className="review-v4-price-divider" aria-hidden />
              <div className="review-v4-price-row review-v4-price-row--total">
                <span>Order Total</span>
                <span>₹{order.orderTotal}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="review-v4-footer">
        {needsLastUsedSelection && (
          <p className="review-v4-footer-nudge" role="status">
            Select a last used payment method to place order
          </p>
        )}
        <ReviewConfirmButton
          label={ctaLabel}
          disabled={!canPlaceOrder}
          onClick={async () => {
            await goToOrderSuccess(navigate, { paymentMethodId, paymentOptions, order })
          }}
        />
      </footer>

      {showPicker && (
        <AddressPicker
          addresses={addresses}
          selectedId={addressId}
          onSelect={onSelectAddress}
          onSaveAddress={onSaveAddress}
          onClose={() => setShowPicker(false)}
        />
      )}

      {showOffers && (
        <div className="payment-offers-backdrop" onClick={() => setShowOffers(false)} aria-hidden="true">
          <div
            className="payment-offers-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-offers-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* glass close (shown in the iPhone Duo layouts) */}
            <button type="button" className="sheet-x payment-offers-x" aria-label="Close" onClick={() => setShowOffers(false)}>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </button>
            <h3 id="payment-offers-title">Bank offers</h3>
            <p>Extra discount with select bank cards and UPI apps at payment.</p>
            <button type="button" className="payment-offers-close" onClick={() => setShowOffers(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
