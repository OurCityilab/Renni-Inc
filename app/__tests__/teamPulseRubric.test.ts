import { strict as assert } from 'node:assert'
import {
  TEAM_PULSE_CALIBRATION_COPY,
  TEAM_PULSE_RATING_ANCHORS,
  isRateableDirectWork,
  ratingHasExtremeScore,
  requiresEvidenceExample
} from '../utils/teamPulseRubric'
import {
  isTeamPulseAdminTakeUser,
  resolveTeamPulseTakeTargets
} from '../utils/teamPulseTargets'
import type { AppUser, TeamPulseCycle } from '../types/models'

interface Test { name: string; fn: () => void }
const tests: Test[] = []
const test = (name: string, fn: () => void) => tests.push({ name, fn })

function user(overrides: Partial<AppUser>): AppUser {
  return {
    uid: 'u-member',
    email: 'member@example.com',
    displayName: 'Member',
    role: 'member',
    title: 'Team Member',
    department: 'marketing',
    isChief: false,
    createdAt: '2026-05-01T00:00:00.000Z',
    ...overrides
  }
}

function cycle(overrides: Partial<TeamPulseCycle> = {}): TeamPulseCycle {
  return {
    id: 'pulse-1',
    title: 'Team Pulse 1',
    description: 'Calibration only.',
    status: 'open',
    opensAt: null,
    closesAt: null,
    departmentsIncluded: ['marketing'],
    calibrationOnly: true,
    includeSelfRatings: true,
    includePeerRatings: true,
    includeLeaderRatings: true,
    createdByUid: 'admin',
    createdByEmail: 'admin@example.com',
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    ...overrides
  }
}

test('extreme ratings require evidence examples', () => {
  assert.equal(requiresEvidenceExample(1), true)
  assert.equal(requiresEvidenceExample(5), true)
  assert.equal(requiresEvidenceExample(3), false)
})

test('directWorkLevel none is not rateable', () => {
  assert.equal(isRateableDirectWork('none'), false)
  assert.equal(isRateableDirectWork('little'), true)
  assert.equal(isRateableDirectWork('some'), true)
  assert.equal(isRateableDirectWork('a_lot'), true)
})

test('ratingHasExtremeScore detects 1 or 5', () => {
  assert.equal(
    ratingHasExtremeScore({
      contribution: 3,
      reliability: 4,
      communication: 3,
      qualityStandard: 2,
      teamSupportLeadership: 3
    }),
    false
  )
  assert.equal(
    ratingHasExtremeScore({
      contribution: 5,
      reliability: 4,
      communication: 3,
      qualityStandard: 2,
      teamSupportLeadership: 3
    }),
    true
  )
})

test('rubric copy makes the calibration-only posture explicit', () => {
  assert.match(TEAM_PULSE_CALIBRATION_COPY, /not an automatic grade/i)
  assert.match(TEAM_PULSE_CALIBRATION_COPY, /does not directly approve or reject deliverables/i)
  assert.equal(TEAM_PULSE_RATING_ANCHORS[5], 'Consistently demonstrated and helped others')
})

test('self-rating enabled creates at least one self target', () => {
  const current = user({ uid: 'u-student', email: 'student@example.com' })
  const targets = resolveTeamPulseTakeTargets({
    cycle: cycle({ includePeerRatings: false, includeLeaderRatings: false }),
    currentUser: current,
    users: []
  })
  assert.equal(targets.targets.length, 1)
  assert.equal(targets.targets[0]?.uid, current.uid)
  assert.equal(targets.currentUserDepartmentIncluded, true)
})

test('no eligible peers produces a detectable empty state condition', () => {
  const current = user({ uid: 'u-student', department: 'finance' })
  const targets = resolveTeamPulseTakeTargets({
    cycle: cycle({
      departmentsIncluded: ['marketing'],
      includeSelfRatings: true,
      includePeerRatings: true
    }),
    currentUser: current,
    users: [user({ uid: 'u-peer', department: 'marketing' })]
  })
  assert.equal(targets.targets.length, 0)
  assert.equal(targets.currentUserDepartmentIncluded, false)
})

test('admin take user is blocked from student target list', () => {
  const admin = user({
    uid: 'u-admin',
    email: 'admin@example.com',
    role: 'admin',
    department: 'admin',
    isChief: true
  })
  assert.equal(isTeamPulseAdminTakeUser(admin), true)
  const targets = resolveTeamPulseTakeTargets({
    cycle: cycle({ departmentsIncluded: [] }),
    currentUser: admin,
    users: [admin]
  })
  assert.equal(targets.targets.length, 0)
})

test('same-department peers and leaders are selected clearly', () => {
  const current = user({ uid: 'u-student' })
  const peer = user({ uid: 'u-peer', email: 'peer@example.com' })
  const leader = user({
    uid: 'u-chief',
    email: 'chief@example.com',
    role: 'cmo',
    title: 'CMO',
    isChief: true
  })
  const otherDept = user({
    uid: 'u-finance',
    email: 'finance@example.com',
    department: 'finance'
  })
  const targets = resolveTeamPulseTakeTargets({
    cycle: cycle(),
    currentUser: current,
    users: [peer, leader, otherDept]
  })
  assert.deepEqual(
    targets.targets.map((t) => t.uid),
    ['u-student', 'u-chief', 'u-peer']
  )
  assert.equal(targets.leaderCount, 1)
  assert.equal(targets.sameDepartmentPeerCount, 2)
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
