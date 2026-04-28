// Centralized permission helper — Section Task Assignment sprint.
//
// This module is the single source of truth for "can this user
// assign tasks / manage users / delegate work?". Every UI surface
// that gates an authoring or admin action should call one of these
// predicates rather than reading `auth.profile.role` or
// `auth.profile.isChief` directly. That makes the rule for "former
// chiefs lose chief permissions immediately when their role
// changes" centrally enforceable.
//
// CURRENT-ROLE-WINS rule (do not relax):
//   `profile.isChief` is treated as DISPLAY METADATA only. The
//   authoritative check is whether the CURRENT `profile.role`
//   belongs to the chief role set. If the stored `isChief` flag
//   has drifted from the role (an admin changed the role but the
//   field hasn't synced yet), the role wins — not the stale
//   boolean. This prevents former chiefs from retaining chief-
//   level capabilities after a role change.
//
// Posture (do not relax):
//   - Pure functions over a typed AppUser shape. No Firestore
//     reads, no Vue runtime imports, no AI calls.
//   - Defensive against null / undefined profiles. An unauth'd
//     caller short-circuits to false on every check.
//   - Mirrors the Firestore rule role checks (admin / coceo /
//     coo / cfo / cmo / csgo) so the UI gate matches the backend
//     gate. The Firestore rules remain the security boundary;
//     this helper is the UX gate.

import type { AppUser, Role, RosterEntry } from '~/types/models'

// Roles that grant chief-level capabilities. Mirrors
// `CHIEF_ROLES` in `app/composables/useRoster.ts` so the team-page
// chief derivation and the UI permission checks stay in lockstep.
const CHIEF_ROLES: ReadonlySet<Role> = new Set<Role>([
  'coceo',
  'coo',
  'cfo',
  'cmo',
  'csgo',
  'admin'
])

/** True iff the role string belongs to the chief set. */
export function isChiefForRole(role: Role | null | undefined): boolean {
  return !!role && CHIEF_ROLES.has(role)
}

type ProfileLike = Pick<AppUser, 'role' | 'isChief'> | null | undefined

/** Admin / instructor / program lead. */
export function isAdmin(profile: ProfileLike): boolean {
  return !!profile && profile.role === 'admin'
}

/** Co-CEO. Treated separately from the rest of the chief set
 *  because Co-CEOs can act company-wide. */
export function isCoCEO(profile: ProfileLike): boolean {
  return !!profile && profile.role === 'coceo'
}

/**
 * True iff the user's CURRENT role is in the chief set.
 *
 * Note: this deliberately ignores `profile.isChief` and derives
 * from `profile.role` instead. If the stored boolean has drifted
 * from the current role, the current role wins. See the module
 * header.
 */
export function isChief(profile: ProfileLike): boolean {
  return !!profile && isChiefForRole(profile.role)
}

/** Functional executive role: any chief OR admin OR Co-CEO. */
export function isExecutiveRole(profile: ProfileLike): boolean {
  return isChief(profile) || isCoCEO(profile) || isAdmin(profile)
}

/** Instructor / admin / program lead. Alias for the audit log. */
export function isInstructorOrAdmin(profile: ProfileLike): boolean {
  return isAdmin(profile)
}

/**
 * Can this user create tasks or assign work to others? Admin,
 * Co-CEO, and any current chief qualify. Former chiefs lose this
 * capability immediately when their role changes (because
 * `isChief` derives from current role).
 */
export function canAssignTasks(profile: ProfileLike): boolean {
  return isExecutiveRole(profile)
}

/**
 * Can this user assign a Playbook section as a task? V1 mirrors
 * the same authorization as general task assignment — any current
 * executive role qualifies. The Firestore rule for /tasks already
 * enforces this server-side.
 */
export function canAssignSectionTasks(profile: ProfileLike): boolean {
  return canAssignTasks(profile)
}

/**
 * Can this user delegate work to peers / subordinates? V1 = same
 * authorization as task assignment. The brief calls this out
 * separately so future passes can split delegation from authoring
 * (e.g., a separate "lead-only" capability) without touching every
 * call site.
 */
export function canDelegateWork(profile: ProfileLike): boolean {
  return canAssignTasks(profile)
}

/**
 * Can this user manage users (create / edit roster entries,
 * change roles)? Strictly admin / instructor in V1. Firestore
 * rules already enforce this; this helper is the UX gate.
 */
export function canManageUsers(profile: ProfileLike): boolean {
  return isAdmin(profile)
}

/**
 * Detects a role-data mismatch on a roster entry: the stored
 * `isChief` flag disagrees with what the current role would
 * derive. Used by /admin/users to surface a "this row needs
 * a re-sync" warning so an admin can reconcile.
 *
 * NOTE: this returns true for the chief-mismatch case AND for the
 * member-but-marked-chief case. Both are anomalies an instructor
 * should reconcile.
 */
export function hasRoleDataMismatch(
  entry: Pick<RosterEntry, 'role' | 'isChief'>
): boolean {
  return entry.isChief !== isChiefForRole(entry.role)
}
