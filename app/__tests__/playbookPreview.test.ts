// Pure unit tests for normalizeDeliverablePreview.
//
// Runner: `tsx app/__tests__/playbookPreview.test.ts` (or
// `npm run test:preview`). Uses Node's built-in `node:assert/strict`
// to match the existing classifier / approval / progress test suites.
//
// Coverage:
//   - final mode uses finalText only
//   - final mode marks missing when finalText blank
//   - current mode falls back finalText → draftText → sourceNotes → missing
//   - export mode uses same fallback as current
//   - evidence links are preserved
//   - structured evidence is preserved
//   - unknown section ids (persisted but absent from studio) still render
//   - no mutation of the input output object

import { strict as assert } from 'node:assert'
import {
  normalizeDeliverablePreview,
  PREVIEW_CONTENT_SOURCE_LABEL,
  renderSectionMarkdown
} from '../utils/playbookPreview'
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
  overrides: Partial<Pick<Deliverable, 'id' | 'title' | 'chapter' | 'status'>> = {}
): Pick<Deliverable, 'id' | 'title' | 'chapter' | 'status'> {
  return {
    id: 'd-1',
    title: 'Test Deliverable',
    chapter: 1,
    status: 'draft',
    ...overrides
  }
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

function makeStudio(sections: { id: string; title: string }[]): TemplateStudio {
  // Minimal cast: the normalizer only reads `sections[].id` and
  // `sections[].title` plus optional builder enable flags. Casting via
  // unknown keeps the test focused without importing every studio
  // helper field.
  const fullSections = sections.map(
    (s) =>
      ({
        id: s.id,
        title: s.title
      }) as unknown as TemplateStudioSection
  )
  return {
    title: 'Studio',
    sections: fullSections
  } as unknown as TemplateStudio
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

/* -------- final mode -------- */

test('final mode uses finalText only when present', () => {
  const output = makeOutput({
    'sec-a': makeSection({
      sectionId: 'sec-a',
      finalText: 'Final copy.',
      draftText: 'Earlier draft.',
      sourceNotes: 'Note.'
    })
  })
  const preview = normalizeDeliverablePreview({
    deliverable: makeDeliverable(),
    studio: makeStudio([{ id: 'sec-a', title: 'Section A' }]),
    output,
    mode: 'final'
  })
  const sec = preview.sections[0]!
  assert.equal(sec.contentSource, 'finalText')
  assert.equal(sec.content, 'Final copy.')
  assert.equal(sec.isMissing, false)
  assert.equal(sec.contentSourceLabel, PREVIEW_CONTENT_SOURCE_LABEL.finalText)
})

test('final mode marks missing when finalText blank, even if draftText exists', () => {
  const output = makeOutput({
    'sec-a': makeSection({
      sectionId: 'sec-a',
      finalText: '   ',
      draftText: 'Working version.',
      sourceNotes: 'Notes.'
    })
  })
  const preview = normalizeDeliverablePreview({
    deliverable: makeDeliverable(),
    studio: makeStudio([{ id: 'sec-a', title: 'Section A' }]),
    output,
    mode: 'final'
  })
  const sec = preview.sections[0]!
  assert.equal(sec.contentSource, 'missing')
  assert.equal(sec.content, '')
  assert.equal(sec.isMissing, true)
  assert.equal(sec.missingLabel, 'Missing final Playbook text')
})

/* -------- current mode -------- */

test('current mode prefers finalText when present', () => {
  const output = makeOutput({
    'sec-a': makeSection({
      sectionId: 'sec-a',
      finalText: 'Final.',
      draftText: 'Draft.'
    })
  })
  const preview = normalizeDeliverablePreview({
    deliverable: makeDeliverable(),
    studio: makeStudio([{ id: 'sec-a', title: 'A' }]),
    output,
    mode: 'current'
  })
  assert.equal(preview.sections[0]!.contentSource, 'finalText')
  assert.equal(preview.sections[0]!.content, 'Final.')
})

test('current mode falls back to draftText when finalText is blank', () => {
  const output = makeOutput({
    'sec-a': makeSection({
      sectionId: 'sec-a',
      finalText: '',
      draftText: 'Working draft text.',
      sourceNotes: 'Should not be used.'
    })
  })
  const preview = normalizeDeliverablePreview({
    deliverable: makeDeliverable(),
    studio: makeStudio([{ id: 'sec-a', title: 'A' }]),
    output,
    mode: 'current'
  })
  const sec = preview.sections[0]!
  assert.equal(sec.contentSource, 'draftText')
  assert.equal(sec.content, 'Working draft text.')
  assert.equal(
    sec.missingLabel,
    'Showing draft text — final Playbook text has not been written yet.'
  )
})

test('current mode falls back to sourceNotes when finalText and draftText blank', () => {
  const output = makeOutput({
    'sec-a': makeSection({
      sectionId: 'sec-a',
      finalText: '',
      draftText: '   ',
      sourceNotes: 'Just some research notes.'
    })
  })
  const preview = normalizeDeliverablePreview({
    deliverable: makeDeliverable(),
    studio: makeStudio([{ id: 'sec-a', title: 'A' }]),
    output,
    mode: 'current'
  })
  const sec = preview.sections[0]!
  assert.equal(sec.contentSource, 'sourceNotes')
  assert.equal(sec.content, 'Just some research notes.')
  assert.match(sec.missingLabel, /source notes/i)
})

test('current mode reports missing when all three are blank', () => {
  const output = makeOutput({
    'sec-a': makeSection({ sectionId: 'sec-a' })
  })
  const preview = normalizeDeliverablePreview({
    deliverable: makeDeliverable(),
    studio: makeStudio([{ id: 'sec-a', title: 'A' }]),
    output,
    mode: 'current'
  })
  const sec = preview.sections[0]!
  assert.equal(sec.contentSource, 'missing')
  assert.equal(sec.isMissing, true)
  assert.equal(sec.missingLabel, 'No saved section text yet')
})

/* -------- export mode -------- */

test('export mode uses same fallback chain as current', () => {
  const output = makeOutput({
    'sec-a': makeSection({
      sectionId: 'sec-a',
      finalText: '',
      draftText: 'Draft body.',
      sourceNotes: 'unused'
    })
  })
  const preview = normalizeDeliverablePreview({
    deliverable: makeDeliverable(),
    studio: makeStudio([{ id: 'sec-a', title: 'A' }]),
    output,
    mode: 'export'
  })
  assert.equal(preview.sections[0]!.contentSource, 'draftText')
  assert.equal(preview.sections[0]!.content, 'Draft body.')
})

/* -------- evidence preservation -------- */

test('evidence links are preserved unchanged', () => {
  const link: DeliverableEvidenceLink = {
    id: 'l-1',
    label: 'Source',
    url: 'https://example.com',
    type: 'doc',
    sectionId: 'sec-a',
    requirementId: null,
    addedByUid: null,
    addedByEmail: null,
    addedAt: null
  }
  const output = makeOutput({
    'sec-a': makeSection({
      sectionId: 'sec-a',
      finalText: 'Final.',
      evidenceLinks: [link]
    })
  })
  const preview = normalizeDeliverablePreview({
    deliverable: makeDeliverable(),
    studio: makeStudio([{ id: 'sec-a', title: 'A' }]),
    output,
    mode: 'current'
  })
  assert.equal(preview.sections[0]!.evidenceLinks.length, 1)
  assert.equal(preview.sections[0]!.evidenceLinks[0]!.url, 'https://example.com')
})

test('structured evidence is preserved unchanged', () => {
  const entry: StructuredEvidenceEntry = {
    id: 'e-1',
    claim: 'Beanies sell at $30 in Detroit retail.',
    evidence: '12 of 14 nearby shops priced beanies $28–$35.',
    source: 'Retail observation, March 2026',
    confidence: 'medium',
    addedByUid: null,
    addedByEmail: null,
    addedAt: null,
    updatedAt: null
  }
  const output = makeOutput({
    'sec-a': makeSection({
      sectionId: 'sec-a',
      finalText: 'Final.',
      structuredEvidence: [entry]
    })
  })
  const preview = normalizeDeliverablePreview({
    deliverable: makeDeliverable(),
    studio: makeStudio([{ id: 'sec-a', title: 'A' }]),
    output,
    mode: 'final'
  })
  assert.equal(preview.sections[0]!.structuredEvidence.length, 1)
  assert.equal(preview.sections[0]!.structuredEvidence[0]!.claim, entry.claim)
})

/* -------- orphan ids -------- */

test('unknown / orphan section ids are appended and render with snapshot title', () => {
  const output = makeOutput({
    'sec-a': makeSection({
      sectionId: 'sec-a',
      finalText: 'Final.'
    }),
    'legacy-1': makeSection({
      sectionId: 'legacy-1',
      sectionTitleSnapshot: 'Legacy section',
      draftText: 'Old draft.'
    })
  })
  const preview = normalizeDeliverablePreview({
    deliverable: makeDeliverable(),
    studio: makeStudio([{ id: 'sec-a', title: 'A' }]),
    output,
    mode: 'current'
  })
  assert.equal(preview.sections.length, 2)
  assert.equal(preview.sections[1]!.sectionId, 'legacy-1')
  assert.equal(preview.sections[1]!.title, 'Legacy section')
  assert.equal(preview.sections[1]!.contentSource, 'draftText')
})

/* -------- no mutation -------- */

test('normalizer does not mutate the input output object', () => {
  const output = makeOutput({
    'sec-a': makeSection({
      sectionId: 'sec-a',
      finalText: '',
      draftText: 'Draft.',
      sourceNotes: 'Notes.'
    })
  })
  const before = JSON.stringify(output)
  normalizeDeliverablePreview({
    deliverable: makeDeliverable(),
    studio: makeStudio([{ id: 'sec-a', title: 'A' }]),
    output,
    mode: 'current'
  })
  // Critically: even when we read draftText as the rendered content,
  // we must NOT promote it into the persisted finalText. The output
  // object must look identical after normalization.
  const after = JSON.stringify(output)
  assert.equal(after, before)
  // And explicitly: finalText must still be empty.
  assert.equal(output.sections['sec-a']!.finalText, '')
})

/* -------- summary counts -------- */

test('summary counts split across finalText / fallback / missing', () => {
  const output = makeOutput({
    a: makeSection({ sectionId: 'a', finalText: 'A' }),
    b: makeSection({ sectionId: 'b', draftText: 'B draft' }),
    c: makeSection({ sectionId: 'c', sourceNotes: 'C notes' }),
    d: makeSection({ sectionId: 'd' })
  })
  const preview = normalizeDeliverablePreview({
    deliverable: makeDeliverable(),
    studio: makeStudio([
      { id: 'a', title: 'A' },
      { id: 'b', title: 'B' },
      { id: 'c', title: 'C' },
      { id: 'd', title: 'D' }
    ]),
    output,
    mode: 'current'
  })
  assert.equal(preview.sectionsWithFinalText, 1)
  assert.equal(preview.sectionsWithFallback, 2)
  assert.equal(preview.sectionsMissing, 1)
  assert.equal(preview.totalSections, 4)
})

/* -------- markdown adapter -------- */

test('renderSectionMarkdown emits final content cleanly', () => {
  const md = renderSectionMarkdown({
    sectionId: 'sec',
    title: 'Section',
    content: 'Body.',
    contentSource: 'finalText',
    contentSourceLabel: PREVIEW_CONTENT_SOURCE_LABEL.finalText,
    isMissing: false,
    missingLabel: '',
    evidenceLinks: [],
    structuredEvidence: [],
    sectionStatus: null,
    hasPersistedSection: true,
    persistedSection: null
  })
  assert.match(md, /^## Section/)
  assert.match(md, /Body\./)
})

test('renderSectionMarkdown notes fallback when source is not finalText', () => {
  const md = renderSectionMarkdown({
    sectionId: 'sec',
    title: 'Section',
    content: 'Draft body.',
    contentSource: 'draftText',
    contentSourceLabel: PREVIEW_CONTENT_SOURCE_LABEL.draftText,
    isMissing: false,
    missingLabel:
      'Showing draft text — final Playbook text has not been written yet.',
    evidenceLinks: [],
    structuredEvidence: [],
    sectionStatus: null,
    hasPersistedSection: true,
    persistedSection: null
  })
  assert.match(md, /Showing draft text/)
  assert.match(md, /Draft body\./)
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
