import { useNavigate } from 'react-router-dom'
import './BottomNav.css'
import homeActiveSrc from '../assets/bottom-nav/home-active.svg'
import homeHouseSrc from '../assets/bottom-nav/home-house.svg'
import homeMSrc from '../assets/bottom-nav/home-m.svg'
import categoriesSrc from '../assets/bottom-nav/categories.svg'
import categoriesActiveSrc from '../assets/bottom-nav/categories-active.svg'
import mallSrc from '../assets/bottom-nav/mall.svg'
import mallActiveSrc from '../assets/bottom-nav/mall-active.svg'
import liveSrc from '../assets/bottom-nav/live.svg'
import liveActiveSrc from '../assets/bottom-nav/live-active.svg'
import ordersSrc from '../assets/bottom-nav/orders.svg'
import ordersActiveSrc from '../assets/bottom-nav/orders-active.svg'

/* SoT bottom-nav icons (Design SoT · 158:20084), exported from Figma. Each tab has its own
   idle (grey line) and selected (filled, coloured) art. Every icon is a 26×26 <svg> that
   places the exported files at their Figma offsets, so the skins' `svg` sizing rules
   (iOS glass bar, Duo rail) keep working unchanged. */
const NavGlyph = ({ parts }) => (
  <svg viewBox="0 0 26 26" width="26" height="26" overflow="visible" aria-hidden>
    {parts.map(([href, x, y, w, h]) => (
      <image key={href} href={href} x={x} y={y} width={w} height={h} preserveAspectRatio="none" />
    ))}
  </svg>
)

const HomeIcon = ({ active }) => (
  <NavGlyph
    parts={
      active
        ? [[homeActiveSrc, 0.5, 2, 25, 21.43]]
        : [
            [homeHouseSrc, 0.967, 2.881, 24.232, 20.28],
            [homeMSrc, 7.548, 11.941, 10.907, 7.24],
          ]
    }
  />
)

const CategoriesIcon = ({ active }) => (
  <NavGlyph parts={[[active ? categoriesActiveSrc : categoriesSrc, 0.928, 2, 24.143, 22]]} />
)

const MallIcon = ({ active }) => (
  <NavGlyph parts={[active ? [mallActiveSrc, 0, 0, 26, 26] : [mallSrc, -0.602, -0.602, 27.204, 27.204]]} />
)

const LiveIcon = ({ active }) => (
  <NavGlyph parts={[[active ? liveActiveSrc : liveSrc, 0.928, 5.697, 24.143, 14.606]]} />
)

const OrdersIcon = ({ active }) => (
  <NavGlyph parts={[[active ? ordersActiveSrc : ordersSrc, 2, 2.501, 22, 20.738]]} />
)

export const NAV_ITEMS = [
  { id: 'home', label: 'Home', to: '/', Icon: HomeIcon },
  { id: 'categories', label: 'Categories', Icon: CategoriesIcon },
  { id: 'mall', label: 'Mall', Icon: MallIcon },
  { id: 'live', label: 'Live Video', Icon: LiveIcon },
  { id: 'orders', label: 'My Orders', to: '/orders', Icon: OrdersIcon },
]

/**
 * App bottom nav. Only Home and My Orders navigate; the rest are placeholders.
 * On the iOS skin it floats as a glass bar and stays full while the feed scrolls.
 */
export default function BottomNav({ active }) {
  const navigate = useNavigate()
  return (
    <>
    <div className="bottom-nav-wash" aria-hidden />
    <nav className="bottom-nav" aria-label="Primary">
      {NAV_ITEMS.map(({ id, label, to, Icon }) => {
        const isActive = id === active
        const tappable = Boolean(to)
        return (
          <button
            key={id}
            type="button"
            className={`bottom-nav-item${isActive ? ' bottom-nav-item--active' : ''}${tappable ? '' : ' bottom-nav-item--static'}`}
            aria-current={isActive ? 'page' : undefined}
            aria-disabled={tappable ? undefined : true}
            onClick={tappable && !isActive ? () => navigate(to) : undefined}
          >
            <Icon active={isActive} />
            <span className="bottom-nav-label">{label}</span>
          </button>
        )
      })}
    </nav>
    </>
  )
}
