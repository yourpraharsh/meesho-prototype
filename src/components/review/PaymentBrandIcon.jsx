/** Brand marks for Last Used / UPI rows — Figma payment step. */
import { GPayIcon, PhonePeMark, PaytmMark } from './upiBrandMarks'

export default function PaymentBrandIcon({ brand }) {
  if (brand === 'gpay') {
    return (
      <span className="payment-brand-icon payment-brand-icon--gpay" aria-hidden>
        <GPayIcon size={16} />
      </span>
    )
  }
  if (brand === 'axis') {
    return (
      <span className="payment-brand-icon payment-brand-icon--axis" aria-hidden>
        A
      </span>
    )
  }
  if (brand === 'phonepe') {
    return (
      <span className="payment-brand-icon payment-brand-icon--phonepe" aria-hidden>
        <PhonePeMark size={28} />
      </span>
    )
  }
  if (brand === 'paytm') {
    return (
      <span className="payment-brand-icon payment-brand-icon--paytm" aria-hidden>
        {/* radius 20 = circular crop, matching the other row icons */}
        <PaytmMark size={28} radius={20} />
      </span>
    )
  }
  if (brand === 'amazon') {
    return <span className="payment-brand-icon payment-brand-icon--amazon" aria-hidden>a</span>
  }
  if (brand === 'visa') {
    return <span className="payment-brand-icon payment-brand-icon--visa" aria-hidden>V</span>
  }
  if (brand === 'master') {
    return <span className="payment-brand-icon payment-brand-icon--master" aria-hidden>M</span>
  }
  return <span className="payment-brand-icon" aria-hidden>₹</span>
}
