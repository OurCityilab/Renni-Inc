// Seeds goals/{department}-{metric-slug} from seeds/seeded_goals_live.csv.
//
// Idempotency: canonical seed fields (department, metricName, target,
// ownerEmail/Uid, notes) refresh on every run. Mutable state (current, status)
// is only set on first create — running seed again won't reset progress the
// team has already recorded.

import { buildEmailToUidMap, db } from './lib/admin'
import { readCsv, slugify } from './lib/csv'

interface GoalRow {
  department: string
  metricName: string
  target: string
  current: string
  ownerEmail: string
  status: string
  notes: string
}

async function main() {
  const rows = readCsv<GoalRow>('seeds/seeded_goals_live.csv')
  const firestore = db()
  const emailToUid = await buildEmailToUidMap()
  const now = new Date().toISOString()

  let creates = 0
  let updates = 0
  for (const row of rows) {
    const email = (row.ownerEmail || '').trim().toLowerCase()
    const id = `${row.department}-${slugify(row.metricName)}`
    const ref = firestore.collection('goals').doc(id)

    const seedFields = {
      department: row.department,
      metricName: row.metricName,
      target: Number(row.target || 0),
      ownerEmail: email,
      ownerUid: emailToUid.get(email) ?? null,
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
        current: Number(row.current || 0),
        status: row.status || 'not_started'
      })
      creates += 1
    }
  }
  console.log(`[seed-goals] new: ${creates}, updated: ${updates}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
