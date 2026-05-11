// Pure unit tests for computeDeliverableProgress.
//
// Runner: `tsx app/__tests__/deliverableProgress.test.ts`
// (or `npm run test:progress`). Uses Node's built-in
// `node:assert/strict` to match the existing classifier and approval
// permission tests. No vitest / jest dependency.
//
// Coverage:
//   - output.sections as an object map with one section status "ready"
//     → hasReadySections true, readySections 1
//   - draft parent + one ready section → would land in Sections marked
//     ready filter (helper exposes hasReadySections=true)
//   - draft parent + one ready section + missing submit gate → NOT
//     Ready to submit (canSubmit=false, bucket=needs_work)
//   - draft parent + draftText present but section.status='empty' →
//     hasAnySectionWork=true so it lands in Work started
//   - output sections object with unknown section id still counts as
//     work started / ready (the helper iterates Object.values, no
//     studio cross-reference)
//   - no output → hasAnySectionWork/hasReadySections false
//   - parent in_review → bucket=needs_review; hasReadySections still
//     reflects underlying section state

import { strict as assert } from 'node:assert'
import { computeDeliverableProgress } from '../utils/deliverableProgress'
import type {
  Deliverable,
  DeliverableOutput,
  DeliverableOutputSection
} from '../types/models'
import type {
  RequirementCoverageEntry,
  RequirementCoverageSummary
} from '../utils/requirementCoverage'

interface Test {
  name: string
  fn: () => void
}

const tests: Test[] = []
const test = (name: string, fn: () => void) => tests.push({ name, fn })

function makeDeliverable(
  status: Deliverable['status']
): Pick<Deliverable, 'status'> {
  return { status }
}

function makeSection(
  overrides: Partial<DeliverableOutputSection>
): DeliverableOutputSection {
  return {
    sectionId: 'sec-default',
    sectionTitleSnapshot: 'Default',
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

function makeOutput(
  sections: Record<string, DeliverableOutputSection>
): DeliverableOutput {
  return {
    id: 'd-1',
    deliverableId: 'd-1',
    sections
  }
}

function coverageWithGap(label: string): RequirementCoverageSummary {
  const entry: RequirementCoverageEntry = {
    requirementId: 'req-1',
    label,
    requiredForApproval: true,
    linkedTasks: [],
    hasTaskCoverage: false,
    hasBlockedTask: false,
    hasCompletedTask: false,
    state: 'none',
    stateLabel: 'No task yet'
  }
  return {
    totalRequirements: 1,
    requiredRequirements: 1,
    coveredRequirements: 0,
    completeRequirements: 0,
    blockedRequirements: 0,
    requiredRequirementsWithoutTasks: [entry],
    byRequirementId: { 'req-1': entry }
  }
}

const cleanCoverage: RequirementCoverageSummary = {
  totalRequirements: 0,
  requiredRequirements: 0,
  coveredRequirements: 0,
  completeRequirements: 0,
  blockedRequirements: 0,
  requiredRequirementsWithoutTasks: [],
  byRequirementId: {}
}

/* -------- core readiness counting -------- */

test('output.sections as object map with one ready section → hasReadySections true, readySections 1', () => {
  const output = makeOutput({
    'sec-a': makeSection({ sectionId: 'sec-a', status: 'ready' }),
    'sec-b': makeSection({ sectionId: 'sec-b', status: 'empty' })
  })
  const result = computeDeliverableProgress({
    deliverable: makeDeliverable('draft'),
    output
  })
  assert.equal(result.hasReadySections, true)
  assert.equal(result.readySections, 1)
  assert.equal(result.totalSections, 2)
  assert.equal(result.hasAnySectionWork, true)
})

test('draft parent + one ready section → exposed via hasReadySections (would land in Sections marked ready filter)', () => {
  const output = makeOutput({
    'sec-a': makeSection({ sectionId: 'sec-a', status: 'ready' })
  })
  const result = computeDeliverableProgress({
    deliverable: makeDeliverable('draft'),
    output
  })
  assert.equal(result.hasReadySections, true)
  assert.equal(result.hasAnySectionWork, true)
})

test('draft + one ready section + missing required coverage → NOT Ready to submit', () => {
  const output = makeOutput({
    'sec-a': makeSection({ sectionId: 'sec-a', status: 'ready' })
  })
  const result = computeDeliverableProgress({
    deliverable: makeDeliverable('draft'),
    output,
    coverage: coverageWithGap('Audience evidence'),
    coverageReady: true
  })
  assert.equal(result.canSubmit, false)
  assert.equal(result.bucket, 'needs_work')
  assert.equal(result.hasReadySections, true)
  assert.deepEqual(result.missingRequiredLabels, ['Audience evidence'])
})

test('draft + draftText only (status empty) → hasAnySectionWork true, hasReadySections false', () => {
  const output = makeOutput({
    'sec-a': makeSection({
      sectionId: 'sec-a',
      status: 'empty',
      draftText: 'first pass'
    })
  })
  const result = computeDeliverableProgress({
    deliverable: makeDeliverable('draft'),
    output
  })
  assert.equal(result.hasAnySectionWork, true)
  assert.equal(result.hasReadySections, false)
})

test('output sections with unknown section id still count', () => {
  // The helper iterates Object.values(sections); it does not cross-
  // reference a Template Studio. A section persisted under an unknown
  // id (e.g. legacy or renamed) is still counted as work / ready.
  const output = makeOutput({
    'legacy-orphan-id': makeSection({
      sectionId: 'legacy-orphan-id',
      status: 'ready',
      sourceNotes: 'evidence here'
    })
  })
  const result = computeDeliverableProgress({
    deliverable: makeDeliverable('draft'),
    output
  })
  assert.equal(result.hasReadySections, true)
  assert.equal(result.readySections, 1)
  assert.equal(result.hasAnySectionWork, true)
})

test('no output → hasAnySectionWork false, hasReadySections false', () => {
  const result = computeDeliverableProgress({
    deliverable: makeDeliverable('draft'),
    output: null
  })
  assert.equal(result.hasAnySectionWork, false)
  assert.equal(result.hasReadySections, false)
  assert.equal(result.readySections, 0)
  assert.equal(result.totalSections, null)
})

/* -------- bucket / submit gate -------- */

test('draft + clean coverage → canSubmit true, bucket ready_to_submit', () => {
  const result = computeDeliverableProgress({
    deliverable: makeDeliverable('draft'),
    output: null,
    coverage: cleanCoverage,
    coverageReady: true
  })
  assert.equal(result.canSubmit, true)
  assert.equal(result.bucket, 'ready_to_submit')
})

test('coverage not ready → canSubmit false even when no gaps', () => {
  const result = computeDeliverableProgress({
    deliverable: makeDeliverable('draft'),
    output: null,
    coverage: cleanCoverage,
    coverageReady: false
  })
  assert.equal(result.canSubmit, false)
})

test('parent in_review → bucket needs_review; readiness flags still reflect output', () => {
  const output = makeOutput({
    'sec-a': makeSection({ sectionId: 'sec-a', status: 'ready' })
  })
  const result = computeDeliverableProgress({
    deliverable: makeDeliverable('in_review'),
    output
  })
  assert.equal(result.bucket, 'needs_review')
  assert.equal(result.hasReadySections, true)
})

test('parent approved → bucket approved, submit gate locked', () => {
  const result = computeDeliverableProgress({
    deliverable: makeDeliverable('approved'),
    output: null,
    coverage: cleanCoverage
  })
  assert.equal(result.bucket, 'approved')
  assert.equal(result.canSubmit, false)
  assert.equal(result.submitEligible, false)
})

test('parent needs_revision + clean coverage → canSubmit true', () => {
  const result = computeDeliverableProgress({
    deliverable: makeDeliverable('needs_revision'),
    output: null,
    coverage: cleanCoverage,
    coverageReady: true
  })
  assert.equal(result.bucket, 'needs_revision')
  assert.equal(result.canSubmit, true)
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
