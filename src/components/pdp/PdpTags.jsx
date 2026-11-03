import { useDealTimer } from '../../hooks/useDealTimer'
import { KeepRatePillIcon } from '../KeepRatePillIcon'
import { MTrustedBadgeIcon } from '../MTrustedBadgeIcon'
import {
  PlpComboMarker,
  PlpPriceConsiderationMarker,
  PlpSaleMarker,
} from '../plp/PlpPriceMarkers'
import { getPdpDealTimerPrefix } from '../../utils/pdpFlavour'
import {
  formatPdpKeepRateLabel,
  formatPurchaseCount,
  getOptimizedPriceFloor,
  getPriceConsiderationLabel,
  SHOW_PLP_UPI_PRIMARY_TAG,
} from '../../utils/plpCardData'
import pdpsInfoIcon from '../../assets/pdp-sot/info/info.svg'
import pdpsUpiIcon from '../../assets/pdp-sot/info/upi.svg'
import pdpsUpiNotch from '../../assets/pdp-sot/info/upi-offer-notch.svg'
import pdpsDealTimerIcon from '../../assets/pdp-sot/info/deal-timer.svg'
import pdpsRatingStar from '../../assets/pdp-sot/info/rating-star.svg'
import './PdpTags.css'
import '../ProductCard.css'
import '../plp/PlpPriceMarkers.css'
import { publicUrl } from '../../utils/publicUrl'

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

function PdpMallPill() {
  return (
    <span className="product-card-chip product-card-chip--mall pdp-tags-mall-pill" aria-label="Mall">
      <span className="product-card-chip-mall-icon">
        <MallBadgeIcon />
      </span>
      <span className="product-card-chip-mall-label">Mall</span>
    </span>
  )
}

function PriceDropShrinkIcon() {
  return (
    <img
      className="product-card-less-today-icon-img"
      src={publicUrl('/badges/price-drop-shrink-icon.svg')}
      alt=""
      width={14}
      height={14}
      decoding="async"
      aria-hidden
    />
  )
}

function TopRatedStarIcon() {
  return (
    <svg
      className="product-card-quality-top-quality-star-svg"
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
    >
      <path
        d="M6 1.15L7.42 4.48L11.02 4.88L8.32 7.35L9.12 10.95L6 9.12L2.88 10.95L3.68 7.35L0.98 4.88L4.58 4.48L6 1.15Z"
        fill="currentColor"
      />
    </svg>
  )
}

function PdpBagIcon() {
  return (
    <svg className="product-card-quality-social-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M3 4V3.2a3 3 0 0 1 6 0V4h1.4l.5 6.2a.6.6 0 0 1-.6.65H1.7a.6.6 0 0 1-.6-.65L1.6 4H3Zm1.2 0h3.6v-.8a1.8 1.8 0 0 0-3.6 0V4Z" fill="currentColor" />
    </svg>
  )
}

function PdpCameraIcon() {
  return (
    <svg className="product-card-quality-social-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M4.3 2.2h3.4l.7 1H10a1 1 0 0 1 1 1v5A1 1 0 0 1 10 10.2H2A1 1 0 0 1 1 9.2v-5a1 1 0 0 1 1-1h1.6l.7-1Z" stroke="currentColor" strokeWidth="0.9" fill="none" />
      <circle cx="6" cy="6.6" r="1.9" stroke="currentColor" strokeWidth="0.9" fill="none" />
    </svg>
  )
}

function PdpQualitySocialTag({ icon, label, variant }) {
  return (
    <span
      className={`product-card-quality-tag product-card-quality-tag--pill product-card-quality-tag--social product-card-quality-tag--social-${variant} pdp-tags-quality-tag`}
    >
      <span className="product-card-quality-social-icon-wrap" aria-hidden>
        {icon}
      </span>
      <span className="product-card-quality-tag-label product-card-quality-tag-label--social">{label}</span>
    </span>
  )
}

function PdpQualityTag({ tag, keepRatePercent, purchaseCount }) {
  if (tag === 'sold_recently') {
    return <PdpQualitySocialTag variant="velocity" icon={<PdpBagIcon />} label="10+ sold recently" />
  }
  if (tag === 'bought_this_week') {
    return <PdpQualitySocialTag variant="velocity" icon={<PdpBagIcon />} label="500+ bought this week" />
  }
  if (tag === 'image_reviews') {
    return <PdpQualitySocialTag variant="photos" icon={<PdpCameraIcon />} label="100 user images added" />
  }
  if (tag === 'geo_velocity') {
    return <PdpQualitySocialTag variant="velocity" icon={<PdpBagIcon />} label={`${formatPurchaseCount(purchaseCount)} people purchased`} />
  }
  if (tag === 'gold') {
    return (
      <span className="product-card-quality-tag product-card-quality-tag--gold pdp-tags-quality-tag">
        <span className="product-card-quality-gold-inner pdp-tags-gold-inner">
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
      <span
        className="product-card-quality-tag product-card-quality-tag--trusted pdp-tags-quality-tag"
        aria-label="m-Trusted"
      >
        <MTrustedBadgeIcon />
      </span>
    )
  }
  if (tag === 'less_returned') {
    const keepLabel = formatPdpKeepRateLabel(keepRatePercent)
    return (
      <span
        className="product-card-quality-tag product-card-quality-tag--pill product-card-quality-tag--less-returned pdp-tags-quality-tag"
        aria-label={keepLabel}
      >
        <span className="product-card-quality-keep-pill-icon-wrap" aria-hidden>
          <KeepRatePillIcon />
        </span>
        <span className="product-card-quality-tag-label product-card-quality-tag-label--less-returned pdp-tags-less-returned-label">
          {keepLabel}
        </span>
      </span>
    )
  }
  if (tag === 'top_quality') {
    return (
      <span className="product-card-quality-tag product-card-quality-tag--pill product-card-quality-tag--top-quality pdp-tags-quality-tag">
        <TopRatedStarIcon />
        <span className="product-card-quality-tag-label product-card-quality-tag-label--top-quality">
          Top Quality
        </span>
      </span>
    )
  }
  return null
}

function PdpDealTimerRow({ productId, globalIndex, prefix }) {
  const label = useDealTimer(productId, globalIndex, true)
  if (!label) return null
  return (
    <div className="pdp-tags-price-row2 pdp-tags-deal-timer-row">
      <span className="pdp-tags-deal-timer-prefix">{prefix}</span>
      <span className="product-card-deal-timer pdp-tags-deal-timer-pill">
        <img className="pdps-deal-timer-icon" src={pdpsDealTimerIcon} alt="" aria-hidden />
        {label}
      </span>
    </div>
  )
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function formatRatingDisplay(value) {
  const n = Math.min(4.9, Math.max(0, Number(value ?? 0)))
  return n.toFixed(1)
}

/* The pink selection label ("Among the Best of 2026", "Trending in Bengaluru",
   "#N bestseller in …", trend names) and the "New Arrival" chip are no longer shown
   on the product page. */
export function PdpTitleRow({ title, isMall, flavour, actions }) {
  return (
    <div className="pdp-title-row">
      <div className="pdp-title-wrap">
        {isMall && <PdpMallPill />}
        <h1 className="pdp-title">{title}</h1>
      </div>
      {actions}
    </div>
  )
}

export function PdpPriceTags({ flavour, productId }) {
  const hasUpi = SHOW_PLP_UPI_PRIMARY_TAG && flavour.primaryPriceTag === 'upi'
  const hasSale = flavour.primaryPriceTag === 'sale'
  const hasCombo = flavour.primaryPriceTag === 'combo_offer'
  const { showMrp, showPctOff, discountPct } = getOptimizedPriceFloor(flavour)
  const showLessToday = flavour.priceConsiderationTag === 'less_today' && !flavour.dealTimer
  const showLowestPrice =
    flavour.priceConsiderationTag === 'lowest_price_30d' && !flavour.dealTimer

  const considerationLabel = getPriceConsiderationLabel(flavour)

  return (
    <div className="pdp-tags">
      <div className="pdp-tags-price-row1">
        <div
          className={`product-card-price-floor${
            hasUpi || hasSale || hasCombo ? ' product-card-price-floor--has-offer' : ''
          }${hasUpi ? ' product-card-price-floor--upi' : ''}`}
        >
          <span className="product-card-price-final pdp-price">₹{flavour.price}</span>
          {showMrp && <span className="product-card-price-mrp pdp-mrp">{flavour.mrp}</span>}
          {showPctOff && (
            <span className="product-card-price-discount pdp-discount">{discountPct}% off</span>
          )}
          <img className="pdps-price-info" src={pdpsInfoIcon} alt="" aria-hidden />
          {/* the "Price Drop" badge is no longer shown on the product page */}
        </div>
        {hasSale && <PlpSaleMarker />}
        {hasCombo && <PlpComboMarker />}
      </div>

      {/* SoT UPI pill: the price above is the online (UPI) price and COD costs more,
          so the pill shows whenever there is a COD price */}
      {flavour.codPayable != null && (
        <div className="pdps-upi-offer">
          <img className="pdps-upi-offer-notch" src={pdpsUpiNotch} alt="" aria-hidden />
          <img className="pdps-upi-offer-icon" src={pdpsUpiIcon} alt="" aria-hidden />
          <span className="pdps-upi-offer-text">
            <span className="pdps-upi-offer-title">UPI Offer</span>
            <span className="pdps-upi-offer-sub">applied for you!</span>
          </span>
        </div>
      )}

      {showLessToday && (
        <div className="pdp-tags-price-row2 pdp-tags-less-today-row">
          <span className="product-card-less-today-icon" aria-hidden>
            <PriceDropShrinkIcon />
          </span>
          <span className="product-card-less-today-label">{considerationLabel}</span>
        </div>
      )}

      {showLowestPrice && considerationLabel && (
        <div className="pdp-tags-price-row2">
          <PlpPriceConsiderationMarker tag="lowest_price_30d" label={considerationLabel} />
        </div>
      )}

      {flavour.codPayable != null && (
        <p className="pdp-tags-cod">
          <span className="pdps-cod-amount">₹{flavour.codPayable}</span> with COD
        </p>
      )}

      <p className="pdps-free-delivery">Free Delivery</p>

      {flavour.dealTimer && (
        <PdpDealTimerRow
          productId={productId}
          globalIndex={flavour.globalIndex}
          prefix={getPdpDealTimerPrefix(flavour)}
        />
      )}
    </div>
  )
}

export function PdpQualityRow({ flavour }) {
  return (
    <div className="product-card-quality-block pdp-tags-quality-row">
      <div className="product-card-quality-floor pdp-tags-quality-floor">
        <span className="pdp-rating-chip">
          {formatRatingDisplay(flavour.rating)}
          <img className="pdps-rating-star" src={pdpsRatingStar} alt="" aria-hidden />
        </span>
        <span className="pdp-rating-extra">
          ({Number(flavour.ratingCountRaw ?? flavour.ratingCount ?? 0).toLocaleString('en-IN')})
        </span>
      </div>
      {/* the product page keeps only the Gold / m-Trusted badges here; hidden: "10+ sold
          recently", "100 user images added", "N% people keep it", "Top Quality",
          "N+ bought this week", "N people purchased" */}
      {flavour.qualityTag &&
        ![
          'sold_recently',
          'image_reviews',
          'less_returned',
          'top_quality',
          'bought_this_week',
          'geo_velocity',
        ].includes(flavour.qualityTag) && (
        <PdpQualityTag
          tag={flavour.qualityTag}
          keepRatePercent={flavour.keepRatePercent}
          purchaseCount={flavour.purchaseCount}
        />
      )}
    </div>
  )
}
