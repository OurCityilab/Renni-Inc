// Guards the pilot roster seed script: every pilot student email must
// be present (lowercased) in the plan, the coach/student accounts must
// keep their roles, and the script must stay hard-locked to the
// staging project. Importing the script must have no side effects
// (main() is guarded behind a direct-execution check).
//
// Runner: `tsx app/__tests__/studio/studioRosterSeed.test.ts`
// (or `npm run test:studio-roster-seed`).

import { strict as assert } from 'node:assert'
import {
  ALLOWED_PROJECT_ID,
  PILOT_STUDENT_EMAILS,
  STUDIO_COHORT_ID,
  buildRosterPlan,
  normalizeEmail
} from '../../../scripts/seed-studio-roster'

interface Test {
  name: string
  fn: () => void
}

const tests: Test[] = []
const test = (name: string, fn: () => void) => tests.push({ name, fn })

const EXPECTED_PILOT_EMAILS = [
  'ashakamaiya@gmail.com',
  'kennedyhoward202@gmail.com',
  'chasehjackson08@gmail.com',
  'jadenmartinsamuels@jrladetroit.com',
  'jordanms819@gmail.com',
  'saraiorozco0101@gmail.com',
  'sbodrun@umich.edu',
  'zoiemari.t@gmail.com',
  'nevaehtaylor666@gmail.com',
  'morganelise2008@gmail.com',
  'mylesjdavis1@outlook.com',
  'blaisework99@gmail.com',
  'jacobdilworth127@gmail.com',
  'alorythomas569@gmail.com',
  'the.myra.simone@gmail.com'
]

test('script is hard-locked to the staging project', () => {
  assert.equal(ALLOWED_PROJECT_ID, 'renni-cc-staging')
})

test('cohort id is the pilot cohort', () => {
  assert.equal(STUDIO_COHORT_ID, 'studio-test-2026')
})

test('normalizeEmail lowercases and trims', () => {
  assert.equal(normalizeEmail('  MIXED@Case.COM '), 'mixed@case.com')
})

test('all 15 pilot student emails are present, lowercase', () => {
  assert.equal(PILOT_STUDENT_EMAILS.length, 15)
  for (const email of EXPECTED_PILOT_EMAILS) {
    assert.ok(PILOT_STUDENT_EMAILS.includes(email), `missing pilot email: ${email}`)
  }
  for (const email of PILOT_STUDENT_EMAILS) {
    assert.equal(email, email.toLowerCase(), `not lowercase: ${email}`)
  }
})

test('plan covers pilots + existing accounts with correct roles and cohort', () => {
  const now = new Date().toISOString()
  const plan = buildRosterPlan(now)
  assert.equal(plan.length, 17)

  const byId = new Map(plan.map((e) => [e.docId, e]))

  for (const email of EXPECTED_PILOT_EMAILS) {
    const entry = byId.get(email)
    assert.ok(entry, `plan missing ${email}`)
    assert.equal(entry.data.studioRole, 'student')
  }

  assert.equal(byId.get('david.elam2@gmail.com')?.data.studioRole, 'student')
  assert.equal(byId.get('dkelam@ourcitylab.io')?.data.studioRole, 'coach')

  for (const entry of plan) {
    assert.equal(entry.docId, entry.docId.toLowerCase(), `doc id not lowercase: ${entry.docId}`)
    assert.equal(entry.docId, entry.data.email, `doc id must equal email: ${entry.docId}`)
    assert.ok(
      entry.data.cohortIds.includes(STUDIO_COHORT_ID),
      `entry missing cohort: ${entry.docId}`
    )
    assert.equal(entry.data.updatedAt, now)
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
