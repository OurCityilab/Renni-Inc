// Deliverable approval permission tests.
//
// Runner: `tsx app/__tests__/approvalPermissions.test.ts`. Uses Node's
// built-in `node:assert/strict` to match the existing classifier test.
// No vitest / jest dependency. Exits non-zero on any assertion failure.
//
// Coverage:
//   - admin can approve in_review
//   - coceo can approve in_review
//   - matching-department chief can approve in_review
//   - non-matching-department chief CANNOT approve
//   - exact approverUid can approve
//   - member cannot approve
//   - nobody can approve draft directly
//   - nobody can approve needs_revision directly
//   - approved cannot be approved again

import { strict as assert } from 'node:assert'
import {
  canApproveDeliverable,
  canReturnDeliverable,
  canSubmitDeliverable,
  isChiefRole
} from '../utils/approvalPermissions'
import type {
  AppUser,
  Deliverable,
  DeliverableStatus,
  Department,
  Role
} from '../types/models'

interface Test {
  name: string
  fn: () => void
}

const tests: Test[] = []
const test = (name: string, fn: () => void) => tests.push({ name, fn })

function makeUser(
  overrides: Partial<Pick<AppUser, 'uid' | 'role' | 'department'>>
): Pick<AppUser, 'uid' | 'role' | 'department'> {
  return {
    uid: 'u-default',
    role: 'member' as Role,
    department: 'operations' as Department,
    ...overrides
  }
}

function makeDeliverable(
  overrides: Partial<
    Pick<Deliverable, 'status' | 'approverUid' | 'department' | 'ownerUid'>
  >
): Pick<Deliverable, 'status' | 'approverUid' | 'department' | 'ownerUid'> {
  return {
    status: 'in_review' as DeliverableStatus,
    approverUid: 'u-approver',
    department: 'operations' as Department,
    ownerUid: 'u-owner',
    ...overrides
  }
}

/* -------- canApproveDeliverable -------- */

test('admin can approve in_review', () => {
  const user = makeUser({ uid: 'u-admin', role: 'admin', department: 'admin' })
  const d = makeDeliverable({})
  assert.equal(canApproveDeliverable(user, d), true)
  assert.equal(canReturnDeliverable(user, d), true)
})

test('coceo can approve in_review across any department', () => {
  const user = makeUser({
    uid: 'u-ceo',
    role: 'coceo',
    department: 'executive'
  })
  const d = makeDeliverable({ department: 'marketing' })
  assert.equal(canApproveDeliverable(user, d), true)
})

test('matching-department chief can approve in_review', () => {
  const user = makeUser({
    uid: 'u-cmo',
    role: 'cmo',
    department: 'marketing'
  })
  const d = makeDeliverable({
    department: 'marketing',
    approverUid: 'someone-else'
  })
  assert.equal(canApproveDeliverable(user, d), true)
  assert.equal(canReturnDeliverable(user, d), true)
})

test('non-matching-department chief cannot approve', () => {
  const user = makeUser({
    uid: 'u-cmo',
    role: 'cmo',
    department: 'marketing'
  })
  const d = makeDeliverable({
    department: 'finance',
    approverUid: 'someone-else'
  })
  assert.equal(canApproveDeliverable(user, d), false)
  assert.equal(canReturnDeliverable(user, d), false)
})

test('exact approverUid can approve even if role would not qualify', () => {
  const user = makeUser({
    uid: 'u-approver',
    role: 'member',
    department: 'strategy-growth'
  })
  const d = makeDeliverable({
    approverUid: 'u-approver',
    department: 'marketing'
  })
  assert.equal(canApproveDeliverable(user, d), true)
})

test('member cannot approve', () => {
  const user = makeUser({ uid: 'u-member', role: 'member' })
  const d = makeDeliverable({ approverUid: 'someone-else' })
  assert.equal(canApproveDeliverable(user, d), false)
  assert.equal(canReturnDeliverable(user, d), false)
})

/* -------- direct-approval blocks -------- */

test('nobody can approve draft directly (even admin)', () => {
  const admin = makeUser({ uid: 'u-admin', role: 'admin', department: 'admin' })
  const coceo = makeUser({ uid: 'u-ceo', role: 'coceo', department: 'executive' })
  const chief = makeUser({ uid: 'u-cmo', role: 'cmo', department: 'marketing' })
  const approver = makeUser({ uid: 'u-approver', role: 'member' })
  const d = makeDeliverable({ status: 'draft', approverUid: 'u-approver' })
  assert.equal(canApproveDeliverable(admin, d), false)
  assert.equal(canApproveDeliverable(coceo, d), false)
  assert.equal(canApproveDeliverable(chief, { ...d, department: 'marketing' }), false)
  assert.equal(canApproveDeliverable(approver, d), false)
})

test('nobody can approve needs_revision directly', () => {
  const admin = makeUser({ uid: 'u-admin', role: 'admin', department: 'admin' })
  const chief = makeUser({ uid: 'u-cmo', role: 'cmo', department: 'marketing' })
  const d = makeDeliverable({
    status: 'needs_revision',
    department: 'marketing'
  })
  assert.equal(canApproveDeliverable(admin, d), false)
  assert.equal(canApproveDeliverable(chief, d), false)
})

test('approved cannot be approved again', () => {
  const admin = makeUser({ uid: 'u-admin', role: 'admin', department: 'admin' })
  const d = makeDeliverable({ status: 'approved' })
  assert.equal(canApproveDeliverable(admin, d), false)
  assert.equal(canReturnDeliverable(admin, d), false)
})

test('unauthenticated profile cannot approve', () => {
  const d = makeDeliverable({})
  assert.equal(canApproveDeliverable(null, d), false)
  assert.equal(canApproveDeliverable(undefined, d), false)
})

/* -------- isChiefRole -------- */

test('isChiefRole identifies department chief roles only', () => {
  assert.equal(isChiefRole('coo'), true)
  assert.equal(isChiefRole('cfo'), true)
  assert.equal(isChiefRole('cmo'), true)
  assert.equal(isChiefRole('csgo'), true)
  // admin and coceo are global, NOT in the department-chief set.
  assert.equal(isChiefRole('admin'), false)
  assert.equal(isChiefRole('coceo'), false)
  assert.equal(isChiefRole('member'), false)
  assert.equal(isChiefRole(null), false)
  assert.equal(isChiefRole(undefined), false)
})

/* -------- canSubmitDeliverable -------- */

test('owner can submit draft', () => {
  const owner = makeUser({ uid: 'u-owner', role: 'member' })
  const d = makeDeliverable({ status: 'draft', ownerUid: 'u-owner' })
  assert.equal(canSubmitDeliverable(owner, d), true)
})

test('owner can submit needs_revision', () => {
  const owner = makeUser({ uid: 'u-owner', role: 'member' })
  const d = makeDeliverable({ status: 'needs_revision', ownerUid: 'u-owner' })
  assert.equal(canSubmitDeliverable(owner, d), true)
})

test('non-owner cannot submit', () => {
  const someone = makeUser({ uid: 'u-other', role: 'member' })
  const d = makeDeliverable({ status: 'draft', ownerUid: 'u-owner' })
  assert.equal(canSubmitDeliverable(someone, d), false)
})

test('owner cannot submit in_review or approved', () => {
  const owner = makeUser({ uid: 'u-owner', role: 'member' })
  assert.equal(
    canSubmitDeliverable(
      owner,
      makeDeliverable({ status: 'in_review', ownerUid: 'u-owner' })
    ),
    false
  )
  assert.equal(
    canSubmitDeliverable(
      owner,
      makeDeliverable({ status: 'approved', ownerUid: 'u-owner' })
    ),
    false
  )
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
