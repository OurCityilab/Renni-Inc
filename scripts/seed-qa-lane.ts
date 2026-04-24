// Local-only QA fixture. Mutates four already-seeded deliverables so we can
// prove the full owner -> approver lifecycle:
//   draft           owned by a student member
//   in_review       submitted by a student member, awaiting a chief
//   needs_revision  returned by a chief, awaiting owner resubmission
//   approved        observable end-state, chief -> co-ceo
//
// Two modes:
//
//   1. Default mode — uses the canonical student/chief emails from the
//      roster. Requires each of those accounts to have already signed in
//      once so users/{uid} exists (otherwise this script exits loudly and
//      prints exactly which emails need to sign in first).
//
//   2. Override mode — set QA_MEMBER_EMAIL, QA_CHIEF_EMAIL, QA_COCEO_EMAIL
//      in the environment to repoint all four rows at accounts you control
//      (for example three test identities). Must set all three or none.
//
// In both modes the script refuses to write a row whose ownerUid or
// approverUid cannot be resolved — a null uid would silently break the
// Firestore rules' ownership checks and produce a misleading failed test.
//
// Idempotent: re-running resets the four rows to these canonical states.
// Revert with `npm run seed:deliverables`, which rewrites canonical
// owner/approver/due fields.

import { buildEmailToUidMap, db } from './lib/admin'
import { deliverableDocId } from './lib/csv'

interface QaRow {
  chapter: number
  title: string
  status: 'draft' | 'in_review' | 'needs_revision' | 'approved'
  ownerRole: 'member' | 'chief'
  approverRole: 'chief' | 'coceo'
  returnedReason?: string
  approvalNotes?: string
  approvedByRole?: string
  note: string
}

// Each row declares what kind of actor it needs in each slot. The specific
// email comes from DEFAULT_PAIRS below, unless env overrides are set.
const QA_LANE: QaRow[] = [
  {
    chapter: 5,
    title: 'House Phoenix Brand Book',
    status: 'draft',
    ownerRole: 'member',
    approverRole: 'chief',
    note: 'draft — owner is a student member; tests Submit for review'
  },
  {
    chapter: 9,
    title: 'Operations and Continuity Systems',
    status: 'in_review',
    ownerRole: 'member',
    approverRole: 'chief',
    note: 'in_review — approver can Approve or Return'
  },
  {
    chapter: 8,
    title: 'Finance and Revenue Model',
    status: 'needs_revision',
    ownerRole: 'member',
    approverRole: 'chief',
    returnedReason:
      'Add baked-goods revenue split and donation KPI. Clarify break-even assumptions.',
    note: 'needs_revision — clearly observable by admin; tests resubmission loop'
  },
  {
    chapter: 12,
    title: 'Strategy and Next-Semester Recommendations',
    status: 'approved',
    ownerRole: 'chief',
    approverRole: 'coceo',
    approvalNotes: 'Approved for QA lane fixture.',
    approvedByRole: 'coceo',
    note: 'approved — observable end-state'
  }
]

// Per-row default emails, keyed by (chapter, slot). Department alignment is
// intentional: the chief approver for each row matches the chapter's dept.
interface Pair { owner: string; approver: string }
const DEFAULT_PAIRS: Record<number, Pair> = {
  5: { owner: '08sydbradley@gmail.com', approver: 'arimalloy10@gmail.com' },   // marketing member / CMO
  9: { owner: 'tseay@ltu.edu', approver: 'sharaecottingham1@gmail.com' },       // ops member / COO
  8: { owner: 'nghtlooker30k@gmail.com', approver: 'cjackson6@ltu.edu' },       // finance member / CFO
  12: { owner: 'alorythomas569@gmail.com', approver: 'pcunegin1@gmail.com' }  // CSGO / Co-CEO
}

function norm(e: string | null | undefined): string | null {
  const v = (e || '').trim().toLowerCase()
  return v || null
}

// Returns the (owner, approver) emails for a row. If any of the three
// QA_* env vars is set, *all three* must be set — this prevents a mix of
// canonical and override accounts that would be confusing to debug.
function resolvePair(row: QaRow): Pair {
  const envMember = norm(process.env.QA_MEMBER_EMAIL)
  const envChief = norm(process.env.QA_CHIEF_EMAIL)
  const envCoCEO = norm(process.env.QA_COCEO_EMAIL)
  const overrideCount = [envMember, envChief, envCoCEO].filter(Boolean).length
  if (overrideCount > 0 && overrideCount < 3) {
    throw new Error(
      '[seed-qa] partial QA override. Set all three of QA_MEMBER_EMAIL, QA_CHIEF_EMAIL, ' +
        'QA_COCEO_EMAIL, or none.'
    )
  }
  if (overrideCount === 3) {
    const owner = row.ownerRole === 'member' ? envMember! : envChief!
    const approver = row.approverRole === 'coceo' ? envCoCEO! : envChief!
    return { owner, approver }
  }
  const fallback = DEFAULT_PAIRS[row.chapter]
  if (!fallback) {
    throw new Error(`[seed-qa] no default pair configured for chapter ${row.chapter}`)
  }
  return { owner: norm(fallback.owner)!, approver: norm(fallback.approver)! }
}

function buildHistory(row: QaRow, ownerEmail: string, approverEmail: string, now: string) {
  const events: Array<Record<string, unknown>> = []
  // Stagger timestamps so the detail page renders them in order.
  const t0 = new Date(Date.parse(now) - 1000 * 60 * 60 * 24).toISOString()
  const t1 = new Date(Date.parse(now) - 1000 * 60 * 60 * 12).toISOString()
  const t2 = now

  if (row.status === 'in_review' || row.status === 'needs_revision' || row.status === 'approved') {
    events.push({
      action: 'submitted',
      fromStatus: 'draft',
      toStatus: 'in_review',
      actorEmail: ownerEmail,
      note: null,
      createdAt: t0
    })
  }
  if (row.status === 'needs_revision') {
    events.push({
      action: 'returned',
      fromStatus: 'in_review',
      toStatus: 'needs_revision',
      actorEmail: approverEmail,
      note: row.returnedReason ?? null,
      createdAt: t1
    })
  }
  if (row.status === 'approved') {
    events.push({
      action: 'approved',
      fromStatus: 'in_review',
      toStatus: 'approved',
      actorEmail: approverEmail,
      ...(row.approvedByRole ? { actorRole: row.approvedByRole } : {}),
      note: row.approvalNotes ?? null,
      createdAt: t2
    })
  }
  return events
}

async function main() {
  const firestore = db()
  const emailToUid = await buildEmailToUidMap()
  const now = new Date().toISOString()
  const uidFor = (e: string) => emailToUid.get(e) ?? null

  // First pass: resolve every email and collect anything with a missing uid.
  // We want one consolidated error, not a drip of failures.
  const plans: Array<{
    row: QaRow
    id: string
    ownerEmail: string
    approverEmail: string
    ownerUid: string | null
    approverUid: string | null
  }> = []
  const missing: Array<{ id: string; slot: 'owner' | 'approver'; email: string }> = []

  for (const row of QA_LANE) {
    const { owner, approver } = resolvePair(row)
    const id = deliverableDocId(row.chapter, row.title)
    const ownerUid = uidFor(owner)
    const approverUid = uidFor(approver)
    if (!ownerUid) missing.push({ id, slot: 'owner', email: owner })
    if (!approverUid) missing.push({ id, slot: 'approver', email: approver })
    plans.push({
      row,
      id,
      ownerEmail: owner,
      approverEmail: approver,
      ownerUid,
      approverUid
    })
  }

  if (missing.length > 0) {
    const lines = missing
      .map((m) => `  - ${m.id} (${m.slot}): ${m.email}`)
      .join('\n')
    throw new Error(
      '[seed-qa] cannot seed QA lane — the following owner/approver accounts ' +
        'have no users/{uid} doc yet. They must sign in to the app once so ' +
        'the provisioning endpoint can create their user record, then rerun.\n' +
        lines +
        '\n\nIf the accounts already signed in, try `npm run sync:users` to ' +
        'refresh the users collection from the roster.'
    )
  }

  // Second pass: existence check. Plans only reference deliverables that
  // should already be seeded; bail if any are missing rather than writing a
  // partial lane.
  for (const p of plans) {
    const exists = (await firestore.collection('deliverables').doc(p.id).get()).exists
    if (!exists) {
      throw new Error(
        `[seed-qa] deliverable ${p.id} not found. Run \`npm run seed:deliverables\` first.`
      )
    }
  }

  // All preconditions OK — stage every patch into one batched commit so a
  // mid-run failure (transient network, rule rejection on row N) cannot
  // leave the QA lane half-applied.
  const batch = firestore.batch()
  for (const p of plans) {
    const { row, id, ownerEmail, approverEmail, ownerUid, approverUid } = p
    const ref = firestore.collection('deliverables').doc(id)
    const patch: Record<string, unknown> = {
      ownerEmail,
      ownerUid,
      approverEmail,
      approverUid,
      status: row.status,
      statusHistory: buildHistory(row, ownerEmail, approverEmail, now),
      updatedAt: now
    }

    patch.submittedForReviewAt =
      row.status === 'draft'
        ? null
        : new Date(Date.parse(now) - 1000 * 60 * 60 * 24).toISOString()
    patch.returnedReason = row.status === 'needs_revision' ? row.returnedReason ?? null : null
    if (row.status === 'approved') {
      patch.approvedAt = now
      patch.approvedByUid = approverUid
      patch.approvedByRole = row.approvedByRole ?? null
      patch.approvalNotes = row.approvalNotes ?? null
    } else {
      patch.approvedAt = null
      patch.approvedByUid = null
      patch.approvedByRole = null
      patch.approvalNotes = null
    }

    batch.update(ref, patch)
  }
  await batch.commit()

  for (const p of plans) {
    console.log(
      `[seed-qa] ${p.id} → ${p.row.status}  owner=${p.ownerEmail}  approver=${p.approverEmail}`
    )
    console.log(`           ${p.row.note}`)
  }

  console.log(
    '\n[seed-qa] done. Revert with `npm run seed:deliverables` (which resets canonical ' +
      'owner/approver/due) followed by a manual status reset if needed.'
  )
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
