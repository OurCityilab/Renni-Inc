// Tests for the Brand Coach prompt template
// (server/utils/studioPromptTemplates/brandCoach.ts): the six output
// types (especially resume_bullets), no-fabrication rules, bracketed
// prompts for missing details, and mock stability on thin input.
//
// Runner: `tsx app/__tests__/studio/brandCoach.test.ts`
// (or `npm run test:studio-brand-coach`).

import { strict as assert } from 'node:assert'
import {
  BRAND_COACH_AUDIENCES,
  BRAND_COACH_OUTPUT_TYPES,
  brandCoachTemplate,
  generateMockBrandCoachResponse,
  type BrandCoachPayload
} from '../../../server/utils/studioPromptTemplates/brandCoach'

interface Test {
  name: string
  fn: () => void
}

const tests: Test[] = []
const test = (name: string, fn: () => void) => tests.push({ name, fn })

const POP_UP_PAYLOAD: BrandCoachPayload = {
  worksheet: '',
  selfWords: '',
  starExample: 'I helped with the pop-up shop and sold sweatshirts',
  audience: 'recruiter',
  outputType: 'resume_bullets'
}

// ---------- output type contract ----------

test('output types: all six dropdown values are accepted by the server', () => {
  assert.deepEqual(
    [...BRAND_COACH_OUTPUT_TYPES].sort(),
    ['pitch_1min_tmay', 'pitch_30s', 'pitch_3s', 'resume_bullets', 'star_story', 'word_choice'].sort()
  )
})

test('output types: resume_bullets is explicitly present', () => {
  assert.ok(BRAND_COACH_OUTPUT_TYPES.includes('resume_bullets'))
})

test('audiences: all five dropdown values are accepted by the server', () => {
  assert.deepEqual(
    [...BRAND_COACH_AUDIENCES].sort(),
    ['admissions', 'customer', 'employer', 'general', 'recruiter'].sort()
  )
})

// ---------- resume bullets mock behavior ----------

test('resume_bullets mock: never invents numbers the student did not give', () => {
  const result = generateMockBrandCoachResponse(POP_UP_PAYLOAD)
  assert.equal(/\d/.test(result.polishedVersion), false)
})

test('resume_bullets mock: missing details become bracketed prompts', () => {
  const result = generateMockBrandCoachResponse(POP_UP_PAYLOAD)
  assert.ok(/\[add number\]/.test(result.polishedVersion))
  assert.ok(/\[add (result|timeframe)\]/.test(result.polishedVersion))
})

test('resume_bullets mock: flags weak verbs like "helped"', () => {
  const result = generateMockBrandCoachResponse(POP_UP_PAYLOAD)
  assert.ok(result.wordChoiceFlags.some((f) => f.word === 'helped'))
})

test('resume_bullets mock: output round-trips through responseSchema', () => {
  const result = generateMockBrandCoachResponse(POP_UP_PAYLOAD)
  const parsed = brandCoachTemplate.responseSchema(result)
  assert.equal(parsed.polishedVersion, result.polishedVersion)
})

// ---------- stability on thin input ----------

test('resume_bullets mock: stays stable with nearly empty details', () => {
  const result = generateMockBrandCoachResponse({
    worksheet: '',
    selfWords: 'hard worker',
    starExample: '',
    audience: 'general',
    outputType: 'resume_bullets'
  })
  assert.ok(result.strengths.length > 0)
  assert.ok(result.polishedVersion.length > 0)
  assert.ok(result.followUpQuestions.length >= 1)
})

test('every output type produces a valid mock response', () => {
  for (const outputType of BRAND_COACH_OUTPUT_TYPES) {
    const result = generateMockBrandCoachResponse({ ...POP_UP_PAYLOAD, outputType })
    assert.ok(brandCoachTemplate.responseSchema(result).polishedVersion.length > 0, outputType)
  }
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
