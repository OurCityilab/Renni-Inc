// Safe QA smoke lane for the Ch. 4 / Ch. 10 / Ch. 11 browser test.
//
// This creates duplicate deliverables with qa-* ids and studioId pointing at
// the canonical Template Studio chapters. Student work then saves to
// deliverableOutputs/{qaDeliverableId}, never to real cohort deliverables.
//
// Usage:
//   QA_MEMBER_EMAIL=smoke-student@example.com \
//   QA_CHIEF_EMAIL=smoke-chief@example.com \
//   QA_COCEO_EMAIL=smoke-coceo@example.com \
//   npm run seed:qa-smoke-lane

import { APPROVAL_RUBRIC } from '../app/types/models'
import type { Department, Role, TaskPriority } from '../app/types/models'
import { buildEmailToUidMap, db } from './lib/admin'

type QaSlot = 'member' | 'chief' | 'coceo'

interface QaIdentity {
  slot: QaSlot
  envKey: 'QA_MEMBER_EMAIL' | 'QA_CHIEF_EMAIL' | 'QA_COCEO_EMAIL'
  role: Role
  department: Department
  isChief: boolean
  title: string
  displayName: string
}

interface QaDeliverablePlan {
  id: string
  studioId: string
  title: string
  chapter: number
  department: Department
  ownerSlot: QaSlot
  approverSlot: QaSlot
  dueDate: string
  definitionOfDone: string
}

interface QaTaskPlan {
  id: string
  title: string
  deliverableId: string
  sectionId: string | null
  requirementId: string | null
  ownerSlot: QaSlot
  dueDate: string
  definitionOfDone: string
  notes: string
  playbookChapter: number
  priority: TaskPriority
}

const IDENTITIES: QaIdentity[] = [
  {
    slot: 'member',
    envKey: 'QA_MEMBER_EMAIL',
    role: 'member',
    department: 'strategy-growth',
    isChief: false,
    title: 'QA Smoke Student',
    displayName: 'QA Smoke Student'
  },
  {
    slot: 'chief',
    envKey: 'QA_CHIEF_EMAIL',
    role: 'csgo',
    department: 'strategy-growth',
    isChief: true,
    title: 'QA Strategy and Growth Chief',
    displayName: 'QA Smoke Chief'
  },
  {
    slot: 'coceo',
    envKey: 'QA_COCEO_EMAIL',
    role: 'coceo',
    department: 'executive',
    isChief: true,
    title: 'QA Co-CEO',
    displayName: 'QA Smoke Co-CEO'
  }
]

const QA_DELIVERABLES: QaDeliverablePlan[] = [
  {
    id: 'qa-ch-04-business-model-canvas',
    studioId: 'ch-04-business-model-canvas',
    title: 'QA Smoke - Business Model Canvas',
    chapter: 4,
    department: 'strategy-growth',
    ownerSlot: 'member',
    approverSlot: 'chief',
    dueDate: '2026-05-08',
    definitionOfDone:
      'QA smoke only: save local archetype application rows, submit for review, and verify chief approval/revision behavior.'
  },
  {
    id: 'qa-ch-10-marketing-and-campaign-playbook',
    studioId: 'ch-10-marketing-and-campaign-playbook',
    title: 'QA Smoke - Marketing and Campaign Playbook',
    chapter: 10,
    department: 'strategy-growth',
    ownerSlot: 'member',
    approverSlot: 'chief',
    dueDate: '2026-05-08',
    definitionOfDone:
      'QA smoke only: save campaign touchpoint rows, submit for review, and verify approved output appears in Playbook.'
  },
  {
    id: 'qa-ch-11-phoenix-nest-retail-carry-pitch',
    studioId: 'ch-11-phoenix-nest-retail-carry-pitch',
    title: 'QA Smoke - Phoenix Nest Retail Carry Pitch',
    chapter: 11,
    department: 'strategy-growth',
    ownerSlot: 'member',
    approverSlot: 'coceo',
    dueDate: '2026-05-08',
    definitionOfDone:
      'QA smoke only: save Phoenix Nest retail offer cards, submit for review, and verify Co-CEO approval to Playbook.'
  }
]

const QA_TASKS: QaTaskPlan[] = [
  {
    id: 'qa-smoke-save-ch-04-local-archetype-table',
    title: 'QA Smoke - Save Ch. 4 local archetype table',
    deliverableId: 'qa-ch-04-business-model-canvas',
    sectionId: 'customer-archetype-local-application',
    requirementId: 'bmc-customer-segments-specific',
    ownerSlot: 'member',
    dueDate: '2026-05-08',
    definitionOfDone:
      'A test local archetype row is saved, survives refresh, and remains visible in review.',
    notes: 'QA smoke task only. Do not use real cohort work.',
    playbookChapter: 4,
    priority: 'high'
  },
  {
    id: 'qa-smoke-save-ch-10-touchpoints-table',
    title: 'QA Smoke - Save Ch. 10 touchpoints table',
    deliverableId: 'qa-ch-10-marketing-and-campaign-playbook',
    sectionId: 'touchpoints',
    requirementId: 'campaign-calendar',
    ownerSlot: 'member',
    dueDate: '2026-05-08',
    definitionOfDone:
      'A test touchpoint row is saved, survives refresh, and remains visible in review.',
    notes: 'QA smoke task only. Do not use real cohort work.',
    playbookChapter: 10,
    priority: 'high'
  },
  {
    id: 'qa-smoke-save-ch-11-offer-card',
    title: 'QA Smoke - Save Ch. 11 offer card',
    deliverableId: 'qa-ch-11-phoenix-nest-retail-carry-pitch',
    sectionId: 'offer',
    requirementId: 'pitch-offer',
    ownerSlot: 'member',
    dueDate: '2026-05-08',
    definitionOfDone:
      'A test retail offer card is saved, survives refresh, and remains visible in review.',
    notes: 'QA smoke task only. Do not use real cohort work.',
    playbookChapter: 11,
    priority: 'high'
  },
  {
    id: 'qa-smoke-submit-for-review',
    title: 'QA Smoke - Submit for review',
    deliverableId: 'qa-ch-10-marketing-and-campaign-playbook',
    sectionId: 'touchpoints',
    requirementId: 'campaign-calendar',
    ownerSlot: 'member',
    dueDate: '2026-05-08',
    definitionOfDone:
      'The QA student submits a safe QA deliverable and sees the in-review state.',
    notes: 'QA smoke task only. Do not use real cohort work.',
    playbookChapter: 10,
    priority: 'high'
  },
  {
    id: 'qa-smoke-approve-for-playbook',
    title: 'QA Smoke - Approve for Playbook',
    deliverableId: 'qa-ch-10-marketing-and-campaign-playbook',
    sectionId: 'touchpoints',
    requirementId: 'campaign-calendar',
    ownerSlot: 'chief',
    dueDate: '2026-05-08',
    definitionOfDone:
      'The QA reviewer approves safe QA work and verifies it appears in Playbook.',
    notes: 'QA smoke task only. Do not use real cohort work.',
    playbookChapter: 10,
    priority: 'high'
  },
  {
    id: 'qa-smoke-request-revision',
    title: 'QA Smoke - Request revision',
    deliverableId: 'qa-ch-04-business-model-canvas',
    sectionId: 'customer-archetype-local-application',
    requirementId: 'bmc-customer-segments-specific',
    ownerSlot: 'chief',
    dueDate: '2026-05-08',
    definitionOfDone:
      'The QA reviewer returns safe QA work and the QA student can revise/resubmit.',
    notes: 'QA smoke task only. Do not use real cohort work.',
    playbookChapter: 4,
    priority: 'high'
  }
]

function norm(v: string | undefined): string {
  return (v || '').trim().toLowerCase()
}

function emailHasSafetyToken(email: string): boolean {
  return /(^|[._+\-@])(qa|smoke|test)([._+\-@]|$)/i.test(email)
}

function routeFor(deliverableId: string, sectionId: string): string {
  return `/deliverables/${deliverableId}/sections/${sectionId}`
}

async function main() {
  const now = new Date().toISOString()

  const resolved = IDENTITIES.map((identity) => ({
    ...identity,
    email: norm(process.env[identity.envKey])
  }))

  const missing = resolved.filter((r) => !r.email)
  if (missing.length > 0) {
    throw new Error(
      '[seed-qa-smoke-lane] required env vars missing: ' +
        missing.map((r) => r.envKey).join(', ') +
        '. All three disposable QA emails must be set together.'
    )
  }

  const emails = resolved.map((r) => r.email)
  if (new Set(emails).size !== emails.length) {
    throw new Error(
      '[seed-qa-smoke-lane] QA_MEMBER_EMAIL, QA_CHIEF_EMAIL, and QA_COCEO_EMAIL must be three different accounts.'
    )
  }

  const unsafe = resolved.filter((r) => !emailHasSafetyToken(r.email))
  if (unsafe.length > 0) {
    throw new Error(
      '[seed-qa-smoke-lane] refusing to use emails without qa/smoke/test safety tokens: ' +
        unsafe.map((r) => `${r.envKey}=${r.email}`).join(', ')
    )
  }

  const firestore = db()
  const batch = firestore.batch()
  for (const r of resolved) {
    batch.set(
      firestore.collection('roster').doc(r.email),
      {
        email: r.email,
        displayName: r.displayName,
        role: r.role,
        title: r.title,
        department: r.department,
        isChief: r.isChief,
        isQaIdentity: true,
        updatedAt: now
      },
      { merge: true }
    )
  }
  await batch.commit()

  const emailToUid = await buildEmailToUidMap()
  const slotEmail = new Map<QaSlot, string>()
  const slotUid = new Map<QaSlot, string | null>()
  for (const r of resolved) {
    slotEmail.set(r.slot, r.email)
    slotUid.set(r.slot, emailToUid.get(r.email) ?? null)
  }

  const missingUsers = resolved.filter((r) => !slotUid.get(r.slot))
  if (missingUsers.length > 0) {
    const lines = missingUsers.map((r) => `  - ${r.envKey}: ${r.email}`).join('\n')
    throw new Error(
      '[seed-qa-smoke-lane] roster entries were upserted, but these accounts have no users/{uid} doc yet:\n' +
        lines +
        '\n\nNext steps:\n' +
        '  1. Sign in once as each QA account so /api/auth/provision creates users/{uid}.\n' +
        '  2. npm run sync:users\n' +
        '  3. Re-run npm run seed:qa-smoke-lane with the same env vars.'
    )
  }

  const dataBatch = firestore.batch()
  for (const d of QA_DELIVERABLES) {
    const ownerEmail = slotEmail.get(d.ownerSlot)!
    const approverEmail = slotEmail.get(d.approverSlot)!
    dataBatch.set(
      firestore.collection('deliverables').doc(d.id),
      {
        id: d.id,
        studioId: d.studioId,
        title: d.title,
        chapter: d.chapter,
        department: d.department,
        ownerEmail,
        ownerUid: slotUid.get(d.ownerSlot),
        approverEmail,
        approverUid: slotUid.get(d.approverSlot),
        dueDate: d.dueDate,
        suggestedDueDate: d.dueDate,
        instructorCanEditDueDate: true,
        dueDateNotes: 'Disposable QA smoke lane. Do not use real cohort work.',
        templateUrl: '',
        definitionOfDone: d.definitionOfDone,
        rubricChecklist: [...APPROVAL_RUBRIC],
        status: 'draft',
        linkedDocUrl: null,
        notes: 'QA smoke deliverable. Safe to mutate during browser smoke testing.',
        submittedForReviewAt: null,
        approvalNotes: null,
        returnedReason: null,
        approvedAt: null,
        approvedByUid: null,
        approvedByRole: null,
        statusHistory: [],
        createdAt: now,
        updatedAt: now
      },
      { merge: true }
    )
  }

  for (const t of QA_TASKS) {
    const ownerEmail = slotEmail.get(t.ownerSlot)!
    dataBatch.set(
      firestore.collection('tasks').doc(t.id),
      {
        id: t.id,
        title: t.title,
        deliverableId: t.deliverableId,
        sectionId: t.sectionId,
        requirementId: t.requirementId,
        ownerEmail,
        ownerUid: slotUid.get(t.ownerSlot),
        status: 'not_started',
        dueDate: t.dueDate,
        notes: t.notes,
        department: 'strategy-growth',
        definitionOfDone: t.definitionOfDone,
        priority: t.priority,
        assignedByEmail: slotEmail.get('coceo'),
        playbookChapter: t.playbookChapter,
        progress: 0,
        dependsOn: [],
        createdAt: now,
        updatedAt: now
      },
      { merge: true }
    )
  }
  await dataBatch.commit()

  console.log('[seed-qa-smoke-lane] roster entries upserted:')
  for (const r of resolved) {
    console.log(`  - roster/${r.email} (${r.role}, ${r.department})`)
  }

  console.log('\n[seed-qa-smoke-lane] QA deliverables upserted:')
  for (const d of QA_DELIVERABLES) {
    console.log(`  - deliverables/${d.id} -> studioId=${d.studioId}`)
  }

  console.log('\n[seed-qa-smoke-lane] QA tasks upserted:')
  for (const t of QA_TASKS) {
    console.log(`  - tasks/${t.id} -> ${t.deliverableId}/${t.sectionId ?? 'overview'}`)
  }

  console.log('\n[seed-qa-smoke-lane] browser smoke routes:')
  console.log(
    `  - ${routeFor('qa-ch-04-business-model-canvas', 'customer-archetype-local-application')}`
  )
  console.log(
    `  - ${routeFor('qa-ch-10-marketing-and-campaign-playbook', 'touchpoints')}`
  )
  console.log(
    `  - ${routeFor('qa-ch-11-phoenix-nest-retail-carry-pitch', 'offer')}`
  )
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
