/** Initial + rollover range: 1 minute to 3 hours. */
export const DEAL_TIMER_MIN_SECONDS = 60
export const DEAL_TIMER_MAX_SECONDS = 3 * 60 * 60

/** When remaining time drops below this, roll a fresh duration. */
export const DEAL_TIMER_RESET_THRESHOLD_MS = DEAL_TIMER_MIN_SECONDS * 1000

/** Random duration in ms between min and max (inclusive). */
export function randomDealTimerDurationMs(
  minSeconds = DEAL_TIMER_MIN_SECONDS,
  maxSeconds = DEAL_TIMER_MAX_SECONDS,
) {
  const min = Math.max(1, Math.floor(minSeconds))
  const max = Math.max(min, Math.floor(maxSeconds))
  const span = max - min + 1
  return (min + Math.floor(Math.random() * span)) * 1000
}

export function createDealTimerEndMs(now = Date.now()) {
  return now + randomDealTimerDurationMs()
}

/** Figma format: `2h : 21m : 23s` or `45m : 12s` when under 1 hour. */
export function formatDealTimerRemaining(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const sec = totalSec % 60
  if (h > 0) return `${h}h : ${m}m : ${sec}s`
  return `${m}m : ${sec}s`
}
