// Tests for the aiSessions module-label resolver
// (server/utils/studioAiSessionModule.ts): valid slugs pass through,
// everything untrusted falls back to the historical 'brand-builder'.
//
// Runner: `tsx app/__tests__/studio/studioAiSessionModule.test.ts`
// (or `npm run test:studio-ai-session-module`).

import { strict as assert } from 'node:assert'
import {
  DEFAULT_STUDIO_SESSION_MODULE,
  resolveStudioSessionModule
} from '../../../server/utils/studioAiSessionModule'

interface Test {
  name: string
  fn: () => void
}

const tests: Test[] = []
const test = (name: string, fn: () => void) => tests.push({ name, fn })

test('default is the historical brand-builder label', () => {
  assert.equal(DEFAULT_STUDIO_SESSION_MODULE, 'brand-builder')
})

test('known tool sources pass through unchanged', () => {
  assert.equal(resolveStudioSessionModule('brand-builder'), 'brand-builder')
  assert.equal(resolveStudioSessionModule('resume-builder'), 'resume-builder')
  assert.equal(resolveStudioSessionModule('linkedin-builder'), 'linkedin-builder')
  assert.equal(
    resolveStudioSessionModule('personal-brand-proof-story-bank'),
    'personal-brand-proof-story-bank'
  )
})

test('input is trimmed and lowercased before validation', () => {
  assert.equal(resolveStudioSessionModule('  Resume-Builder  '), 'resume-builder')
})

test('missing or non-string source falls back to the default', () => {
  assert.equal(resolveStudioSessionModule(undefined), DEFAULT_STUDIO_SESSION_MODULE)
  assert.equal(resolveStudioSessionModule(null), DEFAULT_STUDIO_SESSION_MODULE)
  assert.equal(resolveStudioSessionModule(42), DEFAULT_STUDIO_SESSION_MODULE)
  assert.equal(resolveStudioSessionModule({}), DEFAULT_STUDIO_SESSION_MODULE)
  assert.equal(resolveStudioSessionModule(['brand-builder']), DEFAULT_STUDIO_SESSION_MODULE)
})

test('malformed strings fall back to the default', () => {
  assert.equal(resolveStudioSessionModule(''), DEFAULT_STUDIO_SESSION_MODULE)
  assert.equal(resolveStudioSessionModule('   '), DEFAULT_STUDIO_SESSION_MODULE)
  assert.equal(resolveStudioSessionModule('-leading-dash'), DEFAULT_STUDIO_SESSION_MODULE)
  assert.equal(resolveStudioSessionModule('has spaces inside'), DEFAULT_STUDIO_SESSION_MODULE)
  assert.equal(resolveStudioSessionModule('emoji-🧪'), DEFAULT_STUDIO_SESSION_MODULE)
  assert.equal(resolveStudioSessionModule('a/b'), DEFAULT_STUDIO_SESSION_MODULE)
  assert.equal(resolveStudioSessionModule('x'.repeat(80)), DEFAULT_STUDIO_SESSION_MODULE)
})

test('64-char slug is the maximum accepted length', () => {
  const max = `a${'b'.repeat(63)}`
  assert.equal(resolveStudioSessionModule(max), max)
  assert.equal(resolveStudioSessionModule(`${max}c`), DEFAULT_STUDIO_SESSION_MODULE)
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
