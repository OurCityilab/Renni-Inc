// Tests for server/utils/studioAiRateLimit.ts — config parsing and
// per-user daily counter behavior for Our City Studio's AI Sherpa
// endpoint. Independent from server/utils/aiRateLimit.ts (Renni).
//
// Runner: `tsx app/__tests__/studio/studioAiRateLimit.test.ts`
// (or `npm run test:studio-ai-rate-limit`).

import { strict as assert } from 'node:assert'
import {
  DEFAULT_STUDIO_AI_DAILY_LIMIT,
  recordSuccessfulStudioCall,
  resolveStudioAiDailyLimit,
  withinStudioDailyLimit,
  _resetStudioAiRateLimitForTests
} from '../../../server/utils/studioAiRateLimit'

interface Test {
  name: string
  fn: () => void
}

const tests: Test[] = []
const test = (name: string, fn: () => void) => tests.push({ name, fn })

// ---------- resolveStudioAiDailyLimit (config parsing) ----------

test('resolveStudioAiDailyLimit: empty string falls back to the default', () => {
  assert.equal(resolveStudioAiDailyLimit(''), DEFAULT_STUDIO_AI_DAILY_LIMIT)
})

test('resolveStudioAiDailyLimit: undefined falls back to the default', () => {
  assert.equal(resolveStudioAiDailyLimit(undefined), DEFAULT_STUDIO_AI_DAILY_LIMIT)
})

test('resolveStudioAiDailyLimit: a valid numeric string is honored', () => {
  assert.equal(resolveStudioAiDailyLimit('10'), 10)
})

test('resolveStudioAiDailyLimit: non-numeric strings fall back to the default', () => {
  assert.equal(resolveStudioAiDailyLimit('not-a-number'), DEFAULT_STUDIO_AI_DAILY_LIMIT)
})

test('resolveStudioAiDailyLimit: zero falls back to the default', () => {
  assert.equal(resolveStudioAiDailyLimit('0'), DEFAULT_STUDIO_AI_DAILY_LIMIT)
})

test('resolveStudioAiDailyLimit: a negative value falls back to the default', () => {
  assert.equal(resolveStudioAiDailyLimit('-5'), DEFAULT_STUDIO_AI_DAILY_LIMIT)
})

test('resolveStudioAiDailyLimit: a fractional value is floored', () => {
  assert.equal(resolveStudioAiDailyLimit('3.7'), 3)
})

// ---------- withinStudioDailyLimit / recordSuccessfulStudioCall ----------

test('rate limit: a fresh uid is within the limit', () => {
  _resetStudioAiRateLimitForTests()
  assert.equal(withinStudioDailyLimit('student-a', 3), true)
})

test('rate limit: an empty uid is never within the limit', () => {
  _resetStudioAiRateLimitForTests()
  assert.equal(withinStudioDailyLimit('', 3), false)
})

test('rate limit: stays within the limit until the count is reached, then blocks', () => {
  _resetStudioAiRateLimitForTests()
  const uid = 'student-b'
  const limit = 3
  for (let i = 0; i < limit; i += 1) {
    assert.equal(withinStudioDailyLimit(uid, limit), true, `call ${i + 1} should be allowed`)
    recordSuccessfulStudioCall(uid)
  }
  assert.equal(withinStudioDailyLimit(uid, limit), false)
})

test('rate limit: pre-flight rejection does not consume the budget', () => {
  _resetStudioAiRateLimitForTests()
  const uid = 'student-c'
  const limit = 1
  recordSuccessfulStudioCall(uid)
  assert.equal(withinStudioDailyLimit(uid, limit), false)
  // Checking again (simulating a second rejected request) does not
  // change the outcome — only recordSuccessfulStudioCall mutates state.
  assert.equal(withinStudioDailyLimit(uid, limit), false)
})

test('rate limit: counters are independent per uid', () => {
  _resetStudioAiRateLimitForTests()
  const limit = 1
  recordSuccessfulStudioCall('student-d')
  assert.equal(withinStudioDailyLimit('student-d', limit), false)
  assert.equal(withinStudioDailyLimit('student-e', limit), true)
})

/* -------------------------------------------------------------------
 * Runner
 * ------------------------------------------------------------------ */

let failed = 0
for (const t of tests) {
  try {
    t.fn()
    // eslint-disable-next-line no-console
    console.log(`ok  - ${t.name}`)
  } catch (err) {
    failed++
    // eslint-disable-next-line no-console
    console.error(`FAIL - ${t.name}`)
    console.error(err)
  }
}

if (failed > 0) {
  // eslint-disable-next-line no-console
  console.error(`\n${failed} test(s) failed`)
  process.exit(1)
}
// eslint-disable-next-line no-console
console.log(`\n${tests.length} passed`)
