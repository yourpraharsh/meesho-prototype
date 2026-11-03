import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

/**
 * iPhone Duo folded layout: pages (and overlays) publish the actions that live in the
 * right-hand rail (back, translate, search, wishlist, cart, profile, close…).
 * Registrations form a stack — an open sheet takes the rail over and the page's actions
 * return when it closes. Handlers are read fresh through a ref on every tap.
 */
const RailContext = createContext({ actions: [], overlay: false, register: () => () => {}, update: () => {} })

let nextToken = 1

export function RailProvider({ children }) {
  const stack = useRef([]) /* [{ token, actions, overlay }] */
  const [top, setTop] = useState({ actions: [], overlay: false })
  const publish = useCallback(() => {
    const t = stack.current[stack.current.length - 1]
    setTop(t ? { actions: t.actions, overlay: Boolean(t.overlay) } : { actions: [], overlay: false })
  }, [])
  const register = useCallback((token, acts, overlay) => {
    stack.current = [...stack.current.filter((e) => e.token !== token), { token, actions: acts, overlay }]
    publish()
    return () => {
      stack.current = stack.current.filter((e) => e.token !== token)
      publish()
    }
  }, [publish])
  const update = useCallback((token, acts) => {
    stack.current = stack.current.map((e) => (e.token === token ? { ...e, actions: acts } : e))
    publish()
  }, [publish])
  const value = useMemo(() => ({ actions: top.actions, overlay: top.overlay, register, update }), [top, register, update])
  return <RailContext.Provider value={value}>{children}</RailContext.Provider>
}

export function useRail() {
  return useContext(RailContext)
}

/**
 * `actions`: [{ id, icon, label, onClick?, active?, badge? }] — top-to-bottom order in the rail.
 * `badge` (e.g. the cart count) shows on the button when truthy.
 * `overlay: true` for sheets/pages that sit above the page (the rail then rises above their backdrop).
 */
export function useRailActions(actions, { overlay = false } = {}) {
  const { register, update } = useContext(RailContext)
  const tokenRef = useRef(null)
  if (tokenRef.current === null) tokenRef.current = nextToken++
  const latest = useRef(actions)
  latest.current = actions
  const key = actions.map((a) => `${a.id}:${a.active ? 1 : 0}:${a.badge ?? ''}`).join('|')
  const wrapped = () => latest.current.map((a, i) => ({ ...a, onClick: () => latest.current[i]?.onClick?.() }))
  useEffect(() => register(tokenRef.current, wrapped(), overlay), [register, overlay]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { update(tokenRef.current, wrapped()) }, [key, update]) // eslint-disable-line react-hooks/exhaustive-deps
}
