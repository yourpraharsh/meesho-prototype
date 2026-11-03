/**
 * ODP illustration — flat vector in the unDraw / Storyset idiom: no outlines,
 * two-tone shading, soft ground shadow, rounded forms, a proportional
 * character. Exactly one scene is exported: "nobody home on delivery day".
 */

const C = {
  jamun: '#9F2089',
  jamunDark: '#7A1668',
  wall: '#F6F6FB',
  wallShade: '#E1E1EC',
  roof: '#B9B9CC',
  roofDark: '#9F9FB6',
  glass: '#DCE6FF',
  skin: '#F3D3C4',
  hair: '#3B2A2A',
  navy: '#2B3A67',
  blue: '#5585F8',
  blueDark: '#3D6BE0',
  red: '#E04B4B',
  blob: '#F4F4FB',
  shadow: 'rgba(23, 23, 33, 0.08)',
  ink: '#1F1F28',
}

const Blob = ({ x = 0, y = 0, w = 120, h = 80 }) => (
  <rect x={x} y={y} width={w} height={h} rx={Math.min(w, h) / 4} fill={C.blob} />
)

/** 80 × 74 */
const House = ({ x = 0, y = 0, s = 1, locked = false }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx="40" cy="73" rx="38" ry="3.5" fill={C.shadow} />
    <rect x="10" y="32" width="60" height="40" fill={C.wall} />
    <rect x="56" y="32" width="14" height="40" fill={C.wallShade} />
    <rect x="58" y="14" width="8" height="14" rx="1" fill={C.roofDark} />
    <path d="M2 34 40 4l38 30Z" fill={C.roof} />
    <path d="M2 34h76l-3 4H5Z" fill={C.roofDark} />
    <rect x="17" y="42" width="14" height="12" rx="1.5" fill={C.glass} />
    <path d="M24 42v12M17 48h14" stroke="#fff" strokeWidth="1.6" />
    <rect x="37" y="44" width="16" height="28" rx="2" fill={C.jamun} />
    <rect x="39.5" y="46.5" width="11" height="23" rx="1.5" fill={C.jamunDark} opacity=".45" />
    <circle cx="49.5" cy="58" r="1.5" fill="#fff" />
    {locked && (
      <>
        <circle cx="58" cy="44" r="8" fill={C.red} stroke="#fff" strokeWidth="2" />
        <path d="m54.5 40.5 7 7M61.5 40.5l-7 7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      </>
    )}
  </g>
)

/** 34 × 66 — role: 'customer' (jamun kurta, hair bun) | 'courier' (blue uniform, cap) */
const Person = ({ x = 0, y = 0, s = 1, role = 'customer', facing = 1 }) => {
  const top = role === 'courier' ? C.blue : C.jamun
  const topShade = role === 'courier' ? C.blueDark : C.jamunDark
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="17" cy="65" rx="13" ry="2.5" fill={C.shadow} />
      <g transform={facing === -1 ? 'translate(34 0) scale(-1 1)' : undefined}>
        <rect x="9" y="40" width="7" height="22" rx="3.5" fill={C.navy} />
        <rect x="18" y="40" width="7" height="22" rx="3.5" fill={C.navy} />
        <rect x="7" y="60" width="10" height="4.5" rx="2.2" fill={C.hair} />
        <rect x="17" y="60" width="10" height="4.5" rx="2.2" fill={C.hair} />
        <rect x="7" y="19" width="20" height="25" rx="7" fill={top} />
        <rect x="19" y="19" width="8" height="25" rx="6" fill={topShade} opacity=".35" />
        <rect x="2" y="21" width="5.5" height="18" rx="2.75" fill={top} />
        <circle cx="4.75" cy="40" r="2.6" fill={C.skin} />
        <rect x="26.5" y="21" width="5.5" height="18" rx="2.75" fill={top} />
        <circle cx="29.25" cy="40" r="2.6" fill={C.skin} />
        <rect x="14" y="14" width="6" height="6" fill={C.skin} />
        <circle cx="17" cy="10" r="8.5" fill={C.skin} />
        <circle cx="19.5" cy="9" r="0.9" fill={C.ink} />
        {role === 'courier' ? (
          <>
            <path d="M8.5 9.5a8.5 8.5 0 0 1 17 0Z" fill={C.blueDark} />
            <rect x="7" y="8.5" width="22" height="3" rx="1.5" fill={C.blueDark} />
          </>
        ) : (
          <>
            <path d="M8.5 10c0-6.5 3.8-10 8.5-10s8.5 3.5 8.5 10c-2.2-3.4-4.8-4.6-8.5-4.6S10.7 6.6 8.5 10Z" fill={C.hair} />
            <circle cx="9" cy="6" r="3.2" fill={C.hair} />
          </>
        )}
      </g>
    </g>
  )
}

/** 34 × 32 */
const Calendar = ({ x = 0, y = 0, s = 1, day }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect y="2" width="34" height="30" rx="5" fill="#fff" stroke={C.wallShade} strokeWidth="1.5" />
    <path d="M0 7a5 5 0 0 1 5-5h24a5 5 0 0 1 5 5v5H0Z" fill={C.jamun} />
    <rect x="8" width="3" height="7" rx="1.5" fill={C.jamunDark} />
    <rect x="23" width="3" height="7" rx="1.5" fill={C.jamunDark} />
    <text x="17" y="26" textAnchor="middle" fill={C.ink} style={{ font: '800 12px var(--font-mier)' }}>
      {day}
    </text>
  </g>
)

const svgProps = (vw, vh, size) => ({
  viewBox: `0 0 ${vw} ${vh}`,
  width: size,
  height: (size * vh) / vw,
  className: 'odp-art',
  'aria-hidden': true,
})

/**
 * Nobody home on the delivery date: locked house with a ✕ on the door, the
 * customer walking away, the date on a calendar. Used at every touchpoint that
 * asks or tells the user about not being home — and nowhere else.
 */
export const SceneArt = ({ day, size = 140 }) => (
  <svg {...svgProps(150, 100, size)}>
    <Blob x={0} y={8} w={150} h={90} />
    <House x={12} y={22} s={0.95} locked />
    <Person x={104} y={30} s={0.82} role="customer" facing={1} />
    <path d="M96 60h5M93 68h6" stroke={C.roof} strokeWidth="2.2" strokeLinecap="round" />
    <Calendar x={112} y={4} s={0.9} day={day} />
  </svg>
)
