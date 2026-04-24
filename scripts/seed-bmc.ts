// Seeds bmcBlocks/{key} from seeds/seeded_bmc_live.csv.
//
// Idempotent: canonical seed fields (title, prompt, ownerDepartment, status)
// refresh on every run. Team-authored content stays put — only blocks that
// haven't been authored yet get an empty `content` field on first create.

import { db } from './lib/admin'
import { readCsv } from './lib/csv'

interface BmcRow {
  id: string
  title: string
  prompt: string
  ownerDepartment: string
  status: string
}

const KNOWN_KEYS = new Set([
  'customer_segments',
  'value_propositions',
  'channels',
  'customer_relationships',
  'revenue_streams',
  'key_resources',
  'key_activities',
  'key_partners',
  'cost_structure'
])

async function main() {
  const rows = readCsv<BmcRow>('seeds/seeded_bmc_live.csv')
  const firestore = db()
  const now = new Date().toISOString()

  let creates = 0
  let updates = 0
  let skipped = 0

  for (const row of rows) {
    const id = (row.id || '').trim()
    if (!KNOWN_KEYS.has(id)) {
      console.warn(`[seed-bmc] skipping unknown block key "${id}"`)
      skipped += 1
      continue
    }
    const ref = firestore.collection('bmcBlocks').doc(id)
    const canonical = {
      title: row.title,
      prompt: row.prompt,
      ownerDepartment: (row.ownerDepartment || '').trim() || null,
      status: (row.status || 'draft').trim(),
      updatedAt: now
    }

    const existing = await ref.get()
    if (existing.exists) {
      await ref.update(canonical)
      updates += 1
    } else {
      await ref.set({
        id,
        ...canonical,
        content: '',
        ownerEmail: null,
        updatedByEmail: null
      })
      creates += 1
    }
  }

  console.log(`[seed-bmc] new: ${creates}, updated: ${updates}, skipped: ${skipped}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
