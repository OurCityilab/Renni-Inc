// Deliverable approval permission helpers.
//
// Single source of truth for "can this user approve / return / submit
// this deliverable?". Mirrors the Firestore rule branches in
// firestore/rules.txt so the UI gate matches the backend gate. The
// Firestore rules remain the security boundary; this helper is the UX
// gate.
//
// V1 lifecycle (do not relax):
//   draft  →  in_review              (owner submit)
//   needs_revision  →  in_review     (owner re-submit)
//   in_review  →  approved           (approver / admin / coceo / dept chief)
//   in_review  →  needs_revision     (approver / admin / coceo / dept chief)
//
// draft → approved is NEVER allowed.
// needs_revision → approved is NEVER allowed (must re-enter in_review first).
// "blocked" is a task-level flag and never lands on a deliverable.

import type { AppUser, Deliverable, Role } from '~/types/models'

// Chief roles that can approve within their own department. Co-CEO and
// admin are handled separately because their authority is global.
const CHIEF_DEPARTMENT_ROLES: ReadonlySet<Role> = new Set<Role>([
  'coo',
  'cfo',
  'cmo',
  'csgo'
])

type ProfileLike = Pick<AppUser, 'uid' | 'role' | 'department'> | null | undefined
type DeliverableLike = Pick<
  Deliverable,
  'status' | 'approverUid' | 'department' | 'ownerUid'
>

/** True iff the role string belongs to the department-chief set
 *  (coo/cfo/cmo/csgo). admin and coceo are intentionally excluded
 *  here — they are global authorities and checked separately. */
export function isChiefRole(role: Role | null | undefined): boolean {
  return !!role && CHIEF_DEPARTMENT_ROLES.has(role)
}

function isAdminRole(role: Role | null | undefined): boolean {
  return role === 'admin'
}

function isCoCEORole(role: Role | null | undefined): boolean {
  return role === 'coceo'
}

/**
 * Can this user approve or return the deliverable while it is
 * currently in review? Approval and return share the same authority
 * (both move state out of in_review), so one helper covers both.
 *
 * Returns true only when:
 *   - deliverable.status === 'in_review', AND
 *   - the user is admin, OR
 *   - the user is coceo, OR
 *   - the user is the exact assigned approver (approverUid match), OR
 *   - the user is a department chief whose department matches the
 *     deliverable's department.
 *
 * Members / students never approve. Owners do not approve their own
 * work even if they happen to also be admin / coceo / a matching
 * chief — the UI surfaces the approver branch independently of the
 * owner branch, and the underlying authority check still passes for
 * that override case if it ever applies.
 */
function canActOnInReview(
  user: ProfileLike,
  deliverable: DeliverableLike
): boolean {
  if (!user || !user.uid) return false
  if (deliverable.status !== 'in_review') return false

  const role = user.role
  if (isAdminRole(role) || isCoCEORole(role)) return true

  if (deliverable.approverUid && deliverable.approverUid === user.uid) {
    return true
  }

  if (
    isChiefRole(role) &&
    user.department &&
    deliverable.department === user.department
  ) {
    return true
  }

  return false
}

/** See canActOnInReview. */
export function canApproveDeliverable(
  user: ProfileLike,
  deliverable: DeliverableLike
): boolean {
  return canActOnInReview(user, deliverable)
}

/** See canActOnInReview. */
export function canReturnDeliverable(
  user: ProfileLike,
  deliverable: DeliverableLike
): boolean {
  return canActOnInReview(user, deliverable)
}

/**
 * Can this user submit the deliverable for review? V1 keeps submit
 * tied to ownership: the owner moves draft / needs_revision into
 * in_review. Authorized submitter expansions belong to a later pass.
 */
export function canSubmitDeliverable(
  user: ProfileLike,
  deliverable: DeliverableLike
): boolean {
  if (!user || !user.uid) return false
  if (deliverable.status !== 'draft' && deliverable.status !== 'needs_revision') {
    return false
  }
  return deliverable.ownerUid === user.uid
}
