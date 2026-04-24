// One-shot alignment pass for the existing tasks collection so Tasks,
// Timeline, Deliverables, Departments, and Workbench agree on the same
// shape.
//
// Default is dry-run: prints the proposed patch set without writing.
// Pass --apply (or set BACKFILL_APPLY=1) to commit the changes.
//
//   npm run backfill:tasks              # dry-run, read-only
//   npm run backfill:tasks -- --apply   # write
//
// Per-task behavior:
//   - flag tasks missing deliverableId (cannot be written without manual
//     attention; every new task requires a deliverable).
//   - if deliverableId is set, copy its chapter into playbookChapter (only
//     when playbookChapter is missing).
//   - if department is missing, copy it from the linked deliverable.
//   - if ownerUid is missing and ownerEmail matches a users/{uid} doc,
//     fill ownerUid. Never invent a uid; warn if the email isn't provisioned.
//   - flag tasks with missing assigned user / due date (informational only).
//
// Idempotent: re-running yields zero writes when every task is aligned.
// Exit non-zero if any task required attention that couldn't be resolved.

import { db } from './lib/admin'

interface TaskRow {
  deliverableId?: string | null
  ownerEmail?: string | null
  ownerUid?: string | null
  department?: string | null
  playbookChapter?: number | null
  dueDate?: string | null
  title?: string
}
interface DeliverableRow {
  chapter?: number
  department?: string
}

function isApply(): boolean {
  if (process.env.BACKFILL_APPLY === '1') return true
  return process.argv.slice(2).some((a) => a === '--apply' || a === '-w')
}

async function main() {
  const apply = isApply()
  const mode = apply ? 'APPLY (writes enabled)' : 'DRY-RUN (no writes)'
  console.log(`[backfill-tasks] mode: ${mode}`)

  const firestore = db()

  const usersSnap = await firestore.collection('users').get()
  const emailToUid = new Map<string, string>()
  usersSnap.forEach((d) => {
    const data = d.data() as { email?: string }
    if (data.email) emailToUid.set(data.email.toLowerCase(), d.id)
  })

  const delSnap = await firestore.collection('deliverables').get()
  const deliverablesById = new Map<string, DeliverableRow>()
  delSnap.forEach((d) => {
    deliverablesById.set(d.id, d.data() as DeliverableRow)
  })

  const tasksSnap = await firestore.collection('tasks').get()
  let aligned = 0
  let already = 0
  const warnings: string[] = []

  for (const doc of tasksSnap.docs) {
    const data = doc.data() as TaskRow
    const patch: Record<string, unknown> = {}
    let touched = false
    const label = `${doc.id}${data.title ? ` ("${data.title}")` : ''}`

    // Missing deliverableId is a manual-attention signal. Every task must
    // belong to a deliverable from now on, but we don't fabricate one.
    if (!data.deliverableId) {
      warnings.push(`  - ${label}: no deliverableId. Assign manually.`)
    }

    const linked = data.deliverableId
      ? deliverablesById.get(data.deliverableId) ?? null
      : null

    if (data.deliverableId && !linked) {
      warnings.push(
        `  - ${label}: deliverableId "${data.deliverableId}" does not exist. Re-link or delete.`
      )
    }

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

    if (!data.ownerUid && data.ownerEmail) {
      const email = data.ownerEmail.toLowerCase()
      const uid = emailToUid.get(email)
      if (uid) {
        patch.ownerUid = uid
        touched = true
      } else {
        warnings.push(
          `  - ${label}: ownerEmail "${email}" has no users/{uid} doc (not provisioned). Left ownerUid null.`
        )
      }
    } else if (!data.ownerUid && !data.ownerEmail) {
      warnings.push(`  - ${label}: no ownerEmail, no ownerUid. Manual triage needed.`)
    }

    if (!data.dueDate) {
      warnings.push(`  - ${label}: no dueDate. Informational — not auto-filled.`)
    }

    if (touched) {
      const keys = Object.keys(patch).join(', ')
      if (apply) {
        patch.updatedAt = new Date().toISOString()
        await doc.ref.update(patch)
        console.log(`[backfill-tasks] wrote ${label}: ${keys}`)
      } else {
        console.log(`[backfill-tasks] would write ${label}: ${keys}`)
      }
      aligned += 1
    } else {
      already += 1
    }
  }

  console.log(
    `[backfill-tasks] ${apply ? 'applied' : 'planned'}: ${aligned}, already ok: ${already}, warnings: ${warnings.length}`
  )
  if (warnings.length > 0) {
    console.warn('[backfill-tasks] items needing attention:')
    for (const w of warnings) console.warn(w)
    process.exitCode = 1
  }
  if (!apply) {
    console.log('\n[backfill-tasks] dry-run complete. Re-run with `-- --apply` to commit writes.')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
