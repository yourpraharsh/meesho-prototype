import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  DEFAULT_PLP_CARD_VARIANT,
  isValidPlpCardVariant,
  PLP_VARIANT_STORAGE_KEY,
} from '../constants/plpCardVariant'

const PlpCardVariantContext = createContext(null)

function readStoredVariant() {
  try {
    const raw = localStorage.getItem(PLP_VARIANT_STORAGE_KEY)
    if (raw && isValidPlpCardVariant(raw)) return raw
  } catch {
    /* ignore */
  }
  return DEFAULT_PLP_CARD_VARIANT
}

export function PlpCardVariantProvider({ children }) {
  const [variantId, setVariantIdState] = useState(readStoredVariant)

  const setVariantId = useCallback((next) => {
    if (!isValidPlpCardVariant(next)) return
    setVariantIdState(next)
    try {
      localStorage.setItem(PLP_VARIANT_STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(
    () => ({ variantId, setVariantId }),
    [variantId, setVariantId]
  )

  return (
    <PlpCardVariantContext.Provider value={value}>
      {children}
    </PlpCardVariantContext.Provider>
  )
}

export function usePlpCardVariant() {
  const ctx = useContext(PlpCardVariantContext)
  if (!ctx) {
    throw new Error('usePlpCardVariant must be used within PlpCardVariantProvider')
  }
  return ctx
}
