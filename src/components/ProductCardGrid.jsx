import { useMemo } from 'react'
import ProductCard from './ProductCard'
import { usePlpCardVariant } from '../context/PlpCardVariantContext'
import { useCohort } from '../context/CohortContext'
import { isUniformGridVariant } from '../utils/plpCardFlavour'

/**
 * Stagger variants (V01–V03): masonry columns (2 by default).
 * Simplify variants (V04–V07): uniform CSS grid, no stagger.
 * `columns` widens either layout for large displays (e.g. the iPhone Duo inner display).
 */
export default function ProductCardGrid({
  products,
  className = 'product-card-masonry',
  returnTo = '/',
  onNavigate,
  isWishlisted,
  onWishlistToggle,
  columns = 2,
}) {
  const { variantId } = usePlpCardVariant()
  const { flavourOptions } = useCohort()
  const useUniformGrid = isUniformGridVariant(variantId)

  const cols = Math.max(1, columns)
  const buckets = useMemo(() => {
    const out = Array.from({ length: cols }, () => [])
    products.forEach((product, index) => out[index % cols].push({ product, index }))
    return out
  }, [products, cols])
  /* stagger patterns alternate left/right, so wider grids reuse that rhythm */
  const sideOf = (colIdx) => (colIdx % 2 === 0 ? 'left' : 'right')

  if (useUniformGrid) {
    return (
      <div
        className={`${className} product-card-grid${cols !== 2 ? ` product-card-grid--wide product-card-grid--cols-${cols}` : ''}`}
        style={cols !== 2 ? { '--grid-cols': cols } : undefined}
      >
        {products.map((product, globalIndex) => (
          <ProductCard
            key={product._feedKey ?? product.product_id}
            product={product}
            globalIndex={globalIndex}
            columnIndex={globalIndex}
            column={sideOf(globalIndex % cols)}
            returnTo={returnTo}
            onNavigate={onNavigate}
            isWishlisted={isWishlisted?.(product.product_id)}
            onWishlistToggle={onWishlistToggle}
            flavourOptions={flavourOptions}
          />
        ))}
      </div>
    )
  }

  const renderColumn = (items, side, colIdx) => (
    <div
      key={colIdx}
      className={`product-card-column product-card-column--${side}${colIdx === cols - 1 && cols !== 2 ? ' product-card-column--last' : ''}`}
    >
      {items.map(({ product, index: globalIndex }, columnIndex) => (
        <ProductCard
          key={product._feedKey ?? product.product_id}
          product={product}
          globalIndex={globalIndex}
          columnIndex={columnIndex}
          column={side}
          returnTo={returnTo}
          onNavigate={onNavigate}
          isWishlisted={isWishlisted?.(product.product_id)}
          onWishlistToggle={onWishlistToggle}
          flavourOptions={flavourOptions}
        />
      ))}
    </div>
  )

  return (
    <div className={`${className}${cols !== 2 ? ' product-card-masonry--wide' : ''}`}>
      {buckets.map((items, colIdx) => renderColumn(items, sideOf(colIdx), colIdx))}
    </div>
  )
}
