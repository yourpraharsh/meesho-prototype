import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { getProductsForGrid } from '../data/products'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'
import CartBadge, { cartAriaLabel } from '../components/cart/CartBadge'
import ProductCardGrid from '../components/ProductCardGrid'
import SearchSheet from '../components/search/SearchSheet'
import { HeartIcon } from '../components/ProductCard'
import { useRailActions } from '../context/RailContext'
import { useCommittedPosture, useCommittedSplit, useUiLayout } from '../utils/uiTheme'
import { buildMixedFeed } from '../utils/cohortFeed'
import { getScrollY, scrollRootTo } from '../utils/scrollRoot'
import { rememberFeedPosition } from '../utils/pickupVariants'
import { searchProducts } from '../utils/search'
import { WishlistDrawer } from './Home'
import './Home.css'
import './SearchResults.css'
import '../styles/cart-sot/badge.css'

const SRP_SCROLL_KEY = 'searchResultsScroll'

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
)
const CartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
)
const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="24" height="24" aria-hidden>
    <path className="glass-chevron" d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path className="glass-arrow" d="M10 17L5 12L9.99996 7M5 12H19" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
  </svg>
)
const SortIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="m7 15 5 5 5-5M7 9l5-5 5 5"/></svg>
)
const ChevronDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="m6 9 6 6 6-6"/></svg>
)
const FilterIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
)

/**
 * Search results (/search?q=): the Home feed's layout without the tab bar. One row up top —
 * back · the keyword in the search bar · wishlist · cart — the sort / filter row under it,
 * then the products: the catalogue's real matches first (each once), then everything else
 * so the page always fills. Tapping the bar reopens the search sheet on the keyword.
 */
export default function SearchResults() {
  const location = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const query = params.get('q') ?? ''
  const returnTo = location.pathname + location.search

  const allProducts = getProductsForGrid()
  const { matches, others } = useMemo(
    () => searchProducts(allProducts, query, buildMixedFeed(allProducts)),
    [allProducts, query],
  )

  const [uiLayout] = useUiLayout()
  const committedPosture = useCommittedPosture()
  const committedSplit = useCommittedSplit()
  /* the wide inner display (Open full screen, Book) shows four columns, as Home does */
  const columns =
    uiLayout === 'duo' &&
    (committedPosture === 'landscape' || committedPosture === 'book') &&
    committedSplit === 'full'
      ? 4
      : 2

  const { has, toggle } = useWishlist()
  const { count: cartCount } = useCart()
  const [wishlistOpen, setWishlistOpen] = useState(false)
  const sheetRef = useRef(null)

  /* Back opens Home, which puts its feed back where the search started (as the PDP's Back
     does) — never a history step that could leave the app after a cold-opened link */
  const goBack = () => navigate('/')
  const goToCart = () => navigate('/cart', { state: { returnTo } })
  const runSearch = (term) => navigate(`/search?q=${encodeURIComponent(term)}`, { replace: true })

  /* a new query starts at the top, so its real matches are in view; coming back from a
     product of this search puts the list back where it was */
  useLayoutEffect(() => {
    let saved = null
    try {
      saved = JSON.parse(sessionStorage.getItem(SRP_SCROLL_KEY) ?? 'null')
    } catch {
      saved = null
    }
    sessionStorage.removeItem(SRP_SCROLL_KEY)
    const y = saved?.q === query ? saved.y : 0
    scrollRootTo(y) /* before paint: no frame at Home's (or the last query's) depth */
    if (y) requestAnimationFrame(() => scrollRootTo(y)) /* again once images have sized */
  }, [query])
  const openProduct = (product, index) => {
    sessionStorage.setItem(SRP_SCROLL_KEY, JSON.stringify({ q: query, y: getScrollY() }))
    rememberFeedPosition(product.product_id, index)
  }

  /* iPhone Duo with the rail: back, wishlist and cart live in the rail */
  useRailActions([
    { id: 'back', icon: 'back', label: 'Back', onClick: goBack },
    { id: 'wishlist', icon: 'heart', label: 'Wishlist', onClick: () => setWishlistOpen(true) },
    { id: 'cart', icon: 'cart', label: 'Cart', badge: cartCount, onClick: goToCart },
  ])

  const gridProps = {
    columns,
    className: 'home-grid',
    returnTo,
    isWishlisted: has,
    onWishlistToggle: toggle,
  }

  return (
    <div className="srp">
      <div className="srp-top">
        <header className="srp-header">
          <button type="button" className="srp-back" aria-label="Back" onClick={goBack}>
            <BackIcon />
          </button>
          <button type="button" className="home-search srp-search" aria-label={`Search: ${query}`} onClick={() => sheetRef.current?.open(query)}>
            <SearchIcon />
            <span className="srp-search-text">{query}</span>
          </button>
          <div className="home-actions srp-actions">
            <button type="button" className="home-header-wishlist" aria-label="Wishlist" onClick={() => setWishlistOpen(true)}><HeartIcon /></button>
            <button type="button" className="cart-badge-host" aria-label={cartAriaLabel(cartCount)} onClick={goToCart}>
              <CartIcon />
              <CartBadge count={cartCount} />
            </button>
          </div>
        </header>
        <div className="home-toolbar srp-toolbar">
          <button type="button" className="home-toolbar-btn">
            <SortIcon /> <span>Sort</span>
          </button>
          <button type="button" className="home-toolbar-btn">
            <span>Category</span> <ChevronDownIcon />
          </button>
          <button type="button" className="home-toolbar-btn">
            <span>Price</span> <ChevronDownIcon />
          </button>
          <button type="button" className="home-toolbar-btn">
            <FilterIcon /> <span>Filters</span>
          </button>
        </div>
      </div>

      {matches.length > 0 && (
        <ProductCardGrid
          {...gridProps}
          products={matches}
          onNavigate={openProduct}
        />
      )}
      {others.length > 0 && (
        <>
          {matches.length > 0 && <h2 className="srp-more">More products you may like</h2>}
          <ProductCardGrid
            {...gridProps}
            products={others}
            onNavigate={(product, index) => openProduct(product, matches.length + index)}
          />
        </>
      )}

      <SearchSheet ref={sheetRef} onSubmit={runSearch} />
      {wishlistOpen && <WishlistDrawer returnTo={returnTo} onClose={() => setWishlistOpen(false)} />}
    </div>
  )
}
