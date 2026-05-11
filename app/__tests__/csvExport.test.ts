// Pure unit tests for CSV utilities + Playbook / operations CSV
// builders.
//
// Runner: `tsx app/__tests__/csvExport.test.ts` (or `npm run test:csv`).
// Uses Node's `node:assert/strict` to match the other test suites.

import { strict as assert } from 'node:assert'
import {
  csvEscape,
  csvRow,
  makeCsv,
  safeCsvFilename,
  safeCsvValue,
  formatDateForCsv,
  wordCount
} from '../utils/csvExport'
import {
  buildPlaybookEvidenceCsv,
  buildPlaybookSectionStatusCsv
} from '../utils/playbookExport'
import {
  buildDeliverablesCsv,
  buildGoalsCsv,
  buildPricingScenariosCsv,
  buildTasksCsv,
  buildTransactionsCsv
} from '../utils/operationsExport'
import type {
  Deliverable,
  DeliverableEvidenceLink,
  DeliverableOutput,
  DeliverableOutputSection,
  Goal,
  PopUpTransaction,
  PricingScenario,
  StructuredEvidenceEntry,
  Task
} from '../types/models'
import type {
  TemplateStudio,
  TemplateStudioSection
} from '../types/templateStudio'

interface Test {
  name: string
  fn: () => void
}

const tests: Test[] = []
const test = (name: string, fn: () => void) => tests.push({ name, fn })

/* ----------------- low-level escape -------------------- */

test('csvEscape handles commas', () => {
  assert.equal(csvEscape('Detroit, MI'), '"Detroit, MI"')
})
test('csvEscape handles embedded quotes', () => {
  assert.equal(csvEscape('She said "hi"'), '"She said ""hi"""')
})
test('csvEscape handles newlines and carriage returns', () => {
  assert.equal(csvEscape('line1\nline2'), '"line1\nline2"')
  assert.equal(csvEscape('a\r\nb'), '"a\r\nb"')
})
test('csvEscape leaves plain text alone', () => {
  assert.equal(csvEscape('hello'), 'hello')
})
test('csvEscape returns empty for null / undefined', () => {
  assert.equal(csvEscape(null), '')
  assert.equal(csvEscape(undefined), '')
})

test('csvRow joins escaped cells with commas', () => {
  assert.equal(csvRow(['a', 'b, c', 1]), 'a,"b, c",1')
})

test('makeCsv always emits the header row even with zero data rows', () => {
  assert.equal(makeCsv(['a', 'b'], []), 'a,b')
})
test('makeCsv joins lines with CRLF', () => {
  const out = makeCsv(['a', 'b'], [
    ['1', '2'],
    ['3', '4']
  ])
  assert.equal(out, 'a,b\r\n1,2\r\n3,4')
})

test('safeCsvValue handles numbers, booleans, arrays, null', () => {
  assert.equal(safeCsvValue(0), '0')
  assert.equal(safeCsvValue(Number.NaN), '')
  assert.equal(safeCsvValue(Number.POSITIVE_INFINITY), '')
  assert.equal(safeCsvValue(true), 'true')
  assert.equal(safeCsvValue(false), 'false')
  assert.equal(safeCsvValue(['a', '', 'b']), 'a; b')
  assert.equal(safeCsvValue(null), '')
  assert.equal(safeCsvValue(undefined), '')
})

test('formatDateForCsv preserves yyyy-mm-dd dates and trims ISO millis', () => {
  assert.equal(formatDateForCsv('2026-05-10'), '2026-05-10')
  assert.equal(
    formatDateForCsv('2026-05-10T15:30:00.000Z'),
    '2026-05-10T15:30:00Z'
  )
  assert.equal(formatDateForCsv(null), '')
  assert.equal(formatDateForCsv(undefined), '')
  // Malformed → preserved verbatim.
  assert.equal(formatDateForCsv('not-a-date'), 'not-a-date')
})

test('wordCount counts whitespace-separated tokens', () => {
  assert.equal(wordCount(''), 0)
  assert.equal(wordCount('   '), 0)
  assert.equal(wordCount('hello world'), 2)
  assert.equal(wordCount('  multi\nline   text '), 3)
  assert.equal(wordCount(null), 0)
})

test('safeCsvFilename lowercases and sanitizes', () => {
  assert.equal(safeCsvFilename('Renni: Goals!'), 'renni-goals')
  assert.equal(safeCsvFilename(''), 'renni-export')
  assert.equal(safeCsvFilename('--bad--'), 'bad')
  assert.equal(safeCsvFilename('A,b,c.csv'), 'a-b-c.csv')
})

/* ----------------- Playbook section status CSV -------------------- */

function makeDeliverable(
  overrides: Partial<Deliverable> = {}
): Deliverable {
  return {
    id: 'ch-05-house-phoenix-brand-book',
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
    definitionOfDone: 'Final brand book.',
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
  title = 'House Phoenix Brand Book'
): TemplateStudio {
  return {
    title,
    sections: sections.map(
      (s) => ({ id: s.id, title: s.title }) as unknown as TemplateStudioSection
    )
  } as unknown as TemplateStudio
}

function makeOutput(
  sections: Record<string, DeliverableOutputSection>,
  deliverableId = 'ch-05-house-phoenix-brand-book'
): DeliverableOutput {
  return {
    id: deliverableId,
    deliverableId,
    sections
  }
}

test('section status CSV emits header even when no chapters loaded', () => {
  const csv = buildPlaybookSectionStatusCsv({ chapters: [] })
  assert.ok(csv.startsWith('chapter,chapterTitle,'))
  // Single line — header only.
  assert.equal(csv.split('\r\n').length, 1)
})

test('section status CSV includes incomplete sections', () => {
  const csv = buildPlaybookSectionStatusCsv(
    {
      chapters: [
        {
          chapter: 5,
          deliverables: [
            {
              deliverable: makeDeliverable(),
              studio: makeStudio([
                { id: 's1', title: 'Brand promise' },
                { id: 's2', title: 'Voice' }
              ]),
              output: makeOutput({
                s1: makeSection({ sectionId: 's1', finalText: 'Final.' })
                // s2 missing — should still appear with isMissing=true.
              })
            }
          ]
        }
      ]
    },
    { mode: 'export' }
  )
  assert.match(csv, /Brand promise/)
  assert.match(csv, /Voice/)
  // Missing row should have isMissing=true.
  const lines = csv.split('\r\n')
  const voiceLine = lines.find((l) => l.includes('Voice'))!
  assert.match(voiceLine, /missing/)
  assert.match(voiceLine, /true/)
})

test('section status CSV labels fallback content sources', () => {
  const csv = buildPlaybookSectionStatusCsv(
    {
      chapters: [
        {
          chapter: 5,
          deliverables: [
            {
              deliverable: makeDeliverable(),
              studio: makeStudio([{ id: 's1', title: 'Brand promise' }]),
              output: makeOutput({
                s1: makeSection({
                  sectionId: 's1',
                  finalText: '',
                  draftText: 'Working draft.'
                })
              })
            }
          ]
        }
      ]
    },
    { mode: 'export' }
  )
  assert.match(csv, /draftText/)
  assert.match(csv, /Draft text fallback/)
})

/* ----------------- Playbook evidence CSV -------------------- */

test('evidence CSV includes both linked evidence and structured evidence', () => {
  const link: DeliverableEvidenceLink = {
    id: 'l-1',
    label: 'Retail observation log',
    url: 'https://example.com/log',
    type: 'doc',
    sectionId: 's1',
    requirementId: 'req-7',
    addedByUid: null,
    addedByEmail: null,
    addedAt: null
  }
  const entry: StructuredEvidenceEntry = {
    id: 'e-1',
    claim: 'Detroit-made sells at premium.',
    evidence: '12 of 14 nearby shops priced beanies $28–$35.',
    source: 'Retail observation, March 2026',
    confidence: 'medium',
    risk: 'Small sample size',
    nextValidation: 'Run a March pop-up survey',
    addedByUid: null,
    addedByEmail: null,
    addedAt: null,
    updatedAt: null
  }
  const csv = buildPlaybookEvidenceCsv(
    {
      chapters: [
        {
          chapter: 5,
          deliverables: [
            {
              deliverable: makeDeliverable(),
              studio: makeStudio([{ id: 's1', title: 'Brand promise' }]),
              output: makeOutput({
                s1: makeSection({
                  sectionId: 's1',
                  finalText: 'Final.',
                  evidenceLinks: [link],
                  structuredEvidence: [entry]
                })
              })
            }
          ]
        }
      ]
    },
    { mode: 'export' }
  )
  assert.match(csv, /^chapter,chapterTitle,/m)
  assert.match(csv, /Retail observation log/)
  assert.match(csv, /https:\/\/example\.com\/log/)
  assert.match(csv, /Detroit-made sells at premium\./)
  assert.match(csv, /Run a March pop-up survey/)
  // requirementId comes through as relatedRequirement.
  assert.match(csv, /req-7/)
})

test('evidence CSV emits header only when no evidence exists', () => {
  const csv = buildPlaybookEvidenceCsv({
    chapters: [
      {
        chapter: 5,
        deliverables: [
          {
            deliverable: makeDeliverable(),
            studio: makeStudio([{ id: 's1', title: 'Brand promise' }]),
            output: makeOutput({
              s1: makeSection({ sectionId: 's1', finalText: 'Final.' })
            })
          }
        ]
      }
    ]
  })
  // Single line — header only.
  assert.equal(csv.split('\r\n').length, 1)
})

/* ----------------- deliverables CSV -------------------- */

test('deliverables CSV emits header even when empty', () => {
  const csv = buildDeliverablesCsv([])
  assert.ok(csv.startsWith('title,chapter,'))
  assert.equal(csv.split('\r\n').length, 1)
})

test('deliverables CSV excludes raw uid and statusHistory fields', () => {
  const csv = buildDeliverablesCsv([
    makeDeliverable({
      id: 'd-1',
      title: 'Brand book',
      ownerUid: 'should-not-appear',
      approverUid: 'should-not-appear-either',
      statusHistory: [
        {
          action: 'submitted',
          fromStatus: 'draft',
          toStatus: 'in_review',
          actorEmail: 'someone@example.com',
          createdAt: '2026-04-01T00:00:00.000Z'
        }
      ]
    } as Deliverable)
  ])
  assert.equal(csv.includes('should-not-appear'), false)
  assert.equal(csv.includes('statusHistory'), false)
  // Friendly status label, not the raw enum.
  assert.match(csv, /In progress/)
})

/* ----------------- tasks CSV -------------------- */

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't-1',
    title: 'Draft Section 1',
    deliverableId: 'd-1',
    ownerEmail: 'owner@example.com',
    ownerUid: 'u-owner-DO-NOT-EXPORT',
    status: 'in_progress',
    department: 'marketing',
    priority: 'high',
    startDate: '2026-04-01',
    dueDate: '2026-04-10',
    dependsOn: ['t-0'],
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-04-05T00:00:00.000Z',
    ...overrides
  }
}

test('tasks CSV joins deliverable title and excludes raw uid', () => {
  const csv = buildTasksCsv({
    tasks: [makeTask()],
    deliverables: [{ id: 'd-1', title: 'Brand book' }]
  })
  assert.match(csv, /Brand book/)
  assert.match(csv, /In progress/)
  assert.equal(csv.includes('u-owner-DO-NOT-EXPORT'), false)
})

test('tasks CSV falls back to deliverable id when join is missing', () => {
  const csv = buildTasksCsv({
    tasks: [makeTask({ deliverableId: 'unknown-id' })]
  })
  assert.match(csv, /unknown-id/)
})

/* ----------------- goals CSV -------------------- */

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'g-1',
    department: 'finance',
    metricName: 'Pop-up revenue',
    target: 1000,
    current: 250,
    ownerEmail: 'cfo@example.com',
    ownerUid: 'u-cfo-DO-NOT-EXPORT',
    status: 'on_track',
    updatedAt: '2026-04-01T00:00:00.000Z',
    ...overrides
  }
}

test('goals CSV excludes ownerUid and uses friendly status label', () => {
  const csv = buildGoalsCsv([makeGoal()])
  assert.equal(csv.includes('u-cfo-DO-NOT-EXPORT'), false)
  assert.match(csv, /On track/)
  assert.match(csv, /Pop-up revenue/)
})

/* ----------------- pricing CSV -------------------- */

function makePricingScenario(
  overrides: Partial<PricingScenario> = {}
): PricingScenario {
  return {
    id: 'p-1',
    productName: 'Phoenix beanie',
    brand: 'House Phoenix',
    category: 'apparel',
    unitCost: 8,
    salePrice: 30,
    plannedQuantity: 50,
    ownerEmail: 'cfo@example.com',
    ownerUid: 'u-cfo-DO-NOT-EXPORT',
    department: 'finance',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    ...overrides
  }
}

test('pricing CSV derives unit margin and excludes uid', () => {
  const csv = buildPricingScenariosCsv([makePricingScenario()])
  // Unit margin column should be 22 (30 - 8).
  assert.match(csv, /\b22\b/)
  assert.equal(csv.includes('u-cfo-DO-NOT-EXPORT'), false)
})

/* ----------------- transactions CSV -------------------- */

function makeTransaction(
  overrides: Partial<PopUpTransaction> = {}
): PopUpTransaction {
  return {
    id: 'tx-1',
    type: 'sale',
    productName: 'Phoenix beanie',
    brand: 'House Phoenix',
    category: 'apparel',
    quantity: 1,
    unitPrice: 30,
    unitCost: 8,
    grossRevenue: 30,
    estimatedGrossProfit: 22,
    paymentMethod: 'cash',
    recordedByUid: 'u-recorder-DO-NOT-EXPORT',
    recordedByEmail: 'recorder@example.com',
    department: 'operations',
    createdAt: '2026-05-12T10:00:00.000Z',
    updatedAt: '2026-05-12T10:00:00.000Z',
    ...overrides
  }
}

test('transactions CSV exports email but never the recorder uid', () => {
  const csv = buildTransactionsCsv([makeTransaction()])
  assert.equal(csv.includes('u-recorder-DO-NOT-EXPORT'), false)
  assert.match(csv, /recorder@example\.com/)
  assert.match(csv, /Phoenix beanie/)
})

test('transactions CSV is chronological regardless of input order', () => {
  const csv = buildTransactionsCsv([
    makeTransaction({
      id: 'tx-late',
      productName: 'Late',
      createdAt: '2026-05-12T12:00:00.000Z'
    }),
    makeTransaction({
      id: 'tx-early',
      productName: 'Early',
      createdAt: '2026-05-12T08:00:00.000Z'
    })
  ])
  const lines = csv.split('\r\n')
  const earlyIdx = lines.findIndex((l) => l.includes('Early'))
  const lateIdx = lines.findIndex((l) => l.includes('Late'))
  assert.ok(earlyIdx > 0 && lateIdx > 0)
  assert.ok(earlyIdx < lateIdx, 'Early should appear before Late')
})

/* ----------------- no-mutation guarantee -------------------- */

test('CSV builders do not mutate input arrays / objects', () => {
  const tasks = [makeTask()]
  const tasksBefore = JSON.stringify(tasks)
  buildTasksCsv({
    tasks,
    deliverables: [{ id: 'd-1', title: 'X' }]
  })
  assert.equal(JSON.stringify(tasks), tasksBefore)

  const goals = [makeGoal()]
  const goalsBefore = JSON.stringify(goals)
  buildGoalsCsv(goals)
  assert.equal(JSON.stringify(goals), goalsBefore)

  const tx = [makeTransaction()]
  const txBefore = JSON.stringify(tx)
  buildTransactionsCsv(tx)
  assert.equal(JSON.stringify(tx), txBefore)
})

/* ----------------- runner -------------------- */

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
