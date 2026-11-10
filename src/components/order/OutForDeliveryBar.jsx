import { deliveryOtp } from '../../utils/orders'
import { copyText, deliveryOtpMessage, shareOnWhatsApp } from '../../utils/deliveryOtp'
import { useFlash } from '../../hooks/useFlash'
import { CopyIcon, OtpBlocks, TickIcon, WhatsAppIcon } from './DeliveryOtp'
import './OutForDeliveryBar.css'

const IMAGE_FALLBACK = 'https://placehold.co/88x88/e2e8f0/64748b?text=%20'

/**
 * Home: sticky bar above the bottom nav while an order is out for delivery — the product, the
 * delivery OTP one block per digit, and two icon buttons: copy the OTP, share it on WhatsApp.
 * The product + OTP area opens the order (`onOpen`, so Home can keep its feed position).
 */
export default function OutForDeliveryBar({ order, onOpen }) {
  const [copied, flashCopied] = useFlash()
  const otp = deliveryOtp(order)
  const spoken = otp.split('').join(' ')

  const copy = async () => {
    await copyText(otp)
    flashCopied()
  }

  return (
    <aside className="ofd-bar" aria-label="Order out for delivery">
      <button
        type="button"
        className="ofd-bar-main"
        onClick={onOpen}
        aria-label={`Out for delivery. Delivery OTP ${spoken}. View order`}
      >
        <img
          className="ofd-bar-thumb"
          src={order.image || IMAGE_FALLBACK}
          alt=""
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.src = IMAGE_FALLBACK
          }}
        />
        <span className="ofd-bar-text">
          <span className="ofd-bar-title">Out for delivery</span>
          <span className="ofd-bar-otp">
            <span className="ofd-bar-otp-label">OTP</span>
            <OtpBlocks otp={otp} className="ofd-bar-blocks" blockClassName="ofd-bar-block" decorative />
          </span>
        </span>
      </button>
      <button type="button" className="ofd-bar-icon-btn" onClick={copy} aria-label={copied ? 'OTP copied' : 'Copy OTP'}>
        {copied ? <TickIcon className="ofd-bar-icon" /> : <CopyIcon className="ofd-bar-icon" />}
      </button>
      <button
        type="button"
        className="ofd-bar-icon-btn"
        onClick={() => shareOnWhatsApp(deliveryOtpMessage(otp))}
        aria-label="Share OTP on WhatsApp"
      >
        <WhatsAppIcon className="ofd-bar-icon ofd-bar-icon--wa" />
      </button>
      <span className="ofd-bar-live" aria-live="polite">
        {copied ? 'OTP copied' : ''}
      </span>
    </aside>
  )
}
