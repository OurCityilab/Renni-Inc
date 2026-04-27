import { adminAuth, adminDb } from '~~/server/utils/admin'
import type { AppUser, Department, Role } from '~~/app/types/models'

interface Body {
  idToken?: string
}

interface RosterShape {
  email?: string
  displayName?: string
  role: Role
  title: string
  department: Department
  isChief?: boolean
  alternateEmail?: string
}

// Collections that may carry ownerEmail / approverEmail references seeded before
// this user ever signed in. On first provision we backfill the matching uid so
// later rule checks (ownerUid == request.auth.uid) start succeeding.
const BACKFILL = [
  { col: 'deliverables', from: 'ownerEmail', to: 'ownerUid' },
  { col: 'deliverables', from: 'approverEmail', to: 'approverUid' },
  { col: 'tasks', from: 'ownerEmail', to: 'ownerUid' },
  { col: 'goals', from: 'ownerEmail', to: 'ownerUid' }
] as const

export default defineEventHandler(async (event) => {
  const body = await readBody<Body>(event)
  if (!body?.idToken) {
    throw createError({ statusCode: 400, statusMessage: 'idToken required' })
  }

  let decoded
  try {
    decoded = await adminAuth().verifyIdToken(body.idToken)
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'invalid id token' })
  }

  const email = decoded.email?.toLowerCase()
  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'account has no email' })
  }

  const db = adminDb()

  // Primary lookup: roster doc keyed by the Auth account's email.
  let rosterDocRef = db.collection('roster').doc(email)
  let rosterSnap = await rosterDocRef.get()
  let alternateLoginUsed = false
  let canonicalRosterEmail = email

  // Fallback: instructor-approved alternateEmail. Only consulted when the
  // primary lookup misses, so the canonical roster doc id stays the
  // primary email and provision never mutates the roster.
  if (!rosterSnap.exists) {
    const altSnap = await db
      .collection('roster')
      .where('alternateEmail', '==', email)
      .limit(1)
      .get()
    if (altSnap.empty) {
      return { rostered: false, profile: null }
    }
    rosterSnap = altSnap.docs[0]!
    rosterDocRef = rosterSnap.ref
    alternateLoginUsed = true
    const altData = rosterSnap.data() as RosterShape
    canonicalRosterEmail = (altData.email || rosterSnap.id).toLowerCase()
  }

  const roster = rosterSnap.data() as RosterShape
  const now = new Date().toISOString()
  const userRef = db.collection('users').doc(decoded.uid)
  const existing = await userRef.get()

  const profile: AppUser = {
    uid: decoded.uid,
    email,
    displayName: roster.displayName || decoded.name || email,
    role: roster.role,
    title: roster.title,
    department: roster.department,
    isChief: roster.isChief ?? false,
    createdAt:
      (existing.exists && (existing.data() as AppUser | undefined)?.createdAt) || now,
    updatedAt: now,
    rosterEmail: canonicalRosterEmail,
    alternateLoginUsed
  }

  await userRef.set(profile, { merge: true })

  // Backfill seeded docs that reference this user by email. Use the
  // canonical roster email so seeded references on the LTU primary
  // email still match when the student signed in via their alternate.
  for (const { col, from, to } of BACKFILL) {
    const snap = await db.collection(col).where(from, '==', canonicalRosterEmail).get()
    if (snap.empty) continue
    const batch = db.batch()
    let dirty = false
    snap.forEach((d) => {
      const data = d.data() as Record<string, unknown>
      if (data[to]) return
      batch.update(d.ref, { [to]: decoded.uid, updatedAt: now })
      dirty = true
    })
    if (dirty) await batch.commit()
  }

  return { rostered: true, profile }
})
