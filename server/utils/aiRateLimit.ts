// AI per-user daily rate limit — Architectural Scaffolding sprint.
//
// V1 in-memory implementation. Bounds the worst-case cost of a
// runaway client OR a credentialed bad actor by capping calls per
// user per UTC day.
//
// Posture (do not relax in V1):
//   - In-memory only. Resets on server restart. This is acceptable
//     for V1: the worst case after a restart is 25 additional calls
//     per user, which is well within the cost envelope.
//   - Per-instance. App Hosting may run multiple instances; each
//     instance keeps its own counter. The effective limit is
//     (DAILY_LIMIT × instance count). With minInstances=0,
//     maxInstances=2 in apphosting.yaml, that's at most 50/day per
//     user — still bounded.
//   - When this becomes too loose for cost control, graduate to a
//     Firestore-backed counter document (write per call). The
//     interface here is the same so the swap is internal.
//   - Counter increments only AFTER a successful provider call.
//     Pre-flight rejection (auth, payload too large, bad mode)
//     does not consume the user's daily budget.

const DAILY_LIMIT = 25

interface DailyCounter {
  utcDate: string
  count: number
}

const counters = new Map<string, DailyCounter>()

function utcDateKey(): string {
  const d = new Date()
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Returns true if `uid` would be allowed to make another call today,
 * false if they have already hit the daily limit. Does NOT increment
 * the counter — call `recordSuccessfulCall` after the provider call
 * succeeds.
 */
export function withinDailyLimit(uid: string): boolean {
  if (!uid) return false
  const today = utcDateKey()
  const existing = counters.get(uid)
  if (!existing || existing.utcDate !== today) return true
  return existing.count < DAILY_LIMIT
}

/**
 * Increment the user's daily counter. Call after a successful
 * provider response so failed pre-flight checks don't consume the
 * budget.
 */
export function recordSuccessfulCall(uid: string): void {
  if (!uid) return
  const today = utcDateKey()
  const existing = counters.get(uid)
  if (!existing || existing.utcDate !== today) {
    counters.set(uid, { utcDate: today, count: 1 })
    return
  }
  existing.count += 1
}

/**
 * Configured daily limit. Exposed so the endpoint can include the
 * limit in error messages without re-reading this module.
 */
export const AI_DAILY_LIMIT = DAILY_LIMIT
