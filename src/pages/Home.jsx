import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const HOME_SCROLL_KEY = 'homeScrollPosition'
import { getProductsForGrid, getProductById } from '../data/products'
import { getSelectedPincode, openTestGate } from '../utils/testPincode'
import { getHeroImageForProduct } from '../data/categoryProductImages'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'
import CartBadge, { cartAriaLabel } from '../components/cart/CartBadge'
import ProductCardGrid from '../components/ProductCardGrid'
import BottomNav from '../components/BottomNav'
import { useCommittedPosture, useCommittedSplit, useUiLayout, useUiTheme } from '../utils/uiTheme'
import { getScrollY, onRootScroll, scrollRootTo } from '../utils/scrollRoot'
import { useScrollChrome } from '../hooks/useScrollChrome'
import { useRailActions } from '../context/RailContext'
import SearchSheet from '../components/search/SearchSheet'
import { HeartFilledIcon, HeartIcon } from '../components/ProductCard'
import { buildMixedFeed, buildCohortFeed } from '../utils/cohortFeed'
import { rememberFeedPosition } from '../utils/pickupVariants'
import { useCohort } from '../context/CohortContext'
import { COHORT_TAGS } from '../constants/cohortNavigation'
import {
  CATEGORY_FALLBACK_IMG,
  COHORT_NAV_ITEMS,
} from '../constants/homeCategoryNav'
import './Home.css'
import '../styles/cart-sot/badge.css'

const IMAGE_FALLBACK = 'https://placehold.co/400x400/e2e8f0/64748b?text=Product'

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
)
const MicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
)
const CameraIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
)
const CartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
)
const PinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
)
const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="m9 18 6-6-6-6"/></svg>
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

export default function Home() {
  const location = useLocation()
  const navigate = useNavigate()
  const returnTo = location.pathname + location.search
  /* the bar opens the search sheet; a submitted search shows on its own page (/search) */
  const searchSheetRef = useRef(null)
  const openSearch = () => searchSheetRef.current?.open('')
  const goToSearch = useCallback((term) => {
    /* Back from the results returns to this feed position (restored on mount below) */
    sessionStorage.setItem(HOME_SCROLL_KEY, String(getScrollY()))
    navigate(`/search?q=${encodeURIComponent(term)}`)
  }, [navigate])
  const [isListening, setIsListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const recognitionRef = useRef(null)

  const startVoiceSearch = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      return
    }

    const launchRecognition = () => {
      const recognition = new SpeechRecognition()
      recognition.lang = 'en-IN'
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      recognitionRef.current = recognition
      setIsListening(true)
      setInterimText('')

      recognition.onresult = (e) => {
        let interim = ''
        let final = ''
        for (const result of e.results) {
          if (result.isFinal) final += result[0].transcript
          else interim += result[0].transcript
        }
        setInterimText(interim || final)
        if (final) {
          goToSearch(final)
          setIsListening(false)
          setInterimText('')
        }
      }

      recognition.onerror = () => { setIsListening(false); setInterimText('') }
      recognition.onend = () => { setIsListening(false); setInterimText('') }

      recognition.start()
    }

    // Explicitly request mic permission so the browser re-prompts if previously denied
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          // Stop the stream immediately — we only needed the permission grant
          stream.getTracks().forEach((t) => t.stop())
          launchRecognition()
        })
        .catch(() => {
          // Permission denied — do nothing, browser already shows its own error UI
        })
    } else {
      launchRecognition()
    }
  }, [isListening, goToSearch])

  const [wishlistOpen, setWishlistOpen] = useState(() => Boolean(location.state?.openWishlist))
  const { has, toggle } = useWishlist()
  const { cohortId, cohort, tagId, setCohortId, setTagId } = useCohort()
  const allProducts = getProductsForGrid()
  const mixedFeed = useMemo(() => buildMixedFeed(allProducts), [allProducts])
  const cohortFeed = useMemo(
    () => (cohortId == null ? mixedFeed : buildCohortFeed(allProducts, cohortId)),
    [allProducts, cohortId, mixedFeed],
  )
  const saveHomeScroll = () => {
    sessionStorage.setItem(HOME_SCROLL_KEY, String(getScrollY()))
  }

  /* cart icon (header + Duo rail): opens the cart; the feed position comes back on return */
  const { count: cartCount } = useCart()
  const goToCart = () => {
    saveHomeScroll()
    navigate('/cart', { state: { returnTo } })
  }

  /* iOS skin: header collapses to the search row on scroll; the tab bar always stays full */
  const [uiTheme] = useUiTheme()
  const isIos = uiTheme === 'ios'
  const [uiLayout] = useUiLayout()
  const committedPosture = useCommittedPosture()
  const committedSplit = useCommittedSplit()
  /* the wide inner display (Open full screen, Book) shows four columns */
  const feedColumns =
    uiLayout === 'duo' &&
    (committedPosture === 'landscape' || committedPosture === 'book') &&
    committedSplit === 'full'
      ? 4
      : 2
  const chrome = useScrollChrome({ enabled: isIos, rootKey: `${uiLayout}:${committedPosture ?? ''}` })

  /* iOS skin (phone and Duo): is the sort / filter row docked under the bar? Only then does
     the collapsed bar's glass extend behind it (one sheet of glass), never as an empty band */
  const homeRef = useRef(null)
  const toolbarRef = useRef(null)
  const [toolbarDocked, setToolbarDocked] = useState(false)
  useEffect(() => {
    if (!isIos) {
      setToolbarDocked(false)
      return undefined
    }
    let raf = 0
    const check = () => {
      raf = 0
      const el = toolbarRef.current
      if (!el) return
      /* offsetTop includes the sticky shift and ignores the device's 3D transforms */
      const stickyTop = parseFloat(getComputedStyle(el).top) || 0
      setToolbarDocked(el.offsetTop - getScrollY() <= stickyTop + 0.5)
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(check)
    }
    check()
    const off = onRootScroll(schedule)
    window.addEventListener('resize', schedule)
    /* the feed also moves without a scroll (a cohort's tag row appearing, images settling),
       so follow the page's own size too */
    const ro = new ResizeObserver(schedule)
    if (homeRef.current) ro.observe(homeRef.current, { box: 'border-box' })
    return () => {
      off()
      window.removeEventListener('resize', schedule)
      ro.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [isIos, uiLayout, committedPosture])
  /* The bar takes 220ms to collapse (glassNav.css). A jump past the dock point (scroll
     restore, fast flick) docks the chips in that same frame, so they only move onto the bar
     once the search pill has risen clear of their row (~80ms in on the ease-out curve) */
  const [collapseSettled, setCollapseSettled] = useState(false)
  useEffect(() => {
    if (!chrome.collapsed) {
      setCollapseSettled(false)
      return undefined
    }
    const t = setTimeout(() => setCollapseSettled(true), 80)
    return () => clearTimeout(t)
  }, [chrome.collapsed])
  /* iPhone Duo folded: header actions live in the right rail */
  useRailActions([
    { id: 'profile', icon: 'profile', label: 'Meesho User', onClick: openTestGate },
    { id: 'translate', icon: 'translate', label: 'Language' },
    { id: 'wishlist', icon: 'heart', label: 'Wishlist', onClick: () => setWishlistOpen(true) },
    { id: 'cart', icon: 'cart', label: 'Cart', badge: cartCount, onClick: goToCart },
  ])

  /* Restore the feed position when coming back from a PDP */
  useEffect(() => {
    const saved = sessionStorage.getItem(HOME_SCROLL_KEY)
    if (saved === null) return
    const y = parseInt(saved, 10)
    if (Number.isNaN(y)) return
    sessionStorage.removeItem(HOME_SCROLL_KEY)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollRootTo(y)
      })
    })
  }, [])
  return (
    <div
      ref={homeRef}
      className={`home has-bottom-nav${toolbarDocked && collapseSettled ? ' home--toolbar-docked' : ''}`}
    >
      {isListening && (
        <div className="voice-modal-overlay" onClick={() => recognitionRef.current?.stop()}>
          <div className="voice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="voice-modal-rings">
              <span className="voice-modal-ring" />
              <span className="voice-modal-ring" />
              <span className="voice-modal-ring" />
              <span className="voice-modal-mic"><MicIcon /></span>
            </div>
            <p className="voice-modal-label">Listening…</p>
            {interimText && <p className="voice-modal-interim">"{interimText}"</p>}
            <button type="button" className="voice-modal-cancel" onClick={() => recognitionRef.current?.stop()}>Cancel</button>
          </div>
        </div>
      )}
      <header className={`home-header${isIos && chrome.collapsed ? ' home-header--collapsed' : ''}`}>
        <div className="home-header-row">
          {/* Entry to the user-testing flow: pincode → COD/non-COD cohort */}
          <button type="button" className="home-user" onClick={openTestGate}>
            <img className="home-avatar" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80" alt="" />
            <span className="home-user-text">
              <span className="home-user-name">Meesho User</span>
            </span>
          </button>
          <div className="home-actions">
            {/* wishlist · cart on both skins (line icons on Android, glass capsules on iOS) */}
            <button type="button" className="home-header-wishlist" aria-label="Wishlist" onClick={() => setWishlistOpen(true)}><HeartIcon /></button>
            <button type="button" className="cart-badge-host" aria-label={cartAriaLabel(cartCount)} onClick={goToCart}>
              <CartIcon />
              <CartBadge count={cartCount} />
            </button>
          </div>
        </div>
        <div className="home-search-wrap">
          <div className="home-search">
            <SearchIcon />
            {/* a trigger only: focusing it opens the sheet, whose own field takes the typing */}
            <input
              readOnly
              onFocus={openSearch}
              onClick={openSearch}
              type="search"
              className="home-search-input"
              placeholder={isIos ? 'Search for ‘Kurtis’' : "Search for 'kurtis'"}
              aria-label="Search products"
            />
            {!isIos && (
              <button type="button" className={`home-search-icon-btn${isListening ? ' home-search-icon-btn--listening' : ''}`} aria-label={isListening ? 'Stop listening' : 'Voice search'} onClick={startVoiceSearch}><MicIcon /></button>
            )}
            {isIos && <span className="home-search-divider" aria-hidden />}
            <button type="button" className="home-search-icon-btn" aria-label="Camera search"><CameraIcon /></button>
          </div>
          {isIos && (
            /* Liquid Glass: the mic floats as its own circle beside the search pill */
            <button type="button" className={`home-search-mic${isListening ? ' home-search-mic--listening' : ''}`} aria-label={isListening ? 'Stop listening' : 'Voice search'} onClick={startVoiceSearch}><MicIcon /></button>
          )}
        </div>
      </header>

      <div className="home-location">
        <span><PinIcon /> Delivering to <strong>{getSelectedPincode() ? `Nagpur - ${getSelectedPincode()}` : 'Bengaluru - 560068'}</strong></span>
        <button type="button"><ChevronRightIcon /></button>
      </div>

      <div className="home-categories">
        <div className="home-categories-row">
          {COHORT_NAV_ITEMS.map((item) => {
            const isActive = cohortId === item.cohortId
            return (
              <button
                key={item.cohortId}
                type="button"
                className={`home-cat-item${isActive ? ' home-cat-item--active' : ''}`}
                aria-pressed={isActive}
                onClick={() => setCohortId(isActive ? null : item.cohortId)}
              >
                <div className="home-cat-icon-wrap">
                  <img
                    className="home-cat-icon"
                    src={item.image}
                    alt=""
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = CATEGORY_FALLBACK_IMG
                    }}
                  />
                </div>
                <span className="home-cat-label">{item.label}</span>
              </button>
            )
          })}
        </div>
        {cohort?.tags?.length > 0 && (
          <div className="home-categories-row home-categories-row--tags">
            {cohort.tags.map((tagKey) => {
              const tag = COHORT_TAGS[tagKey]
              const isActive = tagId === tagKey
              return (
                <button
                  key={tagKey}
                  type="button"
                  className={`home-cat-item home-cat-item--tag${isActive ? ' home-cat-item--active' : ''}`}
                  aria-pressed={isActive}
                  onClick={() => setTagId(isActive ? null : tagKey)}
                >
                  <span className="home-cat-label home-cat-label--tag">{tag.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div ref={toolbarRef} className="home-toolbar">
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

      <ProductCardGrid
        columns={feedColumns}
        className="home-grid"
        products={cohortFeed}
        returnTo={returnTo}
        onNavigate={(product, index) => {
          saveHomeScroll()
          /* per-card A/B variants follow the card's place in the feed as shown (pills, search) */
          rememberFeedPosition(product.product_id, index)
        }}
        isWishlisted={has}
        onWishlistToggle={toggle}
      />

      {wishlistOpen && (
        <WishlistDrawer returnTo={returnTo} onClose={() => setWishlistOpen(false)} />
      )}
      <BottomNav active="home" />
      <SearchSheet ref={searchSheetRef} onSubmit={goToSearch} />
    </div>
  )
}

export function WishlistDrawer({ onClose, returnTo }) {
  const { wishlistIds, toggle, has } = useWishlist()
  const IMAGE_FALLBACK = 'https://placehold.co/400x400/e2e8f0/64748b?text=Product'
  return (
    <div className="wishlist-drawer-backdrop" onClick={onClose} aria-hidden="true">
      <div className="wishlist-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="wishlist-drawer-header">
          <h2>Wishlist</h2>
          <button type="button" className="wishlist-drawer-close" aria-label="Close" onClick={onClose}>&times;</button>
        </div>
        <div className="wishlist-drawer-list">
          {wishlistIds.length === 0 ? (
            <p className="wishlist-drawer-empty">Nothing in your wishlist yet.</p>
          ) : (
            wishlistIds.map((id) => {
              const p = getProductById(id)
              if (!p) return null
              const fromJson = getHeroImageForProduct(p)
              const heroMedia = p.base_media?.hero_image
              const cardSrc = fromJson || (typeof heroMedia === 'string' ? heroMedia : '')
              return (
                <div key={id} className="wishlist-drawer-item">
                  <Link to={`/product/${id}`} state={{ returnTo }} className="wishlist-drawer-item-link" onClick={onClose}>
                    <div className="wishlist-drawer-item-img-wrap">
                      <img src={cardSrc || IMAGE_FALLBACK} alt="" onError={(e) => { e.target.onerror = null; e.target.src = IMAGE_FALLBACK }} />
                    </div>
                    <div className="wishlist-drawer-item-body">
                      <span className="wishlist-drawer-item-title">{p.title}</span>
                      <span className="wishlist-drawer-item-price">₹{p.price_summary?.price ?? '—'}</span>
                    </div>
                  </Link>
                  <button type="button" className={`wishlist-drawer-item-remove ${has(id) ? 'selected' : ''}`} aria-label="Remove from wishlist" onClick={() => toggle(id)}><HeartFilledIcon /></button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
