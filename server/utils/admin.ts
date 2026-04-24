import admin from 'firebase-admin'

let cached: admin.app.App | null = null

export function getAdminApp(): admin.app.App {
  if (cached) return cached
  if (admin.apps.length > 0) {
    cached = admin.apps[0]!
    return cached
  }
  const { firebaseClientEmail, firebasePrivateKey } = useRuntimeConfig()
  const projectId =
    process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    ''

  if (!projectId) {
    throw createError({
      statusCode: 500,
      statusMessage:
        'Firebase admin not configured. Set NUXT_PUBLIC_FIREBASE_PROJECT_ID or FIREBASE_PROJECT_ID.'
    })
  }

  if (firebaseClientEmail && firebasePrivateKey) {
    cached = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail: String(firebaseClientEmail),
        // Support PEM strings that were \n-escaped in env vars (Vercel-friendly).
        privateKey: String(firebasePrivateKey).replace(/\\n/g, '\n')
      }),
      projectId
    })
    return cached
  }

  // ADC fallback: used when the org policy iam.disableServiceAccountKeyCreation
  // blocks service-account key creation. Run `gcloud auth application-default login`
  // locally, or set GOOGLE_APPLICATION_CREDENTIALS.
  cached = admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId
  })
  return cached
}

export function adminDb() {
  return getAdminApp().firestore()
}

export function adminAuth() {
  return getAdminApp().auth()
}
