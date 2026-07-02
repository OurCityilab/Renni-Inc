// Guards the Personal Brand & Pitch Lab worksheet links: every PDF
// declared in app/data/studio/worksheets/personalBrandPitchLab.ts
// must exist on disk under public/ with the exact (Title_Case,
// underscore) filename — a renamed or missing file means a broken
// student download link.
//
// Runner: `tsx app/__tests__/studio/personalBrandWorksheets.test.ts`
// (or `npm run test:studio-worksheets`).

import { strict as assert } from 'node:assert'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  PERSONAL_BRAND_WORKSHEETS_DIR,
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

test('route slugs are clean lowercase', () => {
  for (const ws of personalBrandWorksheets) {
    assert.ok(/^[a-z0-9-]+$/.test(ws.slug), ws.slug)
  }
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
