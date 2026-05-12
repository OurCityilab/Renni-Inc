import { strict as assert } from 'node:assert'
import { aggregateAiReviewCoachingMetrics } from '../../server/utils/aiReviewCoachingMetrics'

interface Test { name: string; fn: () => void }
const tests: Test[] = []
const test = (name: string, fn: () => void) => tests.push({ name, fn })

test('metrics aggregate metadata only', () => {
  const metrics = aggregateAiReviewCoachingMetrics([
    {
      createdAt: '2026-05-12T12:00:00.000Z',
      reportType: 'company',
      outcome: 'success',
      durationMs: 100,
      payloadStats: { payloadBytes: 1000 }
    },
    {
      createdAt: '2026-05-12T12:02:00.000Z',
      reportType: 'department',
      outcome: 'ai_safety_check_failed',
      durationMs: 300,
      payloadStats: { payloadBytes: 3000 }
    },
    {
      createdAt: '2026-05-12T12:03:00.000Z',
      reportType: 'chapter',
      outcome: 'ai_forbidden',
      durationMs: null,
      payloadStats: null
    }
  ])
  assert.equal(metrics.totalToday, 3)
  assert.equal(metrics.byReportType.company, 1)
  assert.equal(metrics.byReportType.department, 1)
  assert.equal(metrics.byReportType.chapter, 1)
  assert.equal(metrics.successCount, 1)
  assert.equal(metrics.forbiddenCount, 1)
  assert.equal(metrics.safetyFailureCount, 1)
  assert.equal(metrics.averagePayloadBytes, 2000)
  assert.equal(metrics.averageDurationMs, 200)
  const serialized = JSON.stringify(metrics)
  assert.equal(serialized.includes('contentExcerpt'), false)
  assert.equal(serialized.includes('executiveSummary'), false)
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
