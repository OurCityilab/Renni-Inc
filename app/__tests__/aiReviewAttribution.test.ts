import { strict as assert } from 'node:assert'
import { getSafeCompletionLanguage } from '../utils/aiReviewAttribution'
import type { Task } from '../types/models'

interface Test { name: string; fn: () => void }
const tests: Test[] = []
const test = (name: string, fn: () => void) => tests.push({ name, fn })

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 't-1',
    title: 'Finish source list',
    deliverableId: 'd-1',
    ownerEmail: 'owner@example.com',
    ownerUid: 'u-owner',
    status: 'done',
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-02T00:00:00.000Z',
    ...overrides
  }
}

test('exact completedBy allows completed language', () => {
  const text = getSafeCompletionLanguage(
    task({
      completedByEmail: 'student@example.com',
      completedAt: '2026-05-12T12:00:00.000Z'
    })
  )
  assert.match(text, /Completed by student@example\.com/)
  assert.match(text, /2026-05-12T12:00:00\.000Z/)
})

test('missing completedBy keeps conservative language', () => {
  const text = getSafeCompletionLanguage(task({ completedByEmail: null }))
  assert.match(text, /completion actor unavailable/)
  assert.match(text, /Assigned to owner@example\.com/)
  assert.equal(text.includes('Completed by'), false)
})

test('owner alone does not become completedBy', () => {
  const text = getSafeCompletionLanguage(
    task({ ownerEmail: 'owner@example.com', completedByEmail: undefined })
  )
  assert.equal(text.includes('Completed by owner@example.com'), false)
  assert.match(text, /Assigned to owner@example\.com/)
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
