import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'shopx-wishlist'

const WishlistContext = createContext(null)

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch (_) {}
  return []
}

function saveStored(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch (_) {}
}

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(loadStored)

  useEffect(() => {
    saveStored(ids)
  }, [ids])

  const toggle = useCallback((productId) => {
    setIds((prev) => {
      const set = new Set(prev)
      if (set.has(productId)) set.delete(productId)
      else set.add(productId)
      return [...set]
    })
  }, [])

  const has = useCallback((productId) => ids.includes(productId), [ids])

  const value = { wishlistIds: ids, toggle, has }
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
