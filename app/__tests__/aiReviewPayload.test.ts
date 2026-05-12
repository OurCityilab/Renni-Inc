// Pure unit tests for the deterministic leadership-review payload
// foundation. Phase 1 only — no AI calls.
//
// Runner: `tsx app/__tests__/aiReviewPayload.test.ts`
// (or `npm run test:aireview`). Uses Node's `node:assert/strict` to
// match the other suites.

import { strict as assert } from 'node:assert'
import {
  buildChapterReviewPayload,
  buildCompanyReviewPayload,
  buildDepartmentReviewPayload,
  buildReviewPayload
} from '../utils/aiReviewPayload'
import {
  getContributionLimitations,
  getDeliverableAttribution,
  getSafeCompletionLanguage,
  getSectionAttribution
} from '../utils/aiReviewAttribution'
import { computeDeterministicReadiness } from '../utils/aiReviewReadiness'
import type {
  Deliverable,
  DeliverableEvidenceLink,
  DeliverableOutput,
  DeliverableOutputSection,
  Goal,
  StructuredEvidenceEntry,
  Task
} from '../types/models'
import type {
  TemplateStudio,
  TemplateStudioSection
} from '../types/templateStudio'
import type { AiReviewDeliverableSummary } from '../types/aiReviewReports'

interface Test {
  name: string
  fn: () => void
}

const tests: Test[] = []
const test = (name: string, fn: () => void) => tests.push({ name, fn })

/* -------- builders -------- */

function makeDeliverable(overrides: Partial<Deliverable> = {}): Deliverable {
  return {
    id: 'd-ch5',
    title: 'House Phoenix Brand Book',
    chapter: 5,
    department: 'marketing',
    ownerEmail: 'cmo@example.com',
    ownerUid: 'u-cmo',
    approverEmail: 'cmo@example.com',
    approverUid: 'u-cmo',
    dueDate: '2026-05-10',
    suggestedDueDate: '2026-05-10',
    instructorCanEditDueDate: false,
    status: 'draft',
    definitionOfDone: '',
    rubricChecklist: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    ...overrides
  } as Deliverable
}

function makeSection(
  overrides: Partial<DeliverableOutputSection> & { sectionId: string }
): DeliverableOutputSection {
  return {
    sectionTitleSnapshot: overrides.sectionId,
    sourceNotes: '',
    draftText: '',
    finalText: '',
    evidenceLinks: [],
    status: 'empty',
    updatedAt: null,
    updatedByUid: null,
    updatedByEmail: null,
    ...overrides
  }
}

function makeStudio(
  sections: { id: string; title: string }[],
  title = 'Studio Title'
): TemplateStudio {
  return {
    title,
    sections: sections.map(
      (s) => ({ id: s.id, title: s.title }) as unknown as TemplateStudioSection
    ),
    requirements: []
  } as unknown as TemplateStudio
}

function makeOutput(
  sections: Record<string, DeliverableOutputSection>,
  id: string
): DeliverableOutput {
  return { id, deliverableId: id, sections }
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't-1',
    title: 'Task',
    deliverableId: 'd-ch5',
    ownerEmail: 'owner@example.com',
    ownerUid: 'u-owner',
    status: 'in_progress',
    department: 'marketing',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    ...overrides
  }
}

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'g-1',
    department: 'finance',
    metricName: 'Pop-up revenue',
    target: 1000,
    current: 250,
    ownerEmail: 'cfo@example.com',
    ownerUid: 'u-cfo',
    status: 'on_track',
    updatedAt: '2026-04-01T00:00:00.000Z',
    ...overrides
  }
}

const REQUESTER = {
  email: 'instructor@example.com',
  role: 'admin' as const,
  department: 'admin' as const
}

/* -------- company payload -------- */

test('company payload includes deliverables, status counts, department rollups, limitations', () => {
  const d1 = makeDeliverable({
    id: 'd-mkt',
    chapter: 5,
    department: 'marketing',
    status: 'approved'
  })
  const d2 = makeDeliverable({
    id: 'd-fin',
    chapter: 8,
    department: 'finance',
    status: 'draft',
    ownerEmail: 'cfo@example.com',
    approverEmail: 'cfo@example.com'
  })
  const studio = makeStudio(
    [
      { id: 's1', title: 'Promise' },
      { id: 's2', title: 'Voice' }
    ],
    'Brand Book'
  )
  const payload = buildCompanyReviewPayload({
    requester: REQUESTER,
    deliverables: [d1, d2],
    outputsByDeliverableId: {
      'd-mkt': makeOutput(
        {
          s1: makeSection({ sectionId: 's1', finalText: 'Promise.' }),
          s2: makeSection({ sectionId: 's2', draftText: 'Voice draft.' })
        },
        'd-mkt'
      ),
      'd-fin': null
    },
    studioResolver: (d) => (d.id === 'd-mkt' ? studio : null),
    tasks: [makeTask({ id: 't-1', deliverableId: 'd-mkt' })],
    goals: [makeGoal()]
  })
  assert.equal(payload.reportType, 'company')
  assert.equal(payload.deliverables.length, 2)
  assert.equal(payload.deterministicSummary.approvedDeliverables, 1)
  assert.equal(payload.deterministicSummary.draftDeliverables, 1)
  assert.equal(payload.deterministicSummary.totalChapters, 2)
  assert.equal(payload.deterministicSummary.totalTasks, 1)
  // d-fin lacks a studio; the builder should surface a non-studio
  // limitation.
  assert.ok(
    payload.limitations.some((l) => l.code === 'non-studio-deliverables'),
    'expected non-studio-deliverables limitation'
  )
  // Constraints are always present.
  assert.equal(payload.constraints.noApproval, true)
  assert.equal(payload.constraints.noMutation, true)
  assert.equal(
    payload.constraints.attributionPolicy,
    'assigned_owner_and_last_editor_only'
  )
})

/* -------- department payload -------- */

test('department payload filters deliverables, tasks, and goals by department', () => {
  const dMkt = makeDeliverable({
    id: 'd-mkt',
    department: 'marketing',
    chapter: 5
  })
  const dFin = makeDeliverable({
    id: 'd-fin',
    department: 'finance',
    chapter: 8,
    ownerEmail: 'cfo@example.com'
  })
  const payload = buildDepartmentReviewPayload(
    {
      requester: REQUESTER,
      deliverables: [dMkt, dFin],
      outputsByDeliverableId: {},
      tasks: [
        makeTask({ id: 't-mkt', deliverableId: 'd-mkt', department: 'marketing' }),
        makeTask({ id: 't-fin', deliverableId: 'd-fin', department: 'finance' })
      ],
      goals: [
        makeGoal({ id: 'g-mkt', department: 'marketing' }),
        makeGoal({ id: 'g-fin', department: 'finance' })
      ]
    },
    'marketing'
  )
  assert.equal(payload.reportType, 'department')
  assert.equal(payload.scope.department, 'marketing')
  assert.deepEqual(
    payload.deliverables.map((d) => d.id),
    ['d-mkt']
  )
  assert.deepEqual(
    payload.tasks.map((t) => t.id),
    ['t-mkt']
  )
  assert.deepEqual(
    payload.goals.map((g) => g.id),
    ['g-mkt']
  )
})

/* -------- chapter payload -------- */

test('chapter payload filters by deliverableId or chapter number', () => {
  const dA = makeDeliverable({ id: 'd-a', chapter: 5, department: 'marketing' })
  const dB = makeDeliverable({ id: 'd-b', chapter: 7, department: 'operations' })
  const payloadById = buildChapterReviewPayload(
    {
      requester: REQUESTER,
      deliverables: [dA, dB],
      outputsByDeliverableId: {},
      tasks: [
        makeTask({ id: 't-a', deliverableId: 'd-a' }),
        makeTask({ id: 't-b', deliverableId: 'd-b' })
      ],
      goals: [makeGoal()]
    },
    { deliverableId: 'd-a' }
  )
  assert.deepEqual(payloadById.deliverables.map((d) => d.id), ['d-a'])
  assert.deepEqual(payloadById.tasks.map((t) => t.id), ['t-a'])
  // Goals always drop at chapter scope (intentional — goals are
  // department-owned).
  assert.equal(payloadById.goals.length, 0)

  const payloadByChapter = buildChapterReviewPayload(
    {
      requester: REQUESTER,
      deliverables: [dA, dB],
      outputsByDeliverableId: {},
      tasks: [],
      goals: []
    },
    { chapter: 7 }
  )
  assert.deepEqual(payloadByChapter.deliverables.map((d) => d.id), ['d-b'])
})

/* -------- content source + evidence counts -------- */

test('payload prefers finalText, then draftText, then sourceNotes; counts evidence', () => {
  const link: DeliverableEvidenceLink = {
    id: 'l-1',
    label: 'Source',
    url: 'https://example.com',
    type: 'doc',
    sectionId: 's2',
    requirementId: null,
    addedByUid: null,
    addedByEmail: 'reporter@example.com',
    addedAt: '2026-04-01T00:00:00.000Z'
  }
  const evidenceEntry: StructuredEvidenceEntry = {
    id: 'e-1',
    claim: 'Claim',
    evidence: 'Evidence text',
    source: 'Source citation',
    addedByUid: null,
    addedByEmail: 'reporter@example.com',
    addedAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z'
  }
  const studio = makeStudio([
    { id: 's1', title: 'Final present' },
    { id: 's2', title: 'Draft fallback' },
    { id: 's3', title: 'Source notes fallback' },
    { id: 's4', title: 'Missing' }
  ])
  const output = makeOutput(
    {
      s1: makeSection({ sectionId: 's1', finalText: 'Final.' }),
      s2: makeSection({
        sectionId: 's2',
        draftText: 'Draft text only.',
        evidenceLinks: [link],
        structuredEvidence: [evidenceEntry]
      }),
      s3: makeSection({ sectionId: 's3', sourceNotes: 'Just notes.' })
    },
    'd-ch5'
  )
  const payload = buildReviewPayload({
    scope: { reportType: 'chapter', deliverableId: 'd-ch5' },
    requester: REQUESTER,
    deliverables: [makeDeliverable()],
    outputsByDeliverableId: { 'd-ch5': output },
    studioResolver: () => studio,
    tasks: [],
    goals: []
  })
  const summary = payload.deliverables[0]!
  const sections = summary.sections
  assert.equal(sections[0]!.contentSource, 'finalText')
  assert.equal(sections[0]!.finalTextPresent, true)
  assert.equal(sections[1]!.contentSource, 'draftText')
  assert.equal(sections[1]!.draftFallback, true)
  assert.equal(sections[1]!.evidenceLinkCount, 1)
  assert.equal(sections[1]!.structuredEvidenceCount, 1)
  assert.equal(sections[2]!.contentSource, 'sourceNotes')
  assert.equal(sections[2]!.sourceNotesFallback, true)
  assert.equal(sections[3]!.isMissing, true)
  assert.equal(sections[3]!.contentExcerpt, '')
  // Aggregate roll-up matches.
  assert.equal(summary.evidenceLinkCount, 1)
  assert.equal(summary.structuredEvidenceCount, 1)
  assert.equal(summary.sectionsWithFinalText, 1)
  assert.equal(summary.sectionsWithDraftFallback, 1)
  assert.equal(summary.sectionsWithSourceNotesFallback, 1)
  assert.equal(summary.sectionsMissing, 1)
})

test('missing sections render with empty excerpt and isMissing=true', () => {
  const studio = makeStudio([{ id: 's1', title: 'Section 1' }])
  const payload = buildReviewPayload({
    scope: { reportType: 'chapter', deliverableId: 'd-ch5' },
    requester: REQUESTER,
    deliverables: [makeDeliverable()],
    outputsByDeliverableId: { 'd-ch5': null },
    studioResolver: () => studio,
    tasks: [],
    goals: []
  })
  const s = payload.deliverables[0]!.sections[0]!
  assert.equal(s.isMissing, true)
  assert.equal(s.contentExcerpt, '')
  assert.equal(s.wordCount, 0)
})

test('excerpt is capped on long final text and excerptCapped flag is true', () => {
  const longText = ('lorem ipsum '.repeat(120)).trim() // ~1320 chars
  const studio = makeStudio([{ id: 's1', title: 'Section 1' }])
  const payload = buildReviewPayload({
    scope: { reportType: 'chapter', deliverableId: 'd-ch5' },
    requester: REQUESTER,
    deliverables: [makeDeliverable()],
    outputsByDeliverableId: {
      'd-ch5': makeOutput(
        { s1: makeSection({ sectionId: 's1', finalText: longText }) },
        'd-ch5'
      )
    },
    studioResolver: () => studio,
    tasks: [],
    goals: []
  })
  const s = payload.deliverables[0]!.sections[0]!
  assert.equal(s.excerptCapped, true)
  assert.ok(
    s.contentExcerpt.length < longText.length,
    'excerpt should be shorter than the full text'
  )
  assert.ok(s.contentExcerpt.endsWith('…'), 'capped excerpt should end with ellipsis')
})

/* -------- attribution safety -------- */

test('attribution helper never claims authorship when only owner/last editor exists', () => {
  const d = makeDeliverable({ ownerEmail: 'cmo@example.com', approverEmail: 'cmo@example.com' })
  const a = getDeliverableAttribution(d)
  assert.equal(a.bestConfidence, 'assigned')
  assert.match(a.summaryStatement, /Assigned to cmo@example\.com/)
  assert.equal(a.summaryStatement.includes('Written by'), false)
  assert.equal(a.summaryStatement.includes('Completed by'), false)

  const section = makeSection({
    sectionId: 's1',
    finalText: 'X',
    updatedByEmail: 'student@example.com'
  })
  const sa = getSectionAttribution(d, section)
  assert.equal(sa.bestConfidence, 'assigned')
  assert.match(sa.summaryStatement, /Last saved by student@example\.com/)
  assert.equal(sa.summaryStatement.includes('Written by'), false)

  // No data → 'unknown' + safe statement + correct limitation.
  const empty = getSectionAttribution({ ownerEmail: '', approverEmail: '' }, null)
  assert.equal(empty.bestConfidence, 'unknown')
  assert.match(empty.summaryStatement, /Authorship cannot be confirmed/)
  const lims = getContributionLimitations(empty)
  assert.ok(lims.some((l) => l.code === 'attribution-unavailable'))
})

test('safe completion language never claims completed-by without proof', () => {
  const doneTask = makeTask({ status: 'done', ownerEmail: 'owner@example.com' })
  const s = getSafeCompletionLanguage(doneTask)
  assert.match(s, /Task marked complete; completion actor unavailable/)
  assert.match(s, /Assigned to owner@example\.com/)
  assert.equal(s.includes('Completed by'), false)
})

/* -------- deterministic readiness -------- */

function summary(overrides: Partial<AiReviewDeliverableSummary> = {}): AiReviewDeliverableSummary {
  return {
    id: 'd',
    title: 'T',
    chapter: 1,
    chapterTitle: 'Ch 1',
    department: 'marketing',
    status: 'draft',
    statusLabel: 'In progress',
    ownerEmail: null,
    approverEmail: null,
    dueDate: null,
    isOverdue: false,
    hasStudio: true,
    totalSections: 4,
    sectionsWithFinalText: 0,
    sectionsWithDraftFallback: 0,
    sectionsWithSourceNotesFallback: 0,
    sectionsMissing: 4,
    evidenceLinkCount: 0,
    structuredEvidenceCount: 0,
    missingRequiredRequirementLabels: ['Audience'],
    canSubmit: false,
    returnedReason: null,
    attribution: {
      assignedOwnerEmail: null,
      approverEmail: null,
      lastSavedByEmail: null,
      evidenceContributorEmails: [],
      bestConfidence: 'unknown',
      summaryStatement: 'Authorship cannot be confirmed from current data.'
    },
    sections: [],
    ...overrides
  }
}

test('deterministic readiness is reproducible and deterministic', () => {
  const list = [
    summary({ status: 'approved', sectionsWithFinalText: 4, sectionsMissing: 0, evidenceLinkCount: 2, missingRequiredRequirementLabels: [] }),
    summary({ status: 'approved', sectionsWithFinalText: 4, sectionsMissing: 0, evidenceLinkCount: 1, missingRequiredRequirementLabels: [] })
  ]
  const r1 = computeDeterministicReadiness(list)
  const r2 = computeDeterministicReadiness(list)
  assert.equal(r1.deterministicScore, r2.deterministicScore)
  assert.equal(r1.label, r2.label)
  assert.ok(r1.deterministicScore >= 80, `expected high score, got ${r1.deterministicScore}`)
  assert.equal(r1.label, 'ready')
})

test('deterministic readiness reports high-risk on empty scope', () => {
  const r = computeDeterministicReadiness([])
  assert.equal(r.deterministicScore, 0)
  assert.equal(r.label, 'high-risk')
  assert.ok(r.limitations.some((l) => l.code === 'no-deliverables-in-scope'))
})

test('deterministic readiness penalizes missing sections and revisions', () => {
  const r = computeDeterministicReadiness([
    summary({
      status: 'needs_revision',
      sectionsWithFinalText: 0,
      sectionsMissing: 4,
      evidenceLinkCount: 0,
      missingRequiredRequirementLabels: ['Audience', 'Pricing']
    })
  ])
  assert.ok(r.deterministicScore < 30, `expected high-risk score, got ${r.deterministicScore}`)
  assert.equal(r.label, 'high-risk')
})

/* -------- no mutation -------- */

test('builders do not mutate input arrays / objects', () => {
  const deliverables = [makeDeliverable()]
  const output = makeOutput(
    {
      s1: makeSection({
        sectionId: 's1',
        finalText: '',
        draftText: 'Draft.',
        sourceNotes: 'Notes.'
      })
    },
    'd-ch5'
  )
  const outputs = { 'd-ch5': output }
  const tasks = [makeTask()]
  const goals = [makeGoal()]
  const beforeD = JSON.stringify(deliverables)
  const beforeO = JSON.stringify(output)
  const beforeT = JSON.stringify(tasks)
  const beforeG = JSON.stringify(goals)
  buildCompanyReviewPayload({
    requester: REQUESTER,
    deliverables,
    outputsByDeliverableId: outputs,
    studioResolver: () => makeStudio([{ id: 's1', title: 'S1' }]),
    tasks,
    goals
  })
  assert.equal(JSON.stringify(deliverables), beforeD)
  // Critically: finalText must still be empty even though the
  // builder rendered the draft fallback.
  assert.equal(output.sections['s1']!.finalText, '')
  assert.equal(JSON.stringify(output), beforeO)
  assert.equal(JSON.stringify(tasks), beforeT)
  assert.equal(JSON.stringify(goals), beforeG)
})

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
