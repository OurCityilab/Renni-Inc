import { readFileSync } from 'node:fs'
import { strict as assert } from 'node:assert'
import {
  buildAiReviewSnapshotDoc,
  canSaveAiReviewSnapshot
} from '../utils/aiReviewSnapshots'
import { earlySemesterCompanyPayload, midSemesterDepartmentPayload } from './fixtures/aiReviewPayloads'
import { AI_REVIEW_COACHING_SAFETY_REMINDER } from '../types/aiReviewReports'

interface Test { name: string; fn: () => void }
const tests: Test[] = []
const test = (name: string, fn: () => void) => tests.push({ name, fn })

const adminActor = {
  uid: 'u-admin',
  email: 'instructor@example.com',
  role: 'admin' as const,
  department: 'admin' as const
}

test('apphosting enables AI review coaching without hardcoding the secret', () => {
  const yaml = readFileSync('apphosting.yaml', 'utf8')
  assert.match(yaml, /NUXT_AI_REVIEW_COACHING_ENABLED/)
  assert.match(yaml, /value:\s+"true"/)
  assert.match(yaml, /NUXT_AI_CRITIQUE_API_KEY\s*\n\s*secret: NUXT_AI_CRITIQUE_API_KEY/)
})

test('snapshot doc stores metadata only', () => {
  const doc = buildAiReviewSnapshotDoc(
    {
      payload: earlySemesterCompanyPayload,
      actor: adminActor,
      coaching: {
        executiveSummary: 'Leadership should coach evidence coverage.',
        coachingPriorities: [],
        strongestAreas: [],
        weakestAreas: [],
        missingEvidence: [],
        escalationItems: [],
        suggestedTalkingPoints: [],
        recommendedNextActions: [],
        limitations: ['Attribution remains limited.'],
        safetyReminder: AI_REVIEW_COACHING_SAFETY_REMINDER
      },
      copyBlock: '# Report\nNo full payload here.'
    },
    '2026-05-12T00:00:00.000Z'
  )
  assert.equal(doc.reportType, 'company')
  assert.equal(doc.readinessScore, 18)
  assert.equal(doc.coachingIncluded, true)
  assert.deepEqual(doc.statusCounts, {
    approved: 0,
    inReview: 0,
    needsRevision: 0,
    draft: 2
  })
  const serialized = JSON.stringify(doc)
  assert.equal(serialized.includes('contentExcerpt'), false)
  assert.equal(serialized.includes('Early thoughts on the mission'), false)
  assert.equal(serialized.includes('coachingPriorities'), false)
  assert.equal(serialized.includes('apiKey'), false)
  assert.equal(serialized.includes('idToken'), false)
})

test('snapshot permission blocks ordinary member company-wide', () => {
  assert.equal(
    canSaveAiReviewSnapshot(
      {
        uid: 'u-member',
        email: 'member@example.com',
        role: 'member',
        department: 'marketing'
      },
      earlySemesterCompanyPayload
    ),
    false
  )
})

test('snapshot permission allows matching chief for department scope', () => {
  assert.equal(
    canSaveAiReviewSnapshot(
      {
        uid: 'u-cmo',
        email: 'cmo@example.com',
        role: 'cmo',
        department: 'marketing'
      },
      midSemesterDepartmentPayload
    ),
    true
  )
})

let failed = 0
for (const t of tests) {
  try {
    t.fn()
    console.log(`ok  - ${t.name}`)
  } catch (err) {
    failed++
    console.error(`FAIL - ${t.name}`)
    console.error(err)
  }
}
if (failed > 0) process.exit(1)
console.log(`\n${tests.length} passed`)
