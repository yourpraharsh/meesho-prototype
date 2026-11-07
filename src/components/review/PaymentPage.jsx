import { useState } from 'react'
import { useRailActions } from '../../context/RailContext'
import GlassStepper from '../GlassStepper'
import SkinText from '../SkinText'
import {
  getPaymentMethodIdsForCohort,
  isExtendedPaymentSelection,
  PAYMENT_METHOD_IDS,
} from '../../utils/paymentMethods'
import CheckoutAddressSection from './CheckoutAddressSection'
import PaymentBrandIcon from './PaymentBrandIcon'
import { PaymentMethodCard as BasePaymentMethodCard } from './PaymentMethodCards'
import paysChevronIcon from '../../assets/payment-sot/bottom/chevron-right.svg'
import paysAppbarBack from '../../assets/payment-sot/top/appbar-back.svg'
import paysStepDone from '../../assets/payment-sot/top/stepper-done.svg'
import paysStepCurrent from '../../assets/payment-sot/top/stepper-current.svg'
import './PaymentPage.css'
import './CheckoutAddressSection.css'
/* Meesho Design SoT payment page (167:26405 collapsed, 167:26572 Pay Online expanded) */
import '../../styles/payment-sot/top.css'
import '../../styles/payment-sot/online.css'
import '../../styles/payment-sot/bottom.css'

/** Every method card on this page uses the Meesho Design SoT skin (Figma 167:26460 / 167:26486). */
function PaymentMethodCard(props) {
  return <BasePaymentMethodCard skin="sot" {...props} />
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

const ChevronDownIcon = ({ open }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    width="20"
    height="20"
    aria-hidden
    className={open ? 'payment-page-chevron payment-page-chevron--open' : 'payment-page-chevron'}
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

const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" aria-hidden>
    <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

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
          <span className="payment-page-compact-offer payment-page-compact-offer--link">
            {row.offerText}
          </span>
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

/** Figma 1766:17567 — Last Used / UPI rows inside Pay Online (prepaid step 2). */
function PaymentInstrumentRow({ row, selected, onSelect, showOfferLink, showPrice = false }) {
  return (
    <button
      type="button"
      className={`payment-instrument-row${showPrice ? ' payment-instrument-row--priced' : ''}${
        selected ? ' payment-instrument-row--selected' : ''
      }`}
      aria-pressed={selected}
      onClick={() => onSelect(row.id)}
    >
      <PaymentBrandIcon brand={row.brand} />
      <span className="payment-instrument-body">
        <span className="payment-instrument-label">{row.label}</span>
        {row.offerText && showOfferLink && (
          <span className="payment-instrument-offer">{row.offerText}</span>
        )}
      </span>
      {showPrice && (
        <span className="payment-instrument-price-col">
          {row.savings > 0 && (
            <span className="payment-instrument-compare">₹{row.payable + row.savings}</span>
          )}
          <span
            className={
              row.savings > 0
                ? 'payment-instrument-price payment-instrument-price--discount'
                : 'payment-instrument-price'
            }
          >
            ₹{row.payable}
          </span>
        </span>
      )}
      <span
        className={`payment-instrument-radio${selected ? ' payment-instrument-radio--on' : ''}`}
        aria-hidden
      >
        {selected && <CheckIcon />}
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

/* ---- Payment SoT 167:26630 — expanded Pay Online (UPI apps + other methods) ---- */

/**
 * UPI apps under the expanded Pay Online card, in SoT order with SoT labels. Each maps
 * onto an existing extended-row selection id: ids[0] is what a tap selects, the rest are
 * aliases that light the same card (e.g. a Last Used PhonePe carried over from review).
 */
const PAYS_UPI_APPS = [
  { ids: ['last_gpay'], brand: 'gpay', label: 'Google Pay' },
  { ids: ['upi_phonepe', 'last_phonepe'], brand: 'phonepe', label: 'Phone Pe' },
  /* SoT offer copy — display only, the payable is unchanged */
  { ids: ['upi_paytm'], brand: 'paytm', label: 'Paytm', offer: 'Extra 15% Off upto ₹50' },
]

/** Brands with an exported SoT logo (src/assets/payment-sot/online); others keep PaymentBrandIcon. */
const PAYS_SOT_LOGOS = ['gpay', 'phonepe', 'paytm']

/** SoT "UPI Cards" 167:26636 — lead tick, 28px logo, label (+ offer), radio. */
function PaysInstrumentCard({ id, brand, label, offer, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`pays-upi-card${selected ? ' pays-upi-card--selected' : ''}`}
      aria-pressed={selected}
      onClick={() => onSelect(id)}
    >
      <span className="pays-upi-card-lead" aria-hidden />
      {PAYS_SOT_LOGOS.includes(brand) ? (
        <span className={`pays-upi-logo pays-upi-logo--${brand}`} aria-hidden />
      ) : (
        <PaymentBrandIcon brand={brand} />
      )}
      <span className="pays-upi-card-body">
        <span className="pays-upi-card-label">{label}</span>
        {offer && <span className="pays-upi-card-offer">{offer}</span>}
      </span>
      <span className={`pays-radio${selected ? ' pays-radio--on' : ''}`} aria-hidden />
    </button>
  )
}

/** SoT method row 167:26646… — inset divider above, title + chevron; instrument rows when open. */
function PaysMethodRow({ title, open, onToggle, rows = [], selectedId, onSelect }) {
  return (
    <>
      <div className="pays-divider" aria-hidden />
      <div className="pays-method">
        <button type="button" className="pays-method-trigger" aria-expanded={open} onClick={onToggle}>
          <span className="pays-method-title">{title}</span>
          <span className={`pays-chevron${open ? ' pays-chevron--open' : ''}`} aria-hidden />
        </button>
        {open && rows.length > 0 && (
          <div className="pays-method-panel">
            {rows.map((row) => (
              <PaysInstrumentCard
                key={row.id}
                id={row.id}
                brand={row.brand}
                label={row.label}
                offer={row.offerText}
                selected={selectedId === row.id}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

/**
 * Figma 167:26630 — content under the selected Pay Online card: UPI apps, Add UPI ID /
 * Pay by any UPI app, then Debit/Credit Card, Wallet, Pay Later, Net Banking rows.
 * Instrument picks go through the existing onSelect / extended-row ids.
 */
function PaysOnlineExpanded({
  extendedRows,
  selectedId,
  onSelect,
  needsInstrument,
  upiOpen,
  onToggleUpi,
  cardOpen,
  onToggleCard,
  walletsOpen,
  onToggleWallets,
  netBankingOpen,
  onToggleNetBanking,
}) {
  /* UPI block starts open (SoT 167:26572). Pay Later has no existing state — local, static. */
  const [upiListOpen, setUpiListOpen] = useState(true)
  const [payLaterOpen, setPayLaterOpen] = useState(false)

  const allRows = [...extendedRows.lastUsed, ...extendedRows.upiApps, ...extendedRows.cards]
  const upiApps = PAYS_UPI_APPS.filter((app) => allRows.some((row) => row.id === app.ids[0]))
  const sotIds = PAYS_UPI_APPS.flatMap((app) => app.ids)
  /* "Pay by any UPI app" (existing upiOpen) lists the remaining UPI rows, e.g. Amazon Pay */
  const moreUpiRows = extendedRows.upiApps.filter((row) => !sotIds.includes(row.id))
  /* the saved Axis card from Last Used joins the Debit/Credit Card rows */
  const cardRows = [
    ...extendedRows.lastUsed.filter((row) => !sotIds.includes(row.id)),
    ...extendedRows.cards,
  ]

  return (
    <div className="pays-online-expanded">
      <button
        type="button"
        className="pays-online-head"
        aria-expanded={upiListOpen}
        onClick={() => setUpiListOpen((v) => !v)}
      >
        <span className="pays-online-title">UPI</span>
        {needsInstrument && <span className="pays-online-prompt">Select to continue</span>}
        <span className={`pays-chevron${upiListOpen ? ' pays-chevron--open' : ''}`} aria-hidden />
      </button>
      {upiListOpen && (
        <>
          <div className="pays-upi-list">
            {upiApps.map((app) => (
              <PaysInstrumentCard
                key={app.ids[0]}
                id={app.ids[0]}
                brand={app.brand}
                label={app.label}
                offer={app.offer}
                selected={app.ids.includes(selectedId)}
                onSelect={onSelect}
              />
            ))}
            {upiOpen &&
              moreUpiRows.map((row) => (
                <PaysInstrumentCard
                  key={row.id}
                  id={row.id}
                  brand={row.brand}
                  label={row.label}
                  selected={selectedId === row.id}
                  onSelect={onSelect}
                />
              ))}
          </div>
          <div className="pays-upi-actions">
            {/* static in the prototype — there is no UPI ID entry flow */}
            <button type="button" className="pays-text-btn pays-text-btn--add" aria-disabled="true">
              Add UPI ID
              <span className="pays-icon pays-icon--add" aria-hidden />
            </button>
            <button
              type="button"
              className="pays-text-btn pays-text-btn--more"
              aria-expanded={upiOpen}
              onClick={onToggleUpi}
            >
              Pay by any UPI app
              <span
                className={`pays-icon pays-icon--chevron-right${upiOpen ? ' pays-icon--open' : ''}`}
                aria-hidden
              />
            </button>
          </div>
        </>
      )}
      <PaysMethodRow
        title="Debit/Credit Card"
        open={cardOpen}
        onToggle={onToggleCard}
        rows={cardRows}
        selectedId={selectedId}
        onSelect={onSelect}
      />
      <PaysMethodRow title="Wallet" open={walletsOpen} onToggle={onToggleWallets} />
      <PaysMethodRow title="Pay Later" open={payLaterOpen} onToggle={() => setPayLaterOpen((v) => !v)} />
      <PaysMethodRow title="Net Banking" open={netBankingOpen} onToggle={onToggleNetBanking} />
    </div>
  )
}

/** Checkout steps up to and including Payment (always the last, current step). */
const PAYS_STEPS = ['Review', 'Payment']

function parseOfferLabel(offerLabel) {
  if (!offerLabel) return null
  const match = offerLabel.match(/^(₹\d+\s+OFF)\s*(.*)$/i)
  if (!match) return { highlight: offerLabel, rest: '' }
  return { highlight: match[1], rest: match[2] || 'on this order' }
}

/**
 * Figma 1734:7140 (V4) + 1766:17467 (V3 prepaid).
 * `steps` defaults to Review · Payment; the cart flow passes Cart · Review · Payment
 * (cart Figma 1:834), every step before Payment shown done.
 */
export default function PaymentPage({
  layout = 'default',
  cohort = 'cod',
  offerLabel,
  address,
  addressConfirmed,
  deliveryEta,
  paymentOptions,
  extendedRows,
  selectedId,
  onSelect,
  onChangeAddress,
  onBack,
  qrSeed,
  footer,
  steps = PAYS_STEPS,
  /* step progress (Android stepper row, iOS glass stepper, Duo STEP pill): cart flow only
     (Cart · Review · Payment); Buy Now shows none */
  showSteps = false,
}) {
  useRailActions([{ id: 'back', icon: 'back', label: 'Back', onClick: onBack }])
  const isPrepaidV3 = layout === 'prepaid-v3'
  const stepCount = steps.length
  const [showOffers, setShowOffers] = useState(false)
  const [upiOpen, setUpiOpen] = useState(false)
  const [cardOpen, setCardOpen] = useState(false)
  const [netBankingOpen, setNetBankingOpen] = useState(false)
  const [walletsOpen, setWalletsOpen] = useState(false)

  const methodIds = getPaymentMethodIdsForCohort(cohort)
  const primaryIds = methodIds
  const needsPayOnlineInstrument = isPrepaidV3 && selectedId === 'pay_online'

  const offerParts = parseOfferLabel(offerLabel)

  return (
    <div className={`payment-page${isPrepaidV3 ? ' payment-page--prepaid-v3' : ''}`}>
      <header className="payment-page-header">
        <div className="payment-page-header-main">
          <button type="button" className="payment-page-back" onClick={onBack} aria-label="Back">
            <SkinText
              ios={<BackIcon />}
              android={<img className="pays-appbar-back" src={paysAppbarBack} alt="" aria-hidden />}
            />
          </button>
          <h1 className="payment-page-title"><SkinText ios="Review Your Order" android="Payment Method" /></h1>
          <span className="glass-nav-spacer" aria-hidden />
        </div>
        {showSteps && (
          <span className="payment-page-step">
            <span className="payment-page-step-label">Step</span>
            <span className="payment-page-step-value">{`${stepCount}/${stepCount}`}</span>
          </span>
        )}
        {showSteps && <GlassStepper current={stepCount} steps={steps} />}
        <SkinText
          ios={null}
          android={
            showSteps ? (
              <ol
                className={`pays-stepper${stepCount === 3 ? ' pays-stepper--3' : ''}`}
                aria-label={`Step ${stepCount} of ${stepCount}`}
              >
                {steps.map((label, i) =>
                  i < stepCount - 1 ? (
                    <li key={label} className="pays-stepper-step pays-stepper-step--done">
                      <span className="pays-stepper-node">
                        <img src={paysStepDone} alt="" />
                      </span>
                      <span className="pays-stepper-label">{label}</span>
                    </li>
                  ) : (
                    <li key={label} className="pays-stepper-step pays-stepper-step--current" aria-current="step">
                      <span className="pays-stepper-node">
                        <img src={paysStepCurrent} alt="" />
                        <span className="pays-stepper-num">{stepCount}</span>
                      </span>
                      <span className="pays-stepper-label">{label}</span>
                    </li>
                  ),
                )}
              </ol>
            ) : null
          }
        />
      </header>

      {offerParts && (
        <div className="payment-page-offer-scallop" role="status">
          <p className="payment-page-offer-scallop-text">
            <span className="payment-page-offer-highlight">{offerParts.highlight}</span>
            <span className="payment-page-offer-rest">{offerParts.rest}</span>
          </p>
        </div>
      )}

      <div className="payment-page-body">
        {!isPrepaidV3 && address && (
          <CheckoutAddressSection
            address={address}
            addressConfirmed={addressConfirmed}
            deliveryEta={deliveryEta}
            onChangeAddress={onChangeAddress}
            changeStyle="button"
            className="payment-page-section checkout-address-section--payment review-shell-address-v3"
          />
        )}

        <section
          className={`payment-page-section payment-page-methods${isPrepaidV3 ? ' payment-page-methods--prepaid' : ''}`}
          aria-label="Payment methods"
        >
          <h2 className="payment-page-methods-heading">Select payment method</h2>

          {isPrepaidV3 ? (
            <div className="payment-page-prepaid-list">
              {primaryIds.map((id) => {
                const option = paymentOptions[id]
                if (!option) return null
                const isPayOnline = id === 'pay_online'
                const payOnlineInstrumentSelected =
                  isPayOnline && isExtendedPaymentSelection(selectedId, extendedRows)
                const selected = selectedId === id || payOnlineInstrumentSelected

                if (isPayOnline) {
                  return (
                    <div
                      key={id}
                      className={`payment-page-pay-online-wrap${selected ? ' payment-page-pay-online-wrap--selected' : ''}`}
                    >
                      <PaymentMethodCard
                        option={option}
                        selected={selected}
                        onSelect={onSelect}
                        onViewOffers={() => setShowOffers(true)}
                        qrSeed={qrSeed}
                        density="payment-page"
                      />
                      {selected && (
                        <PaysOnlineExpanded
                          extendedRows={extendedRows}
                          selectedId={selectedId}
                          onSelect={onSelect}
                          needsInstrument={needsPayOnlineInstrument}
                          upiOpen={upiOpen}
                          onToggleUpi={() => setUpiOpen((v) => !v)}
                          cardOpen={cardOpen}
                          onToggleCard={() => setCardOpen((v) => !v)}
                          walletsOpen={walletsOpen}
                          onToggleWallets={() => setWalletsOpen((v) => !v)}
                          netBankingOpen={netBankingOpen}
                          onToggleNetBanking={() => setNetBankingOpen((v) => !v)}
                        />
                      )}
                    </div>
                  )
                }

                return (
                  <PaymentMethodCard
                    key={id}
                    option={option}
                    selected={selected}
                    onSelect={onSelect}
                    onViewOffers={() => setShowOffers(true)}
                    qrSeed={qrSeed}
                    density="payment-page"
                  />
                )
              })}
            </div>
          ) : (
            <>
              <div className="payment-page-method-list">
                {PAYMENT_METHOD_IDS.map((id) => {
                  const option = paymentOptions[id]
                  if (!option || !methodIds.includes(id)) return null
                  return (
                    <PaymentMethodCard
                      key={id}
                      option={option}
                      selected={selectedId === id}
                      onSelect={onSelect}
                      onViewOffers={() => setShowOffers(true)}
                      qrSeed={qrSeed}
                    />
                  )
                })}
              </div>

              <section className="payment-page-last-used">
                <h2 className="payment-page-subheading">Last Used</h2>
                <div className="payment-page-compact-list">
                  {extendedRows.lastUsed.map((row) => (
                    <PaymentCompactRow
                      key={row.id}
                      row={row}
                      selected={selectedId === row.id}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              </section>

              <section className="payment-page-more">
                <PaymentAccordion title="Pay by any UPI app" open={upiOpen} onToggle={() => setUpiOpen((v) => !v)}>
                  {extendedRows.upiApps.map((row) => (
                    <PaymentCompactRow
                      key={row.id}
                      row={row}
                      selected={selectedId === row.id}
                      onSelect={onSelect}
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
                      selected={selectedId === row.id}
                      onSelect={onSelect}
                    />
                  ))}
                </PaymentAccordion>
              </section>
            </>
          )}
        </section>
        {/* Figma 167:26487 + 167:26490 — rows under the payment methods (8px separators) */}
        <div className="pays-more-rows">
          {/* static in the prototype: there is no reselling flow */}
          <div className="pays-row pays-row--reselling">
            <span className="pays-row-label">Reselling this order?</span>
            <span className="pays-row-icon" aria-hidden>
              <img src={paysChevronIcon} alt="" />
            </span>
          </div>
          {/* static: this page has no price breakdown to open; footer link scrolls here */}
          <div id="pays-price-details" className="pays-row pays-row--price-details">
            <span className="pays-row-label">Price Details</span>
            <span className="pays-row-icon pays-row-icon--down" aria-hidden>
              <img src={paysChevronIcon} alt="" />
            </span>
          </div>
        </div>
      </div>

      {footer && <footer className="payment-page-footer">{footer}</footer>}

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
