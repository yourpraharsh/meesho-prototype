import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import { useState, useMemo, useRef, useCallback, useEffect, useLayoutEffect } from 'react'
import { getProductById, getProductsForGrid, getProductsByCategory } from '../data/products'
import { getHeroImageForProduct, getCategoryImageList } from '../data/categoryProductImages'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'
import CartBadge, { cartAriaLabel } from '../components/cart/CartBadge'
import { useToast } from '../context/ToastContext'
import { useRailActions } from '../context/RailContext'
import { scrollRootTo } from '../utils/scrollRoot'
import { useCommittedPosture, useCommittedSplit, useUiLayout } from '../utils/uiTheme'
import PdpSimilarStrip from '../components/pdp/PdpSimilarStrip'
import sotBackIcon from '../assets/pdp-sot/top/appbar-back.svg'
import sotLanguageIcon from '../assets/pdp-sot/top/appbar-language.svg'
import sotSearchIcon from '../assets/pdp-sot/top/appbar-search.svg'
import sotWishlistIcon from '../assets/pdp-sot/top/appbar-wishlist.svg'
import sotCartIcon from '../assets/pdp-sot/top/appbar-cart.svg'
import sotMoreLikeIcon from '../assets/pdp-sot/top/more-like-this.svg'
import BuyNowSheet, { getOutOfStockIds } from '../components/BuyNowSheet'
import ProductCardGrid from '../components/ProductCardGrid'
import {
  getSoldByInfo,
  getProductDetailRows,
  productDetailGlobalIndex,
} from '../utils/pdpSections'
import {
  getBuyNowFunctionalLayer,
  getOptionPrice,
  resolveDisplayMrp,
  resolveDisplayPrice,
} from '../utils/pdpPricing'
import { buildCheckoutState, isBuyNowSizeSelectionValid } from '../utils/checkoutConfig'
import { isGalleryLookLayer, shouldShowPdpVisualLayer } from '../utils/vskuGalleryLooks'
import { getPdpFlavour } from '../utils/pdpFlavour'
import { PdpPriceTags, PdpQualityRow, PdpTitleRow } from '../components/pdp/PdpTags'
import PdpFastDeliveryBand from '../components/pdp/PdpFastDeliveryBand'
import PdpDeliveryAddressRow from '../components/pdp/PdpDeliveryAddressRow'
import pdpsMarkerCod from '../assets/pdp-sot/bottom/marker-cod.svg'
import pdpsMarkerReturns from '../assets/pdp-sot/bottom/marker-returns.svg'
import pdpsMarkerLowestPrice from '../assets/pdp-sot/bottom/marker-lowest-price.svg'
import pdpsCartIcon from '../assets/pdp-sot/bottom/cta-cart.svg'
import pdpsBuyNowIcon from '../assets/pdp-sot/bottom/cta-buy-now.svg'
import pdpsHlChevronDown from '../assets/pdp-sot/highlights/chevron-down.svg'
import pdpsHlHeart from '../assets/pdp-sot/highlights/heart-outline.svg'
import pdpsHlStar from '../assets/pdp-sot/highlights/rating-star.svg'
import AddressPicker from '../components/review/AddressPicker'
import { useCheckoutAddress } from '../components/review/useCheckoutAddress'
import reviewsSummaryStar from '../assets/pdp-sot/reviews/summary-star.svg'
import reviewsChipStar from '../assets/pdp-sot/reviews/review-chip-star.svg'
import reviewsTagSuccess from '../assets/pdp-sot/reviews/tag-success.svg'
import reviewsTagCross from '../assets/pdp-sot/reviews/tag-cross.svg'
import reviewsHeaderDot from '../assets/pdp-sot/reviews/header-dot.svg'
import reviewsHelpfulOutline from '../assets/pdp-sot/reviews/helpful-outline.svg'
import reviewsHelpfulFilled from '../assets/pdp-sot/reviews/helpful-filled.svg'
import reviewsViewAllChevron from '../assets/pdp-sot/reviews/view-all-chevron.svg'
import {
  formatPdpAddressSnippet,
  getDeliveryEtaForProductPromise,
  getDeliveryPromiseForPdp,
} from '../utils/deliveryPromise'
import '../components/VskuPills.css'
import './ProductDetails.css'
import pdpsSizeChevronIcon from '../assets/pdp-sot/size/chevron-down.svg'
import pdpsSoldByStoreIcon from '../assets/pdp-sot/size/soldby-store.svg'
import pdpsSoldByStarIcon from '../assets/pdp-sot/size/soldby-rating-star.svg'
import pdpsSoldByDotIcon from '../assets/pdp-sot/size/soldby-dot.svg'
import pdpsSoldByTrustedBadge from '../assets/pdp-sot/size/soldby-m-trusted.svg'
import '../styles/pdp-sot/top.css'
import '../styles/pdp-sot/info.css'
import '../styles/pdp-sot/size.css'
import '../styles/pdp-sot/highlights.css'
import '../styles/pdp-sot/reviews.css'
import '../styles/pdp-sot/bottom.css'
import '../styles/cart-sot/badge.css'
import pdpsFavoriteIcon from '../assets/pdp-sot/info/favorite.svg'
import pdpsShareIcon from '../assets/pdp-sot/info/share.svg'

const IMAGE_FALLBACK = 'https://placehold.co/400x400/e2e8f0/64748b?text=Product'

const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path className="glass-chevron" d="m15 18-6-6 6-6"/><path className="glass-arrow" d="M10 17L5 12L9.99996 7M5 12H19" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" /></svg>
)
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
)
const HeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
)
const HeartFilledIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
)
const CartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
)
const ShareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
)
const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
)
const ChevronDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="m6 9 6 6 6-6"/></svg>
)
const ViewSimilarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
)
const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="m9 18 6-6-6-6"/></svg>
)
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M20 6 9 17l-5-5"/></svg>
)
const CrossIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M18 6 6 18M6 6l12 12"/></svg>
)
const ThumbsUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
)

function getInitialSelectedOptions(layers, categoryId) {
  const out = {}
  layers?.forEach((layer) => {
    // Shoes — no color axis; size/pack optional on PDP
    if (categoryId === 'mens_shoes' && layer.layer_type === 'VISUAL') return
    if (layer.layer_type === 'VISUAL' && isGalleryLookLayer(layer)) return
    const isFunctional = layer.layer_type === 'FUNCTIONAL' || layer.layer_type === 'VALUE'
    if (isFunctional && layer.options?.length !== 1) return
    const defaultId = layer.default_option_id
    const option = defaultId
      ? layer.options?.find((o) => o.option_id === defaultId)
      : layer.options?.[0]
    if (option) out[layer.axis_id] = option.option_id
  })
  return out
}

/** Hero image priority: VALUE.selected.image.asset_ref → VISUAL.selected.image.asset_ref → base_media.hero_image. */
function resolveHeroAssetRef(product, selectedOptions) {
  const layers = product?.vsku?.layers ?? []
  const valueLayer = layers.find((l) => l.layer_type === 'VALUE')
  const valueOptId = valueLayer && selectedOptions[valueLayer.axis_id]
  const valueOpt = valueLayer?.options?.find((o) => o.option_id === valueOptId)
  if (valueOpt?.image?.asset_ref) return valueOpt.image.asset_ref
  const visualLayer = layers.find((l) => l.layer_type === 'VISUAL' && !isGalleryLookLayer(l))
  const visualOptId = visualLayer && selectedOptions[visualLayer.axis_id]
  const visualOpt = visualLayer?.options?.find((o) => o.option_id === visualOptId)
  if (visualOpt?.image?.asset_ref) return visualOpt.image.asset_ref
  const base = product?.base_media?.hero_image
  if (base && typeof base === 'object' && base.asset_ref) return base.asset_ref
  return null
}

function resolveHeroUrl(product, selectedOptions) {
  const ref = resolveHeroAssetRef(product, selectedOptions)
  if (ref) return ''
  const base = product?.base_media?.hero_image
  if (typeof base === 'string') return base
  return ''
}

/** Returns Set of functional option_ids that are out of stock for the current visual selection (context retention). */
function getOutOfStockFunctionalOptionIds(product, selectedOptions) {
  const oos = new Set()
  if (!product?.outOfStock) return oos
  const visualLayers = (product.vsku?.layers ?? []).filter((l) => l.layer_type === 'VISUAL' && !isGalleryLookLayer(l))
  visualLayers.forEach((vLayer) => {
    const selectedVisualId = selectedOptions[vLayer.axis_id]
    if (!selectedVisualId) return
    const map = product.outOfStock[vLayer.axis_id]
    if (!map) return
    const list = map[selectedVisualId]
    if (Array.isArray(list)) list.forEach((id) => oos.add(id))
  })
  return oos
}

export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const product = getProductById(id)

  /* Back opens the page the product came from when that was a search (it restores its own
     scroll), otherwise Home; checkout's Back carries the same returnTo through */
  const searchReturn = location.state?.returnTo?.startsWith('/search') ? location.state.returnTo : null
  const handleBack = useCallback(() => {
    navigate(searchReturn ?? '/')
  }, [navigate, searchReturn])

  const layers = product?.vsku?.layers ?? []
  const functionalLayers = useMemo(
    () => layers.filter(
      (l) => (l.layer_type === 'FUNCTIONAL' || l.layer_type === 'VALUE') && (l.options?.length ?? 0) > 1,
    ),
    [layers],
  )
  const visualLayers = useMemo(
    () =>
      layers.filter(
        (l) =>
          l.layer_type === 'VISUAL' &&
          (l.options?.length ?? 0) > 1 &&
          !isGalleryLookLayer(l) &&
          shouldShowPdpVisualLayer(product, l),
      ),
    [layers, product],
  )
  const [selectedOptions, setSelectedOptions] = useState(() =>
    getInitialSelectedOptions(layers, product?.categoryId),
  )
  const [heroIndex, setHeroIndex] = useState(0)
  const [showBuyNowSheet, setShowBuyNowSheet] = useState(false)
  /* which CTA opened the size sheet: 'buy' (Buy Now → review) or 'cart' (Add to Cart) */
  const [sheetCta, setSheetCta] = useState('buy')
  const { items: cartItems, count: cartCount, addItem: addCartItem } = useCart()
  const { show: showToast } = useToast()
  const [sectionShimmerLayer, setSectionShimmerLayer] = useState(null)
  const [sectionOosLabel, setSectionOosLabel] = useState(null)
  const prevColorRef = useRef(null)
  const skipOosToastRef = useRef(false)

  const setOption = useCallback((axisId, optionId, layersRef) => {
    setSelectedOptions((prev) => {
      const next = { ...prev, [axisId]: optionId }
      return next
    })
    const visualAxis = layersRef?.find((l) => l.layer_type === 'VISUAL' && !isGalleryLookLayer(l))?.axis_id
    if (axisId === visualAxis) {
      setSectionShimmerLayer(null)
      setSectionOosLabel(null)
    }
  }, [])

  useEffect(() => {
    scrollRootTo(0)
    setSelectedOptions(getInitialSelectedOptions(layers, product?.categoryId))
    setHeroIndex(0)
    setSectionShimmerLayer(null)
    setSectionOosLabel(null)
    prevColorRef.current = null
    skipOosToastRef.current = false
    const el = heroScrollRef.current
    if (el) el.scrollLeft = 0
  }, [id])

  const buyNowFunctionalLayer = useMemo(() => getBuyNowFunctionalLayer(layers), [layers])
  const buyNowOosIds = useMemo(
    () => getOutOfStockIds(product, selectedOptions),
    [product, selectedOptions],
  )

  const goToReview = useCallback(
    (checkout) => {
      setShowBuyNowSheet(false)
      /* Carry query params (cohort, pv variant override) into the review route. */
      navigate(
        { pathname: `/product/${id}/review`, search: location.search },
        {
          state: {
            returnTo: location.state?.returnTo,
            checkout,
          },
        },
      )
    },
    [id, navigate, location.search, location.state?.returnTo],
  )

  const handleBuyNow = useCallback(() => {
    if (!product) return
    if (isBuyNowSizeSelectionValid(buyNowFunctionalLayer, selectedOptions, buyNowOosIds)) {
      goToReview(
        buildCheckoutState(product, layers, selectedOptions, 'all_easy', buyNowFunctionalLayer),
      )
      return
    }
    setSheetCta('buy')
    setShowBuyNowSheet(true)
  }, [product, buyNowFunctionalLayer, selectedOptions, buyNowOosIds, goToReview, layers])

  /* Cart icons (app bar, Duo rail) and the toast's "View Cart" */
  const goToCart = useCallback(() => {
    navigate('/cart', { state: { returnTo: `${location.pathname}${location.search}` } })
  }, [navigate, location.pathname, location.search])

  /* once this product is in the cart, "Add to Cart" becomes "View Cart" (back to Add to
     Cart if it is removed there) */
  const inCart = Boolean(product) && cartItems.some((it) => it.productId === product.product_id)

  /* Add to Cart puts the same checkout state Buy Now would carry into the cart (qty 1;
     adding the same size + return type again bumps that line) and confirms with a
     snackbar above the CTA bar (68px) */
  const addToCart = useCallback(
    (checkout) => {
      setShowBuyNowSheet(false)
      addCartItem({ productId: product.product_id, ...checkout, qty: 1 })
      showToast({ text: 'Added to cart', offset: 76, duration: 2000 })
    },
    [product, addCartItem, showToast],
  )

  /* same size check as Buy Now: a valid selection goes straight in, otherwise the size
     sheet opens with an "Add to Cart" CTA */
  const handleAddToCart = useCallback(() => {
    if (!product) return
    if (isBuyNowSizeSelectionValid(buyNowFunctionalLayer, selectedOptions, buyNowOosIds)) {
      addToCart(
        buildCheckoutState(product, layers, selectedOptions, 'all_easy', buyNowFunctionalLayer),
      )
      return
    }
    setSheetCta('cart')
    setShowBuyNowSheet(true)
  }, [product, buyNowFunctionalLayer, selectedOptions, buyNowOosIds, addToCart, layers])

  useEffect(() => {
    if (!location.state?.openBuyNow || !product) return
    const { openBuyNow: _omit, ...restState } = location.state ?? {}
    navigate(location.pathname, { replace: true, state: restState })
    handleBuyNow()
  }, [location.state?.openBuyNow, product, location.pathname, navigate, handleBuyNow])

  const displayPrice = useMemo(() => resolveDisplayPrice(product, selectedOptions), [product, selectedOptions])
  const displayMrp = useMemo(() => resolveDisplayMrp(product, selectedOptions), [product, selectedOptions])
  const discountPercent = useMemo(() => {
    if (displayMrp == null || displayMrp <= 0) return null
    return Math.round((1 - displayPrice / displayMrp) * 100)
  }, [displayPrice, displayMrp])
  const pdpFlavour = useMemo(
    () =>
      product
        ? getPdpFlavour(product, {
            displayPrice,
            displayMrp,
            discountPercent,
            plpIndex: location.state?.plpIndex,
          })
        : null,
    [product, displayPrice, displayMrp, discountPercent, location.state?.plpIndex],
  )

  const ratingValue = pdpFlavour?.rating ?? Math.min(4.9, Number(product?.rating?.value ?? 0))
  const ratingCount = pdpFlavour?.ratingCountRaw ?? product?.rating?.count ?? 0
  const writtenReviewCount =
    product?.writtenReviews ??
    product?.viewAllReviewsCount ??
    Math.round(ratingCount * 0.18)

  const {
    address,
    addressId,
    showPicker,
    setShowPicker,
    selectAddress,
    saveAddress,
    addresses,
  } = useCheckoutAddress('home')

  const deliveryPromise = useMemo(
    () => (product ? getDeliveryPromiseForPdp(product, address?.pin) : null),
    [product, address?.pin],
  )

  const deliveryEta = useMemo(
    () => (product ? getDeliveryEtaForProductPromise(product, address?.pin) : null),
    [product, address?.pin],
  )

  const addressSnippet = useMemo(() => formatPdpAddressSnippet(address), [address])

  const openAddressPicker = useCallback(() => setShowPicker(true), [setShowPicker])

  const categoryImageList = useMemo(() => getCategoryImageList(product) || [], [product])

  const oosSet = useMemo(() => getOutOfStockFunctionalOptionIds(product, selectedOptions), [product, selectedOptions])
  const stickyOosOption = useMemo(() => {
    const funcLayers = layers.filter((l) => l.layer_type === 'FUNCTIONAL' || l.layer_type === 'VALUE')
    for (const layer of funcLayers) {
      const selectedId = selectedOptions[layer.axis_id]
      if (selectedId != null && oosSet.has(selectedId)) {
        const opt = layer.options?.find((o) => o.option_id === selectedId)
        if (opt) return { label: opt.label }
      }
    }
    return null
  }, [layers, selectedOptions, oosSet])

  const visualAxisId = useMemo(
    () => layers.find((l) => l.layer_type === 'VISUAL' && !isGalleryLookLayer(l))?.axis_id ?? null,
    [layers],
  )
  const isStickyOnlyOosColor = useMemo(() => {
    const currentColorId = selectedOptions[visualAxisId]
    if (!currentColorId || !product?.outOfStock?.color) return false
    const oosColorIds = Object.keys(product.outOfStock.color)
    const shimmerIds = product.outOfStockShimmerColorIds ?? []
    return oosColorIds.includes(currentColorId) && !shimmerIds.includes(currentColorId)
  }, [product?.outOfStock?.color, product?.outOfStockShimmerColorIds, selectedOptions, visualAxisId])

  useEffect(() => {
    if (!visualAxisId) return
    const currentColorId = selectedOptions[visualAxisId]
    const colorJustChanged = prevColorRef.current !== null && currentColorId !== prevColorRef.current
    prevColorRef.current = currentColorId
    skipOosToastRef.current = false

    if (!colorJustChanged || !stickyOosOption) return
    const shimmerIds = product?.outOfStockShimmerColorIds ?? []
    if (!shimmerIds.includes(currentColorId)) return

    const funcLayers = layers.filter((l) => l.layer_type === 'FUNCTIONAL' || l.layer_type === 'VALUE')
    for (const layer of funcLayers) {
      const selectedId = selectedOptions[layer.axis_id]
      if (selectedId == null || !oosSet.has(selectedId)) continue
      const oosOpt = layer.options?.find((o) => o.option_id === selectedId)
      const nextOpt = layer.options?.find((o) => !oosSet.has(o.option_id))
      if (nextOpt) {
        setSelectedOptions((prev) => ({ ...prev, [layer.axis_id]: nextOpt.option_id }))
        setSectionShimmerLayer(layer.axis_id)
        setSectionOosLabel(oosOpt?.label ?? stickyOosOption.label)
      }
      break
    }
  }, [product?.outOfStockShimmerColorIds, selectedOptions, stickyOosOption, visualAxisId, layers, oosSet])

  const handleVskuOptionClick = useCallback((layer, opt, isOos) => {
    if (layer.layer_type !== 'FUNCTIONAL' && layer.layer_type !== 'VALUE') {
      setOption(layer.axis_id, opt.option_id, layers)
      return
    }
    if (isOos) {
      if (isStickyOnlyOosColor) {
        setOption(layer.axis_id, opt.option_id, layers)
        return
      }
      const nextOpt = layer.options?.find((o) => !oosSet.has(o.option_id))
      if (nextOpt) setOption(layer.axis_id, nextOpt.option_id, layers)
      setSectionShimmerLayer(layer.axis_id)
      setSectionOosLabel(opt.label)
      skipOosToastRef.current = true
    } else {
      setOption(layer.axis_id, opt.option_id, layers)
      if (sectionShimmerLayer === layer.axis_id) {
        setSectionShimmerLayer(null)
        setSectionOosLabel(null)
      }
    }
  }, [layers, oosSet, setOption, sectionShimmerLayer, isStickyOnlyOosColor])

  const selectedVisualImageIndex = useMemo(() => {
    const visualLayers = layers.filter((l) => l.layer_type === 'VISUAL' && !isGalleryLookLayer(l))
    const layer = visualLayers[0]
    if (!layer?.options?.length) return null
    const selectedId = selectedOptions[layer.axis_id]
    const idx = layer.options.findIndex((o) => o.option_id === selectedId)
    return idx >= 0 ? idx : null
  }, [layers, selectedOptions])

  const heroImages = useMemo(() => {
    const funcLayer = layers.find((l) => l.layer_type === 'FUNCTIONAL' || l.layer_type === 'VALUE')
    const selectedFuncId = funcLayer && selectedOptions[funcLayer.axis_id]
    const selectedFuncOpt = funcLayer?.options?.find((o) => o.option_id === selectedFuncId)
    const functionalHeroUrl = selectedFuncOpt?.delta?.heroImage
    if (functionalHeroUrl) {
      return [functionalHeroUrl]
    }
    const visualLayer = layers.find((l) => l.layer_type === 'VISUAL' && !isGalleryLookLayer(l))
    const selectedId = visualLayer && selectedOptions[visualLayer.axis_id]
    const selectedOpt = visualLayer?.options?.find((o) => o.option_id === selectedId)
    if (selectedOpt?.delta?.heroImage) {
      const gallery = selectedOpt.delta.gallery ?? []
      return [selectedOpt.delta.heroImage, ...gallery].filter(Boolean)
    }
    const productForGallery = selectedOpt?.variant_product_id
      ? getProductById(selectedOpt.variant_product_id)
      : product
    const hero = productForGallery?.hero_image_url || productForGallery?.base_media?.hero_image
    const galleryUrls = productForGallery?.gallery || []
    let list = []
    const allPhotos = hero ? [hero, ...galleryUrls].filter(Boolean) : []
    if (allPhotos.length > 0) {
      list = allPhotos
    } else {
      const fromVisualUrls = visualLayer?.options?.map((o) => o.image?.url).filter(Boolean)
      if (fromVisualUrls?.length) {
        list = fromVisualUrls
      } else if (categoryImageList.length > 0 && selectedVisualImageIndex != null) {
        const src = categoryImageList[selectedVisualImageIndex % categoryImageList.length]
        if (src) list = [src]
      }
      if (list.length === 0) {
        const fromJson = getHeroImageForProduct(product)
        if (fromJson) list = [fromJson]
      }
      if (list.length === 0) {
        const url = resolveHeroUrl(product, selectedOptions)
        list = url ? [url] : [IMAGE_FALLBACK]
      }
    }
    if (list.length > 0 && selectedOpt?.image?.url) {
      const selectedUrl = selectedOpt.image.url
      const rest = list.filter((u) => u !== selectedUrl)
      return [selectedUrl, ...rest]
    }
    return list
  }, [product, selectedOptions, categoryImageList, selectedVisualImageIndex, layers])

  const heroImg = useMemo(() => {
    const firstUrl = heroImages[0]
    if (firstUrl) return firstUrl
    return getHeroImageForProduct(product) || resolveHeroUrl(product, selectedOptions) || IMAGE_FALLBACK
  }, [heroImages, product, selectedOptions])

  useEffect(() => {
    setHeroIndex(0)
    const el = heroScrollRef.current
    if (el) el.scrollLeft = 0
  }, [selectedOptions])

  const { has, toggle } = useWishlist()
  /* iPhone Duo folded: the PDP has no top bar — its actions live in the right rail */
  useRailActions([
    { id: 'back', icon: 'back', label: 'Back', onClick: handleBack },
    { id: 'translate', icon: 'translate', label: 'Language' },
    { id: 'search', icon: 'search', label: 'Search' },
    { id: 'wishlist', icon: 'heart', label: has(product?.product_id) ? 'Remove from wishlist' : 'Add to wishlist', active: has(product?.product_id), onClick: () => product?.product_id && toggle(product.product_id) },
    { id: 'cart', icon: 'cart', label: 'Cart', badge: cartCount, onClick: goToCart },
  ])
  const heroScrollRef = useRef(null)
  const alsoViewedRef = useRef(null)
  const scrollToAlsoViewed = useCallback(() => {
    alsoViewedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])
  const handleHeroScroll = useCallback(() => {
    const el = heroScrollRef.current
    if (!el) return
    const index = Math.round(el.scrollLeft / el.offsetWidth)
    setHeroIndex(Math.min(index, heroImages.length - 1))
  }, [heroImages.length])
  const scrollToHeroIndex = useCallback((i) => {
    const el = heroScrollRef.current
    if (!el) return
    el.scrollTo({ left: i * el.offsetWidth, behavior: 'smooth' })
    setHeroIndex(i)
  }, [])

  /* iPhone Duo inner display (Open full screen, Book): website-style two-column PDP.
     In Book the columns meet exactly at the hinge (Apple: content splits into regions there). */
  const [uiLayout] = useUiLayout()
  const committedPosture = useCommittedPosture()
  const committedSplit = useCommittedSplit()
  const isWebPdp =
    uiLayout === 'duo' &&
    (committedPosture === 'landscape' || committedPosture === 'book') &&
    committedSplit === 'full'

  /* the hero remounts when the layout switches between phone and web: put the new
     scroller back on the current image */
  useLayoutEffect(() => {
    const el = heroScrollRef.current
    if (el) el.scrollLeft = heroIndex * el.offsetWidth
  }, [isWebPdp]) // eslint-disable-line react-hooks/exhaustive-deps

  const alsoViewed = useMemo(() => {
    const sameCategory = product?.category
      ? getProductsByCategory(product.category).filter((p) => p.product_id !== id)
      : []
    const needed = isWebPdp ? 24 : 6 /* the web layout fills the screen with a 4-up grid */
    if (sameCategory.length >= needed) return sameCategory.slice(0, needed)
    const rest = getProductsForGrid().filter(
      (p) => p.product_id !== id && !sameCategory.some((s) => s.product_id === p.product_id),
    )
    return [...sameCategory, ...rest].slice(0, needed)
  }, [product?.category, id, isWebPdp])

  if (!product) {
    return (
      <div className="pdp">
        <header className="pdp-header">
          <button type="button" className="pdp-back" onClick={handleBack} aria-label="Back"><BackIcon /></button>
          <span>Product not found</span>
        </header>
        <p style={{ padding: 16 }}>No product with this ID. <button type="button" onClick={handleBack}>Go back</button></p>
      </div>
    )
  }

  const soldBy = getSoldByInfo(product)
  const productDetailRows = getProductDetailRows(product, productDetailGlobalIndex(product.product_id))

  const heroBlock = (
      <div className="pdp-hero">
        <div ref={heroScrollRef} className="pdp-hero-scroll" onScroll={handleHeroScroll} role="region" aria-label="Product images">
          {heroImages.map((src, i) => (
            <div key={i} className="pdp-hero-slide">
              <img
                src={src}
                alt={`${product.title} ${i + 1}`}
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = IMAGE_FALLBACK
                }}
              />
            </div>
          ))}
        </div>
        <div className="pdp-hero-row">
          <div className="pdp-dots">
            {heroImages.map((_, i) => (
              <button key={i} type="button" className={`pdp-dot ${i === heroIndex ? 'active' : ''}`} aria-label={`Image ${i + 1}`} onClick={() => scrollToHeroIndex(i)} />
            ))}
          </div>
          <button type="button" className="pdp-more-like" onClick={scrollToAlsoViewed}>
            <img className="pdps-more-like-icon" src={sotMoreLikeIcon} alt="" /> More Like This
          </button>
        </div>
      </div>
  )
  const infoHeadBlock = (
    <div className="pdps-info">
        <PdpTitleRow
          title={product.title}
          isMall={pdpFlavour?.isMall}
          flavour={pdpFlavour}
          actions={
            <div className="pdp-wish-share">
              <button type="button" className={`pdp-wish-share-btn ${has(product?.product_id) ? 'selected' : ''}`} aria-label={has(product?.product_id) ? 'Remove from wishlist' : 'Add to wishlist'} onClick={() => product?.product_id && toggle(product.product_id)}>{has(product?.product_id) ? <HeartFilledIcon /> : <img className="pdps-action-icon pdps-action-icon--wishlist" src={pdpsFavoriteIcon} alt="" aria-hidden />}<span className="pdp-wish-share-label">Wishlist</span></button>
              <button type="button" className="pdp-wish-share-btn" aria-label="Share"><img className="pdps-action-icon pdps-action-icon--share" src={pdpsShareIcon} alt="" aria-hidden /><span className="pdp-wish-share-label">Share</span></button>
            </div>
          }
        />
        {pdpFlavour && (
          <>
            <PdpPriceTags flavour={pdpFlavour} productId={product.product_id} />
            <PdpQualityRow flavour={pdpFlavour} />
          </>
        )}
        {/* the "N Day Delivery" promise row is no longer shown under the price */}
    </div>
  )
  const variantBlocks = (
    <>
        {/* the colour picker is no longer shown on the product page */}
        {functionalLayers.length > 0 && (
          <div className="pdp-vsku pdp-vsku--in-info pdps-size">
            {functionalLayers.map((layer) => {
              const selectedId = selectedOptions[layer.axis_id]
              const selectedOpt = selectedId ? layer.options?.find((o) => o.option_id === selectedId) : null
              const selectedIsOosInThisColor = selectedId != null && oosSet.has(selectedId)
              const isShimmerSection = sectionShimmerLayer === layer.axis_id
              const showSectionOosMsg = isShimmerSection && sectionOosLabel
              return (
                <div key={layer.axis_id} className={`pdp-vsku-block ${isShimmerSection ? 'pdp-vsku-block--shimmer' : ''}`}>
                  <div className="pdp-vsku-title">Select {layer.axis_label}</div>
                  <div className="pdp-vsku-options-wrap">
                    <div className="pdp-vsku-options">
                      {layer.options?.map((opt) => {
                        const isSelected = opt.option_id === selectedId
                        const isOos = oosSet.has(opt.option_id)
                        const price = getOptionPrice(product, selectedOptions, layer, opt)
                        /* SoT: a size unavailable in this selection but sold in other options reads "N Options"; one sold nowhere is crossed out */
                        const otherOptionsCount = isOos
                          ? (layers.find((l) => l.axis_id === visualAxisId)?.options ?? []).filter(
                              (v) =>
                                v.option_id !== selectedOptions[visualAxisId] &&
                                !(product.outOfStock?.[visualAxisId]?.[v.option_id] ?? []).includes(opt.option_id),
                            ).length
                          : 0
                        return (
                          <div key={opt.option_id} className="pdp-vsku-option-wrap">
                            <button
                              type="button"
                              className={`pdp-vsku-pill ${isSelected ? 'selected' : ''} ${isOos ? 'oos' : ''} ${isOos && otherOptionsCount === 0 ? 'pdps-pill--crossed' : ''}`}
                              aria-pressed={isSelected}
                              onClick={() => handleVskuOptionClick(layer, opt, isOos)}
                            >
                              {opt.value_badge && <span className="badge">{opt.value_badge}</span>}
                              {opt.label}
                            </button>
                            {!isOos && <span className="pdp-vsku-pill-price">₹{price}</span>}
                            {isOos && otherOptionsCount > 0 && (
                              <span className="pdp-vsku-pill-price pdps-pill-options">
                                {otherOptionsCount} Option{otherOptionsCount === 1 ? '' : 's'}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  {showSectionOosMsg && (
                    <div className="pdp-vsku-oos-row pdp-vsku-oos-row--subtle">
                      <span className="pdp-vsku-oos-msg pdp-vsku-oos-msg--subtle">{sectionOosLabel} is out of stock</span>
                    </div>
                  )}
                  {selectedIsOosInThisColor && selectedOpt && !stickyOosOption && !showSectionOosMsg && !isStickyOnlyOosColor && (
                    <div className="pdp-vsku-oos-row">
                      <span className="pdp-vsku-oos-msg">{selectedOpt.label} is Out Of Stock in this color</span>
                      <button type="button" className="pdp-vsku-notify-me">Notify Me</button>
                    </div>
                  )}
                  {/size/i.test(layer.axis_label ?? '') && (
                    <button type="button" className="pdps-size-chart">
                      <span>Size Chart</span>
                      <span className="pdps-chevron-btn" aria-hidden="true"><img src={pdpsSizeChevronIcon} alt="" /></span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
    </>
  )
  const ctaBlock = (
        <div className="pdp-cta-wrap">
          <button
            type="button"
            className="pdp-add-to-cart"
            aria-label={inCart ? 'View Cart' : 'Add to Cart'}
            onClick={inCart ? goToCart : handleAddToCart}
          >
            <span className="pdps-cta-icon pdps-cta-icon--cart" aria-hidden="true"><img src={pdpsCartIcon} alt="" /></span>
            {inCart ? 'View Cart' : 'Add to Cart'}
          </button>
          <button type="button" className="pdp-buy-now" onClick={handleBuyNow}>
            <span className="pdps-cta-icon pdps-cta-icon--buy" aria-hidden="true"><img src={pdpsBuyNowIcon} alt="" /></span>
            Buy Now
          </button>
        </div>
  )
  const valueMarkersBlock = (
    <section className="pdps-value-markers" aria-label="Meesho promises">
      <div className="pdps-value-marker">
        <span className="pdps-value-marker__icon" aria-hidden="true">
          <img className="pdps-value-marker__img pdps-value-marker__img--cod" src={pdpsMarkerCod} alt="" />
        </span>
        <span className="pdps-value-marker__label">Free Cash on Delivery</span>
      </div>
      <span className="pdps-value-marker__divider" aria-hidden="true" />
      <div className="pdps-value-marker">
        <span className="pdps-value-marker__icon" aria-hidden="true">
          <img className="pdps-value-marker__img pdps-value-marker__img--returns" src={pdpsMarkerReturns} alt="" />
        </span>
        <span className="pdps-value-marker__label">7 Day Easy Returns</span>
      </div>
      <span className="pdps-value-marker__divider" aria-hidden="true" />
      <div className="pdps-value-marker">
        <span className="pdps-value-marker__icon" aria-hidden="true">
          <img className="pdps-value-marker__img pdps-value-marker__img--lowest-price" src={pdpsMarkerLowestPrice} alt="" />
        </span>
        <span className="pdps-value-marker__label">Lowest Price Guaranteed</span>
      </div>
    </section>
  )
  const detailBlocks = (
    <>
      <div className="pdp-supplier pdps-soldby">
        <div className="pdp-supplier-left">
          <div className="pdps-soldby-logo">
            <span className="pdps-soldby-tag">Sold by</span>
            <span className="pdps-soldby-avatar" aria-hidden="true"><img src={pdpsSoldByStoreIcon} alt="" /></span>
          </div>
          <div className="pdps-soldby-info">
            <span className="pdp-supplier-name">{soldBy.name}</span>
            <div className="pdps-soldby-meta">
              <span className="pdps-soldby-rating">
                {Number(soldBy.rating).toFixed(1)}
                <img className="pdps-soldby-star" src={pdpsSoldByStarIcon} alt="" />
              </span>
              <img className="pdps-soldby-dot" src={pdpsSoldByDotIcon} alt="" />
              <span className="pdps-soldby-trusted"><img src={pdpsSoldByTrustedBadge} alt="Meesho Trusted" /></span>
            </div>
          </div>
        </div>
        <span className="pdp-supplier-chevron pdps-chevron-btn pdps-chevron-btn--right" aria-hidden="true"><img src={pdpsSizeChevronIcon} alt="" /></span>
      </div>

      {productDetailRows.length > 0 && (
        <section className="pdp-specs pdps-hl" aria-label="Product Highlights">
          <div className="pdps-hl-head">
            <h3 className="pdps-hl-title">Product Highlights</h3>
            <button
              type="button"
              className="pdps-hl-copy"
              onClick={() => navigator.clipboard?.writeText(productDetailRows.map((s) => `${s.key}: ${s.value}`).join('\n')).catch(() => {})}
            >
              COPY
            </button>
          </div>
          <div className="pdp-specs-grid">
            {productDetailRows.map((s) => (
              <div key={s.key} className="pdp-specs-row">
                <span className="pdp-specs-key">{s.key}</span>
                <span className="pdp-specs-value">{s.value}</span>
              </div>
            ))}
          </div>
          <button type="button" className="pdp-more-details">
            Additional Details
            <span className="pdps-hl-chevron" aria-hidden="true"><img src={pdpsHlChevronDown} alt="" /></span>
          </button>
        </section>
      )}

      {alsoViewed.length > 0 && (
        <section className="pdps-yml" aria-label="You Might Also Like">
          <div className="pdps-yml-head">
            <h3 className="pdps-yml-title">You Might Also Like</h3>
            <span className="pdps-yml-ad">Ad</span>
          </div>
          <div className="pdps-yml-row">
            {alsoViewed.slice(0, 8).map((p) => {
              const heroMedia = p.base_media?.hero_image
              const cardSrc = getHeroImageForProduct(p) || (typeof heroMedia === 'string' ? heroMedia : '') || IMAGE_FALLBACK
              const cardPrice = p.price_summary?.price
              const cardMrp = p.price_summary?.mrp
              const cardOff = p.price_summary?.discount_percent
              const showCardMrp = cardMrp != null && cardMrp > (cardPrice ?? 0)
              const cardRatingCount = p.rating?.count
              const wished = has(p.product_id)
              return (
                <article key={p.product_id} className="pdps-yml-card">
                  <Link to={`/product/${p.product_id}`} state={{ returnTo: location.pathname }} className="pdps-yml-link">
                    <div className="pdps-yml-media">
                      <img
                        className="pdps-yml-img"
                        src={cardSrc}
                        alt={p.title}
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = IMAGE_FALLBACK
                        }}
                      />
                    </div>
                    <div className="pdps-yml-info">
                      <p className="pdps-yml-name">{p.title}</p>
                      <div className="pdps-yml-price">
                        <span className="pdps-yml-final">₹{cardPrice}</span>
                        {showCardMrp && <span className="pdps-yml-mrp">₹{cardMrp}</span>}
                        {showCardMrp && cardOff > 0 && <span className="pdps-yml-off">{cardOff}% off</span>}
                      </div>
                      <div className="pdps-yml-rating">
                        <span className="pdps-yml-chip">
                          {Math.min(4.9, Number(p.rating?.value ?? 0)).toFixed(1)}
                          <img src={pdpsHlStar} alt="" />
                        </span>
                        {cardRatingCount != null && (
                          <span className="pdps-yml-count">({Number(cardRatingCount).toLocaleString()})</span>
                        )}
                      </div>
                    </div>
                  </Link>
                  <button
                    type="button"
                    className={`pdps-yml-wish${wished ? ' selected' : ''}`}
                    aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
                    aria-pressed={wished}
                    onClick={() => toggle(p.product_id)}
                  >
                    {wished ? <HeartFilledIcon /> : <img src={pdpsHlHeart} alt="" />}
                  </button>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {deliveryPromise?.isFast && (
        <PdpFastDeliveryBand
          deliveryEta={deliveryEta}
          addressSnippet={addressSnippet}
          onChangeAddress={openAddressPicker}
        />
      )}
      {deliveryPromise?.isFast && valueMarkersBlock}

      <section className="pdp-reviews-section">
        <h3>Customer Ratings & Reviews</h3>
        <div className="pdps-reviews-body">
          <div className="pdps-reviews-overview">
            <div className="pdp-reviews-top">
              <div className="pdp-reviews-summary">
                <div className="pdp-reviews-big-chip">
                  <span>{ratingValue}</span>
                  <img className="pdps-reviews-big-star" src={reviewsSummaryStar} alt="" aria-hidden="true" />
                </div>
                <div className="pdp-reviews-meta">
                  <div>{ratingCount?.toLocaleString()} Ratings</div>
                  <div>{writtenReviewCount?.toLocaleString()} Reviews</div>
                </div>
              </div>
              {product.ratingBars?.length > 0 && (
                <div className="pdp-reviews-bars">
                  {product.ratingBars.map((bar, bi) => {
                    const totalBarCount = product.ratingBars.reduce((sum, b) => sum + (b.count || 0), 0)
                    return (
                      <div key={bar.label} className="pdp-reviews-bar-row">
                        <span className="pdp-reviews-bar-label">{['Very Good', 'Good', 'Ok-Ok', 'Bad', 'Very Bad'][bi] ?? bar.label}</span>
                        <div className="pdp-reviews-bar-track">
                          <span className={`pdp-reviews-bar-fill ${bar.fill}`} style={{ width: `${totalBarCount > 0 ? (bar.count / totalBarCount) * 100 : 0}%` }} />
                        </div>
                        <span className="pdp-reviews-bar-count">{bar.count}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            {product.reviewTags?.length > 0 && (
              <div className="pdp-reviews-tags">
                {product.reviewTags.map((tag) => (
                  <span key={tag.label} className={`pdp-reviews-tag ${tag.type}`}>
                    {tag.type === 'green' && <img className="pdps-reviews-tag-icon" src={reviewsTagSuccess} alt="" aria-hidden="true" />}
                    {tag.type === 'red' && <img className="pdps-reviews-tag-icon pdps-reviews-tag-icon--cross" src={reviewsTagCross} alt="" aria-hidden="true" />}
                    {tag.label}
                  </span>
                ))}
              </div>
            )}
            {product.realPhotosCount != null && (
              <div className="pdps-reviews-photos">
                <div className="pdp-reviews-photos-label">Real Photos ({product.realPhotosCount})</div>
                <div className="pdp-reviews-photos-scroll">
                  {Array.from({ length: Math.min(5, product.realPhotosCount) }, (_, i) => i).map((i) => {
                    const isMore = i === 4 && product.realPhotosCount > 5
                    return (
                      <div key={i} className={isMore ? 'pdp-reviews-photo-more' : 'pdps-reviews-media'}>
                        <img
                          className="pdp-reviews-photo"
                          src={heroImages[i % heroImages.length] || heroImg}
                          alt=""
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src = IMAGE_FALLBACK
                          }}
                        />
                        {isMore && (
                          <span className="pdps-reviews-more-text">
                            <span className="pdps-reviews-more-count">+{product.realPhotosCount - 4}</span>
                            <span className="pdps-reviews-more-label">more</span>
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          {product.sampleReviews?.length > 0 && product.sampleReviews.slice(0, 2).map((rev, i) => {
            /* SoT: the 2nd review card carries review photos (product imagery from heroImages) and a clipped text with "Read more" */
            const reviewText = String(rev.text ?? '').replace(/\s*\.\.\s*Read more\s*$/i, '')
            const hasMedia = i === 1 && heroImages.length > 0
            const clipAt = reviewText.lastIndexOf(' ', 52)
            const clippedText = hasMedia && reviewText.length > 52 ? reviewText.slice(0, clipAt > 0 ? clipAt : 52) : null
            return (
              <div key={i} className="pdp-review-card">
                <div className="pdps-review-main">
                  <div className="pdp-review-card-head">
                    <span className="pdps-review-rating">
                      <span className={`pdp-review-card-badge pdps-review-chip--s${rev.stars}`}>
                        {rev.stars}
                        <img className="pdps-review-chip-star" src={reviewsChipStar} alt="" aria-hidden="true" />
                      </span>
                      <span className="pdps-review-label">{['Very Bad', 'Bad', 'Ok-Ok', 'Good', 'Very Good'][rev.stars - 1] ?? rev.label}</span>
                    </span>
                    <img className="pdps-review-dot" src={reviewsHeaderDot} alt="" aria-hidden="true" />
                    <span className="pdp-review-card-date">{rev.date}</span>
                  </div>
                  <div className="pdps-review-content">
                    <div className="pdp-review-card-text">
                      {clippedText ?? reviewText}
                      {clippedText != null && (
                        <>
                          {' ..'}
                          <span className="pdps-review-read-more"> Read more</span>
                        </>
                      )}
                    </div>
                    <span className="pdp-review-card-author">{rev.author}</span>
                  </div>
                  <span className="pdp-review-card-helpful">
                    <span className="pdps-review-helpful-icon"><img src={i === 0 ? reviewsHelpfulFilled : reviewsHelpfulOutline} alt="" aria-hidden="true" /></span>
                    Helpful ({rev.helpful})
                  </span>
                </div>
                {hasMedia && (
                  <div className="pdps-review-media">
                    <div className="pdps-review-media-tile">
                      <img
                        src={heroImages[0] || heroImg}
                        alt=""
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = IMAGE_FALLBACK
                        }}
                      />
                    </div>
                    <div className="pdps-review-media-tile pdps-review-media-tile--more">
                      <img
                        src={heroImages[1 % heroImages.length] || heroImg}
                        alt=""
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = IMAGE_FALLBACK
                        }}
                      />
                      <span className="pdps-reviews-more-text">
                        <span className="pdps-reviews-more-count">+{Math.max(1, heroImages.length - 1)}</span>
                        <span className="pdps-reviews-more-label">more</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {product.viewAllReviewsCount != null && (
          <>
            <div className="pdps-reviews-divider" aria-hidden="true" />
            <button type="button" className="pdp-view-all-reviews" aria-label={`View all ${writtenReviewCount?.toLocaleString()} reviews`}>
              View all reviews
              <span className="pdps-reviews-viewall-icon" aria-hidden="true"><img src={reviewsViewAllChevron} alt="" /></span>
            </button>
          </>
        )}
      </section>

      {deliveryPromise && !deliveryPromise.isFast && (
        <PdpDeliveryAddressRow
          deliveryEta={deliveryEta}
          addressSnippet={addressSnippet}
          onChangeAddress={openAddressPicker}
        />
      )}
      {!deliveryPromise?.isFast && valueMarkersBlock}
    </>
  )
  const alsoViewedBlock = (
      <section ref={alsoViewedRef} className="pdp-also-viewed">
        <h3 className="pdps-pav-title">People Also Viewed</h3>
        <ProductCardGrid
          columns={isWebPdp ? 4 : 2}
          className="pdp-also-grid"
          products={alsoViewed}
          returnTo={location.pathname}
          isWishlisted={has}
          onWishlistToggle={toggle}
        />
      </section>
  )

  return (
    <div className={`pdp${isWebPdp ? ' pdp--web' : ''}`}>
      <header className="pdp-header">
        <button type="button" className="pdp-back" onClick={handleBack} aria-label="Back"><span className="pdps-appbar-legacy"><BackIcon /></span><img className="pdps-appbar-img" src={sotBackIcon} alt="" /></button>
        <div className="pdp-actions">
          <button type="button" className="pdps-appbar-lang" aria-label="Language"><img className="pdps-appbar-img pdps-appbar-img--language" src={sotLanguageIcon} alt="" /></button>
          <button type="button" aria-label="Search"><span className="pdps-appbar-legacy"><SearchIcon /></span><img className="pdps-appbar-img" src={sotSearchIcon} alt="" /></button>
          <button type="button" className={has(product?.product_id) ? 'pdp-header-wishlist selected' : 'pdp-header-wishlist'} aria-label={has(product?.product_id) ? 'Remove from wishlist' : 'Add to wishlist'} onClick={() => product?.product_id && toggle(product.product_id)}>{has(product?.product_id) ? <HeartFilledIcon /> : <><span className="pdps-appbar-legacy"><HeartIcon /></span><img className="pdps-appbar-img pdps-appbar-img--wishlist" src={sotWishlistIcon} alt="" /></>}</button>
          <button type="button" className="cart-badge-host" aria-label={cartAriaLabel(cartCount)} onClick={goToCart}>
            <span className="pdps-appbar-legacy"><CartIcon /></span><img className="pdps-appbar-img pdps-appbar-img--cart" src={sotCartIcon} alt="" />
            <CartBadge count={cartCount} />
          </button>
        </div>
      </header>

      {isWebPdp ? (
        <div className="pdp-web">
          <aside className="pdp-web-left">
            {heroBlock}
            <PdpSimilarStrip product={product} products={alsoViewed} returnTo={location.pathname} onSeeAll={scrollToAlsoViewed} />
            {/* title, price and rating sit under the similar products, beside the size */}
            <section className="pdp-info pdp-web-info">{infoHeadBlock}</section>
            <div className="pdp-web-variants">{variantBlocks}</div>
            {ctaBlock}
          </aside>
          <div className="pdp-web-right">{detailBlocks}</div>
        </div>
      ) : (
        <>
          {heroBlock}
          <PdpSimilarStrip product={product} products={alsoViewed} returnTo={location.pathname} onNext={scrollToAlsoViewed} />
          <section className="pdp-info">
            {infoHeadBlock}
            {variantBlocks}
            {ctaBlock}
          </section>
          {detailBlocks}
        </>
      )}

      {alsoViewedBlock}

      {showBuyNowSheet && product && (
        <BuyNowSheet
          product={product}
          functionalLayer={buyNowFunctionalLayer}
          selectedOptions={selectedOptions}
          onSelectOption={(axisId, optionId) => setOption(axisId, optionId, layers)}
          oosOptionIds={buyNowOosIds}
          onClose={() => setShowBuyNowSheet(false)}
          onConfirm={sheetCta === 'cart' ? addToCart : goToReview}
          ctaLabel={sheetCta === 'cart' ? 'Add to Cart' : 'Buy Now'}
        />
      )}

      {showPicker && (
        <AddressPicker
          addresses={addresses}
          selectedId={addressId}
          onSelect={selectAddress}
          onSaveAddress={saveAddress}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
