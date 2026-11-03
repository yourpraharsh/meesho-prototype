import { useRef } from 'react'

/**
 * Cart count badge (styles in cart-sot/badge.css) for a .cart-badge-host button. It pops
 * only when the count changes while it is on screen (e.g. Add to Cart on the PDP), not each
 * time a page mounts with items already in the cart. Hidden at 0.
 */
export default function CartBadge({ count }) {
  const mountedCount = useRef(count)
  if (!count) return null
  const pop = count !== mountedCount.current
  return (
    <span key={count} className={`cart-badge${pop ? ' cart-badge--pop' : ''}`} aria-hidden="true">
      {typeof count === 'number' && count > 99 ? '99+' : count}
    </span>
  )
}

/** "Cart", "Cart, 1 item", "Cart, 3 items" for the icon button's accessible name. */
export const cartAriaLabel = (count) => (count ? `Cart, ${count} item${count === 1 ? '' : 's'}` : 'Cart')
