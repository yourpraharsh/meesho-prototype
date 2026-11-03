/** Hero stamp — shape reflects savings tier + payment variant. */
export default function OrderSuccessStamp({ variant, celebrationTier }) {
  const showSavingsStamp = celebrationTier !== 'minimal'

  if (showSavingsStamp) {
    return (
      <svg className="order-success-stamp" viewBox="0 0 120 120" width="120" height="120" aria-hidden>
        <path
          className="order-success-stamp-edge"
          d="M60 8c3.2 0 5.8 2.2 8.4 3.8 2.8 1.8 6.2 2.4 9.2 4.2 3 1.8 4.8 5 7.6 7.2 2.8 2.2 6.4 3 9.2 5.4 2.8 2.4 3.8 6 5.6 9.2 1.8 3.2 4.8 5.8 5.8 9.4 1 3.6 0 7.6 0.4 11.4 0.4 3.8 2.6 7.2 2.2 11-0.4 3.8-2.8 7.2-4.2 10.6-1.4 3.4-1.4 7.2-3.4 10.2-2 3-5.2 5-7.8 7.6-2.6 2.6-4.2 6.2-7.2 8.2-3 2-6.8 2.6-10.2 3.8-3.4 1.2-6.4 3.8-10 3.8s-6.6-2.6-10-3.8c-3.4-1.2-7.2-1.8-10.2-3.8-3-2-4.6-5.6-7.2-8.2-2.6-2.6-5.8-4.6-7.8-7.6-2-3-2-6.8-3.4-10.2-1.4-3.4-3.8-6.8-4.2-10.6-0.4-3.8 1.8-7.2 2.2-11 0.4-3.8-0.6-7.8 0.4-11.4 1-3.6 4-6.2 5.8-9.4 1.8-3.2 2.8-6.8 5.6-9.2 2.8-2.4 6.4-3.2 9.2-5.4 2.8-2.2 4.6-5.4 7.6-7.2 3-1.8 6.4-2.4 9.2-4.2C54.2 10.2 56.8 8 60 8z"
        />
        <text x="60" y="72" textAnchor="middle" className="order-success-stamp-symbol">
          %
        </text>
      </svg>
    )
  }

  if (variant === 'ask_friends') {
    return (
      <svg className="order-success-stamp order-success-stamp--round" viewBox="0 0 120 120" width="120" height="120" aria-hidden>
        <circle className="order-success-stamp-edge" cx="60" cy="60" r="52" />
        <path
          className="order-success-stamp-icon"
          d="M42 52c0-6.6 5.4-12 12-12s12 5.4 12 12-5.4 12-12 12-12-5.4-12-12zm28 2c4.2 2.6 7 7.2 7 12.4 0 1.2-.2 2.4-.5 3.5 5.4-1.2 9.5-5.9 9.5-11.5 0-6.6-5.4-12-12-12-2.4 0-4.6.7-6.5 1.9 2.4 1.6 4 4.3 4 7.7zM38 74c0-8.2 10-12.6 22-12.6s22 4.4 22 12.6V78H38v-4z"
        />
      </svg>
    )
  }

  if (variant === 'pay_later') {
    return (
      <svg className="order-success-stamp order-success-stamp--round" viewBox="0 0 120 120" width="120" height="120" aria-hidden>
        <circle className="order-success-stamp-edge" cx="60" cy="60" r="52" />
        <path
          className="order-success-stamp-icon"
          d="M60 34a26 26 0 1 0 0 52 26 26 0 0 0 0-52zm0 10a2 2 0 0 1 2 2v12.8l8.6 5.2a2 2 0 1 1-2 3.4l-9.6-5.8A2 2 0 0 1 58 60V46a2 2 0 0 1 2-2z"
        />
      </svg>
    )
  }

  if (variant === 'cod') {
    return (
      <svg className="order-success-stamp order-success-stamp--round" viewBox="0 0 120 120" width="120" height="120" aria-hidden>
        <circle className="order-success-stamp-edge" cx="60" cy="60" r="52" />
        <path
          className="order-success-stamp-icon"
          d="M34 58h8l3.2-12.8A4 4 0 0 1 49 42h22a4 4 0 0 1 3.8 3.2L78 58h8a4 4 0 0 1 4 4v18a6 6 0 0 1-6 6H36a6 6 0 0 1-6-6V62a4 4 0 0 1 4-4zm15.2-8 2.4 8h21.2l2.4-8H49.2z"
        />
      </svg>
    )
  }

  return (
    <svg className="order-success-stamp order-success-stamp--round" viewBox="0 0 120 120" width="120" height="120" aria-hidden>
      <circle className="order-success-stamp-edge" cx="60" cy="60" r="52" />
      <path
        className="order-success-stamp-check"
        d="M38 62.5 52.5 77 82 45.5"
        fill="none"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
