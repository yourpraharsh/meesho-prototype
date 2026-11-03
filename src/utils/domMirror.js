/**
 * Live DOM mirror for the iPhone Duo's bent postures.
 *
 * A browser cannot fold one element across two planes, so the live app stays on one half
 * of the hinge and this mirror shows the same app on the other half. The mirror is a
 * structural clone of `source`'s children, kept in sync by a MutationObserver (attributes,
 * text, children), plus scroll offsets, form values and canvas bitmaps. Taps and wheel/drag
 * scrolling on the mirror are forwarded to the matching element of the live app, so both
 * halves behave as one continuous screen.
 */

const SCROLLABLE = /(auto|scroll)/

/* every element that has ever scrolled (scroll events from the moment the app loads), so a
   mirror finds the scrolled ones without reading the offsets of the whole tree, which would
   force a full layout of it */
const everScrolled = new Set()
if (typeof document !== 'undefined') {
  document.addEventListener(
    'scroll',
    (e) => {
      if (e.target !== document) everScrolled.add(e.target)
    },
    { capture: true, passive: true },
  )
}

/* px per wheel delta unit */
const wheelUnit = (e) => (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1)

/* how far past the screen (in screen heights) the copy still lays out repeated items in full */
const LAZY_MARGIN = 1.5

/**
 * opts.lazy — selector for repeated, heavy items (a long feed's product cards). Copies of the
 * ones far off screen skip their inner layout and paint (content-visibility: auto) at the live
 * item's exact size, so the copy scrolls and lines up exactly like the live app but costs a
 * fraction to lay out; they render as they come near the screen.
 */
export function createDomMirror(source, target, { lazy } = {}) {
  const toClone = new WeakMap() /* live node → clone */
  const toSource = new WeakMap() /* clone → live node */
  const scrolled = new Set() /* live elements that have a scroll offset */
  const canvases = new Set() /* live canvases: bitmaps aren't DOM, so they're copied by hand */

  function syncProps(src, cl) {
    if (src.nodeType !== 1) return
    const tag = src.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      cl.value = src.value
      if ('checked' in src) cl.checked = src.checked
    }
    /* no scrollTop reads here: cloning inserted nodes must never force a layout per node.
       Scrolled elements are found once at build time and then by their scroll events. */
  }

  function copyCanvas(src, cl) {
    if (cl.width !== src.width) cl.width = src.width
    if (cl.height !== src.height) cl.height = src.height
    if (!src.width || !src.height) return /* drawImage throws on a 0x0 source */
    const ctx = cl.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, cl.width, cl.height)
    ctx.drawImage(src, 0, 0)
  }

  /* one native deep clone, then a single walk over both trees to pair them up (several
     times faster than cloning node by node on a long feed) */
  function deepClone(node) {
    const cl = node.cloneNode(true)
    const live = document.createTreeWalker(node)
    const copy = document.createTreeWalker(cl)
    for (let s = live.currentNode, c = copy.currentNode; s && c; s = live.nextNode(), c = copy.nextNode()) {
      toClone.set(s, c)
      toSource.set(c, s)
      if (c.nodeType !== 1) continue
      c.removeAttribute('id') /* keep ids unique in the document */
      /* nothing in the aria-hidden copy takes focus (scroll containers included: Chrome makes
         them keyboard-focusable, and keyboard scrolling there would tear the halves) */
      c.setAttribute('tabindex', '-1')
      syncProps(s, c)
      if (s.nodeName === 'CANVAS') {
        canvases.add(s)
        copyCanvas(s, c)
      }
    }
    return cl
  }

  /* patch in place: only clones that are new, gone or out of order are touched */
  function syncChildren(parent) {
    const cParent = parent === source ? target : toClone.get(parent)
    if (!cParent) return
    /* drop clones whose live node left this parent (or was re-cloned elsewhere) */
    for (let c = cParent.firstChild; c; ) {
      const next = c.nextSibling
      const src = toSource.get(c)
      if (!src || src.parentNode !== parent || toClone.get(src) !== c) c.remove()
      c = next
    }
    /* walk the live children in order; untouched clones stay attached */
    let ref = cParent.firstChild
    parent.childNodes.forEach((child) => {
      const cl = toClone.get(child) || deepClone(child)
      if (cl === ref) ref = ref.nextSibling
      else cParent.insertBefore(cl, ref) /* new, reordered, or moved in from another parent */
    })
  }

  function syncScroll(el) {
    const cl = el === source ? target : toClone.get(el)
    if (!cl) return
    if (cl.scrollTop !== el.scrollTop) cl.scrollTop = el.scrollTop
    if (cl.scrollLeft !== el.scrollLeft) cl.scrollLeft = el.scrollLeft
  }

  function syncAllScroll() {
    scrolled.forEach((el) => {
      if (!el.isConnected) scrolled.delete(el)
      else syncScroll(el)
    })
  }

  /* initial build. Scroll offsets are read in the next frame, alongside the layout that frame
     does anyway (reading them now would force an extra layout, the copy included) */
  target.replaceChildren()
  const built = []
  source.childNodes.forEach((child) => built.push(deepClone(child)))
  if (lazy) {
    /* measured on the live app before the copy joins the page, so this costs no layout of it */
    const view = source.getBoundingClientRect()
    const margin = view.height * LAZY_MARGIN
    source.querySelectorAll(lazy).forEach((el) => {
      const cl = toClone.get(el)
      if (!cl) return
      const r = el.getBoundingClientRect()
      if (r.bottom > view.top - margin && r.top < view.bottom + margin) return
      /* the placeholder is the live card's exact CONTENT box (contain-intrinsic-size excludes
         padding and border), fractional, so the copy lines up row for row */
      const cs = getComputedStyle(el)
      const bb = cs.boxSizing === 'border-box'
      const edge = (...v) => (bb ? v.reduce((sum, x) => sum + parseFloat(x), 0) : 0)
      const w = parseFloat(cs.width) - edge(cs.borderLeftWidth, cs.borderRightWidth, cs.paddingLeft, cs.paddingRight)
      const h = parseFloat(cs.height) - edge(cs.borderTopWidth, cs.borderBottomWidth, cs.paddingTop, cs.paddingBottom)
      cl.style.contentVisibility = 'auto'
      cl.style.containIntrinsicSize = `auto ${w}px auto ${h}px`
    })
  }
  built.forEach((cl) => target.appendChild(cl))
  everScrolled.forEach((el) => {
    if (!el.isConnected) everScrolled.delete(el)
    else if (el === source || source.contains(el)) scrolled.add(el)
  })
  requestAnimationFrame(syncAllScroll)

  const observer = new MutationObserver((records) => {
    const parents = new Set()
    records.forEach((r) => {
      if (r.type === 'childList') {
        parents.add(r.target)
        return
      }
      const cl = r.target === source ? target : toClone.get(r.target)
      if (!cl) return
      if (r.type === 'characterData') {
        cl.data = r.target.data
      } else if (r.type === 'attributes') {
        if (r.target === source) return /* the mirror root keeps its own box */
        const v = r.target.getAttribute(r.attributeName)
        if (r.attributeName === 'id' || r.attributeName === 'tabindex') return
        if (v === null) cl.removeAttribute(r.attributeName)
        else cl.setAttribute(r.attributeName, v)
        /* React sets controlled values as a property (no input event); its value-attribute sync is the only signal */
        if (r.attributeName === 'value' && r.target.nodeName === 'INPUT') syncProps(r.target, cl)
        /* a width/height replay clears the clone's bitmap */
        if (r.target.nodeName === 'CANVAS') copyCanvas(r.target, cl)
      }
    })
    parents.forEach((p) => {
      if (p === source || source.contains(p)) {
        syncChildren(p)
        /* React updates a textarea by rewriting its text child */
        if (p.nodeName === 'TEXTAREA') {
          const c = toClone.get(p)
          if (c) syncProps(p, c)
        }
      }
    })
    if (parents.size) requestAnimationFrame(syncAllScroll)
  })
  observer.observe(source, { subtree: true, childList: true, attributes: true, characterData: true })

  /* scroll + form values from the live app */
  const onScroll = (e) => {
    const el = e.target === document ? null : e.target
    if (!el || !(el === source || source.contains(el))) return
    scrolled.add(el)
    syncScroll(el)
  }
  const onInput = (e) => {
    const cl = toClone.get(e.target)
    if (cl) syncProps(e.target, cl)
  }
  document.addEventListener('scroll', onScroll, true)
  source.addEventListener('input', onInput, true)
  source.addEventListener('change', onInput, true)

  /* canvas bitmaps: recopy (once per frame) after input that may have drawn */
  let raf = 0
  const syncCanvases = () => {
    if (raf || !canvases.size) return
    raf = requestAnimationFrame(() => {
      raf = 0
      canvases.forEach((c) => {
        if (!c.isConnected) {
          canvases.delete(c)
          return
        }
        const cl = toClone.get(c)
        if (cl) copyCanvas(c, cl)
      })
    })
  }
  source.addEventListener('pointermove', syncCanvases, true)
  source.addEventListener('pointerup', syncCanvases, true)

  /* ---------- forwarding: the mirror acts on the live app ---------- */
  const liveFor = (node) => {
    let n = node
    while (n && n !== target) {
      const live = toSource.get(n)
      if (live) return live
      n = n.parentNode
    }
    return source
  }

  /* can `n` scroll further along `ax` in the direction of `d`? */
  const canScroll = (n, ax, d) => {
    const room =
      ax === 'y'
        ? d > 0 ? n.scrollTop + n.clientHeight < n.scrollHeight - 1 : n.scrollTop > 0
        : d > 0 ? n.scrollLeft + n.clientWidth < n.scrollWidth - 1 : n.scrollLeft > 0
    if (!room) return false
    const cs = getComputedStyle(n)
    return SCROLLABLE.test(ax === 'y' ? cs.overflowY : cs.overflowX)
  }

  /* nearest live scroller with room along one axis; skipping full ones chains at limits, like native */
  const scrollerFor = (live, ax, d) => {
    for (let n = live; n && n.nodeType === 1; n = n.parentNode) {
      if (canScroll(n, ax, d)) return n
      if (n === source) break
    }
    return null
  }

  /* suspend scroll-snap on the live scroller for one forwarded gesture, then settle once */
  let snapHeld = null
  let snapTimer = 0
  const releaseSnap = () => {
    clearTimeout(snapTimer)
    const s = snapHeld
    snapHeld = null
    if (!s || !s.isConnected) return
    const left = s.scrollLeft
    const top = s.scrollTop /* read before snapping is restored */
    s.style.removeProperty('scroll-snap-type')
    s.scrollTo({ left, top, behavior: 'smooth' }) /* lands once on the nearest snap point */
  }
  const holdSnap = (s) => {
    if (snapHeld === s) return
    releaseSnap()
    if (getComputedStyle(s).scrollSnapType === 'none') return
    snapHeld = s
    s.style.setProperty('scroll-snap-type', 'none')
  }

  /* scroll one axis of the live app; returns the scroller it moved (or null) */
  const forward = (live, ax, d) => {
    if (!d) return null
    /* nothing to scroll vertically (e.g. over fixed chrome): the feed scroller takes it */
    const s = scrollerFor(live, ax, d) || (ax === 'y' ? source.querySelector('.app-scroll') || source : null)
    if (!s) return null
    holdSnap(s) /* before scrollBy, or a snap container jumps a whole slide */
    s.scrollBy(ax === 'y' ? { top: d } : { left: d })
    return s
  }

  const onWheel = (e) => {
    if (e.ctrlKey) return /* trackpad pinch / ctrl+wheel: let the browser zoom, as on the live half */
    e.preventDefault()
    const unit = wheelUnit(e)
    const dx = e.deltaX * unit
    const dy = e.deltaY * unit
    const live = liveFor(e.target)
    /* like native rails, only the dominant axis scrolls */
    const s = Math.abs(dx) > Math.abs(dy) ? forward(live, 'x', dx) : forward(live, 'y', dy)
    if (!s) return
    clearTimeout(snapTimer)
    snapTimer = setTimeout(releaseSnap, 150) /* also covers trackpad momentum */
  }

  /* vertical wheel on the live half: move the live scroller and its clone in the same task,
     so the hinge doesn't tear. Horizontal rails and snap containers stay native. */
  const onLiveWheel = (e) => {
    if (e.ctrlKey || e.defaultPrevented) return /* pinch-zoom, or the app's own handler */
    const dy = e.deltaY * wheelUnit(e)
    if (!dy || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
    const sc = scrollerFor(e.target, 'y', dy) /* e.target is already a live node */
    if (!sc || getComputedStyle(sc).scrollSnapType !== 'none') return
    e.preventDefault()
    sc.scrollBy({ top: dy, behavior: 'instant' }) /* main thread, ignores scroll-behavior */
    scrolled.add(sc)
    syncScroll(sc)
  }

  let drag = null
  const onPointerDown = (e) => {
    e.preventDefault() /* no focus / text selection on the clone */
    drag = { x: e.clientX, y: e.clientY, moved: false, target: e.target, axis: null }
  }
  const onPointerMove = (e) => {
    if (!drag || !(e.buttons & 1)) return
    const dx = drag.x - e.clientX
    const dy = drag.y - e.clientY
    if (!drag.moved && Math.hypot(dx, dy) < 6) return
    if (!drag.moved) {
      /* keep the drag across the hinge; taps keep their native click target */
      try {
        target.setPointerCapture(e.pointerId)
      } catch {
        /* pointer already gone */
      }
    }
    drag.moved = true
    drag.axis = drag.axis || (Math.abs(dx) > Math.abs(dy) ? 'x' : 'y')
    /* re-resolved every move, so it chains at limits */
    forward(liveFor(drag.target), drag.axis, drag.axis === 'x' ? dx : dy)
    drag.x = e.clientX
    drag.y = e.clientY
  }
  const onCancel = () => {
    drag = null
  }
  const onClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const wasDrag = drag?.moved
    drag = null
    if (wasDrag) return
    let live = liveFor(e.target)
    /* icons resolve to SVG nodes, which have no click(): act on the nearest HTML element */
    while (live && live !== source && !(live instanceof HTMLElement)) live = live.parentNode
    if (!live || live === source) return
    /* the same point on the live element (the halves sit on different planes), so
       coordinate-based handlers such as the scratch card act where the tap landed */
    let x = e.clientX
    let y = e.clientY
    const twin = toClone.get(live)
    if (twin) {
      const cr = twin.getBoundingClientRect()
      const lr = live.getBoundingClientRect()
      x = lr.left + (e.clientX - cr.left) * (lr.width / (cr.width || 1))
      y = lr.top + (e.clientY - cr.top) * (lr.height / (cr.height || 1))
    }
    const opts = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y }
    /* the mouse pointer is always active, so the app's setPointerCapture never throws
       (a touch pointer is already released by click time) */
    const ptr = { pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0 }
    live.dispatchEvent(new PointerEvent('pointerdown', { ...opts, ...ptr, buttons: 1 }))
    /* a cancelled mousedown (e.g. .home-search-back's onMouseDown preventDefault) keeps focus where it is */
    const keepFocus = !live.dispatchEvent(new MouseEvent('mousedown', { ...opts, button: 0, buttons: 1 }))
    live.dispatchEvent(new PointerEvent('pointerup', { ...opts, ...ptr, buttons: 0 }))
    live.dispatchEvent(new MouseEvent('mouseup', opts))
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(live.tagName)) {
      live.focus({ preventScroll: true })
    } else {
      /* a real tap elsewhere blurs the focused field; forwarded events and click() never move focus.
         Blur only: focusing the tapped button would inherit :focus-visible and draw a ring */
      const active = document.activeElement
      if (!keepFocus && active && active !== live && source.contains(active) && !active.contains(live)) active.blur()
      live.click()
    }
    syncCanvases() /* the tap may have drawn on a live canvas */
  }
  const swallow = (e) => e.preventDefault()

  source.addEventListener('wheel', onLiveWheel, { passive: false })
  target.addEventListener('wheel', onWheel, { passive: false })
  target.addEventListener('pointerdown', onPointerDown)
  target.addEventListener('pointermove', onPointerMove)
  target.addEventListener('pointercancel', onCancel)
  target.addEventListener('click', onClick, true)
  target.addEventListener('mousedown', swallow)
  target.addEventListener('dragstart', swallow)
  /* on window: a drag can end off the mirror, and then no click fires */
  window.addEventListener('pointerup', releaseSnap, true)
  window.addEventListener('pointercancel', releaseSnap, true)

  return function destroy() {
    observer.disconnect()
    document.removeEventListener('scroll', onScroll, true)
    source.removeEventListener('input', onInput, true)
    source.removeEventListener('change', onInput, true)
    source.removeEventListener('pointermove', syncCanvases, true)
    source.removeEventListener('pointerup', syncCanvases, true)
    source.removeEventListener('wheel', onLiveWheel)
    target.removeEventListener('wheel', onWheel)
    target.removeEventListener('pointerdown', onPointerDown)
    target.removeEventListener('pointermove', onPointerMove)
    target.removeEventListener('pointercancel', onCancel)
    target.removeEventListener('click', onClick, true)
    target.removeEventListener('mousedown', swallow)
    target.removeEventListener('dragstart', swallow)
    window.removeEventListener('pointerup', releaseSnap, true)
    window.removeEventListener('pointercancel', releaseSnap, true)
    releaseSnap() /* don't leave an inline scroll-snap-type: none on the live app */
    cancelAnimationFrame(raf)
    raf = 0
    canvases.clear()
    target.replaceChildren()
  }
}
