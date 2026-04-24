// Seeds the `roster/{email}` collection from seeds/seeded_users_live.csv.
//
// The roster is the single source of truth for "who is allowed in."
// On first sign-in, /api/auth/provision looks up roster/{email} (via the
// admin SDK) to decide whether to create users/{uid} for the caller.
//
// Idempotency: documents are keyed by lowercase email. Re-running this script
// refreshes role, title, department, displayName, and isChief; it never
// deletes roster entries — remove them from the CSV and delete explicitly
// if you need someone revoked.
//
// Canonical role vocabulary is owned by app/types/models.ts (Role type).
// config/role-map.json keys must match exactly; a mismatch here silently
// seeded chiefs as isChief:false previously and broke /c-suite access —
// the checks below now fail loudly so that can never happen again.

import { DEPARTMENTS, type Role } from '../app/types/models'
import { db } from './lib/admin'
import { readCsv, readJson } from './lib/csv'

interface UserRow {
  displayName: string
  email: string
  role: string
  title: string
  department: string
}

interface RoleMeta {
  // Members don't have a canonical department (they span teams), so the role
  // map doesn't define one for them — the CSV is required to provide it.
  // For chief roles, this acts as a fallback if a CSV row ever omits the
  // department column.
  department?: string
  isChief: boolean
}

// Mirror of the Role union in app/types/models.ts. Kept here as a runtime
// list so we can validate the role map and the CSV against it.
const KNOWN_ROLES: Role[] = [
  'coceo',
  'coo',
  'cfo',
  'cmo',
  'csgo',
  'member',
  'admin'
]

function assertRoleMapIntegrity(map: Record<string, RoleMeta>) {
  const mapKeys = Object.keys(map)
  const missing = KNOWN_ROLES.filter((r) => !(r in map))
  const extra = mapKeys.filter((k) => !KNOWN_ROLES.includes(k as Role))
  if (missing.length || extra.length) {
    throw new Error(
      '[seed-users] config/role-map.json is out of sync with the canonical Role union in app/types/models.ts. ' +
        `Missing keys: ${missing.join(', ') || 'none'}. ` +
        `Unknown keys: ${extra.join(', ') || 'none'}.`
    )
  }
  for (const role of KNOWN_ROLES) {
    const entry = map[role]!
    if (typeof entry.isChief !== 'boolean') {
      throw new Error(`[seed-users] role "${role}" is missing a boolean isChief flag.`)
    }
    // department is only required for role keys whose members all share one
    // canonical team (i.e. the chiefs and admin); member is intentionally
    // left without a default so each member CSV row must specify its own.
    if (role !== 'member' && !entry.department) {
      throw new Error(`[seed-users] role "${role}" is missing a department.`)
    }
  }
}

async function main() {
  const rows = readCsv<UserRow>('seeds/seeded_users_live.csv')
  const roleMap = readJson<Record<string, RoleMeta>>('config/role-map.json')
  assertRoleMapIntegrity(roleMap)

  const firestore = db()
  const now = new Date().toISOString()

  const batch = firestore.batch()
  let count = 0
  let skipped = 0
  const unknownRoles = new Set<string>()
  const invalidDepartments = new Set<string>()

  for (const row of rows) {
    const email = (row.email || '').trim().toLowerCase()
    if (!email) continue

    const role = row.role?.trim()
    const meta = role ? roleMap[role] : undefined
    if (!meta) {
      // Fail loudly rather than silently seed with isChief:false — this is
      // the exact footgun that previously demoted Co-CEOs and CSGO.
      unknownRoles.add(role || '<empty>')
      skipped += 1
      continue
    }

    const department = (row.department || meta.department || '').trim()
    // Hard validation against the Department union in app/types/models.ts so
    // no silently-invalid value (like the old "unassigned" fallback) ever
    // lands in Firestore.
    if (!(DEPARTMENTS as readonly string[]).includes(department)) {
      invalidDepartments.add(`${email} → "${department || '<empty>'}"`)
      skipped += 1
      continue
    }
    const isChief = meta.isChief

    const ref = firestore.collection('roster').doc(email)
    batch.set(
      ref,
      {
        email,
        displayName: row.displayName,
        role,
        title: row.title,
        department,
        isChief,
        updatedAt: now
      },
      { merge: true }
    )
    count += 1
  }
  await batch.commit()

  console.log(`[seed-users] upserted ${count} roster entries at roster/{email}`)
  if (skipped > 0) {
    if (unknownRoles.size > 0) {
      console.warn(
        `[seed-users] skipped row(s) with unknown roles: ${[...unknownRoles].join(', ')}. ` +
          `Allowed roles: ${KNOWN_ROLES.join(', ')}.`
      )
    }
    if (invalidDepartments.size > 0) {
      console.warn(
        `[seed-users] skipped row(s) with invalid department: ${[...invalidDepartments].join('; ')}. ` +
          `Allowed departments: ${DEPARTMENTS.join(', ')}.`
      )
    }
    console.warn(`[seed-users] total skipped: ${skipped}`)
    process.exitCode = 1
  }
  console.log(
    '[seed-users] reminder: users/{uid} docs are created on first sign-in via /api/auth/provision. ' +
      'If any users have already logged in before a role-map fix, run `npm run sync:users` to refresh their users/{uid} docs from the roster.'
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
