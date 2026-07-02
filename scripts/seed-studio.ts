// Seeds Our City Studio Phase 0b data (cohort, missions, studioRoster)
// into the STAGING project only.
//
// Usage:
//   npx tsx scripts/seed-studio.ts --dry-run
//   npx tsx scripts/seed-studio.ts --student=<email> --coach=<email>
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
// doc id, so re-running is safe.

import admin from 'firebase-admin'

const ALLOWED_PROJECT_ID = 'renni-cc-staging'
const COHORT_ID = 'studio-test-2026'

function arg(name: string): string | null {
  const prefix = `--${name}=`
  const hit = process.argv.find((a) => a.startsWith(prefix))
  return hit ? hit.slice(prefix.length).trim().toLowerCase() : null
}
const dryRun = process.argv.includes('--dry-run')

const now = new Date().toISOString()

const cohort = {
  id: COHORT_ID,
  name: 'Studio Test Cohort (Staging)',
  startDate: '2026-07-01',
  endDate: '2026-12-18',
  programType: 'our-city-studio',
  settings: {
    takeHomePayFactor: 0.75,
    landlordIncomeMultiplier: 3,
    safeRentPercentOfTakeHome: 0.3,
    stretchRentPercentOfTakeHome: 0.4
  },
  createdAt: now,
  updatedAt: now
}

const missions = [
  {
    id: 'mission-brand-statement',
    title: 'Build your Personal Brand Statement',
    description:
      'Answer five questions in your own words, then work with the Brand Sherpa in The Lab to turn them into a short, honest professional brand statement. Save the version you like to your Portfolio.',
    module: 'brand-builder',
    estimatedMinutes: 20,
    dueDate: null,
    order: 1,
    requiredOutputType: 'brand_sentence',
    active: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'mission-first-reflection',
    title: 'Write your first reflection',
    description:
      'Write a short reflection: what do you want to get out of Our City Studio, and what is one thing you are already good at that people come to you for?',
    module: 'story-bank',
    estimatedMinutes: 15,
    dueDate: null,
    order: 2,
    requiredOutputType: 'reflection',
    active: true,
    createdAt: now,
    updatedAt: now
  }
]

function rosterEntries(studentEmail: string, coachEmail: string) {
  return [
    {
      docId: studentEmail,
      data: {
        email: studentEmail,
        displayName: 'Test Student (Staging)',
        studioRole: 'student',
        cohortIds: [COHORT_ID],
        gradeLevel: '11',
        school: 'Renaissance High School',
        updatedAt: now
      }
    },
    {
      docId: coachEmail,
      data: {
        email: coachEmail,
        displayName: 'Test Coach (Staging)',
        studioRole: 'coach',
        cohortIds: [COHORT_ID],
        updatedAt: now
      }
    }
  ]
}

async function main() {
  const studentEmail = arg('student') ?? 'STUDENT_EMAIL_PLACEHOLDER'
  const coachEmail = arg('coach') ?? 'COACH_EMAIL_PLACEHOLDER'
  const roster = rosterEntries(studentEmail, coachEmail)

  const plan = [
    { path: `cohorts/${cohort.id}`, data: cohort },
    ...missions.map((m) => ({ path: `missions/${m.id}`, data: m })),
    ...roster.map((r) => ({ path: `studioRoster/${r.docId}`, data: r.data }))
  ]

  console.log(`[seed-studio] target project: ${ALLOWED_PROJECT_ID}`)
  for (const p of plan) {
    console.log(`\n▶ ${p.path}`)
    console.log(JSON.stringify(p.data, null, 2))
  }

  if (dryRun) {
    console.log('\n[seed-studio] dry run — nothing written.')
    return
  }

  if (!arg('student') || !arg('coach')) {
    console.error(
      '\n[seed-studio] --student=<email> and --coach=<email> are required for a real run.'
    )
    process.exit(1)
  }

  const envProject =
    process.env.FIREBASE_PROJECT_ID || process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID
  if (envProject && envProject !== ALLOWED_PROJECT_ID) {
    console.error(
      `\n[seed-studio] refusing to run: environment points at "${envProject}". ` +
        `This script only ever writes to ${ALLOWED_PROJECT_ID}.`
    )
    process.exit(1)
  }

  const app = admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: ALLOWED_PROJECT_ID
  })
  const db = app.firestore()

  for (const p of plan) {
    await db.doc(p.path).set(p.data, { merge: true })
    console.log(`[seed-studio] wrote ${p.path}`)
  }
  console.log('\n[seed-studio] done.')
}

main().catch((e) => {
  console.error('[seed-studio] failed:', e)
  process.exit(1)
})
