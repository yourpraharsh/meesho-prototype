import { useEffect, useState } from 'react'
import {
  TEST_PINCODES,
  getSelectedPincode,
  setSelectedPincode,
  clearSelectedPincode,
  getSelectedTestCohort,
  setSelectedTestCohort,
  clearSelectedTestCohort,
  getSelectedCardVariant,
  setSelectedCardVariant,
  clearSelectedCardVariant,
  getStoreCountForPincode,
  OPEN_GATE_EVENT,
} from '../utils/testPincode'
import './PincodeGate.css'

const PinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="22" height="22" aria-hidden>
    <path
      d="M12 21.5S4.5 14.4 4.5 9.5a7.5 7.5 0 1 1 15 0c0 4.9-7.5 12-7.5 12Z"
      fill="var(--jamun-base)"
    />
    <circle cx="12" cy="9.5" r="2.8" fill="#fff" />
  </svg>
)

const CashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="22" height="22" aria-hidden>
    <rect x="2.5" y="6" width="19" height="12" rx="2" stroke="var(--jamun-base)" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="2.6" stroke="var(--jamun-base)" strokeWidth="1.8" />
    <path d="M6 9.5v5M18 9.5v5" stroke="var(--jamun-base)" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)

const CardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="22" height="22" aria-hidden>
    <rect x="3" y="5" width="18" height="15" rx="2.5" stroke="var(--jamun-base)" strokeWidth="1.8" />
    <path d="M3 9.5h18" stroke="var(--jamun-base)" strokeWidth="1.8" />
    <path d="M7 13.5h6M7 16.5h4" stroke="var(--jamun-base)" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)

const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden>
    <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const COHORT_OPTIONS = [
  { value: 'cod', label: 'Cash on Delivery', meta: 'I usually pay cash when my order arrives' },
  { value: 'non-cod', label: 'UPI / Online payment', meta: 'I usually pay online while ordering' },
]

/* Moderator's pick: how the store pickup card shows on the cart Review (Figma self-pickup v3) */
const CARD_OPTIONS = [
  { value: 'open', label: 'Card always open', meta: 'Variant 1 · store details always show' },
  { value: 'closed', label: 'Card closed until tapped', meta: 'Variant 2 · band + header only; tapping opens it' },
]

/**
 * User-testing gate — pincode, then payment habit (COD vs non-COD cohort), then
 * (non-COD only) the cart pickup card variant, shown before any app UI on first
 * launch. The home-header "Meesho User" chip re-launches the same flow via
 * OPEN_GATE_EVENT so the researcher can switch pincode/cohort/card between
 * participants. Choices are session-scoped; ?pin= / ?cohort= / ?card= pre-select
 * and skip. COD testers see the plain pickup card, so they skip the card step.
 */
export default function PincodeGate({ children }) {
  const [pin, setPin] = useState(getSelectedPincode)
  const [cohort, setCohort] = useState(getSelectedTestCohort)
  const [card, setCard] = useState(getSelectedCardVariant)

  useEffect(() => {
    const reopen = () => {
      clearSelectedPincode()
      clearSelectedTestCohort()
      clearSelectedCardVariant()
      setPin(null)
      setCohort(null)
      setCard(null)
    }
    window.addEventListener(OPEN_GATE_EVENT, reopen)
    return () => window.removeEventListener(OPEN_GATE_EVENT, reopen)
  }, [])

  if (pin && cohort && (card || cohort === 'cod')) return children

  const choosePin = (value) => {
    setSelectedPincode(value)
    setPin(value)
  }

  const chooseCohort = (value) => {
    setSelectedTestCohort(value)
    setCohort(value)
  }

  const chooseCard = (value) => {
    setSelectedCardVariant(value)
    setCard(value)
  }

  const askingCard = Boolean(pin && cohort)
  const askingCohort = Boolean(pin) && !askingCard

  return (
    <div className="pincode-gate">
      <div className="pincode-gate-card">
        <span className="pincode-gate-icon">
          {askingCard ? <CardIcon /> : askingCohort ? <CashIcon /> : <PinIcon />}
        </span>
        <h1 className="pincode-gate-title">
          {askingCard ? 'Pickup card on cart Review' : askingCohort ? 'How do you usually pay?' : 'Where should we deliver?'}
        </h1>
        <p className="pincode-gate-sub">
          {askingCard
            ? 'For the moderator: pick the variant for this participant'
            : askingCohort
              ? 'Pick what you do most often on Meesho'
              : 'Select your area PIN code to continue'}
        </p>

        {askingCard ? (
          <div className="pincode-gate-list" role="listbox" aria-label="Pickup card variant">
            {CARD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className="pincode-gate-option"
                onClick={() => chooseCard(option.value)}
              >
                <span className="pincode-gate-cohort">
                  <span className="pincode-gate-pin">{option.label}</span>
                  <span className="pincode-gate-meta">{option.meta}</span>
                </span>
                <span className="pincode-gate-chevron" aria-hidden>
                  <ChevronIcon />
                </span>
              </button>
            ))}
          </div>
        ) : askingCohort ? (
          <div className="pincode-gate-list" role="listbox" aria-label="Usual payment method">
            {COHORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className="pincode-gate-option"
                onClick={() => chooseCohort(option.value)}
              >
                <span className="pincode-gate-cohort">
                  <span className="pincode-gate-pin">{option.label}</span>
                  <span className="pincode-gate-meta">{option.meta}</span>
                </span>
                <span className="pincode-gate-chevron" aria-hidden>
                  <ChevronIcon />
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="pincode-gate-list" role="listbox" aria-label="Delivery PIN code">
            {TEST_PINCODES.map((value) => (
              <button
                key={value}
                type="button"
                className="pincode-gate-option"
                onClick={() => choosePin(value)}
              >
                <span className="pincode-gate-pin">{value}</span>
                <span className="pincode-gate-meta">
                  Nagpur · {getStoreCountForPincode(value)} stores nearby
                </span>
                <span className="pincode-gate-chevron" aria-hidden>
                  <ChevronIcon />
                </span>
              </button>
            ))}
          </div>
        )}

        <p className="pincode-gate-foot">Research prototype</p>
      </div>
    </div>
  )
}
