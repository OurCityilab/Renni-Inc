// Tests for the Brand Sherpa prompt template
// (server/utils/studioPromptTemplates/brandSherpa.ts): response
// shape validation and the deterministic mock generator.
//
// Runner: `tsx app/__tests__/studio/brandSherpa.test.ts`
// (or `npm run test:studio-brand-sherpa`). Uses Node's built-in
// `node:assert/strict`, matching the existing test files in
// app/__tests__/ — no vitest/jest dependency.

import { strict as assert } from 'node:assert'
import {
  brandSherpaTemplate,
  generateMockBrandSherpaResponse,
  type BrandSherpaPayload
} from '../../../server/utils/studioPromptTemplates/brandSherpa'

interface Test {
  name: string
  fn: () => void
}

const tests: Test[] = []
const test = (name: string, fn: () => void) => tests.push({ name, fn })

const FULL_PAYLOAD: BrandSherpaPayload = {
  whatYouCareAbout: 'helping younger kids feel confident in school',
  whyItMatters: 'my little brother struggled and nobody helped him',
  whoYouWantToHelp: 'middle schoolers who are falling behind',
  whatPeopleAskYouFor: 'tutoring help with math homework',
  futureYouAreBuilding: 'a tutoring program at my school'
}

const EMPTY_PAYLOAD: BrandSherpaPayload = {
  whatYouCareAbout: '',
  whyItMatters: '',
  whoYouWantToHelp: '',
  whatPeopleAskYouFor: '',
  futureYouAreBuilding: ''
}

// ---------- responseSchema (5-part Sherpa contract) ----------

test('responseSchema: accepts a well-formed 5-part response', () => {
  const parsed = brandSherpaTemplate.responseSchema({
    yourWords: 'raw student words',
    professionalVersion: 'I help middle schoolers with math.',
    whyItWorks: 'It leads with who you help.',
    whatIsMissing: ['a concrete example'],
    tryAgainQuestion: 'Can you name one specific student you helped?'
  })
  assert.equal(parsed.yourWords, 'raw student words')
  assert.equal(parsed.professionalVersion, 'I help middle schoolers with math.')
  assert.equal(parsed.whyItWorks, 'It leads with who you help.')
  assert.deepEqual(parsed.whatIsMissing, ['a concrete example'])
  assert.equal(parsed.tryAgainQuestion, 'Can you name one specific student you helped?')
})

test('responseSchema: rejects a non-object response', () => {
  assert.throws(() => brandSherpaTemplate.responseSchema('not an object'))
})

test('responseSchema: rejects a response missing a required string field', () => {
  assert.throws(() =>
    brandSherpaTemplate.responseSchema({
      yourWords: 'raw',
      professionalVersion: 'polished',
      whyItWorks: 'because',
      whatIsMissing: [],
      // tryAgainQuestion intentionally omitted
    })
  )
})

test('responseSchema: rejects whatIsMissing that is not a string array', () => {
  assert.throws(() =>
    brandSherpaTemplate.responseSchema({
      yourWords: 'raw',
      professionalVersion: 'polished',
      whyItWorks: 'because',
      whatIsMissing: [1, 2, 3],
      tryAgainQuestion: 'question?'
    })
  )
})

test('responseSchema: accepts an empty whatIsMissing array', () => {
  const parsed = brandSherpaTemplate.responseSchema({
    yourWords: 'raw',
    professionalVersion: 'polished',
    whyItWorks: 'because',
    whatIsMissing: [],
    tryAgainQuestion: 'question?'
  })
  assert.deepEqual(parsed.whatIsMissing, [])
})

// ---------- deterministic mock mode ----------

test('mock: returns all five Sherpa contract fields', () => {
  const result = generateMockBrandSherpaResponse(FULL_PAYLOAD)
  assert.equal(typeof result.yourWords, 'string')
  assert.equal(typeof result.professionalVersion, 'string')
  assert.equal(typeof result.whyItWorks, 'string')
  assert.ok(Array.isArray(result.whatIsMissing))
  assert.equal(typeof result.tryAgainQuestion, 'string')
})

test('mock: is deterministic — same input produces the same output', () => {
  const a = generateMockBrandSherpaResponse(FULL_PAYLOAD)
  const b = generateMockBrandSherpaResponse(FULL_PAYLOAD)
  assert.deepEqual(a, b)
})

test('mock: professional version is built only from the student\'s own words', () => {
  const result = generateMockBrandSherpaResponse(FULL_PAYLOAD)
  assert.ok(result.professionalVersion.includes('middle schoolers who are falling behind'))
  assert.ok(result.professionalVersion.includes('tutoring help with math homework'))
  assert.ok(result.professionalVersion.includes('helping younger kids feel confident in school'))
})

test('mock: never fabricates numbers when none appear in the input', () => {
  const result = generateMockBrandSherpaResponse(FULL_PAYLOAD)
  const combined = [
    result.professionalVersion,
    result.whyItWorks,
    result.tryAgainQuestion,
    ...result.whatIsMissing
  ].join(' ')
  assert.equal(/\d/.test(combined), false)
})

test('mock: whatIsMissing flags every blank field on an empty payload', () => {
  const result = generateMockBrandSherpaResponse(EMPTY_PAYLOAD)
  assert.equal(result.whatIsMissing.length, 5)
})

test('mock: passing responseSchema validation (round-trips through the same contract)', () => {
  const result = generateMockBrandSherpaResponse(FULL_PAYLOAD)
  const revalidated = brandSherpaTemplate.responseSchema(result)
  assert.deepEqual(revalidated, result)
})

test('mock: falls back to a generic try-again question when nothing was asked-for', () => {
  const result = generateMockBrandSherpaResponse(EMPTY_PAYLOAD)
  assert.ok(result.tryAgainQuestion.length > 0)
  assert.equal(/\d/.test(result.tryAgainQuestion), false)
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
