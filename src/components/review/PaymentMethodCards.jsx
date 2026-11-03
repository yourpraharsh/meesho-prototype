import './PaymentMethodSection.css'
import PaymentQrCode from './PaymentQrCode'
import paysCardDivider from '../../assets/payment-sot/top/card-divider.svg'
import paysCodCash from '../../assets/payment-sot/top/cod-cash.svg'
import paysRadioOff from '../../assets/payment-sot/top/radio-off.svg'
import paysRadioOn from '../../assets/payment-sot/top/radio-on.svg'
import paysBankOffer from '../../assets/payment-sot/top/bank-offer.svg'
import paysUpiBhim from '../../assets/payment-sot/top/upi-bhim.png'
import paysUpiGpay from '../../assets/payment-sot/top/upi-gpay.png'
import paysUpiPhonepe from '../../assets/payment-sot/top/upi-phonepe.png'
import paysUpiPaytm from '../../assets/payment-sot/top/upi-paytm.png'
import { publicUrl } from '../../utils/publicUrl'

const CheckIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" width="12" height="12" aria-hidden>
    <path
      d="M2.5 6l2.5 2.5 4.5-5"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const IndiaFlagIcon = () => (
  <span className="payment-method-flag" aria-hidden>
    🇮🇳
  </span>
)

const FriendsIcon = () => (
  <img
    src={publicUrl('/badges/ask-friends-icon.png')}
    alt=""
    width={18}
    height={18}
    aria-hidden
    className="payment-method-friends-icon"
  />
)

const OfferIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden>
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.25" />
    <path d="M5.5 8h5M8 5.5v5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
  </svg>
)

const HomeNoteIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden>
    <path
      d="M3.4 7 8 3.2 12.6 7v4.6a1.4 1.4 0 0 1-1.4 1.4H4.8a1.4 1.4 0 0 1-1.4-1.4V7Z"
      fill="#FFD35C"
    />
    <path
      d="M2.2 7.6 8 2.8l5.8 4.8"
      stroke="#F79009"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="6.9" y="8.8" width="2.2" height="3.4" rx="0.7" fill="#F79009" />
  </svg>
)

const PercentSealIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden>
    <path
      d="M8 1l1.8 1.3 2.2-.3.8 2.1 2.1.8-.3 2.2L16 8l-1.4 1.9.3 2.2-2.1.8-.8 2.1-2.2-.3L8 16l-1.8-1.3-2.2.3-.8-2.1-2.1-.8.3-2.2L0 8l1.4-1.9-.3-2.2 2.1-.8.8-2.1 2.2.3L8 1Z"
      fill="var(--green-base)"
      transform="translate(0 -0.5) scale(0.97)"
    />
    <path d="M6 10.2 10.2 6" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="6.3" cy="6.3" r="0.9" fill="#fff" />
    <circle cx="9.9" cy="9.9" r="0.9" fill="#fff" />
  </svg>
)

/** Meesho Design SoT "GIF" (286:7195): 24px roundel stepping through the UPI app marks. */
const PaysUpiGif = () => (
  <span className="pays-upi-gif" aria-hidden>
    <span className="pays-upi-gif-track">
      <span className="pays-upi-gif-frame pays-upi-gif-frame--bhim">
        <img src={paysUpiBhim} alt="" />
      </span>
      <span className="pays-upi-gif-frame pays-upi-gif-frame--gpay">
        <img src={paysUpiGpay} alt="" />
      </span>
      <span className="pays-upi-gif-frame pays-upi-gif-frame--phonepe">
        <img src={paysUpiPhonepe} alt="" />
      </span>
      <span className="pays-upi-gif-frame pays-upi-gif-frame--paytm">
        <span className="pays-upi-gif-paytm-clip">
          <img src={paysUpiPaytm} alt="" />
        </span>
      </span>
      {/* repeat of the first mark so the loop closes without a rewind */}
      <span className="pays-upi-gif-frame pays-upi-gif-frame--bhim">
        <img src={paysUpiBhim} alt="" />
      </span>
    </span>
  </span>
)

export function PaymentPriceColumn({ option, selected }) {
  const showCompare = option.compareAt != null && option.compareAt > option.payable

  return (
    <div className="payment-method-price-col">
      {showCompare && <span className="payment-method-compare">₹{option.compareAt}</span>}
      <span
        className={
          showCompare ? 'payment-method-payable payment-method-payable--discount' : 'payment-method-payable'
        }
      >
        ₹{option.payable}
      </span>
      {option.savingsVsCod > 0 && (
        <span className="payment-method-save">Save ₹{option.savingsVsCod}</span>
      )}
      {!showCompare && selected && option.id === 'cod' && (
        <span className="payment-method-save payment-method-save--hidden" aria-hidden />
      )}
    </div>
  )
}

export function PaymentMethodCard({ option, selected, onSelect, onViewOffers, qrSeed, density, skin }) {
  const isPage = density === 'payment-page'
  /* skin="sot" — Meesho Design SoT cards (payment page only; Figma 167:26460 / 167:26486) */
  const isSot = skin === 'sot'
  const hasCompare = option.compareAt != null && option.compareAt > option.payable
  return (
    <button
      type="button"
      className={`payment-method-card${selected ? ' payment-method-card--selected' : ''}${
        isPage ? ' payment-method-card--page' : ''
      }${isSot ? ` pays-card pays-card--${option.id}${hasCompare ? ' pays-card--discount' : ''}` : ''}`}
      aria-pressed={selected}
      onClick={() => onSelect(option.id)}
    >
      <div className="payment-method-card-main">
        <PaymentPriceColumn option={option} selected={selected} />
        {isSot ? (
          <span className="payment-method-divider pays-card-divider" aria-hidden>
            <img src={paysCardDivider} alt="" />
          </span>
        ) : (
          <span className="payment-method-divider" aria-hidden />
        )}
        <div className="payment-method-label-col">
          <span className="payment-method-label">
            {option.label}
            {option.showFlag && (isSot ? <PaysUpiGif /> : <IndiaFlagIcon />)}
            {isSot && option.id === 'cod' && (
              <img className="pays-card-icon" src={paysCodCash} alt="" aria-hidden />
            )}
            {option.id === 'ask_friends' && <FriendsIcon />}
          </span>
          {option.payByDate && (
            <span className="payment-method-sub">Pay before {option.payByDate}</span>
          )}
        </div>
        <span className={`payment-method-radio${selected ? ' payment-method-radio--selected' : ''}`} aria-hidden>
          {isSot ? (
            <img className="pays-card-radio" src={selected ? paysRadioOn : paysRadioOff} alt="" />
          ) : (
            selected && <CheckIcon />
          )}
        </span>
      </div>

      {option.note && (
        <div className={`payment-method-note payment-method-note--${option.note.tone}`}>
          {option.note.tone === 'warn' ? (
            <HomeNoteIcon />
          ) : isSot ? (
            <img className="pays-card-strip-icon" src={paysBankOffer} alt="" aria-hidden />
          ) : (
            <PercentSealIcon />
          )}
          <span>{option.note.text}</span>
        </div>
      )}

      {option.bankOffers && (
        <div className="payment-method-offers" onClick={(e) => e.stopPropagation()}>
          {isSot ? (
            <img className="pays-card-strip-icon" src={paysBankOffer} alt="" aria-hidden />
          ) : (
            <OfferIcon />
          )}
          <span>Extra discount with bank offers</span>
          <button type="button" className="payment-method-view-offers" onClick={onViewOffers}>
            View Offers
          </button>
        </div>
      )}

      {option.showQr && (
        <div className="payment-method-qr">
          <PaymentQrCode seed={qrSeed ?? option.id} />
        </div>
      )}
    </button>
  )
}
