import { useEffect, useState } from 'react'
import {
  TEST_PINCODES,
  getSelectedPincode,
  setSelectedPincode,
  clearSelectedPincode,
  getSelectedTestCohort,
  setSelectedTestCohort,
  clearSelectedTestCohort,
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

const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden>
    <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const COHORT_OPTIONS = [
  { value: 'cod', label: 'Cash on Delivery', meta: 'I usually pay cash when my order arrives' },
  { value: 'non-cod', label: 'UPI / Online payment', meta: 'I usually pay online while ordering' },
]

/**
 * User-testing gate — pincode, then payment habit (COD vs non-COD cohort),
 * shown before any app UI on first launch. The home-header "Meesho User"
 * chip re-launches the same flow via OPEN_GATE_EVENT so the researcher can
 * switch pincode/cohort between participants. Choices are session-scoped;
 * ?pin= / ?cohort= pre-select and skip.
 */
export default function PincodeGate({ children }) {
  const [pin, setPin] = useState(getSelectedPincode)
  const [cohort, setCohort] = useState(getSelectedTestCohort)

  useEffect(() => {
    const reopen = () => {
      clearSelectedPincode()
      clearSelectedTestCohort()
      setPin(null)
      setCohort(null)
    }
    window.addEventListener(OPEN_GATE_EVENT, reopen)
    return () => window.removeEventListener(OPEN_GATE_EVENT, reopen)
  }, [])

  if (pin && cohort) return children

  const choosePin = (value) => {
    setSelectedPincode(value)
    setPin(value)
  }

  const chooseCohort = (value) => {
    setSelectedTestCohort(value)
    setCohort(value)
  }

  const askingCohort = Boolean(pin)

  return (
    <div className="pincode-gate">
      <div className="pincode-gate-card">
        <span className="pincode-gate-icon">{askingCohort ? <CashIcon /> : <PinIcon />}</span>
        <h1 className="pincode-gate-title">
          {askingCohort ? 'How do you usually pay?' : 'Where should we deliver?'}
        </h1>
        <p className="pincode-gate-sub">
          {askingCohort
            ? 'Pick what you do most often on Meesho'
            : 'Select your area PIN code to continue'}
        </p>

        {askingCohort ? (
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
