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

test('output types: all eight dropdown values are accepted by the server', () => {
  assert.deepEqual(
    [...BRAND_COACH_OUTPUT_TYPES].sort(),
    [
      'pitch_1min_tmay',
      'pitch_30s',
      'pitch_3s',
      'resume_bullets',
      'resume_draft',
      'linkedin_profile',
      'star_story',
      'word_choice'
    ].sort()
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

test('per-worksheet coaching focus appears in the user prompt when provided', () => {
  const base = {
    worksheet: 'I enjoy organizing events.',
    selfWords: '',
    starExample: '',
    audience: 'general' as const,
    outputType: 'word_choice' as const
  }
  const withFocus = brandCoachTemplate.userPromptBuilder({
    ...base,
    focus: 'Help the student find patterns across their raw material.'
  })
  assert.ok(withFocus.includes('Coaching focus for this worksheet:'))
  assert.ok(withFocus.includes('find patterns across their raw material'))
  const withoutFocus = brandCoachTemplate.userPromptBuilder(base)
  assert.ok(!withoutFocus.includes('Coaching focus for this worksheet:'))
})

// ---------- student-voice coaching guardrails ----------

test('system prompt locks the student-voice coaching guardrails', () => {
  const prompt = brandCoachTemplate.systemPrompt()
  // Natural voice, never over-polished beyond evidence.
  assert.ok(prompt.includes("Preserve the student's natural voice"))
  assert.ok(prompt.includes('never make them sound more polished than their evidence supports'))
  // No role upgrades without evidence; bracketed prompts instead.
  assert.ok(prompt.includes('Never upgrade roles'))
  assert.ok(prompt.includes('do not rewrite it as led, organized, coordinated, mentored, or managed'))
  assert.ok(prompt.includes('[describe your role]'))
  assert.ok(prompt.includes('[name what you organized]'))
  // Political/sensitive language: neutral coaching, never erased.
  assert.ok(prompt.includes('political or sensitive'))
  assert.ok(prompt.includes("Do not erase the student's concern"))
  // Early-stage work stays a raw-material summary, not an essay/bio.
  assert.ok(prompt.includes('refined raw-material summary'))
  assert.ok(prompt.includes('not a finished college essay or an adult bio'))
  // Student-safe labels for problems.
  assert.ok(prompt.includes('"too general," "hard to picture," "unsupported," or "needs evidence."'))
  assert.ok(prompt.includes('Avoid harsh labels like "defensive"'))
})

test('system prompt teaches the seven-part flag structure, categories, and the 3–5 cap', () => {
  const prompt = brandCoachTemplate.systemPrompt()
  assert.ok(prompt.includes('"category": "too_vague" | "too_inflated" | "too_casual"'))
  assert.ok(prompt.includes('never more than 5'))
  assert.ok(prompt.includes('not a vocabulary lesson'))
  for (const field of ['"definition"', '"evidenceFit"', '"bestFit"', '"inYourVoice"']) {
    assert.ok(prompt.includes(field), field)
  }
  // Worked example for charged political phrasing keeps the concern.
  assert.ok(prompt.includes('our president the orange man'))
  assert.ok(prompt.includes('Do not erase the political concern'))
})

// ---------- word flag mock behavior ----------

test('mock flags "philanthropist" as a full mini-lesson: definition, audience read, evidence fit, best fit, in-your-voice', () => {
  const result = generateMockBrandCoachResponse({
    worksheet: '',
    selfWords: 'I am a philanthropist',
    starExample: '',
    audience: 'admissions',
    outputType: 'word_choice'
  })
  const flag = result.wordChoiceFlags.find((f) => f.word === 'philanthropist')
  assert.ok(flag)
  assert.equal(flag.category, 'too_inflated')
  assert.ok(/significant money/.test(flag.definition))
  assert.ok(/financial resources/.test(flag.howItMayLand))
  assert.ok(/overstate/.test(flag.evidenceFit))
  assert.ok(flag.alternatives.some((a) => a.startsWith('community builder')))
  assert.ok(flag.alternatives.some((a) => a.startsWith('volunteer organizer')))
  assert.ok(flag.alternatives.length >= 3 && flag.alternatives.length <= 6)
  assert.ok(/evidence supports/.test(flag.bestFit))
  assert.ok(/community builder/.test(flag.inYourVoice))
})

test('every mock flag rule fills the complete seven-part teaching structure', () => {
  const result = generateMockBrandCoachResponse({
    worksheet: 'I am a passionate hard worker and a people person',
    selfWords: 'expert, creative',
    starExample: '',
    audience: 'recruiter',
    outputType: 'word_choice'
  })
  assert.ok(result.wordChoiceFlags.length > 0)
  for (const flag of result.wordChoiceFlags) {
    assert.ok(['too_vague', 'too_inflated', 'too_casual'].includes(flag.category), flag.word)
    assert.ok(flag.definition.length > 0, flag.word)
    assert.ok(flag.howItMayLand.length > 0, flag.word)
    assert.ok(flag.evidenceFit.length > 0, flag.word)
    assert.ok(flag.alternatives.length >= 1, flag.word)
    assert.ok(flag.bestFit.length > 0, flag.word)
    assert.ok(flag.inYourVoice.length > 0, flag.word)
  }
})

test('mock caps flags at 5 so coaching never becomes a vocabulary lesson', () => {
  const result = generateMockBrandCoachResponse({
    worksheet:
      'I am a passionate hardworking people person, a creative expert entrepreneur, a good leader, responsible for a lot of stuff, and I helped everyone',
    selfWords: '',
    starExample: '',
    audience: 'general',
    outputType: 'word_choice'
  })
  assert.ok(result.wordChoiceFlags.length <= 5)
})

test('mock coaches casual political phrasing ("orange man") without erasing the concern', () => {
  const result = generateMockBrandCoachResponse({
    worksheet: 'I do not like what our president the orange man is doing to my community',
    selfWords: '',
    starExample: '',
    audience: 'admissions',
    outputType: 'word_choice'
  })
  const flag = result.wordChoiceFlags.find((f) => f.word === 'orange man')
  assert.ok(flag)
  assert.equal(flag.category, 'too_casual')
  assert.ok(/casual and insulting/.test(flag.howItMayLand))
  // The concern is kept, not erased.
  assert.ok(/concern about political leadership is real/.test(flag.evidenceFit))
  assert.ok(/political leadership/.test(flag.bestFit))
  assert.ok(/policy/.test(flag.inYourVoice))
})

test('mock coaches spoken-voice and underselling phrases ("people be", "I\'m just good at", "everyone knows")', () => {
  const result = generateMockBrandCoachResponse({
    worksheet: "People be sleeping on my neighborhood. I'm just good at math. Everyone knows school lunch is bad.",
    selfWords: '',
    starExample: '',
    audience: 'scholarship',
    outputType: 'word_choice'
  })
  const words = result.wordChoiceFlags.map((f) => f.word)
  assert.ok(words.includes('people be'))
  assert.ok(words.includes("I'm just good at"))
  assert.ok(words.includes('everyone knows'))
  for (const f of result.wordChoiceFlags) assert.equal(f.category, 'too_casual')
})

test('responseSchema rejects a flag with an unknown category', () => {
  const good = generateMockBrandCoachResponse(POP_UP_PAYLOAD)
  const bad = {
    ...good,
    wordChoiceFlags: [{ ...good.wordChoiceFlags[0], category: 'too_spicy' }]
  }
  assert.throws(() => brandCoachTemplate.responseSchema(bad), /category/)
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
