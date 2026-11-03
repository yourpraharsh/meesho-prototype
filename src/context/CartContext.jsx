import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { DELIVERY_TYPE } from '../utils/deliveryTypes'

/**
 * The cart: lines of { key, productId, selectedOptions, returnTypeId, sizeLabel, returnTypeLabel,
 * qty }, i.e. the PDP's checkout state (buildCheckoutState) plus the product and a quantity.
 * Products are looked up again from productId wherever they are shown (computeCartOrder), so
 * prices always come from the same source as the Buy Now flow.
 * Kept in sessionStorage like the rest of the prototype's session (orders, PIN, cohort).
 */
const STORAGE_KEY = 'meesho-cart'
const MAX_QTY = 10
/** useCheckoutAddress persistKey shared by the cart flow's pages (cart, review, payment). */
export const CART_ADDRESS_KEY = 'meesho-cart-address'
/* Home delivery vs store pickup (and the store) for the whole cart, chosen on the cart review
   (step 2) and remembered, so leaving for the cart and coming back keeps it. */
const DELIVERY_KEY = 'meesho-cart-delivery'
const DEFAULT_DELIVERY = { deliveryTypeId: DELIVERY_TYPE.HOME, storeId: null }

const CartContext = createContext(null)

function loadStored() {
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.filter((it) => it && it.key && it.productId) : []
  } catch {
    return []
  }
}

function saveStored(items) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* storage unavailable: the cart lives for this page only */
  }
}

function loadDelivery() {
  try {
    return { ...DEFAULT_DELIVERY, ...JSON.parse(window.sessionStorage.getItem(DELIVERY_KEY) || '{}') }
  } catch {
    return DEFAULT_DELIVERY
  }
}

/** One line per product + selected options + return type; adding the same again bumps its qty. */
export function cartLineKey(productId, selectedOptions = {}, returnTypeId = 'all_easy') {
  const opts = Object.keys(selectedOptions)
    .sort()
    .map((k) => `${k}=${selectedOptions[k]}`)
    .join('&')
  return `${productId}|${opts}|${returnTypeId}`
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadStored)
  const itemsRef = useRef(items)
  itemsRef.current = items

  useEffect(() => {
    saveStored(items)
  }, [items])

  const [delivery, setDeliveryState] = useState(loadDelivery)
  useEffect(() => {
    try {
      window.sessionStorage.setItem(DELIVERY_KEY, JSON.stringify(delivery))
    } catch {
      /* storage unavailable: the choice lives for this page only */
    }
  }, [delivery])
  /** Merge { deliveryTypeId?, storeId? } into the cart's delivery choice. */
  const setDelivery = useCallback((patch) => setDeliveryState((prev) => ({ ...prev, ...patch })), [])

  /** Add a product (checkout state from buildCheckoutState + productId). Returns the line key. */
  const addItem = useCallback(({ productId, selectedOptions = {}, returnTypeId = 'all_easy', sizeLabel = null, returnTypeLabel = null, qty = 1 }) => {
    const key = cartLineKey(productId, selectedOptions, returnTypeId)
    setItems((prev) => {
      const i = prev.findIndex((it) => it.key === key)
      if (i >= 0) {
        const next = [...prev]
        next[i] = { ...next[i], qty: Math.min(MAX_QTY, next[i].qty + qty) }
        return next
      }
      return [...prev, { key, productId, selectedOptions, returnTypeId, sizeLabel, returnTypeLabel, qty: Math.min(MAX_QTY, qty) }]
    })
    return key
  }, [])

  /** Remove a line. Returns the removed line (or null). */
  const removeItem = useCallback((key) => {
    const line = itemsRef.current.find((it) => it.key === key) || null
    setItems((prev) => prev.filter((it) => it.key !== key))
    return line
  }, [])

  const setQty = useCallback((key, qty) => {
    const q = Math.max(1, Math.min(MAX_QTY, Math.round(qty) || 1))
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, qty: q } : it)))
  }, [])

  /** Change a line's size / options (e.g. from a size picker); merges into an identical line. */
  const updateItem = useCallback((key, patch) => {
    setItems((prev) => {
      const i = prev.findIndex((it) => it.key === key)
      if (i < 0) return prev
      const updated = { ...prev[i], ...patch }
      updated.key = cartLineKey(updated.productId, updated.selectedOptions, updated.returnTypeId)
      const rest = prev.filter((_, j) => j !== i)
      const dup = rest.findIndex((it) => it.key === updated.key)
      if (dup >= 0) {
        rest[dup] = { ...rest[dup], qty: Math.min(MAX_QTY, rest[dup].qty + updated.qty) }
        return rest
      }
      rest.splice(i, 0, updated)
      return rest
    })
  }, [])

  /* the cart is bought: next cart starts empty, on home delivery */
  const clear = useCallback(() => {
    setItems([])
    setDeliveryState(DEFAULT_DELIVERY)
  }, [])

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((n, it) => n + (it.qty || 1), 0),
      addItem,
      removeItem,
      setQty,
      updateItem,
      clear,
      delivery,
      setDelivery,
    }),
    [items, addItem, removeItem, setQty, updateItem, clear, delivery, setDelivery],
  )
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
