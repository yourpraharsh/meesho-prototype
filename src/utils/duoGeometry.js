/**
 * iPhone Duo device geometry for the browser preview (CSS px = iOS points).
 *
 * Local frame = the device UNFOLDED in landscape, seen from the inner-display side:
 * the hinge (spine) is the vertical centre line; L is the left half (it carries the outer
 * display on its back and is the half that swings), R is the right half (stays put).
 * β = how far L has rotated about the spine towards the viewer: 0° flat, 180° closed.
 *
 * Every chassis transform is the same op list (rotateX · rotateY · rotateZ), so CSS can
 * interpolate between any two postures component by component. That is what lets
 * Open ↔ Book, Portrait ↔ Laptop, Open ↔ Portrait and Folded ↔ Stand animate smoothly
 * instead of switching the screen off and on.
 *
 * Bent postures (book, laptop) show ONE continuous screen across both halves: the live app
 * sits on one half clipped to it, and a live mirror of it (src/utils/domMirror.js) covers
 * the other half, so content flows across the fold.
 *
 * While Folded ↔ Open / Book swings, the inner display is already on: the live app on R and
 * the mirror on L, seen from both sides — over the inner glass while L faces the viewer, and
 * just outside the cover glass once it has turned past edge-on (mirrorZ), where it stands in
 * for the cover screen — so nothing has to re-lay out while the hinge moves.
 */

export const DUO_SPEC = {
  outer: { w: 466, h: 679 }, // outer display, portrait (points)
  inner: { w: 932, h: 679 }, // inner display, unfolded landscape (points)
  bezel: 5, // "bare minimum" frame around the glass
  thickness: 3, // visual offset between stacked faces (px)
  radius: { outer: 46, hinge: 8 },
}

export const STAGE_PERSPECTIVE = 2800

/* resting hinge angle per posture */
export const DEFAULT_BETA = { folded: 180, stand: 118, landscape: 0, book: 40, portrait: 0, laptop: 74 }

/* which display is on in each posture */
export const DISPLAY_OF = { folded: 'outer', stand: 'outer', landscape: 'inner', book: 'inner', portrait: 'inner', laptop: 'inner' }

const lerp = (a, b, k) => a + (b - a) * k

export const opsCss = (ops) =>
  ops
    .map(([k, v]) => {
      if (k === 'tx') return `translateX(${v}px)`
      if (k === 'ty') return `translateY(${v}px)`
      if (k === 'tz') return `translateZ(${v}px)`
      if (k === 'rx') return `rotateX(${v}deg)`
      if (k === 'ry') return `rotateY(${v}deg)`
      if (k === 'rz') return `rotate(${v}deg)`
      return ''
    })
    .join(' ')

/* the uniform chassis op list (+0 turns -0 into 0) */
const dev = (rx, ry, rz) => [
  ['rx', rx + 0],
  ['ry', ry + 0],
  ['rz', rz + 0],
]

export function deviceFrame(spec = DUO_SPEC) {
  const b = spec.bezel
  const hw = spec.inner.w / 2 + b /* the inner display defines the chassis */
  return { b, hw, dw: hw * 2, dh: Math.max(spec.inner.h, spec.outer.h) + 2 * b }
}

const box = (cx, cy, w, h) => ({ l: cx - w / 2, t: cy - h / 2, w, h })

/**
 * The outer display riding on L's back face at hinge angle β. `orient` picks the screen
 * layout: 'stand' is landscape (turned -90° on the glass), anything else is portrait.
 * At β = 180 it lands exactly where the flat folded placement sits.
 */
function outerOnL(orient, beta, spec) {
  const { hw, dh } = deviceFrame(spec)
  const { outer, thickness: t } = spec
  const cx = hw / 2 /* outer display centre on L's back, in L's unrotated frame */
  const land = orient === 'stand'
  return {
    ...box(cx, dh / 2, land ? outer.h : outer.w, land ? outer.w : outer.h),
    tf: `translateX(${hw - cx}px) rotateY(${beta}deg) translateX(${cx - hw}px) translateZ(-${t + 1}px) rotateY(180deg) rotate(${land ? -90 : 0}deg)`,
  }
}

/* the mirror's offset from L's plane: over the inner glass while L faces the viewer, past the
   cover glass once L has turned over (it hops sides edge-on, where it can't be seen). At rest
   that is simply past 90°; mid-swing the caller passes the side the eye actually sees. */
export const mirrorZ = (beta, spec = DUO_SPEC, cover = beta > 90) => (cover ? -(spec.thickness + 4) : 1)

function basePose(posture, split, beta, spec, bent = false) {
  const { b, hw, dh } = deviceFrame(spec)
  const { inner, outer, thickness: t } = spec

  switch (posture) {
    case 'folded':
      return {
        display: 'outer',
        beta,
        device: dev(0, 0, 0),
        /* flat placement when settled keeps text crisp; outerOnL() while being carried */
        app: { ...box(hw + hw / 2, dh / 2, outer.w, outer.h), tf: `translateZ(${t + 1}px)` },
      }
    case 'stand':
      return { display: 'outer', beta, device: dev(-24, 0, 90), app: outerOnL('stand', beta, spec) }
    case 'landscape': {
      if (split === 'left' || split === 'right') {
        const appCx = split === 'left' ? b + inner.w / 4 : hw + inner.w / 4
        const spareCx = split === 'left' ? hw + inner.w / 4 : b + inner.w / 4
        return {
          display: 'inner',
          beta,
          device: dev(0, 0, 0),
          split,
          app: { ...box(appCx, dh / 2, inner.w / 2, inner.h), tf: 'translateZ(1px)' },
          spare: { ...box(spareCx, dh / 2, inner.w / 2, inner.h), tf: 'translateZ(1px)' },
        }
      }
      if (bent) {
        /* opening / closing from the outer display: the flat screen as two halves, the left
           half (a live mirror) riding L about the spine, so content stays continuous */
        const a = box(hw, dh / 2, inner.w, inner.h)
        return {
          display: 'inner',
          beta,
          device: dev(0, 0, 0),
          app: { ...a, tf: 'translateZ(1px)', clip: 'inset(0 0 0 50%)' },
          mirror: { ...a, tf: `rotateY(${beta}deg) translateZ(${mirrorZ(beta, spec)}px)`, clip: 'inset(0 50% 0 0)' },
        }
      }
      return { display: 'inner', beta, device: dev(0, 0, 0), app: { l: b, t: b, w: inner.w, h: inner.h, tf: 'translateZ(1px)' } }
    }
    case 'book': {
      const k = beta / DEFAULT_BETA.book
      const device = dev(8 * k, -beta / 2, 0)
      if (split === 'left' || split === 'right') {
        /* split view on a bent display: one page each; the left page swings with L about
           the spine, so its plane carries the hinge rotation (same op list at every angle) */
        const leftCx = b + inner.w / 4
        const d = hw - leftCx
        const leftPage = {
          ...box(leftCx, dh / 2, inner.w / 2, inner.h),
          tf: `translateX(${d}px) rotateY(${beta}deg) translateX(${-d}px) translateZ(1px)`,
        }
        const rightPage = { ...box(hw + inner.w / 4, dh / 2, inner.w / 2, inner.h), tf: 'translateZ(1px)' }
        return {
          display: 'inner',
          beta,
          device,
          split,
          app: split === 'left' ? leftPage : rightPage,
          spare: split === 'left' ? rightPage : leftPage,
        }
      }
      const a = box(hw, dh / 2, inner.w, inner.h)
      return {
        display: 'inner',
        beta,
        device,
        app: { ...a, tf: 'translateZ(1px)', clip: 'inset(0 0 0 50%)' },
        mirror: { ...a, tf: `rotateY(${beta}deg) translateZ(${mirrorZ(beta, spec)}px)`, clip: 'inset(0 50% 0 0)' },
      }
    }
    case 'portrait':
      return {
        display: 'inner',
        beta,
        device: dev(0, 0, -90),
        app: { ...box(hw, dh / 2, inner.h, inner.w), tf: 'rotate(90deg) translateZ(1px)' },
      }
    case 'laptop': {
      /* the screen half leans back 16°, the lower half lies flat on the table (74 + 16 = 90),
         and the eye sits above the device looking down at the deck */
      const k = beta / DEFAULT_BETA.laptop
      const a = box(hw, dh / 2, inner.h, inner.w)
      return {
        display: 'inner',
        beta,
        persp: lerp(STAGE_PERSPECTIVE, 1500, k),
        eyeY: lerp(0.5, -0.45, k),
        device: dev(16 * k, 0, -90),
        /* the live app sits on the deck and the mirror on the upright screen: the clipped-away
           part of a plane is still hit-tested in Chrome, and the deck's extension lies behind
           the screen half while the screen's extension would lie in front of the deck */
        app: { ...a, tf: `rotateY(${beta}deg) translateZ(1px) rotate(90deg)`, clip: 'inset(50% 0 0 0)' },
        mirror: { ...a, tf: 'rotate(90deg) translateZ(1px)', clip: 'inset(0 0 50% 0)' },
      }
    }
    default:
      return basePose('folded', 'full', DEFAULT_BETA.folded, spec)
  }
}

/**
 * Pose for a posture.
 * opts.split — split view on Open / Book ('full' | 'left' | 'right')
 * opts.beta  — hinge angle override (a fold animates from/to an intermediate angle)
 * opts.carry — { posture, split }: keep THAT screen riding on the moving chassis. During a
 *              rotation the old layout (split view included) turns with the device, and
 *              only then does the new layout fade in.
 * opts.bent   — Open as two halves (live app on R, mirror on L), as while it swings
 * opts.unclipped — the live app keeps its whole width under the mirror (the mirror is drawn
 *              over it before the swing takes the app's left half, and after it lands)
 */
export function poseFor(posture, { split = 'full', beta, carry, bent, unclipped } = {}, spec = DUO_SPEC) {
  const base = basePose(posture, split, beta ?? DEFAULT_BETA[posture], spec, bent)
  if (unclipped && base.app) base.app = { ...base.app, clip: undefined }
  if (!carry) return base
  const src = basePose(carry.posture, carry.split || 'full', DEFAULT_BETA[carry.posture], spec)
  if (src.display === 'outer') {
    return { ...base, app: outerOnL(carry.posture, base.beta, spec), mirror: undefined, spare: undefined }
  }
  return { ...base, app: { ...src.app, clip: undefined }, mirror: undefined, spare: src.spare }
}

/** The outer display's transform while it rides L's back at hinge angle β. */
export function outerAppTf(orient, beta, spec = DUO_SPEC) {
  return outerOnL(orient, beta, spec).tf
}

/** Chassis halfway between two poses (only what the fit needs: chassis ops, β, camera). */
export function blendPose(a, b, k = 0.5) {
  return {
    beta: lerp(a.beta, b.beta, k),
    device: a.device.map(([op, v], i) => [op, lerp(v, b.device[i][1], k)]),
    persp: lerp(a.persp || STAGE_PERSPECTIVE, b.persp || STAGE_PERSPECTIVE, k),
    eyeY: lerp(a.eyeY ?? 0.5, b.eyeY ?? 0.5, k),
  }
}

/* ---------- tiny 3D math for fitting the posed device into the window ---------- */
const rad = (d) => (d * Math.PI) / 180
function apply(ops, p) {
  /* CSS applies the list right-to-left to a point */
  let [x, y, z] = p
  for (let i = ops.length - 1; i >= 0; i -= 1) {
    const [k, v] = ops[i]
    const c = Math.cos(rad(v))
    const s = Math.sin(rad(v))
    if (k === 'tx') x += v
    else if (k === 'ty') y += v
    else if (k === 'tz') z += v
    else if (k === 'rx') [y, z] = [y * c - z * s, y * s + z * c]
    else if (k === 'ry') [x, z] = [x * c + z * s, -x * s + z * c]
    else if (k === 'rz') [x, y] = [x * c - y * s, x * s + y * c]
  }
  return [x, y, z]
}

/** Projected bounding box of the posed chassis (device centre at 0,0) for a zoom factor. */
function projectedBox(pose, zoom, spec, persp, originDy) {
  const { hw, dw, dh } = deviceFrame(spec)
  const corners = []
  const rect = (x0, x1) => [
    [x0, 0, 0],
    [x1, 0, 0],
    [x0, dh, 0],
    [x1, dh, 0],
  ]
  /* L rotates about the spine (x = hw) by β */
  rect(0, hw).forEach(([x, y, z]) => {
    const [rx, , rz] = apply([['ry', pose.beta]], [x - hw, y, z])
    corners.push([rx + hw, y, rz])
  })
  rect(hw, dw).forEach((p) => corners.push(p))
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  corners.forEach(([x, y, z]) => {
    const [px, py, pz] = apply(pose.device, [x - dw / 2, y - dh / 2, z]).map((v) => v * zoom)
    const k = persp / (persp - pz)
    const sx = px * k
    const sy = originDy + (py - originDy) * k
    minX = Math.min(minX, sx)
    maxX = Math.max(maxX, sx)
    minY = Math.min(minY, sy)
    maxY = Math.max(maxY, sy)
  })
  return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY }
}

/**
 * Zoom + offset that fit the posed device inside `avail` (w, h) and centre it.
 * The zoom scales the chassis in 3D before projection (CSS `scale` on .duo-device).
 * originDy = perspective-origin offset from the stage centre (px, +down).
 */
export function fitPose(pose, avail, spec = DUO_SPEC, persp = pose.persp || STAGE_PERSPECTIVE, originDy = 0, maxZoom = 1) {
  let zoom = maxZoom
  for (let i = 0; i < 8; i += 1) {
    const bb = projectedBox(pose, zoom, spec, persp, originDy)
    const next = zoom * Math.min(avail.w / bb.w, avail.h / bb.h)
    const clamped = Math.min(maxZoom, next)
    const done = Math.abs(clamped - zoom) < 0.001
    zoom = clamped
    if (done) break
  }
  const bb = projectedBox(pose, zoom, spec, persp, originDy)
  return { zoom, dx: -(bb.minX + bb.maxX) / 2, dy: -(bb.minY + bb.maxY) / 2 }
}

/** CSS custom properties for a pose (set on .duo-device). */
export function poseVars(posture, opts = {}, spec = DUO_SPEC) {
  const { b, hw, dw, dh } = deviceFrame(spec)
  const p = poseFor(posture, opts, spec)
  const vars = {
    '--dw': `${dw}px`,
    '--dh': `${dh}px`,
    '--hw': `${hw}px`,
    '--bez': `${b}px`,
    '--beta': `${p.beta}deg`,
    '--dev-tf': opsCss(p.device),
    '--app-l': `${p.app.l}px`,
    '--app-t': `${p.app.t}px`,
    '--app-w': `${p.app.w}px`,
    '--app-h': `${p.app.h}px`,
    '--app-tf': p.app.tf,
    '--app-clip': p.app.clip || 'none',
    '--duo-screen-w': `${p.app.w}px`,
    '--duo-screen-h': `${p.app.h}px`,
    /* the hinge splits the screen into two regions: Open full screen and Book both lay
       their columns out so they meet exactly here */
    '--duo-hinge-x': `${p.app.w / 2}px`,
    '--r-outer': `${spec.radius.outer}px`,
    '--r-hinge': `${spec.radius.hinge}px`,
    '--out-w': `${spec.outer.w}px`,
    '--out-h': `${spec.outer.h}px`,
    '--inner-w': `${spec.inner.w}px`,
    '--inner-h': `${spec.inner.h}px`,
  }
  const second = p.mirror || p.spare
  if (second) {
    Object.assign(vars, {
      '--reg-l': `${second.l}px`,
      '--reg-t': `${second.t}px`,
      '--reg-w': `${second.w}px`,
      '--reg-h': `${second.h}px`,
      '--reg-tf': second.tf,
      '--reg-clip': second.clip || 'none',
    })
  }
  return { vars, pose: p }
}

/* the postures whose wide inner display can be shared (split view) */
const SPLITS = { landscape: true, book: true }

/* how a split change plays: a half-width app slides to the other half; anything that
   changes the app's width (or happens on the bent Book display) cross-fades */
const splitMove = (posture, from, to) => (posture === 'landscape' && from !== 'full' && to !== 'full' ? 'slide' : 'swap')

/**
 * The chain of primitive moves from one screen state to another ({ posture, split }).
 *   unfold / close — Folded ↔ Open / Book: one continuous swing; the screen hands over
 *            between the outer and inner displays as the departing one turns edge-on
 *   power  — other display changes (outer ↔ inner): screen off → move → screen on
 *   slide  — Open split view, app left ↔ right: the app slides between halves
 *   swap   — any other split view change (full ↔ half on Open, everything on Book): the
 *            screen cross-fades, so nothing is ever drawn outside the glass
 *   fold   — same orientation, the hinge angle changes (Open ↔ Book, Portrait ↔ Laptop);
 *            a split screen stays split
 *   rotate — the device turns (Open ↔ Portrait, Folded ↔ Stand): the current screen, split
 *            view included, turns with the device; only then does the new layout fade in
 * e.g. Book → Laptop = fold flat · rotate · fold; App left on Open → Book = fold (still split).
 */
export function planTransition(from, to) {
  const norm = (st) => ({ posture: st.posture, split: SPLITS[st.posture] ? st.split || 'full' : 'full' })
  const a = norm(from)
  const z = norm(to)
  if (DISPLAY_OF[a.posture] !== DISPLAY_OF[z.posture]) {
    /* Folded ↔ Open / Book: one continuous open / close motion (the app hands over between
       displays mid-swing). Other display changes power-cycle. */
    if (a.posture === 'folded' && SPLITS[z.posture]) {
      const steps = [{ kind: 'unfold', to: { posture: z.posture, split: 'full' } }]
      if (z.split !== 'full') steps.push({ kind: splitMove(z.posture, 'full', z.split), to: z })
      return steps
    }
    if (SPLITS[a.posture] && z.posture === 'folded') {
      const steps = []
      if (a.split !== 'full') steps.push({ kind: splitMove(a.posture, a.split, 'full'), to: { posture: a.posture, split: 'full' } })
      steps.push({ kind: 'close', to: z })
      return steps
    }
    return [{ kind: 'power', to: z }]
  }
  if (a.posture === z.posture) {
    if (a.split === z.split) return []
    return [{ kind: splitMove(a.posture, a.split, z.split), to: z }]
  }
  if (DISPLAY_OF[a.posture] === 'outer') return [{ kind: 'rotate', to: z }]

  const FLAT = { book: 'landscape', laptop: 'portrait' }
  const ORIENT = { landscape: 'L', book: 'L', portrait: 'P', laptop: 'P' }
  const steps = []
  let cur = a
  const go = (kind, next) => {
    steps.push({ kind, to: next })
    cur = next
  }
  /* 1. turning the device: straighten the hinge first (keeping any split) */
  if (FLAT[cur.posture] && ORIENT[cur.posture] !== ORIENT[z.posture]) {
    go('fold', { posture: FLAT[cur.posture], split: cur.split })
  }
  /* 2. turn, landing straight in the target's split view */
  if (ORIENT[cur.posture] !== ORIENT[z.posture]) {
    const flat = FLAT[z.posture] || z.posture
    go('rotate', { posture: flat, split: SPLITS[flat] ? z.split : 'full' })
  }
  /* 3. Open ↔ Book: settle the split while flat, then fold (the split rides the fold) */
  if (cur.posture !== z.posture) {
    if (cur.posture === 'landscape' && cur.split !== z.split) go(splitMove('landscape', cur.split, z.split), { posture: 'landscape', split: z.split })
    go('fold', { posture: z.posture, split: SPLITS[z.posture] ? cur.split : 'full' })
  }
  if (cur.split !== z.split) go(splitMove(cur.posture, cur.split, z.split), z)
  return steps
}

/* ---------- the swinging screen, held flat ----------
   While the hinge turns, the screen riding the swinging half is not printed on its glass:
   seen from the viewer's eye it stays a flat sheet in the plane it rests in, squeezed to the
   width the turned glass covers and never foreshortened top to bottom. On the element's own
   plane that is a projective warp, which CSS takes as a matrix3d after the hinge transform. */

export const IDENTITY_M = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

/* the mirror riding L: its hinge transform as ops (centre = device centre), the visible half
   (x from -1 to 0 half-widths) and the plane it rests in on the side it is seen from */
const swingChain = (beta, spec, cover = beta > 90) => ({
  ops: [['ry', beta], ['tz', mirrorZ(beta, spec, cover)]],
  w: spec.inner.w,
  h: spec.inner.h,
  z0: cover ? spec.thickness + 1 : 1,
})

/** Does the eye (eyeInDevice) see L's cover side at hinge angle β? (Book's tilt moves the
 *  edge-on point well past 90°.) */
export const seesCover = (beta, eye) => Math.sin(rad(beta)) * eye[0] + Math.cos(rad(beta)) * eye[2] < 0

const sub = (a, b) => a.map((v, i) => v - b[i])
const add = (a, b) => a.map((v, i) => v + b[i])
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

/** The viewer's eye in the chassis frame (device centre = origin, before the chassis pose). */
export function eyeInDevice(deviceOps, zoom, persp, originDy = 0) {
  const inv = deviceOps.slice().reverse().map(([k, v]) => [k, -v])
  return apply(inv, [0, originDy / zoom, persp / zoom])
}

/* the 2D projective map taking four points onto four others, as a CSS matrix3d (column-major) */
function homography(src, dst) {
  const A = []
  src.forEach(([x, y], i) => {
    const [X, Y] = dst[i]
    A.push([x, y, 1, 0, 0, 0, -x * X, -y * X, X])
    A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y, Y])
  })
  for (let c = 0; c < 8; c += 1) {
    let piv = c
    for (let r = c + 1; r < 8; r += 1) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r
    ;[A[c], A[piv]] = [A[piv], A[c]]
    for (let r = 0; r < 8; r += 1) {
      if (r === c) continue
      const f = A[r][c] / A[c][c]
      for (let k = c; k < 9; k += 1) A[r][k] -= f * A[c][k]
    }
  }
  const [a, b, c, d, e, f, g, h] = A.map((row, i) => row[8] / row[i])
  return [a, d, 0, g, b, e, 0, h, 0, 0, 1, 0, c, f, 0, 1]
}

/**
 * The flat warp for the mirror riding L at hinge angle β, seen from `eye` (eyeInDevice), from
 * whichever side faces it. null while it is edge-on.
 */
export function flatWarp(beta, eye, spec = DUO_SPEC, cover = seesCover(beta, eye)) {
  const { ops, w, h, z0 } = swingChain(beta, spec, cover)
  const at = (p) => apply(ops, p)
  const o = at([0, 0, 0])
  const n = sub(at([0, 0, 1]), o)
  const toEye = sub(eye, o)
  if (Math.abs(dot(n, toEye)) / Math.hypot(...toEye) < 0.12) return null
  const inv = ops.slice().reverse().map(([k, v]) => [k, -v])
  const src = []
  const dst = []
  ;[-1, 0].forEach((fx) =>
    [-1, 1].forEach((fy) => {
      const c = [(fx * w) / 2, (fy * h) / 2, 0]
      const p = at(c)
      /* where the viewer sees this corner across, held at its resting height and plane */
      const s = (eye[2] - z0) / (eye[2] - p[2])
      const f = [eye[0] + (p[0] - eye[0]) * s, c[1], z0]
      /* the point of the element's own plane on that line of sight */
      const d = sub(f, eye)
      const q = add(eye, d.map((v) => v * (dot(n, sub(o, eye)) / dot(n, d))))
      const [x, y] = apply(inv, q)
      src.push([c[0], c[1]])
      /* never past the glass top or bottom (the Book tilt would otherwise push a corner out) */
      dst.push([x, Math.max(-h / 2, Math.min(h / 2, y))])
    }),
  )
  return homography(src, dst)
}

/** The hinge transform of the mirror's holder (the swinging half's glass) at angle β. */
export function hingeTf(beta, spec = DUO_SPEC, cover = beta > 90) {
  return opsCss(swingChain(beta, spec, cover).ops)
}

/** The flat warp, for the copy inside that holder (a 2D projective map on the glass). */
export function warpTf(m = IDENTITY_M) {
  const fmt = (v) => +v.toFixed(9)
  return `matrix3d(${m.map(fmt).join(', ')})`
}
