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
import {
  composeBrandCoachFields,
  emptyBrandWorksheetForm,
  type BrandWorksheetForm
} from '../../utils/studioBrandWorksheet'

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

test('audiences: all six dropdown values are accepted by the server', () => {
  assert.deepEqual(
    [...BRAND_COACH_AUDIENCES].sort(),
    ['admissions', 'customer', 'employer', 'general', 'recruiter', 'scholarship'].sort()
  )
})

// ---------- structured worksheet composition ----------

const FULL_FORM: BrandWorksheetForm = {
  ...emptyBrandWorksheetForm(),
  rawMaterial: 'I ran the table at our school pop-up shop',
  whatICareAbout: 'helping younger students find their confidence',
  selfWords: 'philanthropist, hard worker',
  starSituation: 'Our school held a pop-up shop fundraiser',
  starTask: 'I was in charge of the sweatshirt table',
  starAction: 'I greeted customers and explained the designs',
  starResult: ''
}

test('compose: worksheet fields are labeled sections in the payload', () => {
  const fields = composeBrandCoachFields(FULL_FORM)
  assert.ok(fields.worksheet.includes('Raw material:'))
  assert.ok(fields.worksheet.includes('What I care about:'))
  assert.ok(fields.worksheet.includes('helping younger students find their confidence'))
  assert.equal(fields.selfWords, 'philanthropist, hard worker')
})

test('compose: STAR fields become labeled lines and empty parts are omitted', () => {
  const fields = composeBrandCoachFields(FULL_FORM)
  assert.ok(fields.starExample.includes('Situation: Our school held a pop-up shop fundraiser'))
  assert.ok(fields.starExample.includes('Action: I greeted customers'))
  assert.equal(/Result:/.test(fields.starExample), false)
})

test('compose: structured fields flow into the Sherpa user prompt', () => {
  const fields = composeBrandCoachFields(FULL_FORM)
  const prompt = brandCoachTemplate.userPromptBuilder({
    ...fields,
    audience: 'scholarship',
    outputType: 'star_story'
  })
  assert.ok(prompt.includes('What I care about:'))
  assert.ok(prompt.includes('Situation: Our school held a pop-up shop fundraiser'))
  assert.ok(prompt.includes('scholarship committee'))
})

// ---------- word flag mock behavior ----------

test('mock flags "philanthropist" with the audience-risk explanation', () => {
  const result = generateMockBrandCoachResponse({
    worksheet: '',
    selfWords: 'I am a philanthropist',
    starExample: '',
    audience: 'admissions',
    outputType: 'word_choice'
  })
  const flag = result.wordChoiceFlags.find((f) => f.word === 'philanthropist')
  assert.ok(flag)
  assert.ok(/significant financial resources/.test(flag.howItMayLand))
  assert.ok(flag.alternatives.includes('community builder'))
  assert.ok(flag.alternatives.includes('mutual aid participant'))
})

test('mock flags newly added weak words (creative, entrepreneur, good leader, responsible)', () => {
  const result = generateMockBrandCoachResponse({
    worksheet: 'I am a creative entrepreneur, a good leader, and responsible',
    selfWords: '',
    starExample: '',
    audience: 'general',
    outputType: 'word_choice'
  })
  const words = result.wordChoiceFlags.map((f) => f.word)
  // Mock caps at 4 flags; all four rules should hit on this input.
  assert.ok(words.includes('creative'))
  assert.ok(words.includes('entrepreneur'))
  assert.ok(words.includes('good leader'))
  assert.ok(words.includes('responsible'))
})

// ---------- STAR mode with structured fields ----------

test('star_story mock: labeled STAR with missing Result pushes for the result', () => {
  const fields = composeBrandCoachFields(FULL_FORM)
  const result = generateMockBrandCoachResponse({
    ...fields,
    audience: 'recruiter',
    outputType: 'star_story'
  })
  assert.ok(/Result: \[add result/.test(result.polishedVersion))
  assert.ok(
    result.followUpQuestions.some((q) => /what changed because of what you did/i.test(q))
  )
})

test('star_story mock: labeled STAR keeps each answered part in place', () => {
  const fields = composeBrandCoachFields(FULL_FORM)
  const result = generateMockBrandCoachResponse({
    ...fields,
    audience: 'recruiter',
    outputType: 'star_story'
  })
  assert.ok(result.polishedVersion.includes('Situation: Our school held a pop-up shop fundraiser'))
  assert.ok(result.polishedVersion.includes('Task: I was in charge of the sweatshirt table'))
  assert.ok(result.polishedVersion.includes('Action: I greeted customers and explained the designs'))
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
