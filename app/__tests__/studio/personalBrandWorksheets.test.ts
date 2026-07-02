// Guards the Personal Brand & Pitch Lab modules: every worksheet in
// app/data/studio/worksheets/personalBrandPitchLab.ts must be a real
// fillable module (fields, route, Sherpa focus) AND its reference PDF
// must exist on disk under public/ with the exact (Title_Case,
// underscore) filename — a renamed or missing file means a broken
// student download link.
//
// Runner: `tsx app/__tests__/studio/personalBrandWorksheets.test.ts`
// (or `npm run test:studio-worksheets`).

import { strict as assert } from 'node:assert'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  PERSONAL_BRAND_WORKSHEETS_DIR,
  composeWorksheetPayload,
  getWorksheetBySlug,
  personalBrandWorksheets
} from '../../data/studio/worksheets/personalBrandPitchLab'

interface Test {
  name: string
  fn: () => void
}

const tests: Test[] = []
const test = (name: string, fn: () => void) => tests.push({ name, fn })

const PUBLIC_DIR = join(process.cwd(), 'public')

test('there are exactly seven worksheets, numbered 1-7', () => {
  assert.equal(personalBrandWorksheets.length, 7)
  assert.deepEqual(
    personalBrandWorksheets.map((w) => w.number),
    [1, 2, 3, 4, 5, 6, 7]
  )
})

test('every declared worksheet PDF exists on disk with the exact filename', () => {
  for (const ws of personalBrandWorksheets) {
    const diskPath = join(PUBLIC_DIR, PERSONAL_BRAND_WORKSHEETS_DIR, ws.fileName)
    assert.ok(existsSync(diskPath), `missing PDF: ${diskPath}`)
  }
})

test('hrefs point into the exact-named folder and preserve exact filenames', () => {
  for (const ws of personalBrandWorksheets) {
    assert.ok(
      ws.pdfHref.startsWith('/studio/worksheets/Personal_Brand_Individual_Worksheets/'),
      ws.pdfHref
    )
    assert.ok(ws.pdfHref.endsWith(ws.fileName), ws.pdfHref)
    assert.ok(/^Personal_Brand_Worksheet_\d_/.test(ws.fileName), ws.fileName)
  }
})

test('route slugs are clean lowercase and routes point into the Lab', () => {
  for (const ws of personalBrandWorksheets) {
    assert.ok(/^[a-z0-9-]+$/.test(ws.slug), ws.slug)
    assert.equal(ws.route, `/studio/lab/personal-brand/${ws.slug}`)
    assert.equal(getWorksheetBySlug(ws.slug), ws)
  }
  assert.equal(getWorksheetBySlug('not-a-worksheet'), null)
})

test('every module is fillable: at least one field, unique keys, description, sherpaFocus', () => {
  for (const ws of personalBrandWorksheets) {
    const keys = ws.sections.flatMap((s) => s.fields.map((f) => f.key))
    assert.ok(keys.length >= 1, `${ws.slug} has no fields`)
    assert.equal(new Set(keys).size, keys.length, `${ws.slug} has duplicate field keys`)
    assert.ok(ws.description.trim().length > 0, `${ws.slug} missing description`)
    assert.ok(ws.sherpaFocus.trim().length > 0, `${ws.slug} missing sherpaFocus`)
    assert.ok(ws.outputOptions.length >= 1, `${ws.slug} has no output options`)
  }
})

test('Pitch Builder has 3-second, 30-second, and 3-minute/TMAY sections', () => {
  const ws = getWorksheetBySlug('pitch-builder')
  assert.ok(ws)
  const titles = ws.sections.map((s) => s.title ?? '')
  assert.ok(titles.some((t) => t.includes('3-second')), titles.join(', '))
  assert.ok(titles.some((t) => t.includes('30-second')), titles.join(', '))
  assert.ok(titles.some((t) => t.includes('3-minute') && t.includes('TMAY')), titles.join(', '))
  assert.deepEqual(ws.outputOptions, ['pitch_3s', 'pitch_30s', 'pitch_1min_tmay'])
})

test('Worksheet 7 has LinkedIn headline and resume summary fields', () => {
  const ws = getWorksheetBySlug('resume-linkedin')
  assert.ok(ws)
  const keys = ws.sections.flatMap((s) => s.fields.map((f) => f.key))
  assert.ok(keys.includes('linkedinHeadline'), keys.join(', '))
  assert.ok(keys.includes('resumeSummary'), keys.join(', '))
})

test('composeWorksheetPayload labels every answer with its field label', () => {
  const ws = getWorksheetBySlug('brand-ingredients')
  assert.ok(ws)
  const payload = composeWorksheetPayload(ws, {
    whyICare: 'I care about my neighborhood having safe spaces.',
    goodAt: 'Organizing events end to end.',
    brandWords: 'organized, dependable, community-minded'
  })
  assert.ok(payload.worksheet.includes('Worksheet 2: My Brand Ingredients'))
  assert.ok(payload.worksheet.includes('Why do I care about the work I want to do?'))
  assert.ok(payload.worksheet.includes('I care about my neighborhood having safe spaces.'))
  assert.ok(payload.worksheet.includes('I am good at:'))
  // brandWords maps into the dedicated selfWords slot, not the worksheet text.
  assert.equal(payload.selfWords, 'organized, dependable, community-minded')
  assert.ok(!payload.worksheet.includes('organized, dependable, community-minded'))
})

test('composeWorksheetPayload maps Story 1 into the STAR slot', () => {
  const ws = getWorksheetBySlug('proof-story-bank')
  assert.ok(ws)
  const payload = composeWorksheetPayload(ws, {
    story1Situation: 'Our pop-up shop table was disorganized on opening day.',
    story1Action: 'I made a checklist and reorganized the display.',
    story1Result: 'We sold out of beanies by noon.'
  })
  assert.ok(payload.starExample.includes('Situation: Our pop-up shop table was disorganized'))
  assert.ok(payload.starExample.includes('Action: I made a checklist'))
  assert.ok(payload.starExample.includes('Result: We sold out of beanies by noon.'))
})

test('the Lab index links to the Personal Brand & Pitch Lab', () => {
  const labIndex = readFileSync(
    join(process.cwd(), 'app/pages/studio/lab/index.vue'),
    'utf8'
  )
  assert.ok(labIndex.includes('/studio/lab/personal-brand'))
  assert.ok(labIndex.includes('Personal Brand & Pitch Lab'))
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
