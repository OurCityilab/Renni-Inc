// One-shot helper: re-syncs every users/{uid} document from its matching
// roster/{email}. Use this after fixing the role map (or any other roster-
// side change) so already-provisioned users pick up the correction without
// having to delete and re-sign-in.
//
// Why this exists: the auth provisioning route only writes users/{uid} when
// the client reports the doc is missing. Once a user has signed in, their
// users/{uid} is cached server-side, and a role-map fix in Firestore won't
// propagate to that doc automatically. This script patches them in bulk.

import { db } from './lib/admin'

async function main() {
  const firestore = db()
  const usersSnap = await firestore.collection('users').get()
  const now = new Date().toISOString()

  let patched = 0
  let unchanged = 0
  let missing = 0

  for (const user of usersSnap.docs) {
    const data = user.data() as {
      email?: string
      role?: string
      isChief?: boolean
      department?: string
      title?: string
      displayName?: string
    }
    const email = data.email?.toLowerCase()
    if (!email) {
      console.warn(`[sync-users] users/${user.id} has no email field; skipping`)
      continue
    }

    const rosterSnap = await firestore.collection('roster').doc(email).get()
    if (!rosterSnap.exists) {
      console.warn(`[sync-users] users/${user.id} (${email}) has no matching roster entry`)
      missing += 1
      continue
    }
    const r = rosterSnap.data() as {
      displayName?: string
      role: string
      title: string
      department: string
      isChief: boolean
    }

    const drift =
      data.role !== r.role ||
      data.isChief !== r.isChief ||
      data.department !== r.department ||
      data.title !== r.title ||
      data.displayName !== r.displayName

    if (!drift) {
      unchanged += 1
      continue
    }

    await user.ref.set(
      {
        email,
        displayName: r.displayName,
        role: r.role,
        title: r.title,
        department: r.department,
        isChief: r.isChief,
        updatedAt: now
      },
      { merge: true }
    )
    patched += 1
  }

  console.log(
    `[sync-users] patched ${patched}; unchanged ${unchanged}; missing roster ${missing}`
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
