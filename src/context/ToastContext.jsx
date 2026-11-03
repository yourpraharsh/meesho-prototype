import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import infoIcon from '../assets/cart-sot/cart-snackbar-info.svg'
import heartIcon from '../assets/cart-sot/cart-snackbar-heart.svg'
import '../styles/cart-sot/toast.css'

/**
 * App-wide snackbar (Figma cart file utVjj3B1srPjlUd1kWDvGs · 1:2397 / 1:3167): dark #333
 * bar, white Demi 13/16 text, optional icon and an outlined action. One at a time; a new
 * one replaces the last. Rendered by <ToastHost/> inside the app screen (so it stays on the
 * device screen in the Duo preview).
 *
 *   const { show } = useToast()
 *   show({ text, icon: 'info' | 'heart', action: { label, onClick }, offset: 76, duration })
 * `offset` (px) lifts it above a page's sticky footer. It closes when the page changes, so a
 * "View Cart" action never outlives the page that offered it.
 */
const ToastContext = createContext(null)
const ICONS = { info: infoIcon, heart: heartIcon }

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const idRef = useRef(0)

  const hide = useCallback(() => setToast(null), [])
  /* close one particular toast (not a newer one that replaced it) */
  const hideToast = useCallback((id) => setToast((t) => (t?.id === id ? null : t)), [])
  const show = useCallback((opts) => {
    idRef.current += 1
    setToast({ id: idRef.current, duration: 3200, offset: 16, ...opts })
  }, [])

  const value = useMemo(() => ({ toast, show, hide, hideToast }), [toast, show, hide, hideToast])
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastHost() {
  const { toast, hide, hideToast } = useToast()
  const { pathname } = useLocation()

  useEffect(() => {
    if (!toast) return undefined
    const id = setTimeout(hide, toast.duration)
    return () => clearTimeout(id)
  }, [toast, hide])

  useEffect(() => {
    hide()
  }, [pathname, hide])

  if (!toast) return null
  const icon = ICONS[toast.icon]
  return (
    <div key={toast.id} className="app-toast" role="status" style={{ '--toast-offset': `${toast.offset}px` }}>
      {icon && <img className="app-toast-icon" src={icon} alt="" aria-hidden />}
      <span className="app-toast-text">{toast.text}</span>
      {toast.action && (
        <button
          type="button"
          className="app-toast-action"
          onClick={() => {
            /* the action may show a follow-up toast; only this one closes */
            const { id } = toast
            toast.action.onClick?.()
            hideToast(id)
          }}
        >
          {toast.action.label}
        </button>
      )}
    </div>
  )
}
