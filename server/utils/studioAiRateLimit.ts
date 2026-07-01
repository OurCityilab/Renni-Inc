// Our City Studio AI daily rate limit — parallel to, but fully
// independent from, server/utils/aiRateLimit.ts (Renni Command
// Center). Studio keeps its own in-memory counter map so a busy
// Renni AI day and a busy Studio AI day never interact, and its
// own configurable limit (STUDIO_AI_DAILY_LIMIT) rather than
// Renni's hardcoded AI_DAILY_LIMIT.
//
// Posture (do not relax) — same as aiRateLimit.ts:
//   - In-memory only. Resets on server restart; per-instance.
//   - Counter increments only AFTER a successful call (real
//     provider or mock). Pre-flight rejection does not consume the
//     student's daily budget.

const DEFAULT_STUDIO_AI_DAILY_LIMIT = 50

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
 * Parses the configured STUDIO_AI_DAILY_LIMIT (a raw runtimeConfig
 * string, since env vars are always strings) into a positive
 * integer, falling back to the safe default when unset, blank,
 * non-numeric, zero, or negative.
 */
export function resolveStudioAiDailyLimit(configuredLimit: unknown): number {
  const n = Number(configuredLimit)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_STUDIO_AI_DAILY_LIMIT
}

/**
 * Returns true if `uid` would be allowed to make another Studio AI
 * call today, false if they have already hit `limit`. Does NOT
 * increment the counter — call `recordSuccessfulStudioCall` after
 * the call (real or mock) succeeds.
 */
export function withinStudioDailyLimit(uid: string, limit: number): boolean {
  if (!uid) return false
  const today = utcDateKey()
  const existing = counters.get(uid)
  if (!existing || existing.utcDate !== today) return true
  return existing.count < limit
}

/**
 * Increment the user's daily Studio AI counter. Call after a
 * successful response (real or mock) so failed pre-flight checks
 * don't consume the budget.
 */
export function recordSuccessfulStudioCall(uid: string): void {
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
 * Test-only escape hatch — clears the in-memory counter map so
 * repeated test runs (or a long-lived dev server) don't bleed state
 * across cases.
 */
export function _resetStudioAiRateLimitForTests(): void {
  counters.clear()
}

export { DEFAULT_STUDIO_AI_DAILY_LIMIT }
