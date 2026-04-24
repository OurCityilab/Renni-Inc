import 'dotenv/config'
import admin from 'firebase-admin'

// Initialize firebase-admin once for a CLI seed script run.
// Credentials are pulled from server-only env vars; never from NUXT_PUBLIC_* for secrets.

let app: admin.app.App | null = null

export function getAdminApp(): admin.app.App {
  if (app) return app
  if (admin.apps.length > 0) {
    app = admin.apps[0]!
    return app
  }
  // projectId is not secret; either env name is fine.
  const projectId =
    process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')

  if (!projectId) {
    throw new Error(
      '[seed] Missing projectId. Set NUXT_PUBLIC_FIREBASE_PROJECT_ID or FIREBASE_PROJECT_ID.'
    )
  }

  if (clientEmail && privateKey) {
    app = admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      projectId
    })
    return app
  }

  // ADC fallback: used when the org policy iam.disableServiceAccountKeyCreation
  // blocks service-account key creation. Run `gcloud auth application-default login`
  // locally, or set GOOGLE_APPLICATION_CREDENTIALS.
  app = admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId
  })
  return app
}

export function db() {
  return getAdminApp().firestore()
}

// Build a lowercased email -> uid map from /users. Seeded docs that reference
// people by email (deliverables.ownerEmail, goals.ownerEmail, tasks.ownerEmail)
// use this to backfill *Uid columns when a user has already been provisioned.
// If a user hasn't logged in yet, the uid column stays null and the auth
// provisioning route fills it in on first sign-in.
export async function buildEmailToUidMap(): Promise<Map<string, string>> {
  const snap = await db().collection('users').get()
  const map = new Map<string, string>()
  snap.forEach((doc) => {
    const data = doc.data() as { email?: string }
    if (data.email) map.set(data.email.toLowerCase(), doc.id)
  })
  return map
}
