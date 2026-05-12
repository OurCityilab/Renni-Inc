// Regression tests for the AI coaching surface.
//
// The Vue component itself is a thin renderer over typed props and the
// `useAiReviewCoaching` composable. Rather than spin up the Nuxt
// runtime to mount it (which the current test infrastructure does not
// already do), we cover the user-observable behaviour by:
//
//   1. Testing the composable's invariants in isolation: no autosend
//      on construction, output stays in local refs, clear() resets.
//   2. Testing the copy-summary helper end-to-end against the three
//      golden payload fixtures.
//   3. Auditing the rendered Markdown copy block for unsafe phrases
//      ("AI approved", "Written by", "Completed by", "lazy", etc.).
//      The same deny-list the server validator enforces is applied
//      here so a future regression on the panel cannot ship unsafe
//      strings to the clipboard.
//
// The composable test does NOT execute Firebase or fetch — those are
// only touched inside generateCoaching(), which we don't call. We DO
// import the composable to assert that constructing it has no side
// effects.

import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { isRef } from 'vue'
import {
  AI_REVIEW_COACHING_SAFETY_REMINDER,
  type AiReviewCoachingOutput,
  type AiReviewReportPayload
} from '../types/aiReviewReports'
import { buildSafeFallback } from '../../server/utils/aiReviewCoachingValidator'
import { buildAiReviewCoachingCopyBlock } from '../utils/aiReviewCoachingCopyBlock'
import {
  earlySemesterCompanyPayload,
  midSemesterDepartmentPayload,
  finalWeekChapterPayload
} from './fixtures/aiReviewPayloads'

interface Test {
  name: string
  fn: () => void | Promise<void>
}

const tests: Test[] = []
const test = (name: string, fn: () => void | Promise<void>) =>
  tests.push({ name, fn })

/* --------- helpers --------- */

function makeCoachingOutput(
  overrides: Partial<AiReviewCoachingOutput> = {}
): AiReviewCoachingOutput {
  return {
    executiveSummary:
      'Two chapters are in flight; one is in review and one needs a coaching pass on evidence quality.',
    coachingPriorities: [
      {
        issue:
          'Ch. 5 House Phoenix Brand Book has 1 section in draft fallback.',
        evidenceFromPayload:
          'Section content source draftText; no final Playbook text saved.',
        whyItMatters:
          'Final reviewers cannot judge a section that still reads as draft.',
        coachingMove:
          'Ask the assigned owner to lift draft text to final by Friday standup.',
        owner: 'cmo@example.com',
        urgency: 'high',
        definitionOfDone:
          'Section finalText saved with at least 80 words and at least one evidence link.'
      }
    ],
    strongestAreas: [
      {
        area: 'Marketing evidence depth',
        evidenceFromPayload: '3 evidence items logged on this department.',
        whyItMatters:
          'Evidence depth makes the Phoenix Nest retail pitch defensible.'
      }
    ],
    weakestAreas: [
      {
        area: 'Channel mix in Ch. 10',
        issue: 'Required task coverage gap.',
        recommendedFix:
          'Spin a task that names the channel mix experiment owner.',
        owner: 'cmo@example.com'
      }
    ],
    missingEvidence: [
      {
        sectionOrDeliverable: 'Ch. 5 — Section "Voice"',
        issue: 'No evidence linked.',
        neededEvidence:
          'Retail observation note or peer review supporting the voice claim.',
        owner: 'cmo@example.com'
      }
    ],
    escalationItems: [
      {
        issue: 'Ch. 1 missing required tasks.',
        escalateTo: 'Instructor/Admin',
        reason: 'Owner reports no time to write the launch plan task.',
        urgency: 'medium'
      }
    ],
    suggestedTalkingPoints: [
      'Two chapters are in flight; one is in review.',
      'Coach the marketing team on lifting draft sections to final by Friday.'
    ],
    recommendedNextActions: [
      {
        action: 'Run a 15-minute coaching session with the CMO.',
        owner: 'cmo@example.com',
        urgency: 'high',
        definitionOfDone:
          'Coaching agenda exists and the session is on the calendar.'
      }
    ],
    limitations: [
      'Attribution metadata is thin for 1 section.',
      'Two chapters have no studio backing.'
    ],
    safetyReminder: AI_REVIEW_COACHING_SAFETY_REMINDER,
    ...overrides
  }
}

const BANNED_PHRASES = [
  'ai approved',
  'ai approval',
  'ai grade',
  'written by',
  'completed by ',
  'lazy',
  'poor performer',
  'low performer',
  'weak student',
  'bad student',
  'incapable'
]

function assertNoUnsafePhrases(text: string) {
  const lower = text.toLowerCase()
  // Whitelist explicit negations (the copy block does not currently
  // emit any, but a future iteration shouldn't accidentally introduce
  // them as a sneaky bypass either).
  for (const phrase of BANNED_PHRASES) {
    if (!lower.includes(phrase)) continue
    const idx = lower.indexOf(phrase)
    const window = lower.slice(Math.max(0, idx - 16), idx)
    const negated = /(?:^|\W)(no|not|never|isn't|is not|cannot|can't|do not|don't|without)\s*$/i.test(
      window
    )
    if (negated) continue
    throw new assert.AssertionError({
      message: `Banned phrase "${phrase}" found in rendered copy block.`
    })
  }
}

/* --------- composable invariants --------- */

test('composable constructs without side effects (no autosend)', async () => {
  // The composable references useNuxtApp() inside generateCoaching,
  // never during construction. Importing + calling the factory must
  // not throw, hit the network, or read $firebase.
  const mod = await import('../composables/useAiReviewCoaching')
  const result = mod.useAiReviewCoaching()
  assert.ok(isRef(result.coaching))
  assert.ok(isRef(result.loading))
  assert.ok(isRef(result.error))
  assert.equal(result.coaching.value, null)
  assert.equal(result.loading.value, false)
  assert.equal(result.error.value, null)
  // generateCoaching exists and is a function; we do NOT call it
  // here.
  assert.equal(typeof result.generateCoaching, 'function')
  assert.equal(typeof result.clearCoaching, 'function')
})

test('clearCoaching resets coaching, error, and errorCode', async () => {
  const mod = await import('../composables/useAiReviewCoaching')
  const { coaching, error, errorCode, clearCoaching } = mod.useAiReviewCoaching()
  // Manually populate to simulate prior output.
  coaching.value = makeCoachingOutput()
  error.value = 'something went wrong'
  errorCode.value = 'ai_provider_error'
  clearCoaching()
  assert.equal(coaching.value, null)
  assert.equal(error.value, null)
  assert.equal(errorCode.value, null)
})

/* --------- copy summary against the three fixtures --------- */

test('copy block for company fixture renders safe markdown', () => {
  const block = buildAiReviewCoachingCopyBlock(
    makeCoachingOutput(),
    earlySemesterCompanyPayload
  )
  assert.match(block, /^# Company AI Leadership Coaching/m)
  assert.ok(block.includes(AI_REVIEW_COACHING_SAFETY_REMINDER))
  assert.match(block, /Executive summary/)
  assert.match(block, /Coaching priorities/)
  assert.match(block, /Limitations/)
  assertNoUnsafePhrases(block)
})

test('copy block for department fixture names the department', () => {
  const block = buildAiReviewCoachingCopyBlock(
    makeCoachingOutput(),
    midSemesterDepartmentPayload
  )
  assert.match(block, /^# Department AI Leadership Coaching/m)
  assert.match(block, /Scope: department · marketing\./)
  assertNoUnsafePhrases(block)
})

test('copy block for chapter fixture names the chapter and title', () => {
  const block = buildAiReviewCoachingCopyBlock(
    makeCoachingOutput(),
    finalWeekChapterPayload
  )
  assert.match(block, /^# Chapter AI Leadership Coaching/m)
  assert.match(block, /Scope: chapter 5 · House Phoenix Brand Book\./)
  assertNoUnsafePhrases(block)
})

test('copy block includes a generatedAt line when provided', () => {
  const block = buildAiReviewCoachingCopyBlock(
    makeCoachingOutput(),
    earlySemesterCompanyPayload,
    { generatedAt: '2026-05-12T00:00:00.000Z' }
  )
  assert.match(block, /Generated 2026-05-12T00:00:00\.000Z\./)
})

test('copy block skips empty sections gracefully', () => {
  const empty: AiReviewCoachingOutput = {
    executiveSummary: 'No actionable items right now.',
    coachingPriorities: [],
    strongestAreas: [],
    weakestAreas: [],
    missingEvidence: [],
    escalationItems: [],
    suggestedTalkingPoints: [],
    recommendedNextActions: [],
    limitations: [],
    safetyReminder: AI_REVIEW_COACHING_SAFETY_REMINDER
  }
  const block = buildAiReviewCoachingCopyBlock(empty, finalWeekChapterPayload)
  // The block must still render the title, the safety reminder, and
  // the executive summary; the empty sections do not appear.
  assert.match(block, /^# Chapter AI Leadership Coaching/m)
  assert.match(block, /Executive summary/)
  assert.equal(block.includes('Coaching priorities'), false)
  assert.equal(block.includes('Missing evidence'), false)
  assert.ok(block.includes(AI_REVIEW_COACHING_SAFETY_REMINDER))
})

test('safe fallback renders as copyable coaching output', () => {
  const fallback = buildSafeFallback('AI response was not valid JSON after retry.')
  const block = buildAiReviewCoachingCopyBlock(
    fallback,
    earlySemesterCompanyPayload
  )
  assert.match(block, /^# Company AI Leadership Coaching/m)
  assert.match(block, /Executive summary/)
  assert.match(block, /provider responded/)
  assert.match(block, /required coaching format/)
  assert.match(block, /Limitations/)
  assert.match(block, /not valid JSON after retry/)
  assert.match(block, /Try again/)
  assert.ok(block.includes(AI_REVIEW_COACHING_SAFETY_REMINDER))
  assertNoUnsafePhrases(block)
})

test('metrics card copy explains validation and safety counts', () => {
  const source = readFileSync('app/pages/c-suite/review.vue', 'utf8')
  assert.match(
    source,
    /Provider responded but output failed format\/schema validation/
  )
  assert.match(source, /Provider output was blocked by safety rules/)
  assert.match(source, /Total coaching attempts today/)
  assert.match(source, /Validated coaching outputs/)
})

test('copy block never includes raw payload JSON', () => {
  // The fixture's deliverable has a unique excerpt sentence; if a
  // future refactor accidentally embeds the payload, this assertion
  // will catch it.
  const block = buildAiReviewCoachingCopyBlock(
    makeCoachingOutput(),
    finalWeekChapterPayload
  )
  // Deliverable section excerpt that lives in the payload but should
  // NOT appear in the rendered copy block.
  assert.equal(block.includes('House Phoenix promises a bold rebirth.'), false)
})

test('copy block rejects banned phrases inserted via coaching priorities', () => {
  const bad = makeCoachingOutput({
    coachingPriorities: [
      {
        issue: 'A specific student is lazy.',
        evidenceFromPayload: 'na',
        whyItMatters: 'na',
        coachingMove: 'na',
        owner: 'cmo@example.com',
        urgency: 'high',
        definitionOfDone: 'na'
      }
    ]
  })
  const block = buildAiReviewCoachingCopyBlock(
    bad,
    earlySemesterCompanyPayload
  )
  // The copy block does NOT itself sanitize — that's the validator's
  // job upstream. But we MUST flag the regression so the test suite
  // catches an unsafe response that somehow reached the renderer.
  assert.throws(() => assertNoUnsafePhrases(block))
})

/* --------- payload-shape sanity for fixtures --------- */

test('all fixtures carry the immutable constraints object', () => {
  for (const p of [
    earlySemesterCompanyPayload,
    midSemesterDepartmentPayload,
    finalWeekChapterPayload
  ]) {
    assert.equal(p.constraints.noApproval, true)
    assert.equal(p.constraints.noMutation, true)
    assert.equal(p.constraints.noPersonalJudgment, true)
    assert.equal(
      p.constraints.attributionPolicy,
      'assigned_owner_and_last_editor_only'
    )
  }
})

test('fixtures expose scope-specific report types', () => {
  assert.equal(earlySemesterCompanyPayload.reportType, 'company')
  assert.equal(midSemesterDepartmentPayload.reportType, 'department')
  assert.equal(finalWeekChapterPayload.reportType, 'chapter')
})

/* --------- runner --------- */

;(async () => {
  let failed = 0
  for (const t of tests) {
    try {
      await t.fn()
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
})()
