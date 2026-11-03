import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useScrollActivity } from '../hooks/useScrollActivity'
import { useRail } from '../context/RailContext'
import { postureSplits, postureUsesRail, useCommittedPosture, useCommittedSplit, useUiLayout } from '../utils/uiTheme'
import { NAV_ITEMS } from './BottomNav'
import '../styles/cart-sot/badge.css'
import CartBadge, { cartAriaLabel } from './cart/CartBadge'
import './DuoRail.css'

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }

const ICONS = {
  back: (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden>
      <path d="M10 17L5 12L9.99996 7M5 12H19" {...stroke} strokeWidth={1.5} />
    </svg>
  ),
  translate: (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden>
      <rect x="3" y="3" width="11" height="11" rx="2.5" {...stroke} />
      <rect x="10" y="10" width="11" height="11" rx="2.5" {...stroke} fill="var(--white)" />
      <text x="5.4" y="12" fontSize="8" fontWeight="600" fill="currentColor" fontFamily="system-ui">अ</text>
      <text x="12.6" y="18.8" fontSize="7.5" fontWeight="700" fill="currentColor" fontFamily="system-ui">A</text>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden>
      <circle cx="11" cy="11" r="7" {...stroke} />
      <path d="m20 20-4-4" {...stroke} />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden>
      <path d="M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 7.5 2.5c0 5.4-7.5 10-7.5 10Z" {...stroke} />
    </svg>
  ),
  heartFilled: (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden>
      <path d="M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 7.5 2.5c0 5.4-7.5 10-7.5 10Z" fill="currentColor" />
    </svg>
  ),
  cart: (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden>
      <path d="M3 4h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L20.5 7H6" {...stroke} />
      <circle cx="9.5" cy="19.5" r="1.3" fill="currentColor" />
      <circle cx="17" cy="19.5" r="1.3" fill="currentColor" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden>
      <circle cx="12" cy="8.5" r="3.8" {...stroke} />
      <path d="M4.5 20c.8-3.6 3.9-5.5 7.5-5.5s6.7 1.9 7.5 5.5" {...stroke} />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden>
      <path d="m6 6 12 12M18 6 6 18" {...stroke} />
    </svg>
  ),
  more: (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden>
      <circle cx="6" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="18" cy="12" r="1.6" fill="currentColor" />
    </svg>
  ),
}

const SignalIcon = () => (
  <svg viewBox="0 0 46 46" width="46" height="46" aria-hidden>
    {/* battery ring (open at the bottom), wifi fan, cellular dots */}
    <path d="M9.3 33.4A17 17 0 1 1 36.7 33.4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M14.5 21.5a12 12 0 0 1 17 0M18.3 25.6a6.6 6.6 0 0 1 9.4 0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="23" cy="29.6" r="1.7" fill="currentColor" />
    {/* cellular dots continue the ring's arc across its open bottom */}
    <circle cx="31.93" cy="37.47" r="2" fill="currentColor" />
    <circle cx="26.12" cy="39.71" r="2" fill="currentColor" />
    <circle cx="19.88" cy="39.71" r="2" fill="currentColor" />
    <circle cx="14.07" cy="37.47" r="2" fill="currentColor" />
  </svg>
)

/**
 * Camera hole-punch, time and signal: system UI pinned to the hardware camera.
 * `stand`: the outer display turned landscape puts the camera at the bottom-right corner,
 * where it stands alone (no time, no signal ring).
 * `camera={false}`: the inner display (Open, Book) has only an under-display camera, so
 * the pill shows just the time and the signal ring.
 */
export function DuoStatusCluster({ stand = false, camera = true }) {
  return (
    <div
      className={`duo-rail-status${stand ? ' duo-rail-status--stand' : ''}${camera ? '' : ' duo-rail-status--no-camera'}`}
      aria-hidden
    >
      {camera && <span className="duo-rail-camera" />}
      {!stand && <span className="duo-rail-time">9:41</span>}
      {!stand && (
        <span className="duo-rail-signal">
          <SignalIcon />
        </span>
      )}
    </div>
  )
}

/** Inner display held upright (Portrait, Laptop): time + signal ring at the top-right corner. */
function DuoTopStatus() {
  return (
    <div className="duo-top-status" aria-hidden>
      <span className="duo-rail-time">9:41</span>
      <span className="duo-rail-signal">
        <SignalIcon />
      </span>
    </div>
  )
}

/**
 * iPhone Duo folded outer screen: the vertical rail on the right carries the status
 * cluster (camera hole, time, signal), the page's actions, and — on tab pages — the
 * vertical tab pill that replaces the bottom tab bar.
 */
export default function DuoRail() {
  const [layout] = useUiLayout()
  const posture = useCommittedPosture()
  const split = useCommittedSplit()
  const railOn = layout === 'duo' && postureUsesRail(posture)
  /* split view with the app on the left half: the controls move to the app's left edge for
     the left hand, while the camera / time / signal stay at the device's right edge
     (rendered by DuoDevice) — the camera cannot move */
  const railLeft = postureSplits(posture) && split === 'left'
  /* Stand (Apple): the short screen shows either the toolbar or the tab bar in full, never
     both. "Tab bar compressed" (default): toolbar items at the top, the tab bar folded into
     the current tab's icon above the camera (bottom-right corner). Tapping that icon opens
     the tab bar and compresses the toolbar into "⋯" (back keeps its own button); tapping "⋯"
     swaps them back. */
  const isStand = posture === 'stand'
  const { actions, overlay } = useRail()
  const location = useLocation()
  const navigate = useNavigate()
  const activeTab = location.pathname === '/' ? 'home' : location.pathname === '/orders' ? 'orders' : null

  /* while the feed scrolls the tab pill shrinks to the Meesho mark; it grows back on idle
     (or on a tap of the mark, until the next scroll) */
  const scrolling = useScrollActivity({ enabled: railOn && Boolean(activeTab), rootKey: `${layout}:${posture ?? ''}` })
  const [held, setHeld] = useState(false)
  useEffect(() => {
    if (scrolling) setHeld(false)
  }, [scrolling])
  const [standOpen, setStandOpen] = useState(false)
  /* a page without tabs (or another posture) starts over in the default state */
  useEffect(() => {
    if (!isStand || !activeTab) setStandOpen(false)
  }, [isStand, activeTab])
  const toolbarCompressed = isStand && standOpen && Boolean(activeTab)

  const tabsCollapsed = isStand ? !standOpen : scrolling && !held
  const current = NAV_ITEMS.find((item) => item.id === activeTab)
  const MarkIcon = (isStand && current ? current : NAV_ITEMS[0]).Icon

  if (layout === 'duo' && (posture === 'portrait' || posture === 'laptop')) return <DuoTopStatus />
  if (!railOn) return null

  const tabs = activeTab && (
    <nav
      className={`duo-rail-tabs${tabsCollapsed ? ' duo-rail-tabs--collapsed' : ''}${isStand ? ' duo-rail-tabs--stand' : ''}`}
      aria-label="Primary"
    >
      <button
        type="button"
        className="duo-rail-tab duo-rail-tabs-mark"
        aria-label={isStand && current ? `${current.label}: show tabs` : 'Show navigation'}
        aria-expanded={isStand ? standOpen : undefined}
        tabIndex={tabsCollapsed ? 0 : -1}
        onClick={() => (isStand ? setStandOpen(true) : setHeld(true))}
      >
        <MarkIcon active />
      </button>
      {NAV_ITEMS.map(({ id, label, to, Icon }) => {
        const isActive = id === activeTab
        const go = to && !isActive ? () => navigate(to) : undefined
        return (
          <button
            key={id}
            type="button"
            className={`duo-rail-tab duo-rail-tab--${id}${isActive ? ' duo-rail-tab--active' : ''}`}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            aria-disabled={to ? undefined : true}
            tabIndex={tabsCollapsed ? -1 : undefined}
            onClick={go}
          >
            <Icon active={isActive} />
          </button>
        )
      })}
    </nav>
  )

  const rail = (
    <aside
      className={`duo-rail${overlay ? ' duo-rail--overlay' : ''}${railLeft ? ' duo-rail--left' : ''}${isStand ? ' duo-rail--stand' : ''}${toolbarCompressed ? ' duo-rail--toolbar-compressed' : ''}`}
      aria-label="Navigation rail"
    >
      {/* the camera hole exists only on the outer display (Folded, Stand) */}
      {!railLeft && !isStand && <DuoStatusCluster camera={posture === 'folded'} />}

      {(actions.length > 0 || toolbarCompressed) && (
        <div className="duo-rail-actions">
          {(toolbarCompressed ? actions.filter((a) => a.id === 'back') : actions).map((a) => (
            <button
              key={a.id}
              type="button"
              className={`duo-rail-btn duo-rail-btn--${a.id}${a.active ? ' duo-rail-btn--active' : ''}${a.badge ? ' cart-badge-host' : ''}`}
              aria-label={a.id === 'cart' ? cartAriaLabel(a.badge) : a.badge ? `${a.label} (${a.badge})` : a.label}
              aria-pressed={a.active ? true : undefined}
              onClick={a.onClick}
            >
              {ICONS[a.active && a.icon === 'heart' ? 'heartFilled' : a.icon] ?? ICONS.close}
              {/* count badge (the cart) */}
              <CartBadge count={a.badge} />
            </button>
          ))}
          {toolbarCompressed && (
            <button
              type="button"
              className="duo-rail-btn duo-rail-btn--more"
              aria-label="More actions"
              aria-expanded={false}
              onClick={() => setStandOpen(false)}
            >
              {ICONS.more}
            </button>
          )}
        </div>
      )}

      {isStand ? tabs && <div className="duo-rail-tabslot">{tabs}</div> : tabs}
    </aside>
  )

  if (!isStand) return rail
  /* Stand: the camera is hardware, so it sits above everything the app draws (sheets included) */
  return (
    <>
      {rail}
      <div className="duo-stand-camera">
        <DuoStatusCluster stand />
      </div>
    </>
  )
}
