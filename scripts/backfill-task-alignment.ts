// One-shot alignment pass for the existing tasks collection so Tasks,
// Timeline, Deliverables, Departments, and Workbench agree on the same
// shape. Intentionally kept outside seed-all — run it explicitly with
// `npm run backfill:tasks` when you want to reconcile legacy rows.
//
// Behavior per task:
//   - if deliverableId is set, copy its chapter into playbookChapter
//     (only when playbookChapter is missing).
//   - if department is missing, copy it from the linked deliverable.
//   - if ownerUid is missing and ownerEmail matches a users/{uid} doc,
//     fill ownerUid. Never invent a uid; if the email isn't provisioned
//     we leave ownerUid null and print a warning.
//   - assignedByEmail stays null when absent; no guessing.
//   - definitionOfDone stays null when absent; no scraping other fields.
//
// Idempotent: re-running this makes no writes when every task is already
// aligned. Exit non-zero if any task required attention but couldn't be
// resolved (e.g., unprovisioned owner email), so CI or humans can see it.

import { db } from './lib/admin'

interface TaskRow {
  deliverableId?: string | null
  ownerEmail?: string | null
  ownerUid?: string | null
  department?: string | null
  playbookChapter?: number | null
}
interface DeliverableRow {
  chapter?: number
  department?: string
}

async function main() {
  const firestore = db()

  // Preload users-by-email so ownerUid resolution is a cheap map lookup.
  const usersSnap = await firestore.collection('users').get()
  const emailToUid = new Map<string, string>()
  usersSnap.forEach((d) => {
    const data = d.data() as { email?: string }
    if (data.email) emailToUid.set(data.email.toLowerCase(), d.id)
  })

  // Preload deliverables-by-id so we can derive chapter and department.
  const delSnap = await firestore.collection('deliverables').get()
  const deliverablesById = new Map<string, DeliverableRow>()
  delSnap.forEach((d) => {
    deliverablesById.set(d.id, d.data() as DeliverableRow)
  })

  const tasksSnap = await firestore.collection('tasks').get()
  let aligned = 0
  let already = 0
  let warnedCount = 0
  const warnings: string[] = []

  for (const doc of tasksSnap.docs) {
    const data = doc.data() as TaskRow
    const patch: Record<string, unknown> = {}
    let touched = false

    // Derive playbookChapter + department from linked deliverable when possible.
    const linked = data.deliverableId
      ? deliverablesById.get(data.deliverableId) ?? null
      : null

    if (linked) {
      if (data.playbookChapter == null && linked.chapter != null) {
        patch.playbookChapter = linked.chapter
        touched = true
      }
      if (!data.department && linked.department) {
        patch.department = linked.department
        touched = true
      }
    }

    // Fill ownerUid from users-by-email when we can. Leave null and warn
    // if the email is missing or unprovisioned — never invent.
    if (!data.ownerUid && data.ownerEmail) {
      const email = data.ownerEmail.toLowerCase()
      const uid = emailToUid.get(email)
      if (uid) {
        patch.ownerUid = uid
        touched = true
      } else {
        warnings.push(
          `  - ${doc.id}: ownerEmail "${email}" has no users/{uid} doc (not provisioned yet). Left ownerUid null.`
        )
        warnedCount += 1
      }
    } else if (!data.ownerUid && !data.ownerEmail) {
      warnings.push(`  - ${doc.id}: no ownerEmail, no ownerUid. Manual triage needed.`)
      warnedCount += 1
    }

    if (touched) {
      patch.updatedAt = new Date().toISOString()
      await doc.ref.update(patch)
      aligned += 1
    } else {
      already += 1
    }
  }

  console.log(
    `[backfill-tasks] aligned: ${aligned}, already ok: ${already}, warnings: ${warnedCount}`
  )
  if (warnings.length > 0) {
    console.warn('[backfill-tasks] items needing attention:')
    for (const w of warnings) console.warn(w)
    process.exitCode = 1
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
