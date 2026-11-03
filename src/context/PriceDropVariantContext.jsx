import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  DEFAULT_PRICE_DROP_VARIANT,
  isValidPriceDropVariant,
  PRICE_DROP_VARIANT_STORAGE_KEY,
} from '../constants/priceDropVariant'

const PriceDropVariantContext = createContext(null)

function readStoredVariant() {
  try {
    const raw = localStorage.getItem(PRICE_DROP_VARIANT_STORAGE_KEY)
    if (raw && isValidPriceDropVariant(raw)) return raw
  } catch {
    /* ignore */
  }
  return DEFAULT_PRICE_DROP_VARIANT
}

export function PriceDropVariantProvider({ children }) {
  const [variantId, setVariantIdState] = useState(readStoredVariant)

  const setVariantId = useCallback((next) => {
    if (!isValidPriceDropVariant(next)) return
    setVariantIdState(next)
    try {
      localStorage.setItem(PRICE_DROP_VARIANT_STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(
    () => ({ variantId, setVariantId }),
    [variantId, setVariantId]
  )

  return (
    <PriceDropVariantContext.Provider value={value}>
      {children}
    </PriceDropVariantContext.Provider>
  )
}

export function usePriceDropVariant() {
  const ctx = useContext(PriceDropVariantContext)
  if (!ctx) {
    throw new Error('usePriceDropVariant must be used within PriceDropVariantProvider')
  }
  return ctx
}
