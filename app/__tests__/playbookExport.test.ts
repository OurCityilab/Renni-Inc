// Pure unit tests for the playbookExport builders.
//
// Runner: `tsx app/__tests__/playbookExport.test.ts`
// (or `npm run test:export`). Uses Node's built-in
// `node:assert/strict` to match the other test suites. No vitest /
// jest dependency.
//
// Coverage:
//   - deliverable Markdown uses finalText when present
//   - deliverable Markdown falls back to draftText in current/export mode
//   - deliverable Markdown falls back to sourceNotes when draft/final blank
//   - missing section is labeled
//   - evidence links appear
//   - structured evidence appears
//   - full chapter export includes multiple deliverables
//   - full Playbook export includes incomplete chapters
//   - no mutation of input objects
//   - safeFilename helper sanitizes filenames

import { strict as assert } from 'node:assert'
import {
  buildChapterMarkdown,
  buildDeliverableMarkdown,
  buildFullPlaybookMarkdown,
  chapterFilename,
  deliverableFilename,
  fullPlaybookFilename,
  safePlaybookFilename
} from '../utils/playbookExport'
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

/* -------- builders -------- */

function makeDeliverable(
  overrides: Partial<Deliverable> = {}
): Deliverable {
  return {
    id: 'ch-05-house-phoenix-brand-book',
    title: 'House Phoenix Brand Book',
    chapter: 5,
    department: 'marketing',
    ownerEmail: 'owner@example.com',
    ownerUid: 'u-owner',
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
      (s) =>
        ({ id: s.id, title: s.title }) as unknown as TemplateStudioSection
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

/* -------- deliverable Markdown -------- */

test('deliverable Markdown uses finalText when present', () => {
  const md = buildDeliverableMarkdown(
    {
      deliverable: makeDeliverable(),
      studio: makeStudio([{ id: 'sec-a', title: 'Brand promise' }]),
      output: makeOutput({
        'sec-a': makeSection({
          sectionId: 'sec-a',
          finalText: 'House Phoenix promises bold rebirth.'
        })
      })
    },
    { mode: 'export' }
  )
  assert.match(md, /House Phoenix promises bold rebirth\./)
  assert.match(md, /## Brand promise/)
  // Should NOT include a fallback notice when finalText is present.
  assert.equal(md.includes('Showing draft text'), false)
  assert.equal(md.includes('Showing source notes'), false)
})

test('deliverable Markdown falls back to draftText in export mode', () => {
  const md = buildDeliverableMarkdown(
    {
      deliverable: makeDeliverable(),
      studio: makeStudio([{ id: 'sec-a', title: 'Brand promise' }]),
      output: makeOutput({
        'sec-a': makeSection({
          sectionId: 'sec-a',
          finalText: '',
          draftText: 'Draft promise.'
        })
      })
    },
    { mode: 'export' }
  )
  assert.match(md, /Draft promise\./)
  assert.match(md, /Showing draft text/)
})

test('deliverable Markdown falls back to sourceNotes when draft and final blank', () => {
  const md = buildDeliverableMarkdown(
    {
      deliverable: makeDeliverable(),
      studio: makeStudio([{ id: 'sec-a', title: 'Brand promise' }]),
      output: makeOutput({
        'sec-a': makeSection({
          sectionId: 'sec-a',
          finalText: '',
          draftText: '',
          sourceNotes: 'Research note about Detroit makers.'
        })
      })
    },
    { mode: 'export' }
  )
  assert.match(md, /Research note about Detroit makers\./)
  assert.match(md, /Showing source notes/)
})

test('missing section is labeled when nothing is saved', () => {
  const md = buildDeliverableMarkdown(
    {
      deliverable: makeDeliverable(),
      studio: makeStudio([
        { id: 'sec-a', title: 'Brand promise' },
        { id: 'sec-b', title: 'Voice' }
      ]),
      output: makeOutput({
        'sec-a': makeSection({ sectionId: 'sec-a', finalText: 'Final A.' })
      })
    },
    { mode: 'export' }
  )
  // sec-b is missing
  assert.match(md, /## Voice/)
  assert.match(md, /No saved section text yet/)
})

test('final mode marks missing when finalText blank even with draft present', () => {
  const md = buildDeliverableMarkdown(
    {
      deliverable: makeDeliverable(),
      studio: makeStudio([{ id: 'sec-a', title: 'Brand promise' }]),
      output: makeOutput({
        'sec-a': makeSection({
          sectionId: 'sec-a',
          finalText: '',
          draftText: 'Draft'
        })
      })
    },
    { mode: 'final' }
  )
  assert.match(md, /Missing final Playbook text/)
  assert.equal(md.includes('Draft'), false)
})

/* -------- evidence preservation -------- */

test('evidence links appear in deliverable Markdown', () => {
  const link: DeliverableEvidenceLink = {
    id: 'l-1',
    label: 'Source A',
    url: 'https://example.com/a',
    type: 'doc',
    sectionId: 'sec-a',
    requirementId: null,
    addedByUid: null,
    addedByEmail: null,
    addedAt: null
  }
  const md = buildDeliverableMarkdown(
    {
      deliverable: makeDeliverable(),
      studio: makeStudio([{ id: 'sec-a', title: 'Brand promise' }]),
      output: makeOutput({
        'sec-a': makeSection({
          sectionId: 'sec-a',
          finalText: 'Final.',
          evidenceLinks: [link]
        })
      })
    },
    { mode: 'export' }
  )
  assert.match(md, /Evidence links/)
  assert.match(md, /\[Source A\]\(https:\/\/example\.com\/a\)/)
})

test('structured evidence appears in deliverable Markdown', () => {
  const entry: StructuredEvidenceEntry = {
    id: 'e-1',
    claim: 'Detroit-made sells at premium.',
    evidence: '12 of 14 nearby shops priced beanies $28–$35.',
    source: 'Retail observation, March 2026',
    addedByUid: null,
    addedByEmail: null,
    addedAt: null,
    updatedAt: null
  }
  const md = buildDeliverableMarkdown(
    {
      deliverable: makeDeliverable(),
      studio: makeStudio([{ id: 'sec-a', title: 'Brand promise' }]),
      output: makeOutput({
        'sec-a': makeSection({
          sectionId: 'sec-a',
          finalText: 'Final.',
          structuredEvidence: [entry]
        })
      })
    },
    { mode: 'export' }
  )
  assert.match(md, /Structured evidence/)
  assert.match(md, /Detroit-made sells at premium\./)
  assert.match(md, /Retail observation, March 2026/)
})

/* -------- chapter export -------- */

test('chapter export covers multiple deliverables in one chapter', () => {
  const md = buildChapterMarkdown(
    {
      chapter: 5,
      title: 'House Phoenix',
      deliverables: [
        {
          deliverable: makeDeliverable({
            id: 'a',
            title: 'A',
            chapter: 5,
            department: 'marketing'
          }),
          studio: makeStudio([{ id: 'sec-a', title: 'A1' }], 'A'),
          output: makeOutput(
            { 'sec-a': makeSection({ sectionId: 'sec-a', finalText: 'A body.' }) },
            'a'
          )
        },
        {
          deliverable: makeDeliverable({
            id: 'b',
            title: 'B',
            chapter: 5,
            department: 'marketing'
          }),
          studio: makeStudio([{ id: 'sec-b', title: 'B1' }], 'B'),
          output: makeOutput(
            { 'sec-b': makeSection({ sectionId: 'sec-b', draftText: 'B draft.' }) },
            'b'
          )
        }
      ]
    },
    { mode: 'export' }
  )
  assert.match(md, /^# House Phoenix/m)
  assert.match(md, /## A/)
  assert.match(md, /## B/)
  assert.match(md, /A body\./)
  assert.match(md, /B draft\./)
  assert.match(md, /Showing draft text/)
})

/* -------- full Playbook export -------- */

test('full Playbook export includes incomplete chapters', () => {
  const md = buildFullPlaybookMarkdown(
    {
      chapters: [
        {
          chapter: 1,
          deliverables: [
            {
              deliverable: makeDeliverable({
                id: 'ch1',
                title: 'Exec',
                chapter: 1,
                department: 'executive'
              }),
              studio: makeStudio([{ id: 's1', title: 'Overview' }], 'Exec'),
              output: makeOutput(
                {
                  s1: makeSection({ sectionId: 's1', finalText: 'Done.' })
                },
                'ch1'
              )
            }
          ]
        },
        {
          chapter: 5,
          deliverables: [
            {
              deliverable: makeDeliverable({
                id: 'ch5',
                title: 'Brand',
                chapter: 5,
                department: 'marketing'
              }),
              studio: makeStudio(
                [
                  { id: 's5a', title: 'Promise' },
                  { id: 's5b', title: 'Voice' }
                ],
                'Brand'
              ),
              output: makeOutput(
                {
                  s5a: makeSection({
                    sectionId: 's5a',
                    draftText: 'Promise draft.'
                  })
                  // s5b missing entirely
                },
                'ch5'
              )
            }
          ]
        }
      ]
    },
    { mode: 'export' }
  )
  assert.match(md, /Renni Inc\. Brand & Operations Playbook/)
  assert.match(md, /Export summary/)
  // Chapter 1
  assert.match(md, /Done\./)
  // Chapter 5 — incomplete chapter with fallback + missing section
  assert.match(md, /Promise draft\./)
  assert.match(md, /Showing draft text/)
  assert.match(md, /No saved section text yet/)
})

test('chapters render in chapter-number order regardless of input order', () => {
  const md = buildFullPlaybookMarkdown(
    {
      chapters: [
        {
          chapter: 12,
          deliverables: [
            {
              deliverable: makeDeliverable({
                id: 'd12',
                title: 'D12',
                chapter: 12,
                department: 'strategy-growth'
              }),
              studio: makeStudio([{ id: 's', title: 'S' }], 'D12'),
              output: null
            }
          ]
        },
        {
          chapter: 2,
          deliverables: [
            {
              deliverable: makeDeliverable({
                id: 'd2',
                title: 'D2',
                chapter: 2,
                department: 'marketing'
              }),
              studio: makeStudio([{ id: 's', title: 'S' }], 'D2'),
              output: null
            }
          ]
        }
      ]
    },
    { mode: 'export' }
  )
  const idx2 = md.indexOf('## Chapter 2')
  const idx12 = md.indexOf('## Chapter 12')
  assert.ok(idx2 > -1 && idx12 > -1)
  assert.ok(idx2 < idx12, `chapter 2 should appear before chapter 12 (got idx2=${idx2}, idx12=${idx12})`)
})

/* -------- no mutation -------- */

test('builders do not mutate input output objects', () => {
  const output = makeOutput({
    'sec-a': makeSection({
      sectionId: 'sec-a',
      finalText: '',
      draftText: 'Draft only.',
      sourceNotes: 'Some notes.'
    })
  })
  const before = JSON.stringify(output)
  buildDeliverableMarkdown(
    {
      deliverable: makeDeliverable(),
      studio: makeStudio([{ id: 'sec-a', title: 'Brand promise' }]),
      output
    },
    { mode: 'export' }
  )
  // The export must NEVER copy draftText into finalText. After export,
  // finalText is still empty.
  assert.equal(output.sections['sec-a']!.finalText, '')
  assert.equal(JSON.stringify(output), before)
})

/* -------- filename helpers -------- */

test('safePlaybookFilename lowercases and sanitizes', () => {
  assert.equal(safePlaybookFilename('My Chapter 05'), 'my-chapter-05')
  assert.equal(
    safePlaybookFilename('House Phoenix: Brand Book!'),
    'house-phoenix-brand-book'
  )
  assert.equal(
    safePlaybookFilename('  weird/path\\\\slashes  '),
    'weird-path-slashes'
  )
  assert.equal(safePlaybookFilename(''), 'renni-playbook-export')
  // No leading or trailing dots/hyphens.
  assert.equal(safePlaybookFilename('--bad--'), 'bad')
  assert.equal(safePlaybookFilename('..lots..'), 'lots')
})

test('fullPlaybookFilename builds canonical default name', () => {
  assert.equal(
    fullPlaybookFilename(null, 'export'),
    'renni-playbook-current-state.md'
  )
  assert.equal(
    fullPlaybookFilename(null, 'final'),
    'renni-playbook-final-state.md'
  )
  // Timestamp colons collapsed; still ends in .md and is lowercased.
  const ts = '2026-05-12T15:30:00.000Z'
  const name = fullPlaybookFilename(ts, 'export')
  assert.match(name, /^renni-playbook-current-state-2026-05-12t15-30-00-000z\.md$/)
})

test('chapterFilename and deliverableFilename are safe and lowercase', () => {
  const chFile = chapterFilename({
    chapter: 5,
    title: 'House Phoenix Brand Book',
    deliverables: []
  })
  assert.equal(
    chFile,
    'renni-playbook-chapter-05-house-phoenix-brand-book.md'
  )
  const delFile = deliverableFilename({
    deliverable: makeDeliverable({
      id: 'ch-05-house-phoenix-brand-book'
    }),
    studio: null,
    output: null
  })
  assert.equal(delFile, 'renni-deliverable-ch-05-house-phoenix-brand-book.md')
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
