// Pure unit tests for the AI Leadership Coaching prompt + validator.
//
// Runner: `tsx app/__tests__/aiReviewCoaching.test.ts` (or
// `npm run test:aireview-coaching`). Uses Node's
// `node:assert/strict` to match the other suites.

import { strict as assert } from 'node:assert'
import {
  buildAiReviewCoachingSystemPrompt,
  buildAiReviewCoachingUserMessage
} from '../../server/utils/aiReviewCoachingPrompt'
import {
  CoachingValidationError,
  buildSafeFallback,
  scanBannedPhrases,
  validateCoachingOutput
} from '../../server/utils/aiReviewCoachingValidator'
import {
  AI_REVIEW_COACHING_SAFETY_REMINDER,
  AI_REVIEW_CONSTRAINTS_DEFAULT
} from '../types/aiReviewReports'
import type {
  AiReviewCoachingOutput,
  AiReviewReportPayload
} from '../types/aiReviewReports'

interface Test {
  name: string
  fn: () => void
}

const tests: Test[] = []
const test = (name: string, fn: () => void) => tests.push({ name, fn })

/* -------- prompt -------- */

test('system prompt forbids approval', () => {
  const p = buildAiReviewCoachingSystemPrompt('company')
  assert.match(p, /do not approve/i)
  // Prompt is word-wrapped — match across any whitespace runs.
  assert.match(p, /approval\s+always\s+belongs\s+to\s+a\s+human\s+reviewer/i)
})

test('system prompt forbids personal judgment', () => {
  const p = buildAiReviewCoachingSystemPrompt('company')
  assert.match(p, /never describe a student as/i)
  assert.match(p, /lazy/i)
  assert.match(p, /weak/i)
})

test('system prompt cites attribution uncertainty rule', () => {
  const p = buildAiReviewCoachingSystemPrompt('chapter')
  assert.match(p, /never claim authorship/i)
  assert.match(p, /assigned to/i)
  assert.match(p, /last saved by/i)
  assert.match(p, /authorship cannot be confirmed/i)
})

test('system prompt requires JSON-only output and exact safety reminder', () => {
  const p = buildAiReviewCoachingSystemPrompt('department')
  assert.match(p, /ONE\s+JSON\s+object/i)
  assert.match(p, /No\s+Markdown\s+fences/i)
  assert.ok(
    p.includes(`safetyReminder MUST be exactly: "${AI_REVIEW_COACHING_SAFETY_REMINDER}"`),
    'prompt must require the exact safety reminder literal'
  )
})

test('system prompt forbids AI approval / AI grade language', () => {
  const p = buildAiReviewCoachingSystemPrompt('company')
  assert.match(p, /do NOT write the words "AI approved" or "AI grade"/i)
})

test('system prompt adapts to scope', () => {
  const company = buildAiReviewCoachingSystemPrompt('company')
  const department = buildAiReviewCoachingSystemPrompt('department')
  const chapter = buildAiReviewCoachingSystemPrompt('chapter')
  assert.match(company, /COMPANY SCOPE FOCUS/)
  assert.match(department, /DEPARTMENT SCOPE FOCUS/)
  assert.match(chapter, /CHAPTER SCOPE FOCUS/)
  assert.notEqual(company, department)
  assert.notEqual(department, chapter)
})

test('user message includes the deterministic payload as JSON', () => {
  const payload = makePayload()
  const msg = buildAiReviewCoachingUserMessage(payload)
  assert.match(msg, /source of truth/i)
  assert.match(msg, /PAYLOAD START/)
  assert.match(msg, /PAYLOAD END/)
  // Confirm the payload's deliverable id is present in the JSON body.
  assert.ok(msg.includes('d-1'))
})

/* -------- validator -------- */

function makeValidOutput(): AiReviewCoachingOutput {
  return {
    executiveSummary: 'Two chapters approved; one needs evidence.',
    coachingPriorities: [
      {
        issue: 'Ch. 5 missing final text in 2 of 5 sections.',
        evidenceFromPayload:
          'Section "Voice" content source is draftText; section "Promise" content source is missing.',
        whyItMatters: 'Reviewers cannot judge a section that has no final text.',
        coachingMove:
          'Ask the assigned owner to draft final text for "Voice" today.',
        owner: 'cmo@example.com',
        urgency: 'high',
        definitionOfDone:
          'Each of the two listed sections has finalText saved with at least 80 words.'
      }
    ],
    strongestAreas: [
      {
        area: 'Approval coverage',
        evidenceFromPayload: '8 of 13 chapters approved.',
        whyItMatters:
          'Approved chapters anchor the Brand and Operations Playbook for hand-off.'
      }
    ],
    weakestAreas: [
      {
        area: 'Evidence coverage in Finance',
        issue: 'Finance has 0 structured evidence entries.',
        recommendedFix:
          'Log at least one structured evidence entry per finance deliverable.',
        owner: 'cfo@example.com'
      }
    ],
    missingEvidence: [
      {
        sectionOrDeliverable: 'Ch. 5 — Section "Voice"',
        issue: 'No evidence linked.',
        neededEvidence:
          'A peer review or retail observation log supporting the voice claim.',
        owner: 'cmo@example.com'
      }
    ],
    escalationItems: [
      {
        issue: 'Ch. 7 returned for revision twice.',
        escalateTo: 'Instructor/Admin',
        reason: 'Two consecutive returns suggest the rubric is unclear.',
        urgency: 'medium'
      }
    ],
    suggestedTalkingPoints: [
      '8 of 13 chapters are approved.',
      '2 chapters are showing draft fallback only; coach owners this week.'
    ],
    recommendedNextActions: [
      {
        action: 'Schedule a 15-minute coaching session with the CMO',
        owner: 'cmo@example.com',
        urgency: 'high',
        definitionOfDone: 'Coaching agenda exists and the session is on the calendar.'
      }
    ],
    limitations: [
      'Attribution metadata is thin for 4 sections.',
      'Two chapters have no studio backing.'
    ],
    safetyReminder: AI_REVIEW_COACHING_SAFETY_REMINDER
  }
}

test('valid mock AI JSON parses successfully', () => {
  const result = validateCoachingOutput(makeValidOutput())
  assert.equal(result.safetyReminder, AI_REVIEW_COACHING_SAFETY_REMINDER)
  assert.equal(result.coachingPriorities.length, 1)
  assert.equal(result.executiveSummary.length > 0, true)
})

test('missing required field throws shape error', () => {
  const bad = makeValidOutput() as unknown as Record<string, unknown>
  delete bad.executiveSummary
  assert.throws(
    () => validateCoachingOutput(bad),
    (err) => err instanceof CoachingValidationError && err.reason === 'shape'
  )
})

test('wrong urgency value throws shape error', () => {
  const bad = makeValidOutput()
  ;(bad.coachingPriorities[0] as { urgency: string }).urgency = 'extreme'
  assert.throws(() => validateCoachingOutput(bad))
})

test('safety reminder mismatch is rejected', () => {
  const bad = makeValidOutput()
  bad.safetyReminder =
    'AI approval only.' as typeof bad.safetyReminder
  assert.throws(
    () => validateCoachingOutput(bad),
    (err) =>
      err instanceof CoachingValidationError &&
      err.reason === 'shape' &&
      String(err.detail).includes('safetyReminder')
  )
})

test('banned phrase in any string field is rejected', () => {
  const bad = makeValidOutput()
  bad.executiveSummary = 'This team has lazy contributors.'
  assert.throws(
    () => validateCoachingOutput(bad),
    (err) => err instanceof CoachingValidationError && err.reason === 'safety'
  )
})

test('banned phrase scanner walks nested arrays', () => {
  const obj = {
    a: 'fine',
    b: [{ c: 'AI approved hooray' }]
  }
  const r = scanBannedPhrases(obj)
  assert.equal(r.ok, false)
  assert.match(String(r.phrase), /ai approved/i)
})

test('negation phrasing like "no AI approval" is allowed', () => {
  const r = scanBannedPhrases({ note: 'No AI approval is granted here.' })
  assert.equal(r.ok, true)
})

test('the safety reminder literal does not trip the scanner', () => {
  const r = scanBannedPhrases({ safetyReminder: AI_REVIEW_COACHING_SAFETY_REMINDER })
  assert.equal(r.ok, true)
})

test('safe fallback emits valid shape with the exact safety reminder', () => {
  const fb = buildSafeFallback('shape error')
  // Validator must accept the fallback.
  const validated = validateCoachingOutput(fb)
  assert.equal(validated.safetyReminder, AI_REVIEW_COACHING_SAFETY_REMINDER)
  assert.equal(validated.coachingPriorities.length, 0)
  assert.ok(validated.limitations.length >= 1)
})

test('validator rejects "Written by ___" claims', () => {
  const bad = makeValidOutput()
  bad.coachingPriorities[0]!.coachingMove =
    'The CMO note was written by an unknown contributor.'
  assert.throws(
    () => validateCoachingOutput(bad),
    (err) => err instanceof CoachingValidationError && err.reason === 'safety'
  )
})

test('validator rejects "Completed by ___" claims', () => {
  const bad = makeValidOutput()
  bad.coachingPriorities[0]!.evidenceFromPayload =
    'Task completed by some-student@example.com.'
  assert.throws(() => validateCoachingOutput(bad))
})

/* -------- helpers -------- */

function makePayload(): AiReviewReportPayload {
  return {
    reportType: 'company',
    scope: { reportType: 'company' },
    requester: {
      email: 'instructor@example.com',
      role: 'admin',
      department: 'admin'
    },
    constraints: AI_REVIEW_CONSTRAINTS_DEFAULT,
    deterministicSummary: {
      totalChapters: 1,
      totalDeliverables: 1,
      approvedDeliverables: 0,
      draftDeliverables: 1,
      inReviewDeliverables: 0,
      needsRevisionDeliverables: 0,
      overdueDeliverables: 0,
      totalSections: 1,
      sectionsWithFinalText: 1,
      sectionsWithDraftFallback: 0,
      sectionsWithSourceNotesFallback: 0,
      sectionsMissing: 0,
      evidenceLinkCount: 0,
      structuredEvidenceCount: 0,
      totalTasks: 0,
      completedTasks: 0,
      blockedTasks: 0,
      overdueTasks: 0
    },
    deterministicReadiness: {
      deterministicScore: 50,
      label: 'needs-work',
      scoringBreakdown: [],
      limitations: []
    },
    deliverables: [
      {
        id: 'd-1',
        title: 'Sample Deliverable',
        chapter: 5,
        chapterTitle: 'Brand Book',
        department: 'marketing',
        status: 'draft',
        statusLabel: 'In progress',
        ownerEmail: 'cmo@example.com',
        approverEmail: 'cmo@example.com',
        dueDate: '2026-05-15',
        isOverdue: false,
        hasStudio: true,
        totalSections: 1,
        sectionsWithFinalText: 1,
        sectionsWithDraftFallback: 0,
        sectionsWithSourceNotesFallback: 0,
        sectionsMissing: 0,
        evidenceLinkCount: 0,
        structuredEvidenceCount: 0,
        missingRequiredRequirementLabels: [],
        canSubmit: true,
        returnedReason: null,
        attribution: {
          assignedOwnerEmail: 'cmo@example.com',
          approverEmail: 'cmo@example.com',
          lastSavedByEmail: null,
          evidenceContributorEmails: [],
          bestConfidence: 'assigned',
          summaryStatement: 'Assigned to cmo@example.com'
        },
        sections: []
      }
    ],
    tasks: [],
    goals: [],
    limitations: [],
    generatedAt: '2026-05-12T00:00:00.000Z'
  }
}

/* -------- runner -------- */

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
