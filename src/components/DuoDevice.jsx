import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useLocation } from 'react-router-dom'
import {
  commitPostureClasses,
  getCommittedPosture,
  getCommittedSplit,
  getDuoPosture,
  setUiState,
  useDuoPosture,
  useDuoSplit,
  useUiLayout,
} from '../utils/uiTheme'
import {
  DEFAULT_BETA,
  DUO_SPEC,
  IDENTITY_M,
  STAGE_PERSPECTIVE,
  blendPose,
  eyeInDevice,
  fitPose,
  flatWarp,
  opsCss,
  seesCover,
  planTransition,
  poseFor,
  poseVars,
  hingeTf,
  warpTf,
} from '../utils/duoGeometry'
import { createDomMirror } from '../utils/domMirror'
import { IS_DUO_COVER, duoCoverSrc } from '../utils/duoCoverEmbed'
import { DuoStatusCluster } from './DuoRail'
import '../styles/duoDevice.css'

/*
 * iPhone Duo preview stage.
 * Always rendered around the live app so toggling skins / postures never remounts it:
 * on the phone layouts every wrapper is `display: contents` and the chassis is hidden.
 *
 * A posture change runs as a chain of moves (see planTransition):
 *   unfold / close — Folded ↔ Open / Book, the Duo's signature motion: one continuous swing
 *            of the hinge. The app changes layout only while the device is shut and the
 *            cover screen is blurred (before the swing when opening, after it when closing),
 *            so nothing re-lays out while it moves. Through the swing the inner display is
 *            on: the half that stays put shows the app, sharp; the swinging half carries a live
 *            copy of the app's left half, seen from either side (over the cover glass while it
 *            faces the viewer), held flat (see flatWarp) and blurred by the hinge angle: sharp
 *            open, heaviest shut. Shut, the cover screen clears to the very same screen.
 *   power  — other display changes (outer ↔ inner): dim → move → light
 *   fold   — Open ↔ Book, Portrait ↔ Laptop: the screen stays on and the hinge eases open /
 *            shut; content keeps flowing across the fold (live mirror on the other half),
 *            and a split screen stays split. Open ↔ Book full screen bends like a swing: the
 *            left page's screen is held flat and blurred while it moves (most mid-way) and
 *            lands on its glass as the Book page, sharp.
 *   rotate — Open ↔ Portrait, Folded ↔ Stand: the screen (split view included) turns with
 *            the device, and only then does the new layout fade in over white glass
 *   slide  — split view on Open: the app slides to its half
 *   swap   — split view on Book: the pages cross-fade
 * Everything moves on one ease-in-out curve. The stage fit (scale, offset, camera) animates
 * through a mid-way keyframe so the device stays in the window while it turns.
 */
const MS = { dim: 200, move: 1050, light: 520, slide: 480, fold: 900, rotate: 950, swapOut: 160, swapIn: 300, blurIn: 150, clear: 280 }
/* blur (px) of the swinging half's screens, by the hinge angle: none at either end (open 0°,
   shut 180°), building as the half turns away from where it rests and peaking edge-on (90°),
   where it moves fastest. Each face shows its own screen (the cover face the closed screen
   itself), so nothing needs hiding where the device rests. */
const SWING_BLUR = { peak: 22, bend: 16 }
/* never quite 0: a 3D-moving layer whose filter animates up from none draws blank in Chrome
   (the filter surface it needs is only made on the way); 0.01px can't be seen */
const blurCss = (px) => `blur(${Math.max(0.01, +px.toFixed(2))}px)`
const hingeBlur = (beta) => SWING_BLUR.peak * Math.sin((Math.max(0, Math.min(180, beta)) * Math.PI) / 180)
/* swing: by the hinge angle, easing in / out where the page rests on its glass */
const swingBlurAt = (beta, k, w) => hingeBlur(beta) * w
/* Open ↔ Book: sharp at both ends, rising and falling with how far the hinge has travelled */
const bendBlurAt = (beta, k) => SWING_BLUR.bend * Math.sin(Math.PI * k)
const EASE_PTS = [0.65, 0, 0.35, 1]
const EASE = `cubic-bezier(${EASE_PTS.join(', ')})`

const BAR_GAP = 12
/* the split-view row hangs under the control bar (Open only); its space is always kept so
   the device never jumps when the row appears */
const SPLIT_ROW = 38

/* the control bar's bottom edge, cached: reading it forces a layout of the whole document,
   which on a long feed costs more than a frame (it only moves on resize) */
let barBottom = null
if (typeof window !== 'undefined') window.addEventListener('resize', () => (barBottom = null))
function computeFit(pose, maxZoom = 1) {
  if (barBottom == null) {
    const bar = document.querySelector('.ui-skin--duo')
    if (bar) barBottom = bar.getBoundingClientRect().bottom
  }
  const top = barBottom != null ? barBottom + SPLIT_ROW + BAR_GAP : 24
  const avail = { w: window.innerWidth - 32, h: window.innerHeight - top - 24 }
  const stageH = window.innerHeight - top
  /* eyeY: where the viewer's eye sits as a fraction of the stage height (0.5 = centre) */
  const eyeY = pose.eyeY ?? 0.5
  const persp = pose.persp || STAGE_PERSPECTIVE
  return { ...fitPose(pose, avail, undefined, persp, (eyeY - 0.5) * stageH, maxZoom), top, persp, eyeY }
}

/* the stage fit sampled along the move (offsets are eased progress, which is exactly the
   blend factor the chassis is at, since both run on the same curve), so the device stays
   inside the window through the whole turn, not just at its ends and middle */
const FIT_SAMPLES = 12
function fitFrames(fromPose, toPose, from, to) {
  const frames = [{ ...from, pose: fromPose, offset: 0 }]
  for (let i = 1; i < FIT_SAMPLES; i += 1) {
    const k = i / FIT_SAMPLES
    const pose = blendPose(fromPose, toPose, k)
    frames.push({ ...computeFit(pose, from.zoom + (to.zoom - from.zoom) * k), pose, offset: k })
  }
  frames.push({ ...to, pose: toPose, offset: 1 })
  return frames
}

/* the fit along a move between two poses: the device eases out / in to fit each pose and
   re-centres, with the camera following it through the move */
function fitTrack(fromPose, toPose, from) {
  return fitFrames(fromPose, toPose, from, computeFit(toPose))
}

/* stage fit as two animations: the slide (translate) stays on the compositor even while the
   main thread re-lays out the app; the camera (perspective) only animates when it changes */
function animateStageFit(stage, frames, opts) {
  const out = [stage.animate(frames.map((f) => ({ translate: `${f.dx}px ${f.dy}px`, offset: f.offset })), opts)]
  if (frames.some((f) => f.persp !== frames[0].persp || f.eyeY !== frames[0].eyeY)) {
    out.push(
      stage.animate(
        frames.map((f) => ({ perspective: `${f.persp}px`, perspectiveOrigin: `50% ${f.eyeY * 100}%`, offset: f.offset })),
        opts,
      ),
    )
  }
  return out
}

/* keyframes for the mirror riding the swinging half: its hinge transform plus the flat warp,
   and its blur, sampled on the same eased progress as the hinge and the stage fit (with two
   more either side of edge-on, where it hops from the inner glass to past the cover glass).
   `rests` ('start' | 'end'): the end of the swing where it rests on the inner glass: its warp
   and blur ease in from / out to none there (Book's left page lifts off and lands smoothly,
   and is sharp the moment it settles). `blurAt(beta, k, w)` gives its blur (px). */
const WARP_SAMPLES = 24
const LAND = 0.2
function warpFrames(b0, b1, fromPose, toPose, from, to, rests, blurAt = swingBlurAt) {
  const betaAt = (k) => b0 + (b1 - b0) * k
  /* where the viewer's eye is at each point of the move (the device re-fits as it goes) */
  const eyeAt = (k) => {
    const pose = blendPose(fromPose, toPose, k)
    const fit = k <= 0 ? from : k >= 1 ? to : computeFit(pose, from.zoom + (to.zoom - from.zoom) * k)
    const stageH = window.innerHeight - (fit.top ?? 96)
    return eyeInDevice(pose.device, fit.zoom, fit.persp || STAGE_PERSPECTIVE, ((fit.eyeY ?? 0.5) - 0.5) * stageH)
  }
  const ks = Array.from({ length: WARP_SAMPLES + 1 }, (_, i) => i / WARP_SAMPLES)
  /* where the eye sees L edge-on (Book's tilt puts it well past 90°): the copy hops sides there */
  const side = (k) => seesCover(betaAt(k), eyeAt(k))
  if (side(0) !== side(1)) {
    let lo = 0
    let hi = 1
    for (let i = 0; i < 24; i += 1) {
      const mid = (lo + hi) / 2
      if (side(mid) === side(0)) lo = mid
      else hi = mid
    }
    const kEdge = (lo + hi) / 2
    ks.push(Math.max(0, kEdge - 0.004), Math.min(1, kEdge + 0.004))
  }
  const samples = [...new Set(ks)]
    .sort((a, b) => a - b)
    .map((k) => {
      const eye = eyeAt(k)
      const beta = betaAt(k)
      const cover = seesCover(beta, eye)
      return { beta, cover, m: flatWarp(beta, eye, undefined, cover), offset: k }
    })
  /* edge-on (a sliver there anyway): hold the nearest warp it shows */
  const shown = samples.filter((f) => f.m)
  return samples.map(({ beta, cover, m, offset }) => {
    const near = m || shown.reduce((best, f) => (!best || Math.abs(f.offset - offset) < Math.abs(best.offset - offset) ? f : best), null)?.m
    const away = rests === 'start' ? offset : 1 - offset
    const w = Math.min(1, away / LAND) ** 2 * (3 - 2 * Math.min(1, away / LAND))
    const warp = (near || IDENTITY_M).map((v, i) => IDENTITY_M[i] + (v - IDENTITY_M[i]) * w)
    return { beta, cover, warp, filter: blurCss(blurAt(beta, offset, w)), offset }
  })
}

/* the swinging half during a swing is ONE element (so the browser has nothing to depth-sort it
   against): the mirror's holder carries the hinge; inside it, the copy of the open screen shows on
   the inner face, and the cover stand-in (the closed screen itself, see duoCoverEmbed) on the
   cover face, both with the flat warp and the hinge's blur */
function riderAnims(holder, copy, cover, frames, opts) {
  if (!holder?.animate || !copy?.animate) return []
  const out = [
    holder.animate(frames.map((f) => ({ transform: hingeTf(f.beta, undefined, f.cover), offset: f.offset })), opts),
    copy.animate(
      frames.map((f) => ({
        transform: `${warpTf(f.warp)} translateX(${f.cover ? -DUO_SPEC.inner.w / 2 : 0}px) scaleX(${f.cover ? -1 : 1})`,
        filter: f.filter,
        offset: f.offset,
      })),
      opts,
    ),
  ]
  if (cover?.animate) {
    out.push(cover.animate(frames.map((f) => ({ transform: warpTf(f.warp), filter: f.filter, opacity: f.cover ? 1 : 0, offset: f.offset })), opts))
  }
  return out
}

/* repeated items the live copies only lay out near the screen (a feed can run to hundreds) */
const MIRROR_LAZY = '.product-card'

const initialGeom = () => ({ posture: getCommittedPosture() || getDuoPosture(), split: getCommittedSplit() })

export default function DuoDevice({ children }) {
  const [layout] = useUiLayout()
  const [targetPosture] = useDuoPosture()
  const targetSplit = useDuoSplit()
  const isDuo = layout === 'duo'

  /* geom = what the chassis shows right now: { posture, split, beta?, carry?: { posture, split } } */
  const [geom, setGeom] = useState(() => (isDuo ? initialGeom() : null))
  const geomRef = useRef(geom)
  const [phase, setPhase] = useState('idle')
  const [animMs, setAnimMs] = useState(MS.move)
  const [seg, setSeg] = useState(null)
  const stageRef = useRef(null)
  const deviceRef = useRef(null)
  const mirrorRef = useRef(null)
  const mirrorAppRef = useRef(null)
  const coverRef = useRef(null)
  const coverFrameRef = useRef(null)
  /* the cover stand-in loads once in Duo (its page and scroll then follow by message) */
  const location = useLocation()
  const [coverSrc, setCoverSrc] = useState(null)
  useEffect(() => {
    if (!isDuo || IS_DUO_COVER) return
    setCoverSrc((src) => src || duoCoverSrc(`${window.location.pathname}${window.location.search}`))
  }, [isDuo])
  useEffect(() => {
    const win = coverFrameRef.current?.contentWindow
    if (!win) return undefined
    const id = setTimeout(() => {
      const scroller = deviceRef.current?.querySelector(':scope > .app .app-scroll')
      win.postMessage(
        { type: 'duo-cover-sync', id: 'route', path: `${location.pathname}${location.search}`, scrollTop: scroller?.scrollTop || 0 },
        window.location.origin,
      )
    }, 300)
    return () => clearTimeout(id)
  }, [location.pathname, location.search])
  const timers = useRef(new Set())
  const anims = useRef([])
  const runRef = useRef(null)
  const targetRef = useRef(null)
  const commitWaiters = useRef([])
  targetRef.current = { posture: targetPosture, split: targetSplit }

  const apply = useCallback((desc) => {
    geomRef.current = desc
    setGeom(desc)
  }, [])

  const geometry = useMemo(() => (geom ? poseVars(geom.posture, geom) : null), [geom])
  const pose = geometry?.pose

  /* resting fit for the current pose (and on resize) */
  const [fit, setFit] = useState({ zoom: 1, dx: 0, dy: 0 })
  const fitRef = useRef(fit)
  useLayoutEffect(() => {
    /* mid-swing the chassis and stage fit run on their own timeline: no refit (it would
       restyle the whole screen, both copies included, while the hinge moves) */
    if (!pose || geomRef.current?.swing) return undefined
    const compute = () => {
      barBottom = null /* at rest: read the bar afresh (it may still be settling in) */
      const f = computeFit(pose)
      fitRef.current = f
      setFit(f)
    }
    compute()
    window.addEventListener('resize', compute)
    const id = setTimeout(compute, 80) /* after the control bar has mounted */
    return () => {
      window.removeEventListener('resize', compute)
      clearTimeout(id)
    }
  }, [pose])

  /* the fit animates start → mid-way pose → end on the same curve as the chassis */
  useLayoutEffect(() => {
    if (!seg || !seg.ms) return
    const stage = stageRef.current
    const device = deviceRef.current
    if (!stage?.animate || !device?.animate) return
    const opts = { duration: seg.ms, easing: EASE }
    anims.current.forEach((a) => a.cancel())
    anims.current = [
      ...animateStageFit(stage, seg.frames, opts),
      device.animate(seg.frames.map((f) => ({ scale: `${f.zoom} ${f.zoom} ${f.zoom}`, offset: f.offset })), opts),
    ]
  }, [seg])

  const stopAll = useCallback(() => {
    runRef.current = null
    commitWaiters.current.splice(0).forEach((resolve) => resolve())
    timers.current.forEach(clearTimeout)
    timers.current.clear()
    anims.current.forEach((a) => a.cancel())
    anims.current = []
  }, [])

  /* ---------- the move runner ---------- */
  const runChain = useCallback(async () => {
    if (runRef.current || !geomRef.current) return /* a running chain re-reads the target when it ends */
    const token = {}
    runRef.current = token
    const alive = () => runRef.current === token
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const T = (ms) => (reduced ? 0 : ms)
    /* a CSS transition starts on the frame after its commit: let it land before moving on */
    const Tm = (ms) => (reduced ? 0 : ms + 50)
    const wait = (ms) =>
      new Promise((resolve) => {
        const id = setTimeout(() => {
          timers.current.delete(id)
          resolve()
        }, ms)
        timers.current.add(id)
      })
    /* let React commit the start pose and the browser style it, so transitions start from it
       (falls back to a timer where rAF is paused, e.g. a background tab) */
    const settle = () =>
      new Promise((resolve) => {
        let done = false
        const fin = () => {
          if (done) return
          done = true
          void deviceRef.current?.getBoundingClientRect()
          if (mirrorRef.current) void getComputedStyle(mirrorRef.current).transform
          resolve()
        }
        requestAnimationFrame(() => requestAnimationFrame(fin))
        const id = setTimeout(fin, 80)
        timers.current.add(id)
      })
    /* move the chassis to `desc`, animating the stage fit through the mid-way pose */
    const moveTo = (desc, nextPhase, ms) => {
      const fromPose = poseFor(geomRef.current.posture, geomRef.current)
      const toPose = poseFor(desc.posture, desc)
      const frames = fitTrack(fromPose, toPose, fitRef.current)
      setAnimMs(ms)
      apply(desc)
      setPhase(nextPhase)
      setSeg({ frames, ms })
    }

    /* lay the app out for another display in one synchronous commit, with the app's own
       transitions held off for it: the new layout lands as it will rest (nothing slides in
       while the screen clears or the hinge moves) */
    const relayout = (fn) => {
      const root = document.documentElement
      root.classList.add('duo-relayout')
      flushSync(fn)
      /* after the next frame has styled it (or a moment, where frames are paused) */
      let done = false
      const restore = () => {
        if (done) return
        done = true
        root.classList.remove('duo-relayout')
      }
      requestAnimationFrame(() => requestAnimationFrame(restore))
      setTimeout(restore, 120)
    }

    /* resolves once React has committed the geometry just applied (mirror built, styles set) */
    const committed = () => new Promise((resolve) => commitWaiters.current.push(resolve))

    /* the cover stand-in shows this page at this scroll, drawn (or a moment has passed) */
    const coverSynced = () =>
      new Promise((resolve) => {
        const win = coverFrameRef.current?.contentWindow
        if (!win) {
          resolve()
          return
        }
        const id = `${Date.now()}-${Math.random()}`
        const scroller = deviceRef.current?.querySelector(':scope > .app .app-scroll')
        let done = false
        const finish = () => {
          if (done) return
          done = true
          window.removeEventListener('message', onMessage)
          resolve()
        }
        const onMessage = (e) => {
          if (e.data?.type === 'duo-cover-ready' && e.data.id === id) finish()
        }
        window.addEventListener('message', onMessage)
        win.postMessage(
          { type: 'duo-cover-sync', id, path: `${window.location.pathname}${window.location.search}`, scrollTop: scroller?.scrollTop || 0 },
          window.location.origin,
        )
        const tid = setTimeout(finish, 450)
        timers.current.add(tid)
      })

    /* the next frame has been drawn (or a while has passed, where frames are paused) */
    const painted = () =>
      new Promise((resolve) => {
        let done = false
        const fin = () => {
          if (done) return
          done = true
          resolve()
        }
        requestAnimationFrame(() => requestAnimationFrame(fin))
        const id = setTimeout(fin, 600)
        timers.current.add(id)
      })
    /* an animation has really run to its end: it starts on the first frame drawn after play(),
       which on a long page can be well after play() was called, so a plain timer would end
       the swing early (falls back to a timer where frames are paused) */
    const ran = (anim, ms) => Promise.race([anim ? anim.finished.then(() => {}, () => {}) : Promise.resolve(), wait(ms)])
    /* `lead` ms before an animation of `total` ms ends (timed from when it really started) */
    const nearEnd = async (anim, total, lead) => {
      await Promise.race([anim.ready.then(() => {}, () => {}), wait(400)])
      await wait(Math.max(0, total - (anim.currentTime ?? 0) - lead))
    }
    /* swap what the screen shows as a cross-fade (a view transition: the old picture dissolves
       into the new one), so the blurred screen settles into the next one instead of popping */
    const crossfade = (fn) =>
      new Promise((resolve) => {
        const root = document.documentElement
        if (!document.startViewTransition || document.hidden) {
          fn()
          resolve()
          return
        }
        root.classList.add('duo-vt')
        const vt = document.startViewTransition(() => {
          if (alive()) fn()
        })
        vt.updateCallbackDone.then(resolve, resolve)
        vt.finished.finally(() => root.classList.remove('duo-vt'))
      })

    /* Folded ↔ Open / Book: the hinge, chassis, stage and the swinging half's screen run one
       Web Animations timeline on the compositor; the app re-lays out only while the device is
       shut and blurred, never while it moves, and nothing moves before it has been drawn */
    const swing = async (opening, to) => {
      const inner = opening ? to.posture : geomRef.current.posture /* landscape | book */
      const innerBeta = DEFAULT_BETA[inner]
      const b0 = opening ? 180 : innerBeta
      const b1 = opening ? innerBeta : 180
      const finalGeom = opening ? { posture: inner, split: 'full' } : { posture: 'folded', split: 'full' }
      if (reduced) {
        commitPostureClasses(finalGeom.posture, 'full')
        apply(finalGeom)
        return
      }
      const carried = { posture: 'folded', split: 'full', carry: { posture: 'folded', split: 'full' } }
      /* the inner display on through the swing: live app on R, its copy riding L. Open at rest
         has no copy: it is built over the whole-width live app, which gives up its left half
         only once the copy has been drawn (and takes it back the same way after landing) */
      const swinging = (beta, unclipped) => ({ posture: inner, split: 'full', bent: true, swing: true, beta, unclipped })
      const fresh = inner === 'landscape'
      apply(opening ? carried : swinging(innerBeta, fresh))
      setPhase('prep')
      /* the cover stand-in catches up with this page and scroll meanwhile */
      const coverReady = coverSynced()
      await (opening || !fresh ? settle() : painted())
      if (!alive()) return
      const stage = stageRef.current
      const device = deviceRef.current
      const half = device?.querySelector('.duo-half--l')
      const app = device?.querySelector(':scope > .app')
      if (!stage?.animate || !half || !app) {
        commitPostureClasses(finalGeom.posture, 'full')
        apply(finalGeom)
        return
      }
      const fromPose = poseFor(geomRef.current.posture, geomRef.current)
      const toPose = poseFor(finalGeom.posture, finalGeom)
      /* the device re-fits and re-centres as it opens / closes, the camera following it */
      const frames = fitTrack(fromPose, toPose, fitRef.current)
      const mirrorFrames = warpFrames(b0, b1, fromPose, toPose, frames[0], frames[frames.length - 1], opening ? 'end' : 'start')
      const D = Math.round(420 + 4.4 * Math.abs(b1 - b0))
      /* hold the end pose: if anything runs late (busy main thread, hidden tab), the device
         waits open / shut instead of snapping back to its start */
      const opts = { duration: D, easing: EASE, fill: 'forwards' }
      const fadeOpts = (ms) => ({ duration: ms, easing: 'ease-out', fill: 'forwards' })

      /* opening: the cover screen blurs (shut = the hinge blur at its heaviest), and while that
         runs on the compositor the app is re-laid out under it (the copy it lands on is already
         at full blur) */
      anims.current.forEach((a) => a.cancel())
      /* (only if the shut screen carries any blur at all) */
      const shutBlur = hingeBlur(180) >= 0.5
      const blurIn = opening && shutBlur ? app.animate([{ filter: blurCss(0) }, { filter: blurCss(hingeBlur(180)) }], fadeOpts(MS.blurIn)) : null
      anims.current = blurIn ? [blurIn] : []
      if (opening) {
        setPhase('unfold-blur')
        await Promise.all([shutBlur ? wait(MS.blurIn * 0.4) : null, coverReady])
        if (!alive()) return
      }

      /* the chassis timeline, created paused so it holds the start pose meanwhile */
      const hinge = half.animate([{ transform: `rotateY(${b0}deg)` }, { transform: `rotateY(${b1}deg)` }], opts)
      const chassis = [
        hinge,
        ...animateStageFit(stage, frames, opts),
        device.animate(
          frames.map((f) => ({ transform: opsCss(f.pose.device), scale: `${f.zoom} ${f.zoom} ${f.zoom}`, offset: f.offset })),
          opts,
        ),
      ]
      chassis.forEach((a) => a.pause())
      anims.current.push(...chassis)
      let riders = []
      const ride = () => {
        riders = riderAnims(mirrorRef.current, mirrorAppRef.current, coverRef.current, mirrorFrames, opts)
        riders.forEach((a) => a.pause())
        anims.current.push(...riders)
      }
      if (opening) {
        /* still shut, under the blur: lay the app out for the inner display (one synchronous
           commit, so no frame shows the new layout before its copy is in place), the cover
           screen dissolving into its copy */
        await crossfade(() => {
          relayout(() => {
            commitPostureClasses(inner, 'full')
            apply(swinging(180))
            setPhase('prep') /* the cover screen's glass clip goes in the same commit */
          })
          blurIn?.cancel() /* the live app is on R now, sharp; its copy over the cover glass is blurred */
          ride()
        })
        if (!alive()) return
      } else {
        ride()
      }
      if (opening) {
        /* the re-laid-out app and its copy are drawn before anything moves */
        await painted()
        if (!alive()) return
      } else {
        await coverReady
        if (!alive()) return
        /* the live app gives up its left half on the frame the swing starts */
        if (fresh) flushSync(() => apply(swinging(innerBeta)))
      }
      /* go: every part of the swing starts on the same frame */
      chassis.concat(riders).forEach((a) => a.play())
      setPhase(opening ? 'unfold' : 'close')
      if (opening) {
        await ran(hinge, D + 1500)
        if (!alive()) return
      }

      if (!opening) {
        /* as it lands (the hinge finishes on the compositor meanwhile): lay the app out for the
           cover screen, the shut screen dissolving into it, then its light blur clears */
        await nearEnd(hinge, D, 150)
        if (!alive()) return
        let clear = null
        await crossfade(() => {
          relayout(() => {
            commitPostureClasses('folded', 'full')
            apply(carried)
            setPhase('close-clear') /* its glass clip lands with it, before its blur clears */
          })
          const cover = deviceRef.current?.querySelector(':scope > .app')
          clear = shutBlur && cover?.animate
            ? cover.animate([{ filter: blurCss(hingeBlur(180)) }, { filter: blurCss(0) }], { duration: MS.clear, easing: EASE, fill: 'forwards' })
            : null
          if (clear) anims.current.push(clear)
        })
        if (!alive()) return
        await ran(hinge, D + 1500)
        await ran(clear, MS.clear + 1000)
        if (!alive()) return
      } else if (fresh) {
        /* landed on Open: the live app takes its whole width back under the copy (the same
           picture), and the copy goes once that has been drawn */
        apply(swinging(b1, true))
        await painted()
        if (!alive()) return
      }
      apply(finalGeom) /* settled pose: the same picture, crisp and flat where possible */
      setPhase('prep')
      await committed()
      if (!alive()) return
      /* release the held end values in the same frame the matching static pose lands */
      anims.current.forEach((a) => a.cancel())
      anims.current = []
      await settle()
    }

    /* Open ↔ Book, full screen: the hinge bends on one Web Animations timeline with the chassis
       and stage, and the left page's screen is held flat (flatWarp) and blurred while it
       moves, landing on its glass as the Book page, sharp */
    const bend = async (toBook) => {
      const b0 = toBook ? 0 : DEFAULT_BETA.book
      const b1 = toBook ? DEFAULT_BETA.book : 0
      const bentAt = (beta, unclipped) => ({ posture: 'book', split: 'full', swing: true, beta, unclipped })
      if (toBook) {
        /* bent at 0° looks the same as Open: its page copy is built over the whole-width app,
           which gives up its left half once the copy has been drawn */
        commitPostureClasses('book', 'full')
        apply(bentAt(0, true))
      } else {
        apply(bentAt(b0))
      }
      setPhase('prep')
      await painted()
      if (!alive()) return
      const stage = stageRef.current
      const device = deviceRef.current
      const half = device?.querySelector('.duo-half--l')
      if (!stage?.animate || !half) return
      const fromPose = poseFor('book', bentAt(b0))
      const toPose = poseFor('book', bentAt(b1))
      const frames = fitTrack(fromPose, toPose, fitRef.current)
      const mirrorFrames = warpFrames(b0, b1, fromPose, toPose, frames[0], frames[frames.length - 1], toBook ? 'end' : 'start', bendBlurAt)
      const opts = { duration: MS.fold, easing: EASE, fill: 'forwards' }
      anims.current.forEach((a) => a.cancel())
      const hinge = half.animate([{ transform: `rotateY(${b0}deg)` }, { transform: `rotateY(${b1}deg)` }], opts)
      const riders = riderAnims(mirrorRef.current, mirrorAppRef.current, null, mirrorFrames, opts)
      anims.current = [
        hinge,
        ...animateStageFit(stage, frames, opts),
        device.animate(
          frames.map((f) => ({ transform: opsCss(f.pose.device), scale: `${f.zoom} ${f.zoom} ${f.zoom}`, offset: f.offset })),
          opts,
        ),
        ...riders,
      ]
      anims.current.forEach((a) => a.pause())
      if (toBook) flushSync(() => apply(bentAt(0)))
      anims.current.forEach((a) => a.play())
      setPhase('bend')
      await ran(hinge, MS.fold + 1500)
      if (!alive()) return
      if (toBook) {
        apply({ posture: 'book', split: 'full' })
      } else {
        /* flat again: the live app takes its whole width back under the page copy, then the
           copy goes and Open's layout takes over (the same picture) */
        apply(bentAt(0, true))
        await painted()
        if (!alive()) return
        commitPostureClasses('landscape', 'full')
        apply({ posture: 'landscape', split: 'full' })
      }
      setPhase('prep')
      await committed()
      if (!alive()) return
      anims.current.forEach((a) => a.cancel())
      anims.current = []
      await settle()
    }

    const runStep = async ({ kind, to }) => {
      const full = { posture: to.posture, split: to.split }
      if (kind === 'unfold' || kind === 'close') {
        await swing(kind === 'unfold', to)
        return
      }
      if (kind === 'power') {
        setPhase('dim')
        await wait(T(MS.dim))
        if (!alive()) return
        commitPostureClasses(to.posture, to.split)
        moveTo(full, 'move', T(MS.move))
        await wait(Tm(MS.move))
        if (!alive()) return
        setPhase('light')
        await wait(T(MS.light))
        return
      }
      if (kind === 'slide') {
        commitPostureClasses(to.posture, to.split)
        apply(full)
        setPhase('slide')
        await wait(T(MS.slide))
        return
      }
      if (kind === 'swap') {
        setPhase('swap-out')
        await wait(T(MS.swapOut))
        if (!alive()) return
        commitPostureClasses(to.posture, to.split)
        apply(full)
        setPhase('swap-in')
        await wait(T(MS.swapIn))
        return
      }
      if (kind === 'fold') {
        const from = geomRef.current
        const pages = { landscape: true, book: true }
        if (!reduced && pages[from.posture] && pages[to.posture] && (from.split || 'full') === 'full' && (to.split || 'full') === 'full') {
          await bend(to.posture === 'book')
          return
        }
        const bending = to.posture === 'book' || to.posture === 'laptop'
        if (bending) {
          /* start bent at 0° (looks identical to flat), let the mirror fill the other half,
             then ease the hinge open */
          commitPostureClasses(to.posture, to.split)
          apply({ ...full, beta: 0 })
          setPhase('prep')
          await settle()
          if (!alive()) return
          moveTo(full, 'fold', T(MS.fold))
          await wait(Tm(MS.fold))
        } else {
          /* ease the hinge flat, then hand over to the flat posture (identical picture) */
          moveTo({ posture: geomRef.current.posture, split: geomRef.current.split, beta: 0 }, 'fold', T(MS.fold))
          await wait(Tm(MS.fold))
          if (!alive()) return
          commitPostureClasses(to.posture, to.split)
          apply(full)
          setPhase('prep')
          await settle()
        }
        return
      }
      if (kind === 'rotate') {
        /* the current screen (split view included) rides the chassis while it turns */
        const carry = { posture: geomRef.current.posture, split: geomRef.current.split }
        apply({ ...carry, carry })
        setPhase('prep')
        await settle()
        if (!alive()) return
        moveTo({ ...full, carry }, 'rotate', T(MS.rotate))
        await wait(Tm(MS.rotate))
        if (!alive()) return
        /* then the new layout fades in over white glass */
        setPhase('swap-out')
        await wait(T(MS.swapOut))
        if (!alive()) return
        commitPostureClasses(to.posture, to.split)
        apply(full)
        setPhase('swap-in')
        await wait(T(MS.swapIn))
      }
    }

    try {
      /* follow every change the user makes mid-chain; give up only if a plan that ran to
         the end twice in a row still has not arrived (it always converges) */
      let stale = 0
      while (alive() && stale < 2) {
        const target = targetRef.current
        const steps = planTransition(geomRef.current, target)
        if (!steps.length) break
        let replanned = false
        for (const step of steps) {
          await runStep(step)
          if (!alive()) return
          /* the user picked something else mid-chain: re-plan from here */
          if (targetRef.current.posture !== target.posture || targetRef.current.split !== target.split) {
            replanned = true
            break
          }
        }
        stale = replanned ? 0 : stale + 1
      }
      if (alive()) setPhase('idle')
    } finally {
      if (runRef.current === token) runRef.current = null
    }
  }, [apply])

  /* entering / leaving Duo: no animation */
  useLayoutEffect(() => {
    if (!isDuo) {
      stopAll()
      geomRef.current = null
      setGeom(null)
      setPhase('idle')
      setSeg(null)
      return
    }
    if (!geomRef.current) apply(initialGeom())
  }, [isDuo, apply, stopAll])

  useEffect(() => stopAll, [stopAll])

  /* the pointer heading for Folded or Book while Open rests: build the left half's copy now
     (over the whole-width app, the same picture), so the fold starts the moment it's clicked;
     dropped again if it isn't */
  useEffect(() => {
    if (!isDuo) return undefined
    let revert = 0
    const onIntent = (e) => {
      const g = geomRef.current
      if (runRef.current || !g || g.posture !== 'landscape' || (g.split || 'full') !== 'full' || g.swing) return
      if (e.detail !== 'folded' && e.detail !== 'book') return
      if (!g.bent) apply({ posture: 'landscape', split: 'full', bent: true, unclipped: true })
      clearTimeout(revert)
      revert = setTimeout(() => {
        const cur = geomRef.current
        if (!runRef.current && cur?.posture === 'landscape' && cur.bent && !cur.swing && targetRef.current.posture === 'landscape') {
          apply({ posture: 'landscape', split: cur.split || 'full' })
        }
      }, 2500)
    }
    window.addEventListener('duo-intent', onIntent)
    return () => {
      window.removeEventListener('duo-intent', onIntent)
      clearTimeout(revert)
    }
  }, [isDuo, apply])

  /* posture / split change while in Duo */
  useEffect(() => {
    if (isDuo) runChain()
  }, [isDuo, targetPosture, targetSplit, runChain])

  const bent = Boolean(pose?.mirror)
  const spare = Boolean(pose?.spare)
  /* the screen being shown (while a rotation carries the old screen, that one) */
  const screen = geom?.carry || geom

  /* live mirror on the other half of the hinge (book, laptop); built before paint so the
     half never shows empty, and kept while the hinge angle animates */
  const mirrorKey = bent ? 'on' : null
  useLayoutEffect(() => {
    if (!mirrorKey) return undefined
    const source = deviceRef.current?.querySelector(':scope > .app')
    const target = mirrorAppRef.current
    if (!source || !target) return undefined
    return createDomMirror(source, target, { lazy: MIRROR_LAZY })
  }, [mirrorKey])

  /* after every commit: wake whoever waits for the geometry they applied */
  useLayoutEffect(() => {
    if (!commitWaiters.current.length) return
    commitWaiters.current.splice(0).forEach((resolve) => resolve())
  })

  return (
    <div
      ref={stageRef}
      className="duo-stage"
      data-phase={isDuo ? phase : undefined}
      data-pose={isDuo ? screen?.posture : undefined}
      data-split={isDuo ? screen?.split || 'full' : undefined}
      data-swing={isDuo && geom?.swing ? '' : undefined}
      style={
        isDuo
          ? {
              '--duo-zoom': fit.zoom,
              '--stage-top': `${fit.top ?? 96}px`,
              '--stage-dx': `${fit.dx}px`,
              '--stage-dy': `${fit.dy}px`,
              '--stage-persp': `${fit.persp || STAGE_PERSPECTIVE}px`,
              '--stage-eye': `${(fit.eyeY ?? 0.5) * 100}%`,
              '--duo-anim-ms': `${animMs}ms`,
              '--duo-ease': EASE,
              '--duo-swap-out-ms': `${MS.swapOut}ms`,
              '--duo-swap-in-ms': `${MS.swapIn}ms`,
              '--duo-slide-ms': `${MS.slide}ms`,
            }
          : undefined
      }
    >
      <div className="duo-device" ref={deviceRef} style={geometry?.vars}>
        <div className="duo-half duo-half--l" aria-hidden>
          <div className="duo-face duo-face--front" />
          <div className="duo-face duo-face--back" />
        </div>
        <div className="duo-half duo-half--r" aria-hidden>
          <div className="duo-face duo-face--front" />
          <div className="duo-face duo-face--back" />
        </div>
        <div className="duo-crease" aria-hidden />
        {children}
        {/* bent postures: a live copy of the app on the other half of the hinge */}
        <div ref={mirrorRef} className={`duo-mirror${bent ? ' duo-mirror--on' : ''}`} aria-hidden>
          {bent && <div ref={mirrorAppRef} className="app app-mirror" />}
          {/* the closed screen itself, for the swinging half's cover face (kept loaded) */}
          {coverSrc && (
            <div ref={coverRef} className="duo-cover-view">
              <iframe ref={coverFrameRef} src={coverSrc} title="Cover screen" tabIndex={-1} />
            </div>
          )}
        </div>
        {/* system status can't move: with the app on the left half, time + signal stay at the
            device's right edge (the inner display's camera is under the glass, so no hole) */}
        {spare && screen?.split === 'left' && (
          <div className="duo-sys-status">
            <DuoStatusCluster camera={false} />
          </div>
        )}
        {/* split view on Open: the empty half */}
        <div className={`duo-spare${spare ? ' duo-spare--on' : ''}`}>
          {spare && (
            <div className="duo-spare-card">
              <span className="duo-spare-title">Split View</span>
              <span className="duo-spare-text">Open another app on this side, or move Meesho here.</span>
              <button
                type="button"
                className="duo-spare-move"
                onClick={() => setUiState({ split: screen?.split === 'left' ? 'right' : 'left' })}
              >
                Move Meesho here
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
