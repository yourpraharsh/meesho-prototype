import { useCallback, useEffect, useState } from 'react'

/**
 * A short-lived flag, e.g. a "Copied" label: flash(key) sets it, and it clears itself after
 * `ms`. Flashing again restarts the timer.
 */
export function useFlash(ms = 2000) {
  const [state, setState] = useState({ key: null, n: 0 })
  useEffect(() => {
    if (state.key == null) return undefined
    const t = window.setTimeout(() => setState((s) => ({ ...s, key: null })), ms)
    return () => window.clearTimeout(t)
  }, [state.key, state.n, ms])
  const flash = useCallback((key = true) => setState((s) => ({ key, n: s.n + 1 })), [])
  return [state.key, flash]
}
