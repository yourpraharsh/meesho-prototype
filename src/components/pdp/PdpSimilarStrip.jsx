import { Link } from 'react-router-dom'
import { getHeroImageForProduct } from '../../data/categoryProductImages'
import './PdpSimilarStrip.css'
import similarNextIcon from '../../assets/pdp-sot/top/similar-next.svg'

const IMAGE_FALLBACK = 'https://placehold.co/120x160/f2f2f6/8b8ba3?text=Meesho'

/**
 * "N Similar Products" thumbnail strip (Figma Duo PDP): the current product first and
 * selected, then same-category alternatives. Tapping a thumb opens that product.
 */
export default function PdpSimilarStrip({ product, products, returnTo, onSeeAll, onNext }) {
  const items = [product, ...products.filter((p) => p.product_id !== product.product_id)].slice(0, 8)
  if (items.length < 2) return null
  return (
    <section className="pdp-similar" aria-label="Similar products">
      <div className="pdp-similar-head">
        <span className="pdp-similar-title">{items.length} Similar Products</span>
        {onSeeAll && (
          <button type="button" className="pdp-similar-all" onClick={onSeeAll}>
            View all
          </button>
        )}
      </div>
      <div className="pdp-similar-row">
        {items.map((p, i) => {
          const src = getHeroImageForProduct(p) || p.hero_image_url || IMAGE_FALLBACK
          const thumb = (
            <img
              src={src}
              alt={p.title}
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = IMAGE_FALLBACK
              }}
            />
          )
          return i === 0 ? (
            <span key={p.product_id} className="pdp-similar-thumb pdp-similar-thumb--current" aria-current="true">
              {thumb}
            </span>
          ) : (
            <Link
              key={p.product_id}
              to={`/product/${p.product_id}`}
              state={{ returnTo }}
              className="pdp-similar-thumb"
              title={p.title}
            >
              {thumb}
            </Link>
          )
        })}
      </div>
      {onNext && (
        <button type="button" className="pdps-similar-next" aria-label="See more similar products" onClick={onNext}>
          <img src={similarNextIcon} alt="" />
        </button>
      )}
    </section>
  )
}
