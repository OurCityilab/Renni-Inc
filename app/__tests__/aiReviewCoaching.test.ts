// Pure unit tests for the AI Leadership Coaching prompt + validator.
//
// Runner: `tsx app/__tests__/aiReviewCoaching.test.ts` (or
// `npm run test:aireview-coaching`). Uses Node's
// `node:assert/strict` to match the other suites.

import { strict as assert } from 'node:assert'
import {
  buildAiReviewCoachingJsonRepairUserMessage,
  buildAiReviewCoachingSimplifiedSystemPrompt,
  buildAiReviewCoachingSimplifiedUserMessage,
  buildAiReviewCoachingSystemPrompt,
  buildAiReviewCoachingUserMessage
} from '../../server/utils/aiReviewCoachingPrompt'
import {
  AiReviewCoachingJsonParseError,
  extractAiReviewCoachingJson,
  summarizeAiReviewCoachingJsonDiagnostics
} from '../../server/utils/aiReviewCoachingJson'
import {
  buildInvocationDoc,
  summarizePayloadStats
} from '../../server/utils/aiReviewCoachingInvocations'
import {
  CoachingValidationError,
  buildDeterministicCoachingFallback,
  buildSafeFallback,
  convertSimplifiedCoachingToFull,
  missingCompactCoachingFields,
  missingTopLevelCoachingFields,
  scanBannedPhrases,
  validateSimplifiedCoachingOutput,
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
import { buildAiReviewCoachingCopyBlock } from '../utils/aiReviewCoachingCopyBlock'
import {
  allFixtures,
  earlySemesterCompanyPayload,
  midSemesterDepartmentPayload,
  finalWeekChapterPayload
} from './fixtures/aiReviewPayloads'

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
  assert.match(p, /first\s+character\s+must\s+be\s+\{/i)
  assert.match(p, /last\s+character\s+must\s+be\s+\}/i)
  assert.match(p, /Do not output undefined/i)
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
  assert.match(msg, /first character must be \{/i)
  assert.match(msg, /last character must be \}/i)
  assert.match(msg, /PAYLOAD START/)
  assert.match(msg, /PAYLOAD END/)
  // Confirm the payload's deliverable id is present in the JSON body.
  assert.ok(msg.includes('d-1'))
})

test('repair user message requests JSON-only retry without raw bad output', () => {
  const payload = makePayload()
  const msg = buildAiReviewCoachingJsonRepairUserMessage(payload)
  assert.match(msg, /prior response was not valid JSON/i)
  assert.match(msg, /first character must be \{/i)
  assert.match(msg, /Do not use Markdown fences/i)
  assert.match(msg, /PAYLOAD START/)
  assert.equal(msg.includes('Here is the invalid response'), false)
})

test('compact schema is the primary prompt path', () => {
  const p = buildAiReviewCoachingSimplifiedSystemPrompt('company')
  assert.match(p, /PRIMARY MODE/)
  assert.match(p, /COMPACT PRIMARY OUTPUT SHAPE/)
  assert.match(p, /coachingPriorities: string\[\]/)
  assert.match(p, /strongestAreas: string\[\]/)
  assert.match(p, /weakestAreas: string\[\]/)
  assert.match(p, /escalationItems: string\[\]/)
  assert.match(p, /first\s+character\s+must\s+be\s+\{/i)
  assert.match(p, /last\s+character\s+must\s+be\s+\}/i)
  assert.match(p, /Do not use\s+Markdown\s+fences/i)
  assert.equal(p.includes('AiReviewCoachingOutput SHAPE'), false)
})

test('compact primary user message does not include raw bad output', () => {
  const msg = buildAiReviewCoachingSimplifiedUserMessage(makePayload())
  assert.match(msg, /compact schema/i)
  assert.match(msg, /PAYLOAD START/)
  assert.match(msg, /PAYLOAD END/)
  assert.equal(msg.includes('Here is the invalid response'), false)
})

test('fixture prompt builders create scope-specific guidance', () => {
  const pairs: Array<[AiReviewReportPayload, RegExp]> = [
    [earlySemesterCompanyPayload, /COMPANY SCOPE FOCUS/],
    [midSemesterDepartmentPayload, /DEPARTMENT SCOPE FOCUS/],
    [finalWeekChapterPayload, /CHAPTER SCOPE FOCUS/]
  ]
  for (const [payload, expected] of pairs) {
    const prompt = buildAiReviewCoachingSystemPrompt(payload.scope.reportType)
    assert.match(prompt, expected)
    assert.match(prompt, /deterministic JSON payload/i)
    assert.match(prompt, /do not approve/i)
  }
})

test('fixture user messages include parseable deterministic payload JSON', () => {
  for (const payload of allFixtures) {
    const msg = buildAiReviewCoachingUserMessage(payload)
    const match = /PAYLOAD START\n([\s\S]+)\nPAYLOAD END/.exec(msg)
    assert.ok(match, 'message should wrap payload JSON')
    const parsed = JSON.parse(match[1] ?? '') as AiReviewReportPayload
    assert.equal(parsed.reportType, payload.reportType)
    assert.equal(parsed.scope.reportType, payload.scope.reportType)
    assert.equal(parsed.constraints.noApproval, true)
  }
})

/* -------- JSON extraction -------- */

test('JSON extractor parses raw object JSON', () => {
  const out = extractAiReviewCoachingJson('{"executiveSummary":"ok"}')
  assert.equal(out.executiveSummary, 'ok')
})

test('JSON extractor parses fenced json block', () => {
  const out = extractAiReviewCoachingJson('```json\n{"executiveSummary":"ok"}\n```')
  assert.equal(out.executiveSummary, 'ok')
})

test('JSON extractor parses generic fenced block', () => {
  const out = extractAiReviewCoachingJson('```\n{"executiveSummary":"ok"}\n```')
  assert.equal(out.executiveSummary, 'ok')
})

test('JSON extractor parses prose-wrapped balanced object', () => {
  const out = extractAiReviewCoachingJson(
    'Here is the report:\n{"executiveSummary":"ok","nested":{"x":"brace } inside string"}}\nThanks.'
  )
  assert.equal(out.executiveSummary, 'ok')
})

test('JSON extractor rejects arrays as top-level output', () => {
  assert.throws(
    () => extractAiReviewCoachingJson('[{"executiveSummary":"ok"}]'),
    AiReviewCoachingJsonParseError
  )
})

test('JSON extractor rejects empty objects', () => {
  assert.throws(
    () => extractAiReviewCoachingJson('{}'),
    AiReviewCoachingJsonParseError
  )
})

test('JSON extractor rejects invalid text with no JSON', () => {
  assert.throws(
    () => extractAiReviewCoachingJson('I cannot provide JSON right now.'),
    AiReviewCoachingJsonParseError
  )
})

test('JSON extractor rejects incomplete JSON', () => {
  assert.throws(
    () => extractAiReviewCoachingJson('{"executiveSummary":"ok"'),
    AiReviewCoachingJsonParseError
  )
})

test('JSON diagnostics report metadata only', () => {
  const diag = summarizeAiReviewCoachingJsonDiagnostics(
    'prefix {"executiveSummary":"ok"} suffix',
    true
  )
  assert.equal(diag.responseCharCount > 0, true)
  assert.equal(diag.firstCharWasBrace, false)
  assert.equal(diag.balancedJsonObjectFound, true)
  assert.equal(diag.retryUsed, true)
  const serialized = JSON.stringify(diag)
  assert.equal(serialized.includes('executiveSummary'), false)
  assert.equal(serialized.includes('prefix'), false)
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

test('missing top-level fields are reported without raw output', () => {
  const missing = missingTopLevelCoachingFields({
    executiveSummary: 'ok',
    safetyReminder: AI_REVIEW_COACHING_SAFETY_REMINDER
  })
  assert.ok(missing.includes('coachingPriorities'))
  assert.ok(missing.includes('recommendedNextActions'))
  assert.equal(missing.includes('executiveSummary'), false)
})

test('compact missing fields are reported against compact schema', () => {
  const missing = missingCompactCoachingFields({
    executiveSummary: 'ok',
    coachingPriorities: [],
    safetyReminder: AI_REVIEW_COACHING_SAFETY_REMINDER
  })
  assert.ok(missing.includes('strongestAreas'))
  assert.ok(missing.includes('weakestAreas'))
  assert.ok(missing.includes('escalationItems'))
  assert.equal(missing.includes('executiveSummary'), false)
})

test('simplified coaching response converts into valid full output', () => {
  const simplified = validateSimplifiedCoachingOutput({
    executiveSummary: 'Leadership should focus on evidence gaps today.',
    coachingPriorities: ['Marketing has draft fallback in one section.'],
    strongestAreas: ['Several sections have saved work.'],
    weakestAreas: ['Evidence coverage needs attention.'],
    missingEvidence: ['Pricing assumptions need a source or assumption note.'],
    escalationItems: ['Overdue finance work may affect final readiness.'],
    recommendedNextActions: ['Ask the CFO to verify pricing assumptions.'],
    suggestedTalkingPoints: ['Use the deterministic report as the status source.'],
    limitations: ['Attribution metadata is thin.'],
    safetyReminder: AI_REVIEW_COACHING_SAFETY_REMINDER
  })
  const full = validateCoachingOutput(
    convertSimplifiedCoachingToFull(simplified)
  )
  assert.equal(full.safetyReminder, AI_REVIEW_COACHING_SAFETY_REMINDER)
  assert.equal(full.coachingPriorities.length, 1)
  assert.equal(full.strongestAreas.length, 1)
  assert.equal(full.weakestAreas.length, 1)
  assert.equal(full.missingEvidence.length, 1)
  assert.equal(full.escalationItems.length, 1)
  assert.equal(full.recommendedNextActions.length, 1)
  assert.equal(full.coachingPriorities[0]!.owner, 'Unknown owner')
  assert.equal(
    full.coachingPriorities[0]!.definitionOfDone,
    'The assigned team updates the section, adds evidence where needed, and prepares it for human review.'
  )
})

test('simplified conversion still rejects unsafe phrases', () => {
  const simplified = validateSimplifiedCoachingOutput({
    executiveSummary: 'Leadership should focus on evidence gaps today.',
    coachingPriorities: ['A specific student is lazy.'],
    strongestAreas: [],
    weakestAreas: [],
    missingEvidence: [],
    escalationItems: [],
    recommendedNextActions: [],
    suggestedTalkingPoints: [],
    limitations: [],
    safetyReminder: AI_REVIEW_COACHING_SAFETY_REMINDER
  })
  assert.throws(
    () => validateCoachingOutput(convertSimplifiedCoachingToFull(simplified)),
    (err) => err instanceof CoachingValidationError && err.reason === 'safety'
  )
})

test('deterministic fallback produces useful coaching from payload counts', () => {
  const payload = makePayload()
  payload.deterministicSummary.sectionsMissing = 2
  payload.deterministicSummary.overdueDeliverables = 1
  payload.deterministicSummary.needsRevisionDeliverables = 1
  payload.deterministicSummary.evidenceLinkCount = 0
  payload.deterministicSummary.structuredEvidenceCount = 0
  const fallback = buildDeterministicCoachingFallback(
    payload,
    'AI provider response failed required coaching format.'
  )
  assert.equal(fallback.source, 'deterministic_fallback')
  assert.match(fallback.executiveSummary, /Deterministic fallback coaching/)
  assert.ok(fallback.coachingPriorities.length >= 4)
  assert.ok(fallback.recommendedNextActions.length >= 5)
  assert.match(fallback.limitations.join(' '), /AI coaching failed/)
  assert.match(fallback.limitations.join(' '), /No student authorship inferred/)
  assert.equal(validateCoachingOutput(fallback).safetyReminder, AI_REVIEW_COACHING_SAFETY_REMINDER)
  assert.equal(/AI approved|AI grade|Written by|lazy|poor performer|weak student|bad student|incapable/i.test(JSON.stringify(fallback)), false)
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
  assert.match(validated.executiveSummary, /provider responded/i)
  assert.match(validated.executiveSummary, /required coaching format/i)
  assert.match(validated.limitations.join(' '), /Try again/)
  assert.ok(validated.limitations.length >= 1)
})

test('safe fallback for JSON retry failure emits renderable coaching output', () => {
  const fb = buildSafeFallback('AI response was not valid JSON after retry.')
  const validated = validateCoachingOutput(fb)
  assert.equal(validated.safetyReminder, AI_REVIEW_COACHING_SAFETY_REMINDER)
  assert.match(validated.limitations.join(' '), /not valid JSON after retry/)
  assert.equal(validated.coachingPriorities.length, 0)
})

test('synthesized coaching output validates for each golden fixture', () => {
  for (const payload of allFixtures) {
    const output = makeValidOutput()
    output.executiveSummary = `${payload.reportType} scope has ${payload.deterministicSummary.totalDeliverables} deliverable(s) in the deterministic payload.`
    const validated = validateCoachingOutput(output)
    assert.equal(validated.safetyReminder, AI_REVIEW_COACHING_SAFETY_REMINDER)
  }
})

test('safe fallback validates for each golden fixture', () => {
  for (const payload of allFixtures) {
    const fallback = buildSafeFallback(
      `${payload.reportType} fixture fallback validation.`
    )
    const validated = validateCoachingOutput(fallback)
    assert.equal(validated.coachingPriorities.length, 0)
    assert.match(validated.limitations.join(' '), /fixture fallback validation/)
  }
})

test('copy helper produces safe summaries for each golden fixture', () => {
  for (const payload of allFixtures) {
    const block = buildAiReviewCoachingCopyBlock(
      makeValidOutput(),
      payload,
      { generatedAt: payload.generatedAt }
    )
    assert.match(block, /AI coaching only\. Human leaders approve work\./)
    assert.match(block, /Executive summary/)
    assert.match(block, /Coaching priorities/)
    assert.equal(block.includes('"deterministicSummary"'), false)
    assert.equal(block.includes('"deliverables"'), false)
  }
})

test('audit invocation doc stores metadata only', () => {
  const stats = summarizePayloadStats(
    finalWeekChapterPayload,
    JSON.stringify(finalWeekChapterPayload).length
  )
  const doc = buildInvocationDoc(
    {
      uid: 'user-1',
      email: 'instructor@example.com',
      role: 'admin',
      reportType: finalWeekChapterPayload.reportType,
      scope: finalWeekChapterPayload.scope,
      outcome: 'success',
      validationOutcome: 'passed',
      safetyScanOutcome: 'passed',
      validationDiagnostics: {
        category: null,
        missingTopLevelFields: ['coachingPriorities'],
        receivedTopLevelFields: ['executiveSummary', 'coachingPriorities'],
        responseCharCount: 250,
        firstCharWasBrace: false,
        balancedJsonObjectFound: true,
        retryUsed: true,
        compactAttemptUsed: true,
        simplifiedFallbackUsed: true,
        finalFailureStage: null
      },
      payloadStats: stats,
      provider: { name: 'anthropic-messages' },
      durationMs: 123,
      errorCode: null
    },
    '2026-05-12T00:00:00.000Z'
  )
  assert.equal(doc.uid, 'user-1')
  assert.equal(doc.email, 'instructor@example.com')
  assert.equal(doc.reportType, 'chapter')
  assert.equal(doc.deliverableId, 'd-ch05-brand')
  assert.equal(doc.chapter, 5)
  assert.deepEqual(doc.provider, { name: 'anthropic-messages' })
  assert.deepEqual(doc.payloadStats, stats)
  assert.deepEqual(doc.validationDiagnostics, {
    category: null,
    missingTopLevelFields: ['coachingPriorities'],
    receivedTopLevelFields: ['executiveSummary', 'coachingPriorities'],
    responseCharCount: 250,
    firstCharWasBrace: false,
    balancedJsonObjectFound: true,
    retryUsed: true,
    compactAttemptUsed: true,
    simplifiedFallbackUsed: true,
    finalFailureStage: null
  })

  const serialized = JSON.stringify(doc)
  assert.equal(serialized.includes('House Phoenix promises a bold rebirth'), false)
  assert.equal(serialized.includes('deterministicSummary'), false)
  assert.equal(serialized.includes('contentExcerpt'), false)
  assert.equal(serialized.includes('raw provider text'), false)
  assert.equal(serialized.includes('idToken'), false)
  assert.equal(serialized.includes('apiKey'), false)
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
