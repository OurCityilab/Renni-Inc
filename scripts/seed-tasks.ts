// Seeds tasks/ch-XX-<title-slug> from seeds/seeded_tasks_live.csv.
//
// Each task row references its parent deliverable by chapter number. Because
// deliverable IDs are now ch-XX-<title-slug> (so more than one deliverable per
// chapter is possible), this script resolves the parent by querying the
// deliverables collection for the chapter and mapping chapter -> doc ID.
//
// V1 assumption: one deliverable per chapter. If that changes, extend the
// tasks CSV with a deliverableSlug (or deliverableId) column and switch this
// lookup from chapter -> one-id to (chapter, slug) -> one-id.
//
// Idempotency: canonical seed fields (title, deliverable link, ownerEmail/Uid,
// startDate, dueDate, notes) refresh on every run. Mutable state (status,
// progress, dependsOn) is only set on first create — team progress is
// preserved across re-seeds.

import { buildEmailToUidMap, db } from './lib/admin'
import { chapterPrefix, readCsv, slugify } from './lib/csv'

interface TaskRow {
  deliverableChapter: string
  title: string
  ownerEmail: string
  status: string
  startDate: string
  dueDate: string
  notes: string
}

async function loadChapterToDeliverableId(): Promise<Map<number, string>> {
  const snap = await db().collection('deliverables').get()
  if (snap.empty) {
    throw new Error(
      '[seed-tasks] no deliverables seeded yet. Run `npm run seed:deliverables` first.'
    )
  }
  const map = new Map<number, string>()
  snap.forEach((doc) => {
    const data = doc.data() as { chapter?: number }
    const chapter = Number(data.chapter)
    if (!chapter) return
    if (map.has(chapter)) {
      console.warn(
        `[seed-tasks] multiple deliverables found for chapter ${chapter}; using ${map.get(chapter)}. ` +
          'Add a deliverableSlug column to seeds/seeded_tasks_live.csv to disambiguate.'
      )
      return
    }
    map.set(chapter, doc.id)
  })
  return map
}

async function main() {
  const rows = readCsv<TaskRow>('seeds/seeded_tasks_live.csv')
  const firestore = db()
  const emailToUid = await buildEmailToUidMap()
  const chapterToDeliverable = await loadChapterToDeliverableId()
  const now = new Date().toISOString()

  let creates = 0
  let updates = 0
  let skipped = 0

  for (const row of rows) {
    const chapter = Number(row.deliverableChapter)
    const deliverableId = chapter ? chapterToDeliverable.get(chapter) ?? null : null
    if (chapter && !deliverableId) {
      console.warn(
        `[seed-tasks] no deliverable for chapter ${chapter}; skipping task "${row.title}"`
      )
      skipped += 1
      continue
    }
    const email = (row.ownerEmail || '').trim().toLowerCase()

    // Task IDs use the chapter prefix + title slug (not the full deliverable id)
    // so task keys stay readable even when deliverable titles are long.
    const id = `${chapter ? chapterPrefix(chapter) : 'task'}-${slugify(row.title)}`
    const ref = firestore.collection('tasks').doc(id)

    const seedFields = {
      title: row.title,
      deliverableId,
      ownerEmail: email,
      ownerUid: emailToUid.get(email) ?? null,
      startDate: row.startDate || null,
      dueDate: row.dueDate || null,
      notes: row.notes || null,
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
        status: row.status || 'not_started',
        progress: 0,
        dependsOn: [],
        createdAt: now
      })
      creates += 1
    }
  }
  console.log(`[seed-tasks] new: ${creates}, updated: ${updates}, skipped: ${skipped}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
