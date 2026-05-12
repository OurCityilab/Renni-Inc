import { strict as assert } from 'node:assert'
import {
  buildReviewMarkdown,
  reviewMarkdownFilename
} from '../utils/aiReviewReportExport'
import { earlySemesterCompanyPayload, finalWeekChapterPayload } from './fixtures/aiReviewPayloads'
import { AI_REVIEW_COACHING_SAFETY_REMINDER } from '../types/aiReviewReports'
import type { AiReviewCoachingOutput } from '../types/aiReviewReports'

interface Test { name: string; fn: () => void }
const tests: Test[] = []
const test = (name: string, fn: () => void) => tests.push({ name, fn })

function coaching(): AiReviewCoachingOutput {
  return {
    executiveSummary: 'Coach final text and evidence coverage before the submission meeting.',
    coachingPriorities: [
      {
        issue: 'Evidence is thin.',
        evidenceFromPayload: 'Deterministic report shows zero evidence links.',
        whyItMatters: 'Leadership needs defensible claims.',
        coachingMove: 'Ask owners to add one source per claim.',
        owner: 'cmo@example.com',
        urgency: 'high',
        definitionOfDone: 'Each claim has a linked source or assumption note.'
      }
    ],
    strongestAreas: [],
    weakestAreas: [],
    missingEvidence: [],
    escalationItems: [],
    suggestedTalkingPoints: [],
    recommendedNextActions: [],
    limitations: ['AI only sees the report payload.'],
    safetyReminder: AI_REVIEW_COACHING_SAFETY_REMINDER
  }
}

test('markdown export includes readiness, work state, limitations, and safety note', () => {
  const md = buildReviewMarkdown(earlySemesterCompanyPayload, null, {
    generatedAt: '2026-05-12T00:00:00.000Z'
  })
  assert.match(md, /Readiness: 18 \/ 100/)
  assert.match(md, /Work-State Summary/)
  assert.match(md, /Top Missing Items/)
  assert.match(md, /Limitations/)
  assert.match(md, /Deterministic report is the source of truth/)
  assert.match(md, /Human leaders approve work/)
})

test('markdown export includes coaching only when provided', () => {
  const without = buildReviewMarkdown(finalWeekChapterPayload)
  const withCoaching = buildReviewMarkdown(finalWeekChapterPayload, coaching())
  assert.equal(without.includes('## AI Coaching'), false)
  assert.match(withCoaching, /## AI Coaching/)
  assert.match(withCoaching, /Coaching priorities/)
})

test('markdown export excludes raw payload JSON and unsafe phrases', () => {
  const md = buildReviewMarkdown(earlySemesterCompanyPayload, coaching())
  assert.equal(md.includes('"deterministicSummary"'), false)
  assert.equal(md.includes('"deliverables"'), false)
  assert.equal(md.includes('apiKey'), false)
  assert.equal(md.includes('idToken'), false)
  assert.equal(/AI approved|AI grade|Written by|lazy|poor performer|weak student|bad student|incapable/i.test(md), false)
})

test('markdown export handles empty lists with clear placeholders', () => {
  const payload = {
    ...earlySemesterCompanyPayload,
    deliverables: [],
    limitations: [],
    deterministicReadiness: {
      ...earlySemesterCompanyPayload.deterministicReadiness,
      limitations: []
    }
  }
  const md = buildReviewMarkdown(payload)
  assert.match(md, /None in current scope/)
  assert.match(md, /No deterministic limitations/)
})

test('markdown filename is safe', () => {
  const name = reviewMarkdownFilename(finalWeekChapterPayload)
  assert.match(name, /^renni-chapter-review-/)
  assert.match(name, /\.md$/)
  assert.equal(/[ /:]/.test(name), false)
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
