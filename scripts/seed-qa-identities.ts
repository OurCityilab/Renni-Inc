// Local QA identity setup. Upserts three roster entries with NON-admin
// roles so the full student -> chief -> co-ceo workflow can be exercised
// from accounts you control without contaminating the real student/chief
// roster.
//
// This script is deliberately separate from seeds/seeded_users_live.csv.
// seed-users.ts merges-in CSV rows without deleting anything else, so the
// three QA identities written here survive across reseeds. If you ever
// want them gone, delete the roster/{email} docs directly in the console.
//
// Usage:
//   QA_MEMBER_EMAIL=you+member@example.com \
//   QA_CHIEF_EMAIL=you+chief@example.com \
//   QA_COCEO_EMAIL=you+coceo@example.com \
//   npm run seed:qa-identities
//
// After those three accounts each sign in to the app once (so the
// /api/auth/provision route creates users/{uid}), run:
//   npm run sync:users
//   QA_MEMBER_EMAIL=... QA_CHIEF_EMAIL=... QA_COCEO_EMAIL=... npm run seed:qa

import { db } from './lib/admin'
import type { Department, Role } from '../app/types/models'

interface IdentityPlan {
  envKey: string
  role: Role
  department: Department
  isChief: boolean
  title: string
  fallbackName: string
}

// Role assignments are fixed intentionally:
// - member: ordinary student (non-chief)
// - csgo:   internal role key for the Strategy and Growth chief; does not
//           overlap a high-traffic chief slot in the real roster
// - coceo:  Co-CEO (executive)
// None of these grant admin, so the QA workflow is a clean non-admin test.
const PLAN: IdentityPlan[] = [
  {
    envKey: 'QA_MEMBER_EMAIL',
    role: 'member',
    department: 'strategy-growth',
    isChief: false,
    title: 'QA Student (testing)',
    fallbackName: 'QA Member'
  },
  {
    envKey: 'QA_CHIEF_EMAIL',
    role: 'csgo',
    department: 'strategy-growth',
    isChief: true,
    title: 'QA Chief (testing)',
    fallbackName: 'QA Chief'
  },
  {
    envKey: 'QA_COCEO_EMAIL',
    role: 'coceo',
    department: 'executive',
    isChief: true,
    title: 'QA Co-CEO (testing)',
    fallbackName: 'QA Co-CEO'
  }
]

function norm(v: string | undefined): string {
  return (v || '').trim().toLowerCase()
}

async function main() {
  const firestore = db()
  const now = new Date().toISOString()

  // Resolve email + display name for each slot, and refuse to proceed unless
  // all three emails are present. Partial setup would silently mis-seed the
  // QA lane, exactly the false-negative we just hardened seed:qa against.
  const resolved = PLAN.map((plan) => {
    const nameEnvKey = plan.envKey.replace(/_EMAIL$/, '_NAME')
    return {
      plan,
      email: norm(process.env[plan.envKey]),
      displayName: (process.env[nameEnvKey] || '').trim() || plan.fallbackName
    }
  })

  const missing = resolved.filter((r) => !r.email)
  if (missing.length > 0) {
    throw new Error(
      '[seed-qa-identities] required env vars missing: ' +
        missing.map((m) => m.plan.envKey).join(', ') +
        '. All three must be set together.'
    )
  }

  // Same-email protection: if the user accidentally points two QA slots at
  // the same account, the second write would clobber the first and the
  // workflow test would collapse.
  const emails = resolved.map((r) => r.email)
  if (new Set(emails).size !== emails.length) {
    throw new Error(
      '[seed-qa-identities] QA_MEMBER_EMAIL, QA_CHIEF_EMAIL, and QA_COCEO_EMAIL ' +
        'must be three different accounts. Got: ' +
        emails.join(', ')
    )
  }

  // Safety checks. Each roster email in QA_* must be one of:
  //   (a) a brand-new email not already in the roster, or
  //   (b) a row already marked `isQaIdentity: true` by a prior run of this
  //       script (so re-running is idempotent), or
  //   (c) a row the operator explicitly opts-in to overwrite via QA_FORCE=1.
  // Admin rows are always additionally protected — even QA_FORCE=1 would
  // downgrade instructor access, so we require QA_FORCE=1 AND still log it
  // loudly. This catches typos where a real admin or real student/chief
  // email ends up in QA_* env vars.
  for (const r of resolved) {
    const existing = await firestore.collection('roster').doc(r.email).get()
    if (!existing.exists) continue

    const data = existing.data() as { role?: string; isQaIdentity?: boolean }
    const isQa = data.isQaIdentity === true
    const forced = process.env.QA_FORCE === '1'

    if (data.role === 'admin' && !forced) {
      throw new Error(
        `[seed-qa-identities] ${r.email} is already in the roster as 'admin'. ` +
          `Downgrading to '${r.plan.role}' would remove their instructor access. ` +
          `If this is intentional, set QA_FORCE=1 and rerun.`
      )
    }
    if (!isQa && !forced) {
      throw new Error(
        `[seed-qa-identities] ${r.email} is already in the roster as ` +
          `'${data.role ?? '<unknown>'}' and is NOT marked as a QA identity. ` +
          `Refusing to overwrite a real roster entry. Set QA_FORCE=1 to override.`
      )
    }
    if (forced) {
      console.warn(
        `[seed-qa-identities] QA_FORCE=1: overwriting existing roster/${r.email} ` +
          `(role=${data.role ?? '<unknown>'}, isQaIdentity=${!!isQa}).`
      )
    }
  }

  const batch = firestore.batch()
  for (const { plan, email, displayName } of resolved) {
    const ref = firestore.collection('roster').doc(email)
    batch.set(
      ref,
      {
        email,
        displayName,
        role: plan.role,
        title: plan.title,
        department: plan.department,
        isChief: plan.isChief,
        // Marker used by seed-qa-identities / cleanup-qa-identities to tell
        // QA test rows apart from real roster entries.
        isQaIdentity: true,
        updatedAt: now
      },
      { merge: true }
    )
    console.log(
      `[seed-qa-identities] roster/${email} → ${plan.role} (${plan.department}, isChief=${plan.isChief})`
    )
  }
  await batch.commit()

  console.log(
    '\n[seed-qa-identities] done. Next steps:\n' +
      '  1. Sign in to the app once as each of the three accounts so users/{uid} is provisioned.\n' +
      '  2. npm run sync:users     (refreshes users collection from roster)\n' +
      '  3. QA_MEMBER_EMAIL=... QA_CHIEF_EMAIL=... QA_COCEO_EMAIL=... npm run seed:qa\n'
  )
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
