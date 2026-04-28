import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe
} from 'firebase/firestore'
import { onMounted, onScopeDispose, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import type {
  AppUser,
  CollaborationRole,
  Department,
  EmailStatus,
  RosterEntry,
  Role
} from '~/types/models'

// Roles that are chiefs by convention. Mirrors config/role-map.json on the
// server so Team-page edits land with a consistent isChief flag. Admin is a
// chief too (instructor / program lead).
const CHIEF_ROLES = new Set<Role>(['coceo', 'coo', 'cfo', 'cmo', 'csgo', 'admin'])
export function isChiefForRole(role: Role): boolean {
  return CHIEF_ROLES.has(role)
}

export type RosterPatch = {
  role?: Role
  title?: string
  department?: Department
  isChief?: boolean
  displayName?: string
  // V1 access manager — admin-only access fields. Empty strings clear
  // the field for the provision fallback (alternateEmail) or for the
  // display-only admin labels.
  alternateEmail?: string
  emailStatus?: EmailStatus | ''
  accessNotes?: string
  // V1 Remote Marketing Studio metadata — display-only. Empty strings
  // clear the field. None of these affect permissions or rules.
  classSection?: string
  cohortGroup?: string
  collaborationRole?: CollaborationRole | ''
}

export function useRoster() {
  function db() {
    return useNuxtApp().$firebase.db
  }
  function col() {
    return collection(db(), 'roster')
  }

  // Reactive list. Firestore rule already restricts reads to signed-in users;
  // nothing extra needed here. Subscription starts in onMounted so $firebase
  // isn't touched during SSR (client-only plugin).
  function watchAll() {
    const data = ref<RosterEntry[]>([])
    const loading = ref(true)
    let unsub: Unsubscribe | null = null

    onMounted(() => {
      unsub = onSnapshot(col(), (snap) => {
        data.value = snap.docs.map((d) => d.data() as RosterEntry)
        loading.value = false
      })
    })
    onScopeDispose(() => {
      if (unsub) unsub()
    })
    return { data, loading }
  }

  // Admin-only per Firestore rules. If a non-admin calls this, the write is
  // rejected server-side. The Team and /admin/users pages gate the UI on
  // auth.isAdmin and the admin middleware. Audit fields (updatedByUid /
  // updatedByEmail / updatedAt) are stamped here so callers don't have to
  // remember.
  async function update(email: string, patch: RosterPatch) {
    const auth = useAuthStore()
    const ref = doc(db(), 'roster', email.toLowerCase())
    await updateDoc(ref, {
      ...patch,
      updatedAt: new Date().toISOString(),
      updatedByUid: auth.user?.uid ?? null,
      updatedByEmail: auth.profile?.email ?? auth.user?.email ?? null
    })
  }

  // Create a new roster entry. Admin-only per Firestore rules.
  // Section Task Assignment sprint adds this so instructors / admins
  // can manually add a user from /admin/users when a student missed
  // signup. The roster doc id is the lowercased primary email; the
  // student must sign in once for /api/auth/provision to upsert
  // their users/{uid} doc.
  //
  // Posture (do not relax in V1):
  //   - Does NOT create a Firebase Auth account. The student must
  //     sign in with the matching Google account at least once.
  //   - Does NOT mutate users/{uid}; provision.post.ts is the only
  //     write path for that collection.
  //   - Refuses to overwrite an existing roster doc — the caller
  //     must check via watchAll() first.
  async function create(entry: {
    email: string
    displayName: string
    role: Role
    title: string
    department: Department
    isChief: boolean
    alternateEmail?: string
    classSection?: string
    cohortGroup?: string
    collaborationRole?: CollaborationRole | ''
    accessNotes?: string
  }) {
    const auth = useAuthStore()
    const email = entry.email.trim().toLowerCase()
    if (!email) throw new Error('Email is required.')
    const ref = doc(db(), 'roster', email)
    const existing = await getDoc(ref)
    if (existing.exists()) {
      throw new Error(
        `Roster entry already exists for ${email}. Use the existing row to edit.`
      )
    }
    const now = new Date().toISOString()
    const payload: RosterEntry = {
      email,
      displayName: entry.displayName.trim(),
      role: entry.role,
      title: entry.title.trim(),
      department: entry.department,
      isChief: entry.isChief,
      alternateEmail: (entry.alternateEmail || '').toLowerCase(),
      classSection: entry.classSection || '',
      cohortGroup: entry.cohortGroup || '',
      collaborationRole: entry.collaborationRole ?? '',
      accessNotes: entry.accessNotes || '',
      emailStatus: 'pending-signup',
      updatedAt: now,
      updatedByUid: auth.user?.uid ?? '',
      updatedByEmail: auth.profile?.email ?? auth.user?.email ?? ''
    }
    await setDoc(ref, payload)
  }

  // Propagate a roster patch to the user's `users/{uid}` doc so an
  // already-signed-in user picks up role / department / title /
  // isChief changes immediately via the auth store's onSnapshot
  // subscription. Without this, a role change on /team only takes
  // effect after the user signs out and back in (provision.post.ts
  // re-runs).
  //
  // Admin-only per the Firestore `users/{uid}` rule. Idempotent:
  // matches users by `email == roster.email` AND `email ==
  // alternateEmail` so an alternate-login user is also covered.
  async function syncUserFromRoster(email: string) {
    const lower = email.trim().toLowerCase()
    if (!lower) return
    const rosterSnap = await getDoc(doc(db(), 'roster', lower))
    if (!rosterSnap.exists()) return
    const r = rosterSnap.data() as RosterEntry
    const usersCol = collection(db(), 'users')
    // Match users whose `email` OR `rosterEmail` matches this
    // roster doc. Two queries because Firestore disjunction is
    // limited; deduplicate by uid below.
    const [bySelf, byRoster] = await Promise.all([
      getDocs(query(usersCol, where('email', '==', lower))),
      getDocs(query(usersCol, where('rosterEmail', '==', lower)))
    ])
    const seen = new Set<string>()
    const batch = writeBatch(db())
    let any = false
    const now = new Date().toISOString()
    const patch: Partial<AppUser> = {
      role: r.role,
      title: r.title,
      department: r.department,
      isChief: r.isChief,
      displayName: r.displayName,
      updatedAt: now
    }
    for (const snap of [...bySelf.docs, ...byRoster.docs]) {
      if (seen.has(snap.id)) continue
      seen.add(snap.id)
      batch.update(snap.ref, patch as Record<string, unknown>)
      any = true
    }
    if (any) await batch.commit()
  }

  return { watchAll, update, create, syncUserFromRoster }
}
