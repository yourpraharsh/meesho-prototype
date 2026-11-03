/**
 * Shared UPI brand marks (user-supplied logo refs) — NPCI/UPI, Google Pay,
 * PhonePe, Paytm. Used by the COD-cohort UPI strip + sheet carousel and the
 * payment-page method rows.
 */

/** Simplified NPCI/UPI mark — tricolor chevrons + wordmark. */
export const UpiMark = ({ width = 44, height = 15 }) => (
  <svg viewBox="0 0 48 16" width={width} height={height} aria-hidden>
    <path d="M2.5 1 9.5 8 2.5 15 .5 13 5.5 8 .5 3Z" fill="#ED752E" />
    <path d="M8 1 15 8 8 15 6 13 11 8 6 3Z" fill="#098A44" />
    <text x="18.5" y="13" fill="#40415C" style={{ font: '800 13.5px var(--font-mier)' }}>
      UPI
    </text>
  </svg>
)

/** Official Google "G" glyph (sign-in button paths). */
const GoogleG = () => (
  <>
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </>
)

/** "G Pay" lockup — colored G + grey wordmark (strip/sheet). */
export const GPayMark = ({ height = 15 }) => (
  <svg viewBox="0 0 112 48" height={height} width={(height / 48) * 112} aria-hidden>
    <GoogleG />
    <text x="55" y="39" fill="#5F6368" style={{ font: '600 42px var(--font-mier)' }}>
      Pay
    </text>
  </svg>
)

/** Google G alone on white — payment-row icon slot. */
export const GPayIcon = ({ size = 16 }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden>
    <GoogleG />
  </svg>
)

/** PhonePe — purple circle, white Devanagari पे. */
export const PhonePeMark = ({ size = 20 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <circle cx="20" cy="20" r="20" fill="#5F259F" />
    <text
      x="20"
      y="28"
      textAnchor="middle"
      fill="#fff"
      style={{ font: '700 21px -apple-system, "Noto Sans Devanagari", sans-serif' }}
    >
      पे
    </text>
  </svg>
)

/** Paytm — cyan/navy app tile with the wordmark in a white circle. */
export const PaytmMark = ({ size = 20, radius = 8 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <rect width="40" height="40" rx={radius} fill="#00BAF2" />
    <path
      d={`M0 20h40v${20 - radius}a${radius} ${radius} 0 0 1-${radius} ${radius}H${radius}a${radius} ${radius} 0 0 1-${radius}-${radius}Z`}
      fill="#002E6E"
    />
    <circle cx="20" cy="20" r="13" fill="#fff" />
    <text x="20" y="23" textAnchor="middle" style={{ font: '800 9px var(--font-mier)' }}>
      <tspan fill="#002E6E">pay</tspan>
      <tspan fill="#00BAF2">tm</tspan>
    </text>
  </svg>
)
