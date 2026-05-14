import { strict as assert } from 'node:assert'
import type { TeamPulseResponse } from '../types/models'
import {
  averageTeamPulseResponseRatings,
  buildRaterPatternFlags,
  buildTeamPulseStudentSummary,
  canGenerateTeamPulseSummaries,
  summaryHidesRawPeerIdentity
} from '../utils/teamPulseSummary'

interface Test { name: string; fn: () => void }
const tests: Test[] = []
const test = (name: string, fn: () => void) => tests.push({ name, fn })

function response(
  overrides: Partial<TeamPulseResponse>
): TeamPulseResponse {
  return {
    id: 'r',
    cycleId: 'cycle-1',
    raterUid: 'rater-1',
    raterEmail: 'rater1@example.com',
    raterRole: 'member',
    raterDepartment: 'marketing',
    rateeUid: 'student-1',
    rateeEmail: 'student1@example.com',
    rateeRole: 'member',
    rateeDepartment: 'marketing',
    relationship: 'peer',
    directWorkLevel: 'some',
    ratings: {
      contribution: 3,
      reliability: 3,
      communication: 3,
      qualityStandard: 3,
      teamSupportLeadership: 3
    },
    comments: {
      strength: '',
      improvement: '',
      supportNeeded: '',
      evidenceExample: ''
    },
    submittedAt: '2026-05-12T12:00:00.000Z',
    updatedAt: '2026-05-12T12:00:00.000Z',
    ...overrides
  }
}

test('averages calculate direct-work weighted scores', () => {
  const summary = buildTeamPulseStudentSummary({
    cycleId: 'cycle-1',
    subjectUid: 'student-1',
    subjectEmail: 'student1@example.com',
    department: 'marketing',
    responses: [
      response({
        raterUid: 'peer-a',
        directWorkLevel: 'little',
        ratings: {
          contribution: 1,
          reliability: 1,
          communication: 1,
          qualityStandard: 1,
          teamSupportLeadership: 1
        }
      }),
      response({
        raterUid: 'peer-b',
        directWorkLevel: 'a_lot',
        ratings: {
          contribution: 5,
          reliability: 5,
          communication: 5,
          qualityStandard: 5,
          teamSupportLeadership: 5
        }
      })
    ],
    now: '2026-05-12T12:00:00.000Z'
  })
  assert.equal(summary.averages.contribution, 3.9)
  assert.equal(summary.peerAverages?.contribution, 3)
  assert.equal(summary.directWorkBreakdown.little, 1)
  assert.equal(summary.directWorkBreakdown.a_lot, 1)
})

test('self-peer gap flag fires with safe copy', () => {
  const summary = buildTeamPulseStudentSummary({
    cycleId: 'cycle-1',
    subjectUid: 'student-1',
    subjectEmail: 'student1@example.com',
    department: 'marketing',
    responses: [
      response({
        raterUid: 'student-1',
        raterEmail: 'student1@example.com',
        relationship: 'self',
        ratings: {
          contribution: 5,
          reliability: 5,
          communication: 5,
          qualityStandard: 5,
          teamSupportLeadership: 5
        }
      }),
      response({ raterUid: 'peer-a', ratings: { contribution: 2, reliability: 2, communication: 2, qualityStandard: 2, teamSupportLeadership: 2 } }),
      response({ raterUid: 'peer-b', ratings: { contribution: 2, reliability: 2, communication: 2, qualityStandard: 2, teamSupportLeadership: 2 } })
    ],
    now: '2026-05-12T12:00:00.000Z'
  })
  assert.ok(summary.flags.some((f) => f.flagType === 'self_peer_gap'))
  assert.match(summary.flags[0]!.reviewCopy, /Calibration discussion recommended|Pattern needs review/)
})

test('low direct-work confidence flag fires safely', () => {
  const summary = buildTeamPulseStudentSummary({
    cycleId: 'cycle-1',
    subjectUid: 'student-1',
    subjectEmail: 'student1@example.com',
    department: 'marketing',
    responses: [
      response({ raterUid: 'peer-a', directWorkLevel: 'none', ratings: undefined }),
      response({ raterUid: 'peer-b', directWorkLevel: 'little' }),
      response({ raterUid: 'peer-c', directWorkLevel: 'some' })
    ],
    now: '2026-05-12T12:00:00.000Z'
  })
  assert.ok(summary.flags.some((f) => f.flagType === 'low_direct_work_confidence'))
})

test('peer disagreement flag fires safely', () => {
  const summary = buildTeamPulseStudentSummary({
    cycleId: 'cycle-1',
    subjectUid: 'student-1',
    subjectEmail: 'student1@example.com',
    department: 'marketing',
    responses: [
      response({ raterUid: 'peer-a', ratings: { contribution: 1, reliability: 3, communication: 3, qualityStandard: 3, teamSupportLeadership: 3 } }),
      response({ raterUid: 'peer-b', ratings: { contribution: 5, reliability: 3, communication: 3, qualityStandard: 3, teamSupportLeadership: 3 } }),
      response({ raterUid: 'peer-c', ratings: { contribution: 3, reliability: 3, communication: 3, qualityStandard: 3, teamSupportLeadership: 3 } })
    ],
    now: '2026-05-12T12:00:00.000Z'
  })
  assert.ok(summary.flags.some((f) => f.flagType === 'peer_disagreement'))
})

test('uniform rater pattern flags fire with safe review language', () => {
  const highRows = Array.from({ length: 2 }, (_, i) =>
    response({
      id: `h-${i}`,
      raterUid: 'high-rater',
      raterEmail: 'high@example.com',
      rateeUid: `student-${i}`,
      ratings: {
        contribution: 5,
        reliability: 5,
        communication: 5,
        qualityStandard: 5,
        teamSupportLeadership: 5
      }
    })
  )
  const lowRows = Array.from({ length: 2 }, (_, i) =>
    response({
      id: `l-${i}`,
      raterUid: 'low-rater',
      raterEmail: 'low@example.com',
      rateeUid: `low-student-${i}`,
      ratings: {
        contribution: 1,
        reliability: 1,
        communication: 1,
        qualityStandard: 1,
        teamSupportLeadership: 1
      }
    })
  )
  const flags = buildRaterPatternFlags([...highRows, ...lowRows])
  assert.ok(flags.some((r) => r.flags.some((f) => f.flagType === 'uniform_high_scorer')))
  assert.ok(flags.some((r) => r.flags.some((f) => f.flagType === 'uniform_low_scorer')))
  const serialized = JSON.stringify(flags)
  assert.equal(/cheating|lying|lazy|weak student|bad student|punishment|grade impact/i.test(serialized), false)
})

test('student summary helper does not expose raw peer identity fields', () => {
  const summary = buildTeamPulseStudentSummary({
    cycleId: 'cycle-1',
    subjectUid: 'student-1',
    subjectEmail: 'student1@example.com',
    department: 'marketing',
    responses: [response({ raterUid: 'peer-a', raterEmail: 'peer-a@example.com' })],
    now: '2026-05-12T12:00:00.000Z'
  })
  assert.equal(summaryHidesRawPeerIdentity(summary), true)
  assert.equal(JSON.stringify(summary).includes('peer-a@example.com'), false)
})

test('admin response average helper averages available core ratings', () => {
  assert.equal(
    averageTeamPulseResponseRatings(
      response({
        ratings: {
          contribution: 5,
          reliability: 4,
          communication: 3,
          qualityStandard: 2,
          teamSupportLeadership: 1
        }
      })
    ),
    3
  )
})

test('admin response average helper averages leadership ratings', () => {
  assert.equal(
    averageTeamPulseResponseRatings(
      response({
        ratings: undefined,
        leadershipRatings: {
          clearDirection: 5,
          fairDelegation: 4,
          followUpAccountability: 4,
          respectfulCommunication: 3,
          helpWhenStuck: 4
        }
      })
    ),
    4
  )
})

test('admin response average helper returns null with no numeric ratings', () => {
  assert.equal(
    averageTeamPulseResponseRatings(
      response({
        directWorkLevel: 'none',
        ratings: undefined,
        leadershipRatings: undefined
      })
    ),
    null
  )
})

test('summary generation eligibility is closed-cycle only', () => {
  assert.equal(canGenerateTeamPulseSummaries({ status: 'draft' }), false)
  assert.equal(canGenerateTeamPulseSummaries({ status: 'open' }), false)
  assert.equal(canGenerateTeamPulseSummaries({ status: 'closed' }), true)
  assert.equal(canGenerateTeamPulseSummaries({ status: 'summarized' }), false)
  assert.equal(canGenerateTeamPulseSummaries(null), false)
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
