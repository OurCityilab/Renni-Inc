// Removes placeholder QA roster entries created by a bad run of
// seed-qa-identities (e.g. typo'd or example.com placeholders that were
// never real Google accounts and will never provision users/{uid}).
//
// Scope is deliberately narrow:
//   - Only deletes from roster/{email}. Does NOT touch users/{uid}.
//     Placeholder accounts never signed in, so no users/{uid} exists for
//     them; deleting the roster doc is the full cleanup.
//   - Refuses to delete a roster entry whose role is 'admin' unless the
//     caller sets QA_FORCE=1. This protects david.elam2@gmail.com, the
//     other instructor emails, and any future admin roster rows from
//     being removed by a typo in the remove list.
//   - Does not modify seeds/seeded_users_live.csv.
//
// Defaults to the three placeholder emails you flagged. To clean up a
// different set in the future, pass QA_REMOVE_EMAILS as a comma-separated
// list:
//   QA_REMOVE_EMAILS=foo@example.com,bar@example.com npm run cleanup:qa-identities

import { db } from './lib/admin'

const DEFAULT_TARGETS = [
  'actual-member-email@example.com',
  'actual-chief-email@example.com',
  'actual-coceo-email@example.com'
]

function resolveTargets(): string[] {
  const raw = process.env.QA_REMOVE_EMAILS
  const list = raw
    ? raw.split(',').map((e) => e.trim()).filter(Boolean)
    : DEFAULT_TARGETS
  const normalized = list.map((e) => e.toLowerCase())
  return Array.from(new Set(normalized))
}

async function main() {
  const firestore = db()
  const targets = resolveTargets()
  if (targets.length === 0) {
    throw new Error('[cleanup-qa-identities] no target emails resolved.')
  }

  console.log('[cleanup-qa-identities] target roster docs:')
  for (const t of targets) console.log(`  - ${t}`)

  // Preflight. To delete, each target must be:
  //   (a) marked `isQaIdentity: true` (written by seed-qa-identities), or
  //   (b) already absent (no-op), or
  //   (c) explicitly forced via QA_FORCE=1.
  // Admin roster entries are additionally protected and require QA_FORCE=1.
  const toDelete: string[] = []
  const notFound: string[] = []
  const blockedAdmins: string[] = []
  const blockedReal: Array<{ email: string; role: string }> = []
  const forced = process.env.QA_FORCE === '1'

  for (const email of targets) {
    const snap = await firestore.collection('roster').doc(email).get()
    if (!snap.exists) {
      notFound.push(email)
      continue
    }
    const data = snap.data() as { role?: string; isQaIdentity?: boolean }
    const isQa = data.isQaIdentity === true

    if (data.role === 'admin' && !forced) {
      blockedAdmins.push(email)
      continue
    }
    if (!isQa && !forced) {
      blockedReal.push({ email, role: data.role ?? '<unknown>' })
      continue
    }
    if (forced && !isQa) {
      console.warn(
        `[cleanup-qa-identities] QA_FORCE=1: deleting non-QA roster/${email} ` +
          `(role=${data.role ?? '<unknown>'}).`
      )
    }
    toDelete.push(email)
  }

  if (blockedAdmins.length > 0) {
    throw new Error(
      '[cleanup-qa-identities] refusing to delete these admin roster entries: ' +
        blockedAdmins.join(', ') +
        '. If this is really what you want, rerun with QA_FORCE=1. Note that this ' +
        'will remove instructor/program-lead access for those accounts.'
    )
  }
  if (blockedReal.length > 0) {
    const lines = blockedReal.map((b) => `  - ${b.email} (role=${b.role})`).join('\n')
    throw new Error(
      '[cleanup-qa-identities] refusing to delete these roster entries because they ' +
        'are not marked as QA identities (no isQaIdentity flag):\n' +
        lines +
        '\n\nIf this is really what you want, rerun with QA_FORCE=1.'
    )
  }

  if (toDelete.length === 0) {
    console.log(
      `\n[cleanup-qa-identities] nothing to delete. Not found: ${notFound.join(', ') || 'none'}.`
    )
    return
  }

  const batch = firestore.batch()
  for (const email of toDelete) {
    batch.delete(firestore.collection('roster').doc(email))
  }
  await batch.commit()

  console.log('\n[cleanup-qa-identities] deleted:')
  for (const e of toDelete) console.log(`  - roster/${e}`)
  if (notFound.length > 0) {
    console.log(
      `\n[cleanup-qa-identities] already absent (no-op): ${notFound.join(', ')}`
    )
  }
  console.log(
    '\nusers/{uid} was not touched. Placeholder accounts never signed in, so no user docs exist.'
  )
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
