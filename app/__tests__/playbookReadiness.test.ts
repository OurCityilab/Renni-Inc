// Pure unit tests for summarizePlaybookReadiness.
//
// Runner: `tsx app/__tests__/playbookReadiness.test.ts`
// (or `npm run test:readiness`). Uses Node's `node:assert/strict`
// to match the other suites.

import { strict as assert } from 'node:assert'
import { summarizePlaybookReadiness } from '../utils/playbookReadiness'
import type {
  Deliverable,
  DeliverableEvidenceLink,
  DeliverableOutput,
  DeliverableOutputSection,
  StructuredEvidenceEntry
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

function makeDeliverable(
  overrides: Partial<Pick<
    Deliverable,
    'id' | 'title' | 'chapter' | 'department' | 'status'
  >> = {}
): Pick<Deliverable, 'id' | 'title' | 'chapter' | 'department' | 'status'> {
  return {
    id: 'd-1',
    title: 'Default Deliverable',
    chapter: 1,
    department: 'marketing',
    status: 'draft',
    ...overrides
  }
}

function makeStudio(
  sections: { id: string; title: string }[],
  title = 'Studio'
): TemplateStudio {
  return {
    title,
    sections: sections.map(
      (s) => ({ id: s.id, title: s.title }) as unknown as TemplateStudioSection
    )
  } as unknown as TemplateStudio
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

function makeOutput(
  sections: Record<string, DeliverableOutputSection>,
  id = 'd-1'
): DeliverableOutput {
  return { id, deliverableId: id, sections }
}

/* -------- core counts -------- */

test('counts sections by content source (final / draft fallback / source-notes / missing)', () => {
  const summary = summarizePlaybookReadiness({
    chapters: [
      {
        chapter: 5,
        deliverables: [
          {
            deliverable: makeDeliverable({
              id: 'd-1',
              title: 'House Phoenix Brand Book',
              chapter: 5
            }),
            studio: makeStudio([
              { id: 's1', title: 'Final' },
              { id: 's2', title: 'Draft' },
              { id: 's3', title: 'Source notes' },
              { id: 's4', title: 'Missing' }
            ]),
            output: makeOutput(
              {
                s1: makeSection({ sectionId: 's1', finalText: 'Done.' }),
                s2: makeSection({ sectionId: 's2', draftText: 'Draft.' }),
                s3: makeSection({ sectionId: 's3', sourceNotes: 'Notes.' })
                // s4 missing entirely
              },
              'd-1'
            )
          }
        ]
      }
    ],
    mode: 'export'
  })
  assert.equal(summary.totalSections, 4)
  assert.equal(summary.sectionsWithFinalText, 1)
  assert.equal(summary.sectionsWithDraftFallback, 1)
  assert.equal(summary.sectionsWithSourceNotesFallback, 1)
  assert.equal(summary.sectionsMissing, 1)
})

test('counts evidence links and structured evidence', () => {
  const link: DeliverableEvidenceLink = {
    id: 'l-1',
    label: 'Source',
    url: 'https://example.com',
    type: 'doc',
    sectionId: 's1',
    requirementId: null,
    addedByUid: null,
    addedByEmail: null,
    addedAt: null
  }
  const entry: StructuredEvidenceEntry = {
    id: 'e-1',
    claim: 'A claim',
    evidence: 'An evidence',
    source: 'A source',
    addedByUid: null,
    addedByEmail: null,
    addedAt: null,
    updatedAt: null
  }
  const summary = summarizePlaybookReadiness({
    chapters: [
      {
        chapter: 5,
        deliverables: [
          {
            deliverable: makeDeliverable(),
            studio: makeStudio([{ id: 's1', title: 'S1' }]),
            output: makeOutput({
              s1: makeSection({
                sectionId: 's1',
                finalText: 'F.',
                evidenceLinks: [link, link, link],
                structuredEvidence: [entry, entry]
              })
            })
          }
        ]
      }
    ]
  })
  assert.equal(summary.evidenceLinkCount, 3)
  assert.equal(summary.structuredEvidenceCount, 2)
})

test('counts approved/draft/in_review/needs_revision deliverables', () => {
  const summary = summarizePlaybookReadiness({
    chapters: [
      {
        chapter: 1,
        deliverables: [
          {
            deliverable: makeDeliverable({ id: 'a', status: 'approved' }),
            studio: makeStudio([{ id: 's', title: 'S' }]),
            output: null
          },
          {
            deliverable: makeDeliverable({ id: 'b', status: 'draft' }),
            studio: makeStudio([{ id: 's', title: 'S' }]),
            output: null
          },
          {
            deliverable: makeDeliverable({ id: 'c', status: 'in_review' }),
            studio: makeStudio([{ id: 's', title: 'S' }]),
            output: null
          },
          {
            deliverable: makeDeliverable({
              id: 'd',
              status: 'needs_revision'
            }),
            studio: makeStudio([{ id: 's', title: 'S' }]),
            output: null
          }
        ]
      }
    ]
  })
  assert.equal(summary.totalDeliverables, 4)
  assert.equal(summary.approvedDeliverables, 1)
  assert.equal(summary.draftDeliverables, 1)
  assert.equal(summary.inReviewDeliverables, 1)
  assert.equal(summary.needsRevisionDeliverables, 1)
})

/* -------- mode semantics -------- */

test('final mode does not treat draft fallback as final', () => {
  const summary = summarizePlaybookReadiness({
    chapters: [
      {
        chapter: 5,
        deliverables: [
          {
            deliverable: makeDeliverable(),
            studio: makeStudio([{ id: 's1', title: 'S1' }]),
            output: makeOutput({
              s1: makeSection({
                sectionId: 's1',
                finalText: '',
                draftText: 'Draft only.'
              })
            })
          }
        ]
      }
    ],
    mode: 'final'
  })
  assert.equal(summary.sectionsWithFinalText, 0)
  assert.equal(summary.sectionsWithDraftFallback, 0)
  // Final mode collapses non-final content into 'missing'.
  assert.equal(summary.sectionsMissing, 1)
  assert.equal(summary.missingItems.length, 1)
})

/* -------- chapter rollup -------- */

test('per-chapter rollup reflects deliverable and section counts', () => {
  const summary = summarizePlaybookReadiness({
    chapters: [
      {
        chapter: 1,
        title: 'Exec',
        deliverables: [
          {
            deliverable: makeDeliverable({
              id: 'd-1',
              status: 'approved',
              chapter: 1
            }),
            studio: makeStudio([
              { id: 's1', title: 'A' },
              { id: 's2', title: 'B' }
            ]),
            output: makeOutput({
              s1: makeSection({ sectionId: 's1', finalText: 'A' }),
              s2: makeSection({ sectionId: 's2', finalText: 'B' })
            })
          }
        ]
      },
      {
        chapter: 5,
        title: 'Brand',
        deliverables: [
          {
            deliverable: makeDeliverable({
              id: 'd-2',
              status: 'draft',
              chapter: 5
            }),
            studio: makeStudio([
              { id: 's1', title: 'A' },
              { id: 's2', title: 'B' }
            ]),
            output: makeOutput({
              s1: makeSection({
                sectionId: 's1',
                draftText: 'Draft'
              })
              // s2 missing
            })
          }
        ]
      }
    ]
  })
  assert.equal(summary.chapters.length, 2)
  assert.equal(summary.chapters[0]!.chapter, 1)
  assert.equal(summary.chapters[0]!.statusLabel, 'Approved')
  assert.equal(summary.chapters[1]!.chapter, 5)
  assert.equal(summary.chapters[1]!.statusLabel, 'In progress')
  assert.equal(summary.chapters[1]!.sectionsMissing, 1)
})

test('chapters render in chapter-number order regardless of input order', () => {
  const summary = summarizePlaybookReadiness({
    chapters: [
      {
        chapter: 12,
        deliverables: [
          {
            deliverable: makeDeliverable({ id: 'd-12', chapter: 12 }),
            studio: makeStudio([{ id: 's', title: 'S' }]),
            output: null
          }
        ]
      },
      {
        chapter: 2,
        deliverables: [
          {
            deliverable: makeDeliverable({ id: 'd-2', chapter: 2 }),
            studio: makeStudio([{ id: 's', title: 'S' }]),
            output: null
          }
        ]
      }
    ]
  })
  assert.equal(summary.chapters[0]!.chapter, 2)
  assert.equal(summary.chapters[1]!.chapter, 12)
})

/* -------- no mutation -------- */

test('helper does not mutate input objects', () => {
  const output = makeOutput({
    s1: makeSection({
      sectionId: 's1',
      finalText: '',
      draftText: 'Draft.',
      sourceNotes: 'Notes.'
    })
  })
  const before = JSON.stringify(output)
  summarizePlaybookReadiness({
    chapters: [
      {
        chapter: 5,
        deliverables: [
          {
            deliverable: makeDeliverable(),
            studio: makeStudio([{ id: 's1', title: 'S1' }]),
            output
          }
        ]
      }
    ]
  })
  // The aggregator must never copy draftText into finalText or
  // otherwise touch the saved output.
  assert.equal(output.sections['s1']!.finalText, '')
  assert.equal(JSON.stringify(output), before)
})

/* -------- missing items list -------- */

test('missingItems lists each missing section once with chapter + deliverable context', () => {
  const summary = summarizePlaybookReadiness({
    chapters: [
      {
        chapter: 7,
        title: 'Operations',
        deliverables: [
          {
            deliverable: makeDeliverable({
              id: 'd-1',
              title: 'Operations Readiness',
              chapter: 7
            }),
            studio: makeStudio(
              [
                { id: 's1', title: 'Roles' },
                { id: 's2', title: 'Checklist' }
              ],
              'Operations Readiness'
            ),
            output: makeOutput({
              s1: makeSection({ sectionId: 's1', finalText: 'Done' })
              // s2 missing
            })
          }
        ]
      }
    ]
  })
  assert.equal(summary.missingItems.length, 1)
  const item = summary.missingItems[0]!
  assert.equal(item.chapter, 7)
  assert.equal(item.deliverableTitle, 'Operations Readiness')
  assert.equal(item.sectionTitle, 'Checklist')
  assert.match(item.note, /No saved section text yet/)
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
