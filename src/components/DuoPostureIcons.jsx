/* iPhone Duo posture glyphs (outline style, after the designer's reference strip). */
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinejoin: 'round', strokeLinecap: 'round' }

export const POSTURE_META = {
  folded: { label: 'Folded', hint: 'Outer display' },
  stand: { label: 'Stand', hint: 'Outer display, standing on its edges' },
  landscape: { label: 'Open', hint: 'Inner display, landscape' },
  book: { label: 'Book', hint: 'Inner display, partly folded' },
  portrait: { label: 'Portrait', hint: 'Inner display, portrait' },
  laptop: { label: 'Laptop', hint: 'Inner display, seated on a table' },
}

export function PostureIcon({ posture, size = 28 }) {
  const common = { width: size, height: size, viewBox: '0 0 40 40', 'aria-hidden': true }
  switch (posture) {
    case 'folded':
      return (
        <svg {...common}>
          <rect x="11" y="6" width="18" height="28" rx="3.2" {...S} />
          <circle cx="25.4" cy="10.2" r="1.3" fill="currentColor" />
          <path d="M17 30.6h6" {...S} />
        </svg>
      )
    case 'stand':
      return (
        <svg {...common}>
          <path d="M8.5 11h22.6l-3.9 20.4H5.4L8.5 11Z" {...S} />
          <path d="M31.1 11l3.6 17.6c.2 1-.4 1.6-1.3 1.6h-5.3" {...S} />
          <path d="M11.6 27.8h9" {...S} />
        </svg>
      )
    case 'landscape':
      return (
        <svg {...common}>
          <rect x="4.5" y="9" width="31" height="22" rx="2.6" {...S} />
          <path d="M15.5 27.6h9" {...S} />
        </svg>
      )
    case 'book':
      return (
        <svg {...common}>
          <path d="M5 9.4c1.6-.5 3.7-.3 5.8.2L20 11.4l9.2-1.8c2.1-.5 4.2-.7 5.8-.2v20.8l-15 3.4-15-3.4V9.4Z" {...S} />
          <path d="M14.4 28.6l5.6 1.2 5.6-1.2" {...S} />
        </svg>
      )
    case 'portrait':
      return (
        <svg {...common}>
          <rect x="9" y="4.5" width="22" height="31" rx="2.6" {...S} />
          <path d="M15.5 32h9" {...S} />
        </svg>
      )
    case 'laptop':
      return (
        <svg {...common}>
          <path d="M8.8 8.4h22.4v16.2H8.8z" {...S} />
          <path d="M8.8 24.6 5.4 33a.9.9 0 0 0 .8 1.2h27.6a.9.9 0 0 0 .8-1.2l-3.4-8.4" {...S} />
          <path d="M16 31h8" {...S} />
        </svg>
      )
    default:
      return null
  }
}
