import { Link } from 'react-router-dom'
import { getHeroImageForProduct } from '../data/categoryProductImages'
import { usePlpCardVariant } from '../context/PlpCardVariantContext'
import { usePriceDropVariant } from '../context/PriceDropVariantContext'
import { useCohort } from '../context/CohortContext'
import { useDealTimer } from '../hooks/useDealTimer'
import { getPlpImageWrapClassName, getPlpStaggerDepthStyle } from '../utils/plpCardStagger'
import {
  buildComprehensionChips,
  formatPlpKeepRateLabel,
  formatPurchaseCount,
  getPlpCardData,
  getLegacyTitleDisplay,
  getOptimizedPriceFloor,
  resolveRatingCount,
  shouldShowComprehensionBlock,
  shouldShowPriceDropRow,
  splitComprehensionRows,
} from '../utils/plpCardData'
import {
  getPriceLayer,
  getQualityLayer,
  hasQualityLayer,
  isFloorBodyVariant,
  isOptimizedVariant,
  isSimplifyCardVariant,
  isTileBodyVariant,
  showDealTimer,
} from '../utils/plpCardFlavour'
import DeliveryPromiseRow from './delivery/DeliveryPromiseRow'
import { KeepRatePillIcon } from './KeepRatePillIcon'
import { MTrustedBadgeIcon } from './MTrustedBadgeIcon'
import { getDeliveryPromiseForPdp } from '../utils/deliveryPromise'
import { deriveCodPayable } from '../utils/pdpFlavour'
import sotMallIcon from '../assets/plp-sot/mall-icon.svg'
import sotTimerIcon from '../assets/plp-sot/timer-icon.svg'
import './ProductCard.css'
import { publicUrl } from '../utils/publicUrl'

const IMAGE_FALLBACK = 'https://placehold.co/400x400/e2e8f0/64748b?text=Product'

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="8" height="8" aria-hidden>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)


/** Mall seal — Figma 801:32979 */
function MallBadgeIcon() {
  return (
    <img
      className="product-card-chip-mall-icon-svg"
      src={publicUrl('/badges/mall-seal.svg')}
      alt=""
      width={10}
      height={10}
      decoding="async"
      aria-hidden
    />
  )
}

export function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  )
}

export function HeartFilledIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  )
}

function ComprehensionChip({ chip }) {
  if (chip.type === 'selection') {
    return (
      <span className="product-card-chip product-card-chip--selection">
        <span className="product-card-chip-selection-dot" aria-hidden />
        {chip.label}
      </span>
    )
  }
  if (chip.type === 'new') {
    return <span className="product-card-chip product-card-chip--new">{chip.label}</span>
  }
  if (chip.type === 'ad') {
    return <span className="product-card-chip product-card-chip--ad">{chip.label}</span>
  }
  if (chip.type === 'mall') {
    return (
      <span className="product-card-chip product-card-chip--mall" aria-label="Mall">
        <span className="product-card-chip-mall-icon">
          <MallBadgeIcon />
        </span>
        <span className="product-card-chip-mall-label">Mall</span>
      </span>
    )
  }
  if (chip.type === 'brand') {
    return <span className="product-card-chip product-card-chip--meta">{chip.label}</span>
  }
  return <span className="product-card-chip product-card-chip--meta">{chip.label}</span>
}

/** Down-trend arrow for the prominent Price Drop badge. */
function PriceDropArrowIcon() {
  return (
    <svg
      className="product-card-price-drop-arrow"
      width="11"
      height="10"
      viewBox="0 0 12 11"
      fill="none"
      aria-hidden
    >
      <path
        d="M9.71189 9.96623L7.17761 4.78178L4.52102 5.96333L2.13867 0.600159"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.7518 7.16937L9.59787 10.2772L8.08039 9.7138L6.56291 9.15038"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SaleBoltIcon() {
  return (
    <svg
      className="product-card-price-tag-sale-bolt"
      width="7"
      height="9"
      viewBox="0 0 7 9"
      fill="none"
      aria-hidden
    >
      <path
        d="M4.62 0L0 5.18H2.77L2.15 9L7 3.54H4.23L4.62 0Z"
        fill="#FEEF98"
      />
    </svg>
  )
}

function PrimaryPriceTag({ tag }) {
  if (tag === 'sale') {
    return (
      <span className="product-card-price-tag product-card-price-tag--sale">
        <span className="product-card-price-tag-sale-label">SALE</span>
        <SaleBoltIcon />
      </span>
    )
  }
  if (tag === 'combo_offer') {
    return (
      <span className="product-card-price-tag product-card-price-tag--combo">
        <span className="product-card-price-tag-combo-bold">COMBO</span>
        <span className="product-card-price-tag-combo-soft">OFFER</span>
      </span>
    )
  }
  return null
}


function TopRatedStarIcon() {
  return (
    <svg
      className="product-card-quality-top-quality-star-svg"
      width="9.57"
      height="9.57"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M6 1.15L7.42 4.48L11.02 4.88L8.32 7.35L9.12 10.95L6 9.12L2.88 10.95L3.68 7.35L0.98 4.88L4.58 4.48L6 1.15Z"
        fill="currentColor"
      />
    </svg>
  )
}

/** Shared leading glyphs for the appended social-proof quality tags (inherit tag colour). */
function BagIcon() {
  return (
    <svg className="product-card-quality-social-icon" width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M3 4V3.2a3 3 0 0 1 6 0V4h1.4l.5 6.2a.6.6 0 0 1-.6.65H1.7a.6.6 0 0 1-.6-.65L1.6 4H3Zm1.2 0h3.6v-.8a1.8 1.8 0 0 0-3.6 0V4Z" fill="currentColor" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg className="product-card-quality-social-icon" width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M4.3 2.2h3.4l.7 1H10a1 1 0 0 1 1 1v5A1 1 0 0 1 10 10.2H2A1 1 0 0 1 1 9.2v-5a1 1 0 0 1 1-1h1.6l.7-1Z" stroke="currentColor" strokeWidth="0.9" fill="none" />
      <circle cx="6" cy="6.6" r="1.9" stroke="currentColor" strokeWidth="0.9" fill="none" />
    </svg>
  )
}

function QualitySocialTag({ icon, label, variant }) {
  return (
    <span
      className={`product-card-quality-tag product-card-quality-tag--pill product-card-quality-tag--social product-card-quality-tag--social-${variant}`}
    >
      <span className="product-card-quality-social-icon-wrap" aria-hidden>
        {icon}
      </span>
      <span className="product-card-quality-tag-label product-card-quality-tag-label--social">{label}</span>
    </span>
  )
}

function QualityTagChip({ tag, keepRatePercent, purchaseCount }) {
  if (tag === 'sold_recently') {
    return <QualitySocialTag variant="velocity" icon={<BagIcon />} label="10+ sold" />
  }
  if (tag === 'bought_this_week') {
    return <QualitySocialTag variant="velocity" icon={<BagIcon />} label="500+ bought" />
  }
  if (tag === 'image_reviews') {
    return <QualitySocialTag variant="photos" icon={<CameraIcon />} label="100 photos" />
  }
  if (tag === 'geo_velocity') {
    return <QualitySocialTag variant="velocity" icon={<BagIcon />} label={`${formatPurchaseCount(purchaseCount)} purchased`} />
  }
  if (tag === 'gold') {
    return (
      <span className="product-card-quality-tag product-card-quality-tag--gold">
        <span className="product-card-quality-gold-inner">
          <span className="product-card-quality-gold-jewel" aria-hidden>
            ◆
          </span>
          Gold
        </span>
      </span>
    )
  }
  if (tag === 'm_trusted') {
    return (
      <span className="product-card-quality-tag product-card-quality-tag--trusted" aria-label="m-Trusted">
        <MTrustedBadgeIcon />
      </span>
    )
  }
  if (tag === 'less_returned') {
    const keepLabel = formatPlpKeepRateLabel(keepRatePercent)
    return (
      <span
        className="product-card-quality-tag product-card-quality-tag--pill product-card-quality-tag--less-returned"
        aria-label={keepLabel}
      >
        <span className="product-card-quality-keep-pill-icon-wrap" aria-hidden>
          <KeepRatePillIcon />
        </span>
        <span className="product-card-quality-tag-label product-card-quality-tag-label--less-returned">
          {keepLabel}
        </span>
      </span>
    )
  }
  if (tag === 'top_quality') {
    return (
      <span className="product-card-quality-tag product-card-quality-tag--pill product-card-quality-tag--top-quality">
        <TopRatedStarIcon />
        <span className="product-card-quality-tag-label product-card-quality-tag-label--top-quality">
          Top Quality
        </span>
      </span>
    )
  }
  return null
}

function DealTimerImageLabel({ productId, globalIndex }) {
  const label = useDealTimer(productId, globalIndex, true)
  if (!label) return null
  return <span className="product-card-image-timer">{label}</span>
}

/* Design SoT card: badges that sit across the image's bottom edge — Mall and the deal timer */
function SotImageBadges({ flavour, productId, globalIndex }) {
  const timerLabel = useDealTimer(productId, globalIndex, Boolean(flavour?.dealTimer))
  const showTimer = Boolean(flavour?.dealTimer && timerLabel)
  /* every card's price sits on the UPI strip, so SALE / COMBO move onto the image's
     bottom-right corner (where the SoT puts its promo sticker) */
  const promoTag =
    flavour?.primaryPriceTag === 'sale' || flavour?.primaryPriceTag === 'combo_offer' ? flavour.primaryPriceTag : null
  if (!flavour?.isMall && !showTimer && !promoTag) return null
  return (
    <>
    {promoTag && (
      <div className="product-card-sot-promo">
        <PrimaryPriceTag tag={promoTag} />
      </div>
    )}
    <div className="product-card-sot-badges">
      {flavour.isMall && (
        <span className="product-card-sot-mall">
          <img src={sotMallIcon} alt="" />
          Mall
        </span>
      )}
      {showTimer && (
        <span className="product-card-sot-timer">
          <img src={sotTimerIcon} alt="" />
          {timerLabel}
        </span>
      )}
    </div>
    </>
  )
}

function DealTimerPricePill({ productId, globalIndex }) {
  const label = useDealTimer(productId, globalIndex, true)
  if (!label) return null
  return (
    <span className="product-card-deal-timer">
      <span className="product-card-deal-timer-icon" aria-hidden>
        ⏱
      </span>
      {label}
    </span>
  )
}

function formatRatingDisplay(value) {
  const n = Math.min(4.9, Math.max(0, Number(value ?? 0)))
  return n.toFixed(1)
}

/* Tags product cards no longer show: Top Quality, the keep-rate pill ("98% keep it") and the
   social-proof chips (photo count, purchase count, "bought this week", "10+ sold"). */
const HIDDEN_CARD_TAGS = new Set([
  'top_quality',
  'image_reviews',
  'geo_velocity',
  'bought_this_week',
  'sold_recently',
  'less_returned', /* "98% keep it" */
])

/** PLP price block — row 1: floor + primary tag; row 2: deal timer. */
function OptimizedTileContent({ flavour, productId, globalIndex }) {
  /* product cards no longer show the "New" chip or any pink selection pill
     ("Best of 2026", "Top in Bengaluru", "#N in <category>", trend labels) */
  const chips = buildComprehensionChips(flavour).filter((chip) => chip.type !== 'new' && chip.type !== 'selection')
  const comprehensionRows = splitComprehensionRows(chips)
  const legacyTitle = getLegacyTitleDisplay(flavour)
  const showComprehension = shouldShowComprehensionBlock(flavour)
  const hasUpi = flavour.primaryPriceTag === 'upi'
  const { showMrp, showPctOff, discountPct } = getOptimizedPriceFloor(flavour)
  const upiAmountOff =
    hasUpi && flavour.saleAmountOff != null ? Math.round(flavour.saleAmountOff) : null

  /* Design SoT card: one title line — the brand in bold, then what the product is
     (Mall moved onto the image as a badge; Ad stays as a small label) */
  const brandLabel = chips.find((c) => c.type === 'brand')?.label ?? null
  const kindLabel =
    [chips.find((c) => c.type === 'sscat')?.label, chips.find((c) => c.type === 'pack')?.label]
      .filter(Boolean)
      .join(' · ') || (brandLabel ? '' : legacyTitle ?? '')
  const codPayable = deriveCodPayable(flavour.price)
  void comprehensionRows
  void showComprehension

  return (
    <>
      {(brandLabel || kindLabel || flavour.isAd) && (
        <p className="product-card-sot-title">
          {flavour.isAd && <span className="product-card-sot-ad">Ad</span>}
          {brandLabel && <strong>{brandLabel}</strong>}
          {brandLabel && kindLabel ? ' ' : ''}
          {kindLabel}
        </p>
      )}

      <div className="product-card-price-block">
        <div className="product-card-price-row1">
          {/* SoT: every card's price sits on the UPI strip (the shown price is the online
              price; "₹X with COD" follows underneath) */}
          <div className="product-card-price-floor product-card-price-floor--has-offer product-card-price-floor--upi">
            <span className="product-card-price-final">₹{flavour.price}</span>
            {showMrp && <span className="product-card-price-mrp">₹{flavour.mrp}</span>}
            {showPctOff && (
              <span className="product-card-price-discount">{discountPct}% off</span>
            )}
            {hasUpi && upiAmountOff != null && upiAmountOff > 0 && (
              <span className="product-card-price-amount-off">₹{upiAmountOff} off</span>
            )}
            <span className="product-card-price-tag product-card-price-tag--upi">UPI</span>
          </div>
        </div>
        {codPayable != null && (
          <p className="product-card-sot-cod">
            <strong>₹{codPayable}</strong> with COD
          </p>
        )}
      </div>

      <div className="product-card-quality-block">
        <div className="product-card-quality-floor">
          <span className="product-card-rating-pill">
            {formatRatingDisplay(flavour.rating)}
            <StarIcon />
          </span>
          <span className="product-card-rating-count">({flavour.ratingCount})</span>
        </div>
        {flavour.qualityTag && !HIDDEN_CARD_TAGS.has(flavour.qualityTag) && (
          <QualityTagChip
            tag={flavour.qualityTag}
            keepRatePercent={flavour.keepRatePercent}
            purchaseCount={flavour.purchaseCount}
          />
        )}
      </div>

    </>
  )
}

function FloorRating({ product, globalIndex, value }) {
  const display = formatRatingDisplay(value)
  const count = resolveRatingCount(product, globalIndex)
  return (
    <div className="product-card-floor-rating">
      <span className="product-card-floor-rating-pill">
        {display}
        <StarIcon />
      </span>
      <span className="product-card-floor-rating-count">({count.toLocaleString()})</span>
    </div>
  )
}

function PriceLayerRow({ product, globalIndex }) {
  const layer = getPriceLayer(product, globalIndex)
  const showMrp =
    layer.mrp != null && layer.finalPrice != null && layer.mrp > layer.finalPrice
  const showPctOff =
    showMrp && layer.discountPercent != null && layer.discountPercent > 0
  const hasOfferChip = layer.extraSlot != null

  let extraChip = null
  if (layer.extraSlot === 'combo') {
    extraChip = (
      <span className="product-card-layer-chip product-card-layer-chip--combo">
        <span className="product-card-layer-chip-combo-bold">COMBO</span>
        <span className="product-card-layer-chip-combo-soft">OFFER</span>
      </span>
    )
  } else if (layer.extraSlot === 'upi') {
    extraChip = <span className="product-card-layer-chip product-card-layer-chip--upi">UPI</span>
  } else if (layer.extraSlot === 'gst') {
    extraChip = (
      <span className="product-card-layer-chip product-card-layer-chip--gst">
        ↓ {layer.gstDropLabel}
      </span>
    )
  }

  const priceLayerClass = [
    'product-card-layer',
    'product-card-layer--price',
    layer.extraSlot === 'upi' && 'product-card-layer--has-upi',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={priceLayerClass}>
      <div className="product-card-layer-floor-group">
        <span className="product-card-layer-final-price">₹{layer.finalPrice}</span>
        {showMrp && <span className="product-card-layer-mrp">₹{layer.mrp}</span>}
        {showPctOff && (
          <span className="product-card-layer-discount">{layer.discountPercent}% off</span>
        )}
      </div>
      {hasOfferChip && extraChip}
    </div>
  )
}

function QualityLayerRow({ product, globalIndex }) {
  const layer = getQualityLayer(product, globalIndex)
  const ratingDisplay = formatRatingDisplay(layer.rating)

  let markerChip = null
  if (layer.markerSlot === 'trusted') {
    markerChip = (
      <span className="product-card-layer-chip product-card-layer-chip--trusted" aria-label="m-Trusted">
        <MTrustedBadgeIcon />
      </span>
    )
  } else if (layer.markerSlot === 'gold') {
    markerChip = (
      <span className="product-card-layer-chip product-card-layer-chip--gold">
        <span className="product-card-layer-gold-inner">
          <span className="product-card-layer-gold-jewel" aria-hidden>
            ◆
          </span>
          Gold
        </span>
      </span>
    )
  }

  const qualityLayerClass = [
    'product-card-layer',
    'product-card-layer--quality',
    layer.markerSlot === 'gold' && 'product-card-layer--has-gold',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={qualityLayerClass}>
      <div className="product-card-layer-floor-group">
        <span className="product-card-layer-rating-pill">
          {ratingDisplay}
          <StarIcon />
        </span>
        <span className="product-card-layer-rating-count">
          ({layer.ratingCount.toLocaleString()})
        </span>
      </div>
      {markerChip}
    </div>
  )
}

function SimplifyCardBody({ product, globalIndex, variantId }) {
  return (
    <div className="product-card-simplify-body">
      <PriceLayerRow product={product} globalIndex={globalIndex} />
      {hasQualityLayer(variantId) && (
        <QualityLayerRow product={product} globalIndex={globalIndex} />
      )}
    </div>
  )
}

function FloorBodyRow({ product, globalIndex }) {
  const price = product.price_summary?.price
  return (
    <div className="product-card-simplify-body">
      <div className="product-card-floor product-card-floor--on-tile">
        <span className="product-card-floor-price">₹{price}</span>
        <FloorRating product={product} globalIndex={globalIndex} value={product.rating?.value} />
      </div>
    </div>
  )
}

function LegacyCardBody({ p, globalIndex = 0 }) {
  const ratingCount = resolveRatingCount(p, globalIndex)
  return (
    <div className="product-card-body">
      <h2 className="product-card-title">{p.title}</h2>
      <div className="product-card-price-row">
        <span className="product-card-price">₹{p.price_summary?.price}</span>
        {p.price_summary?.mrp != null &&
          p.price_summary.mrp > (p.price_summary?.price ?? 0) && (
            <span className="product-card-mrp">₹{p.price_summary.mrp}</span>
          )}
        {p.price_summary?.discount_percent != null &&
          p.price_summary.discount_percent > 0 &&
          p.price_summary?.mrp != null &&
          p.price_summary.mrp > (p.price_summary?.price ?? 0) && (
          <span className="product-card-offer">{p.price_summary.discount_percent}% off</span>
        )}
      </div>
      <div className="product-card-rating">
        <span className="product-card-rating-pill">
          <StarIcon />
          {Number(p.rating?.value ?? 0).toFixed(1)}
        </span>
        <span className="product-card-rating-count">({ratingCount.toLocaleString()})</span>
      </div>
    </div>
  )
}

function ProductCardImage({
  p,
  cardSrc,
  imageWrapClass,
  staggerStyle,
  simplify,
  isWishlisted,
  onWishlistToggle,
  considerationTags,
  showTimer,
  globalIndex = 0,
  variantId,
  price,
  optimized = false,
  imageOnly = false,
}) {
  const imageBlock = (
    <div
      className={`product-card-image-wrap${imageWrapClass ? ` ${imageWrapClass}` : ''}${simplify ? ' product-card-image-wrap--simplify' : ''}${optimized ? ' product-card-image-wrap--optimized' : ''}`}
      style={staggerStyle}
    >
      <img
        className="product-card-image"
        src={cardSrc || IMAGE_FALLBACK}
        alt={p.title}
        onError={(e) => {
          e.target.onerror = null
          e.target.src = IMAGE_FALLBACK
        }}
      />
      {showTimer && <DealTimerImageLabel productId={p.product_id} globalIndex={globalIndex} />}

      {variantId === 'floor' && (
        <div className="product-card-floor">
          <span className="product-card-floor-price">₹{price}</span>
          <FloorRating product={p} globalIndex={globalIndex} value={p.rating?.value} />
        </div>
      )}
    </div>
  )

  if (imageOnly) {
    return imageBlock
  }

  return (
    <div
      className={`product-card-image-wrap${imageWrapClass ? ` ${imageWrapClass}` : ''}${simplify ? ' product-card-image-wrap--simplify' : ''}`}
      style={staggerStyle}
    >
      <img
        className="product-card-image"
        src={cardSrc || IMAGE_FALLBACK}
        alt={p.title}
        onError={(e) => {
          e.target.onerror = null
          e.target.src = IMAGE_FALLBACK
        }}
      />
      <button
        type="button"
        className={`product-card-wishlist${isWishlisted ? ' selected' : ''}`}
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onWishlistToggle?.(p.product_id)
        }}
      >
        {isWishlisted ? <HeartFilledIcon /> : <HeartIcon />}
      </button>

      {showTimer && <DealTimerImageLabel productId={p.product_id} globalIndex={globalIndex} />}

      {variantId === 'floor' && (
        <div className="product-card-floor">
          <span className="product-card-floor-price">₹{price}</span>
          <FloorRating product={p} globalIndex={globalIndex} value={p.rating?.value} />
        </div>
      )}
    </div>
  )
}

export default function ProductCard({
  product: p,
  globalIndex = 0,
  columnIndex = 0,
  column = 'left',
  returnTo = '/',
  onNavigate,
  isWishlisted,
  onWishlistToggle,
  flavourOptions: flavourOptionsProp,
}) {
  const { variantId } = usePlpCardVariant()
  const { flavourOptions: cohortFlavourOptions } = useCohort()
  const flavourOptions = flavourOptionsProp ?? cohortFlavourOptions
  const optimized = isOptimizedVariant(variantId)
  const simplify = isSimplifyCardVariant(variantId)
  const fromJson = getHeroImageForProduct(p)
  const heroMedia = p.base_media?.hero_image
  const cardSrc = fromJson || (typeof heroMedia === 'string' ? heroMedia : '')
  const imageWrapClass = getPlpImageWrapClassName(columnIndex, column, globalIndex, variantId)
  const staggerStyle = getPlpStaggerDepthStyle(columnIndex, column, globalIndex, variantId)
  const price = p.price_summary?.price
  const showTimer = showDealTimer(variantId, globalIndex)
  const showTileBody = isTileBodyVariant(variantId)
  const showFloorBody = isFloorBodyVariant(variantId)
  const flavour = optimized ? getPlpCardData(p, globalIndex, flavourOptions) : null
  const pdpPath = `/product/${p.product_id}`
  const pdpNavState = { returnTo, plpIndex: globalIndex }
  /* the grid learns which card (and feed position) was opened */
  const handleNavigate = () => onNavigate?.(p, globalIndex)

  if (optimized && flavour) {
    return (
      <article className="product-card product-card--optimized">
        <div className="product-card-media">
          <Link
            to={pdpPath}
            state={pdpNavState}
            className="product-card-image-link"
            onClick={handleNavigate}
            aria-label={p.title}
          >
            <ProductCardImage
              p={p}
              cardSrc={cardSrc}
              imageWrapClass={imageWrapClass}
              staggerStyle={staggerStyle}
              simplify={false}
              isWishlisted={isWishlisted}
              onWishlistToggle={onWishlistToggle}
              considerationTags={null}
              showTimer={false}
              globalIndex={globalIndex}
              variantId={variantId}
              price={price}
              optimized
              imageOnly
            />
          </Link>
          <button
            type="button"
            className={`product-card-wishlist product-card-wishlist--optimized${isWishlisted ? ' selected' : ''}`}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            onClick={() => onWishlistToggle?.(p.product_id)}
          >
            {isWishlisted ? <HeartFilledIcon /> : <HeartIcon />}
          </button>
          <SotImageBadges flavour={flavour} productId={p.product_id} globalIndex={globalIndex} />
        </div>
        <div className="product-card-tile">
          <Link
            to={pdpPath}
            state={pdpNavState}
            className="product-card-tile-link"
            onClick={handleNavigate}
          >
            <OptimizedTileContent flavour={flavour} productId={p.product_id} globalIndex={globalIndex} />
          </Link>
        </div>
      </article>
    )
  }

  return (
    <div className={`product-card${simplify ? ` product-card--${variantId}` : ''}`}>
      <Link
        to={pdpPath}
        state={pdpNavState}
        className="product-card-link"
        onClick={handleNavigate}
      >
        <ProductCardImage
          p={p}
          cardSrc={cardSrc}
          imageWrapClass={imageWrapClass}
          staggerStyle={staggerStyle}
          simplify={simplify}
          isWishlisted={isWishlisted}
          onWishlistToggle={onWishlistToggle}
          considerationTags={null}
          showTimer={showTimer}
          globalIndex={globalIndex}
          variantId={variantId}
          price={price}
        />

        {showTileBody && (
          <SimplifyCardBody product={p} globalIndex={globalIndex} variantId={variantId} />
        )}

        {showFloorBody && <FloorBodyRow product={p} globalIndex={globalIndex} />}

        {!simplify && <LegacyCardBody p={p} globalIndex={globalIndex} />}
      </Link>
    </div>
  )
}
