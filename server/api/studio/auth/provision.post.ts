// Our City Studio provisioning endpoint.
//
// Deliberately separate from server/api/auth/provision.post.ts. That
// endpoint gates access to the Renni Command Center via the
// `roster` collection; this endpoint gates access to Our City
// Studio via a sibling `studioRoster` collection. A Studio student
// never needs a Renni roster entry, and a Renni Command Center user
// never gets Studio access just by being rostered there — the two
// checks are fully independent, per the confirmed separation
// requirement.
import { defineEventHandler, readBody, createError } from 'h3'
import { adminAuth, adminDb } from '~~/server/utils/admin'
import type { StudentProfile, StudioRole } from '~~/app/types/studio/models'

interface Body {
  idToken?: string
}

interface StudioRosterShape {
  email?: string
  displayName?: string
  studioRole: StudioRole
  cohortIds: string[]
  gradeLevel?: string
  school?: string
  worksite?: string
  alternateEmail?: string
}

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

  // Primary lookup: studioRoster doc keyed by the Auth account's email.
  let rosterDocRef = db.collection('studioRoster').doc(email)
  let rosterSnap = await rosterDocRef.get()
  let alternateLoginUsed = false

  // Fallback: coach/admin-approved alternateEmail, mirroring the Renni
  // roster's alternate-login pattern.
  if (!rosterSnap.exists) {
    const altSnap = await db
      .collection('studioRoster')
      .where('alternateEmail', '==', email)
      .limit(1)
      .get()
    if (altSnap.empty) {
      return { studioEnrolled: false, profile: null }
    }
    rosterSnap = altSnap.docs[0]!
    rosterDocRef = rosterSnap.ref
    alternateLoginUsed = true
  }

  const roster = rosterSnap.data() as StudioRosterShape
  const now = new Date().toISOString()
  const profileRef = db.collection('studentProfiles').doc(decoded.uid)
  const existing = await profileRef.get()
  const existingData = existing.exists ? (existing.data() as StudentProfile) : null

  const profile: StudentProfile = {
    uid: decoded.uid,
    email,
    displayName: roster.displayName || decoded.name || email,
    studioRole: roster.studioRole,
    studioCohortIds: roster.cohortIds || [],
    activeStudioCohortId:
      existingData?.activeStudioCohortId ?? roster.cohortIds?.[0] ?? null,
    gradeLevel: roster.gradeLevel,
    school: roster.school,
    worksite: roster.worksite,
    interests: existingData?.interests,
    goals: existingData?.goals,
    profileStatus: existingData?.profileStatus ?? 'new',
    createdAt: existingData?.createdAt || now,
    updatedAt: now
  }

  await profileRef.set(profile, { merge: true })

  return { studioEnrolled: true, profile, alternateLoginUsed }
})
