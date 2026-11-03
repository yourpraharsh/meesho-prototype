import { useMemo } from 'react'

const SHAPES = ['dot', 'ring', 'squiggle', 'shard']
const COLORS = ['#ffe566', '#ffffff', '#b8a9ff', '#7ec8ff', '#ffd966', '#e8f4ff', '#ff9ff3']

function mulberry32(seed) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Burst confetti — particles fly outward with staggered pop timing.
 * @param {{ seed?: number, intense?: boolean, light?: boolean, className?: string }} props
 */
export default function OrderSuccessConfetti({ seed = 1, intense = false, light = false, className = '' }) {
  const count = intense ? 56 : light ? 24 : 42
  const distanceScale = intense ? 1.55 : light ? 0.82 : 1

  const pieces = useMemo(() => {
    const rand = mulberry32(seed)
    return Array.from({ length: count }, (_, i) => {
      const angle = rand() * Math.PI * 2
      const distance = (48 + rand() * (intense ? 160 : 120)) * distanceScale
      const dx = Math.cos(angle) * distance
      const dy = Math.sin(angle) * distance - (intense ? 32 : 20)
      const spin = (rand() - 0.5) * (intense ? 900 : 720)
      const delay = rand() * (intense ? 0.2 : 0.35)
      const duration = (intense ? 1.05 : 0.85) + rand() * 0.55
      const size = (intense ? 7 : 5) + rand() * (intense ? 11 : 9)

      return {
        id: i,
        shape: SHAPES[Math.floor(rand() * SHAPES.length)],
        color: COLORS[Math.floor(rand() * COLORS.length)],
        dx,
        dy,
        spin,
        delay,
        duration,
        size,
      }
    })
  }, [count, distanceScale, intense, light, seed])

  return (
    <div className={`order-success-confetti${className ? ` ${className}` : ''}`} aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className={`order-success-confetti-piece order-success-confetti-piece--${p.shape}${
            intense ? ' order-success-confetti-piece--intense' : ''
          }`}
          style={{
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
            '--spin': `${p.spin}deg`,
            '--delay': `${p.delay}s`,
            '--duration': `${p.duration}s`,
            '--size': `${p.size}px`,
            '--color': p.color,
          }}
        />
      ))}
    </div>
  )
}
