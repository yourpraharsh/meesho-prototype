/* Delivery OTP pieces shared by the ODP's OTP card and Home's out-for-delivery bar */

/** One block per digit. `decorative` when the parent already speaks the code (a labelled button). */
export function OtpBlocks({ otp, className, blockClassName, decorative = false }) {
  const digits = String(otp).split('')
  return (
    <span
      className={className}
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': `OTP ${digits.join(' ')}` })}
    >
      {digits.map((digit, i) => (
        <span key={i} className={blockClassName} aria-hidden>
          {digit}
        </span>
      ))}
    </span>
  )
}

export const CopyIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
    <rect x="5.25" y="5.25" width="9" height="9.5" rx="1.75" stroke="currentColor" strokeWidth="1.3" />
    <path
      d="M10.75 3.25v-.5c0-.97-.78-1.75-1.75-1.75H3.5c-.97 0-1.75.78-1.75 1.75V9c0 .97.78 1.75 1.75 1.75h.25"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
)

export const TickIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/* WhatsApp glyph (brand green), for the share-on-WhatsApp button */
export const WhatsAppIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden>
    <path
      fill="#25D366"
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"
    />
  </svg>
)
