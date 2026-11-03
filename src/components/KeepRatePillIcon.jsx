/** Flat check-in-seal — keep-rate ("did not return") quality pill icon. Inherits tag colour. */
export function KeepRatePillIcon({ className = 'product-card-quality-keep-pill-icon' }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M6 0.8l1.35 0.98 1.67-0.02 0.5 1.6 1.35 0.99-0.53 1.58 0.53 1.58-1.35 0.99-0.5 1.6-1.67-0.02L6 11.2l-1.35-0.98-1.67 0.02-0.5-1.6-1.35-0.99 0.53-1.58L1.13 4.35 2.48 3.36l0.5-1.6 1.67 0.02L6 0.8z"
        fill="currentColor"
        opacity="0.16"
      />
      <path
        d="M3.7 6.05L5.25 7.6L8.4 4.3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
