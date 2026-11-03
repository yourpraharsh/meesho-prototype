/**
 * Deterministic decorative QR SVG from a seed string (no external deps).
 */

function hashSeed(seed) {
  let h = 2166136261
  const s = String(seed ?? 'meesho')
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function isFinderDark(x, y) {
  const outer = x >= 0 && x <= 6 && y >= 0 && y <= 6
  const inner = x >= 2 && x <= 4 && y >= 2 && y <= 4
  const midRing = outer && !inner
  const center = x === 3 && y === 3
  return midRing || center
}

function inFinderZone(x, y, size) {
  if (x < 7 && y < 7) return true
  if (x >= size - 7 && y < 7) return true
  if (x < 7 && y >= size - 7) return true
  return false
}

function mapFinderCoords(x, y, size) {
  if (x < 7 && y < 7) return [x, y]
  if (x >= size - 7 && y < 7) return [x - (size - 7), y]
  if (x < 7 && y >= size - 7) return [x, y - (size - 7)]
  return [x, y]
}

function cellOn(x, y, size, seed) {
  if (inFinderZone(x, y, size)) {
    const [fx, fy] = mapFinderCoords(x, y, size)
    return isFinderDark(fx, fy)
  }
  const roll = hashSeed(`${seed}:${x}:${y}`) % 5
  return roll > 1
}

/** @returns {string} SVG markup for a QR-like pattern */
export function buildQrSvg(seed, moduleCount = 25) {
  const rects = []
  for (let y = 0; y < moduleCount; y += 1) {
    for (let x = 0; x < moduleCount; x += 1) {
      if (cellOn(x, y, moduleCount, seed)) {
        rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="#111"/>`)
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${moduleCount} ${moduleCount}" shape-rendering="crispEdges">${rects.join('')}</svg>`
}

export function buildQrDataUrl(seed) {
  const svg = buildQrSvg(seed)
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
