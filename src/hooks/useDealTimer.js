import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createDealTimerEndMs,
  DEAL_TIMER_RESET_THRESHOLD_MS,
  formatDealTimerRemaining,
} from '../utils/dealTimer'

/**
 * Live deal countdown — fresh random duration (1m–3h) on each prototype launch.
 * When remaining drops below 1 minute, rolls a new 1m–3h duration.
 */
export function useDealTimer(productId, globalIndex, enabled) {
  const endMsRef = useRef(null)
  const [label, setLabel] = useState(null)

  const rollDuration = useCallback(() => {
    const nextEnd = createDealTimerEndMs()
    endMsRef.current = nextEnd
    return nextEnd
  }, [])

  useEffect(() => {
    if (!enabled) {
      endMsRef.current = null
      setLabel(null)
      return undefined
    }

    rollDuration()

    const tick = () => {
      let remaining = endMsRef.current - Date.now()
      if (remaining <= DEAL_TIMER_RESET_THRESHOLD_MS) {
        rollDuration()
        remaining = endMsRef.current - Date.now()
      }
      setLabel(formatDealTimerRemaining(remaining))
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [enabled, rollDuration, productId, globalIndex])

  return label
}
