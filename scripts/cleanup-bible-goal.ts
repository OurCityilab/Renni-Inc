// One-time cleanup: remove the orphaned goals/executive-bible-chapter-approval-rate
// doc left behind when the goal's metricName was renamed from
// "Bible Chapter Approval Rate" to "Playbook Chapter Approval Rate".
// The seeder builds doc IDs from the metric name, so the rename produced a
// new doc and the old one was never deleted.
//
// Deliberately narrow:
//   - Targets exactly one doc ID.
//   - Refuses to delete unless its current metricName actually contains
//     "Bible" (case-insensitive). If the doc has been overwritten or this
//     script is rerun after success, it no-ops rather than deleting the
//     wrong thing.
//   - Does not touch any other goal, any other collection, rules, or
//     seeds. Safe to rerun.

import { db } from './lib/admin'

const TARGET_ID = 'executive-bible-chapter-approval-rate'

async function main() {
  const firestore = db()
  const ref = firestore.collection('goals').doc(TARGET_ID)
  const snap = await ref.get()

  if (!snap.exists) {
    console.log(
      `[cleanup-bible-goal] goals/${TARGET_ID} does not exist — nothing to delete.`
    )
    return
  }

  const data = snap.data() as { metricName?: string }
  const name = data.metricName ?? ''
  if (!/bible/i.test(name)) {
    throw new Error(
      `[cleanup-bible-goal] refusing to delete goals/${TARGET_ID}: metricName is ` +
        `"${name}", which does not contain "Bible". Aborting so no non-legacy goal is removed.`
    )
  }

  await ref.delete()
  console.log(
    `[cleanup-bible-goal] deleted goals/${TARGET_ID} (metricName was "${name}")`
  )
  console.log(
    '[cleanup-bible-goal] the canonical goal goals/executive-playbook-chapter-approval-rate ' +
      'is untouched and remains the active doc.'
  )
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
