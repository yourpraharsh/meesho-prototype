import { publicUrl } from '../../utils/publicUrl'
export default function PaymentQrCode({ className = '' }) {
  return (
    <div className={`payment-method-qr-frame${className ? ` ${className}` : ''}`}>
      <img
        className="payment-method-qr-img"
        src={publicUrl('/badges/ask-friends-qr.png')}
        alt=""
        decoding="async"
        aria-hidden
      />
    </div>
  )
}
