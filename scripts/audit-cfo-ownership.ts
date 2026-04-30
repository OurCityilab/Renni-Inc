// Read-only by default. Audits the Chase -> Destiny CFO transition and prints
// the exact Firestore/Auth state plus the narrow writes needed to reconcile it.
//
// Usage:
//   npm run audit:cfo-ownership
//   npm run audit:cfo-ownership -- --write
//
// The write mode is intentionally explicit and should be run only after the
// dry-run output has been reviewed.

import { getAuth } from 'firebase-admin/auth'
import type { DocumentReference, QueryDocumentSnapshot } from 'firebase-admin/firestore'
import { db, getAdminApp } from './lib/admin'

const CHASE_EMAIL = 'cjackson6@ltu.edu'
const DESTINY_EMAIL = 'hardydestiny04@gmail.com'
const FINANCE_DELIVERABLE_IDS = new Set([
  'ch-07-current-product-line-and-pricing',
  'ch-08-finance-and-revenue-model'
])

type Patch = {
  ref: DocumentReference
  data: Record<string, unknown>
  reason: string
}

type Preserved = {
  path: string
  reason: string
  current: Record<string, unknown>
}

const write = process.argv.includes('--write')

function pathOf(ref: DocumentReference) {
  return ref.path
}

function slim(data: Record<string, unknown>) {
  return {
    displayName: data.displayName,
    email: data.email,
    rosterEmail: data.rosterEmail,
    role: data.role,
    title: data.title,
    department: data.department,
    isChief: data.isChief,
    ownerEmail: data.ownerEmail,
    ownerUid: data.ownerUid,
    approverEmail: data.approverEmail,
    approverUid: data.approverUid,
    status: data.status,
    chapter: data.chapter,
    deliverableId: data.deliverableId,
    updatedAt: data.updatedAt
  }
}

function addPatch(
  patches: Patch[],
  ref: DocumentReference,
  data: Record<string, unknown>,
  reason: string
) {
  patches.push({
    ref,
    data: { ...data, updatedAt: new Date().toISOString() },
    reason
  })
}

async function collectUsersForEmail(email: string) {
  const firestore = db()
  const users = firestore.collection('users')
  const [byEmail, byRoster] = await Promise.all([
    users.where('email', '==', email).get(),
    users.where('rosterEmail', '==', email).get()
  ])
  const out = new Map<string, QueryDocumentSnapshot>()
  for (const doc of [...byEmail.docs, ...byRoster.docs]) out.set(doc.id, doc)
  return [...out.values()]
}

async function ownerUidFor(email: string) {
  const users = await collectUsersForEmail(email)
  return users[0]?.id ?? null
}

function isFinanceDeliverable(data: Record<string, unknown>) {
  return (
    data.department === 'finance' ||
    data.chapter === 7 ||
    data.chapter === 8 ||
    FINANCE_DELIVERABLE_IDS.has(String(data.id || ''))
  )
}

function isFinanceTask(data: Record<string, unknown>, financeIds: Set<string>) {
  const deliverableId = String(data.deliverableId || '')
  const id = String(data.id || '')
  return (
    data.department === 'finance' ||
    financeIds.has(deliverableId) ||
    FINANCE_DELIVERABLE_IDS.has(deliverableId) ||
    /^ch-(07|08)-/.test(id)
  )
}

async function getAuthUser(email: string) {
  try {
    const user = await getAuth(getAdminApp()).getUserByEmail(email)
    return {
      uid: user.uid,
      email: user.email,
      customClaims: user.customClaims ?? null,
      disabled: user.disabled
    }
  } catch (error) {
    return {
      email,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

async function main() {
  const firestore = db()
  const patches: Patch[] = []
  const preserved: Preserved[] = []
  const now = new Date().toISOString()

  const destinyUid = await ownerUidFor(DESTINY_EMAIL)

  const [chaseRoster, destinyRoster] = await Promise.all([
    firestore.collection('roster').doc(CHASE_EMAIL).get(),
    firestore.collection('roster').doc(DESTINY_EMAIL).get()
  ])

  if (chaseRoster.exists) {
    addPatch(
      patches,
      chaseRoster.ref,
      {
        role: 'member',
        title: 'Team Member',
        department: 'finance',
        isChief: false
      },
      'Chase should not retain CFO/chief roster permissions.'
    )
  }
  if (destinyRoster.exists) {
    addPatch(
      patches,
      destinyRoster.ref,
      {
        role: 'cfo',
        title: 'CFO',
        department: 'finance',
        isChief: true
      },
      'Destiny is the intended current CFO.'
    )
  }

  for (const doc of await collectUsersForEmail(CHASE_EMAIL)) {
    addPatch(
      patches,
      doc.ref,
      {
        role: 'member',
        title: 'Team Member',
        department: 'finance',
        isChief: false
      },
      'Already-provisioned Chase user profile should match roster.'
    )
  }
  for (const doc of await collectUsersForEmail(DESTINY_EMAIL)) {
    addPatch(
      patches,
      doc.ref,
      {
        role: 'cfo',
        title: 'CFO',
        department: 'finance',
        isChief: true
      },
      'Already-provisioned Destiny user profile should match roster.'
    )
  }

  const financeDeliverableIds = new Set<string>(FINANCE_DELIVERABLE_IDS)
  const financeDeliverables = await firestore
    .collection('deliverables')
    .where('department', '==', 'finance')
    .get()
  for (const doc of financeDeliverables.docs) financeDeliverableIds.add(doc.id)

  const chaseDeliverables = await firestore
    .collection('deliverables')
    .where('ownerEmail', '==', CHASE_EMAIL)
    .get()
  for (const doc of chaseDeliverables.docs) {
    const data = doc.data()
    if (!isFinanceDeliverable({ id: doc.id, ...data })) continue
    if (data.status === 'approved') {
      preserved.push({
        path: pathOf(doc.ref),
        reason: 'Approved historical deliverable preserved.',
        current: slim(data)
      })
      continue
    }
    addPatch(
      patches,
      doc.ref,
      {
        ownerEmail: DESTINY_EMAIL,
        ownerUid: destinyUid
      },
      'Active Finance deliverable owner should be Destiny.'
    )
  }

  const chaseTasks = await firestore
    .collection('tasks')
    .where('ownerEmail', '==', CHASE_EMAIL)
    .get()
  for (const doc of chaseTasks.docs) {
    const data = doc.data()
    if (!isFinanceTask({ id: doc.id, ...data }, financeDeliverableIds)) continue
    if (data.status === 'done') {
      preserved.push({
        path: pathOf(doc.ref),
        reason: 'Completed task preserved.',
        current: slim(data)
      })
      continue
    }
    addPatch(
      patches,
      doc.ref,
      {
        ownerEmail: DESTINY_EMAIL,
        ownerUid: destinyUid
      },
      'Active Finance task owner should be Destiny.'
    )
  }

  const [chaseGoals, chasePricing] = await Promise.all([
    firestore.collection('goals').where('ownerEmail', '==', CHASE_EMAIL).get(),
    firestore.collection('pricingScenarios').where('ownerEmail', '==', CHASE_EMAIL).get()
  ])

  for (const doc of chaseGoals.docs) {
    const data = doc.data()
    if (data.department !== 'finance') continue
    addPatch(
      patches,
      doc.ref,
      {
        ownerEmail: DESTINY_EMAIL,
        ownerUid: destinyUid
      },
      'Finance goal owner should follow the current CFO.'
    )
  }

  for (const doc of chasePricing.docs) {
    const data = doc.data()
    if (data.department !== 'finance') continue
    addPatch(
      patches,
      doc.ref,
      {
        ownerEmail: DESTINY_EMAIL,
        ownerUid: destinyUid
      },
      'Finance pricing scenario owner should follow the current CFO.'
    )
  }

  const authUsers = await Promise.all([
    getAuthUser(CHASE_EMAIL),
    getAuthUser(DESTINY_EMAIL)
  ])

  const report = {
    mode: write ? 'WRITE' : 'DRY_RUN',
    checkedAt: now,
    chaseEmail: CHASE_EMAIL,
    destinyEmail: DESTINY_EMAIL,
    destinyUid,
    authUsers,
    currentRoster: {
      [CHASE_EMAIL]: chaseRoster.exists ? slim(chaseRoster.data()!) : null,
      [DESTINY_EMAIL]: destinyRoster.exists ? slim(destinyRoster.data()!) : null
    },
    plannedChanges: patches.map((p) => ({
      path: pathOf(p.ref),
      reason: p.reason,
      patch: p.data
    })),
    preserved
  }

  console.log(JSON.stringify(report, null, 2))

  if (!write) return

  const batch = firestore.batch()
  for (const patch of patches) batch.set(patch.ref, patch.data, { merge: true })
  await batch.commit()
  console.log(`[audit-cfo-ownership] wrote ${patches.length} narrow CFO correction(s).`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
