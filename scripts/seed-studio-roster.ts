// Seeds the Our City Studio pilot roster (studioRoster collection)
// into the STAGING project only. Never touches the Renni `roster`
// collection or any auth/user records.
//
// Usage:
//   npx tsx scripts/seed-studio-roster.ts --dry-run   (print plan, write nothing)
//   npx tsx scripts/seed-studio-roster.ts --apply     (write + read-back verify)
//
// Safety: hard-locked to renni-cc-staging. This script deliberately
// does NOT read the project id from .env / NUXT_PUBLIC_* (a local
// .env pointing at production must never redirect a seed run) and
// refuses to run against anything else. Uses Application Default
// Credentials (org policy blocks service-account keys):
//   gcloud auth application-default login
//   gcloud auth application-default set-quota-project renni-cc-staging
//
// Idempotent: every write is set(..., { merge: true }) on a fixed
// lowercase-email doc id, so re-running is safe and existing fields
// (like displayName) are preserved.

import { pathToFileURL } from 'node:url'

export const ALLOWED_PROJECT_ID = 'renni-cc-staging'
export const STUDIO_COHORT_ID = 'studio-test-2026'

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

// Pilot group (2026-07). studioRole: student, cohort studio-test-2026.
export const PILOT_STUDENT_EMAILS: string[] = [
  'ashakamaiya@gmail.com',
  'kennedyhoward202@gmail.com',
  'chasehjackson08@gmail.com',
  'jadenmartinsamuels@jrladetroit.com',
  'jordanms819@gmail.com',
  'saraiorozco0101@gmail.com',
  'sbodrun@umich.edu',
  'zoiemari.t@gmail.com',
  'nevaehtaylor666@gmail.com',
  'morganelise2008@gmail.com',
  'mylesjdavis1@outlook.com',
  'blaisework99@gmail.com',
  'jacobdilworth127@gmail.com',
  'alorythomas569@gmail.com',
  'the.myra.simone@gmail.com'
].map(normalizeEmail)

export interface RosterSeedEntry {
  docId: string
  data: {
    email: string
    studioRole: 'student' | 'coach'
    cohortIds: string[]
    updatedAt: string
  }
}

export function buildRosterPlan(now: string): RosterSeedEntry[] {
  const entry = (email: string, studioRole: 'student' | 'coach'): RosterSeedEntry => {
    const id = normalizeEmail(email)
    return {
      docId: id,
      data: { email: id, studioRole, cohortIds: [STUDIO_COHORT_ID], updatedAt: now }
    }
  }
  return [
    ...PILOT_STUDENT_EMAILS.map((e) => entry(e, 'student')),
    // Existing staging identities — kept in the seed so a re-run
    // always converges on the full expected roster.
    entry('david.elam2@gmail.com', 'student'),
    entry('dkelam@ourcitylab.io', 'coach')
  ]
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const apply = process.argv.includes('--apply')
  if (dryRun === apply) {
    console.error(
      'Usage:\n  npx tsx scripts/seed-studio-roster.ts --dry-run\n  npx tsx scripts/seed-studio-roster.ts --apply'
    )
    process.exit(1)
  }

  const plan = buildRosterPlan(new Date().toISOString())

  console.log(`[seed-studio-roster] target project: ${ALLOWED_PROJECT_ID}`)
  console.log(`[seed-studio-roster] cohort: ${STUDIO_COHORT_ID}`)
  console.log(`[seed-studio-roster] ${plan.length} studioRoster docs:`)
  for (const p of plan) {
    console.log(`  studioRoster/${p.docId}  (${p.data.studioRole})`)
  }

  if (dryRun) {
    console.log('\n[seed-studio-roster] dry run — nothing written.')
    return
  }

  const envProject =
    process.env.FIREBASE_PROJECT_ID || process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID
  if (envProject && envProject !== ALLOWED_PROJECT_ID) {
    console.error(
      `\n[seed-studio-roster] refusing to run: environment points at "${envProject}". ` +
        `This script only ever writes to ${ALLOWED_PROJECT_ID}.`
    )
    process.exit(1)
  }

  const admin = (await import('firebase-admin')).default
  const app = admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: ALLOWED_PROJECT_ID
  })
  if (app.options.projectId !== ALLOWED_PROJECT_ID) {
    console.error(
      `\n[seed-studio-roster] refusing to run: initialized project is "${app.options.projectId}".`
    )
    process.exit(1)
  }
  const db = app.firestore()

  for (const p of plan) {
    await db.doc(`studioRoster/${p.docId}`).set(p.data, { merge: true })
    console.log(`[seed-studio-roster] wrote studioRoster/${p.docId}`)
  }

  // Read-back verification.
  console.log('\n[seed-studio-roster] verifying…')
  let failures = 0
  for (const p of plan) {
    const snap = await db.doc(`studioRoster/${p.docId}`).get()
    const data = snap.data()
    const ok =
      snap.exists &&
      data?.studioRole === p.data.studioRole &&
      Array.isArray(data?.cohortIds) &&
      data.cohortIds.includes(STUDIO_COHORT_ID)
    if (ok) {
      console.log(`  ok  - ${p.docId} (${data!.studioRole}, ${STUDIO_COHORT_ID})`)
    } else {
      failures++
      console.error(`  FAIL - ${p.docId}: ${JSON.stringify(data ?? null)}`)
    }
  }
  if (failures > 0) {
    console.error(`\n[seed-studio-roster] ${failures} doc(s) failed verification.`)
    process.exit(1)
  }
  console.log('\n[seed-studio-roster] done — all entries verified.')
}

// Only run when invoked directly (tests import the plan/constants).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error('[seed-studio-roster] failed:', e)
    process.exit(1)
  })
}
