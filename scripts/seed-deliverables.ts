// Seeds deliverables/ch-XX-<title-slug> from seeds/seeded_deliverables_live.csv.
//
// IDs combine chapter and a slug of the title so more than one deliverable per
// chapter is possible in the future. Chapter is also stored as its own field.
//
// Idempotency strategy
// --------------------
// Canonical seed fields (title, chapter, department, owner/approver, template,
// definitionOfDone, rubric, suggestedDueDate, instructor-edit flag, notes)
// get refreshed on every run. Mutable state (status, dueDate after override,
// linkedDocUrl, notes-written-by-user, submittedForReviewAt, approval fields)
// is only written when the doc does not exist yet. Re-seeding never wipes
// review or approval state.

import { APPROVAL_RUBRIC } from '../app/types/models'
import { buildEmailToUidMap, db } from './lib/admin'
import { deliverableDocId, readCsv, toBool } from './lib/csv'

interface DeliverableRow {
  title: string
  chapter: string
  department: string
  ownerEmail: string
  approverEmail: string
  dueDate: string
  status: string
  templateUrl: string
  definitionOfDone: string
  instructorCanEditDueDate: string
  dueDateNotes: string
}

async function main() {
  const rows = readCsv<DeliverableRow>('seeds/seeded_deliverables_live.csv')
  const firestore = db()
  const emailToUid = await buildEmailToUidMap()
  const now = new Date().toISOString()

  let creates = 0
  let updates = 0

  for (const row of rows) {
    const chapter = Number(row.chapter)
    if (!chapter) continue
    const id = deliverableDocId(chapter, row.title)
    const ref = firestore.collection('deliverables').doc(id)

    const ownerEmail = (row.ownerEmail || '').trim().toLowerCase()
    const approverEmail = (row.approverEmail || '').trim().toLowerCase()

    const seedFields = {
      title: row.title,
      chapter,
      department: row.department,
      ownerEmail,
      approverEmail,
      ownerUid: emailToUid.get(ownerEmail) ?? null,
      approverUid: emailToUid.get(approverEmail) ?? null,
      suggestedDueDate: row.dueDate,
      instructorCanEditDueDate: toBool(row.instructorCanEditDueDate),
      dueDateNotes: row.dueDateNotes || null,
      templateUrl: row.templateUrl,
      definitionOfDone: row.definitionOfDone,
      rubricChecklist: [...APPROVAL_RUBRIC],
      updatedAt: now
    }

    const existing = await ref.get()
    if (existing.exists) {
      await ref.update(seedFields)
      updates += 1
    } else {
      await ref.set({
        id,
        ...seedFields,
        dueDate: row.dueDate,
        status: 'draft',
        linkedDocUrl: null,
        notes: null,
        submittedForReviewAt: null,
        approvalNotes: null,
        returnedReason: null,
        approvedAt: null,
        approvedByUid: null,
        approvedByRole: null,
        createdAt: now
      })
      creates += 1
    }
  }

  console.log(`[seed-deliverables] new: ${creates}, updated: ${updates}`)
  if (emailToUid.size === 0) {
    console.warn(
      '[seed-deliverables] no users/{uid} docs exist yet — ownerUid/approverUid set to null. ' +
        'They will backfill automatically on first sign-in via /api/auth/provision, ' +
        'or by re-running this script after users have logged in at least once.'
    )
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
