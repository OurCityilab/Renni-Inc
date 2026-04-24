import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  type Unsubscribe
} from 'firebase/firestore'
import { onMounted, onScopeDispose, ref } from 'vue'
import type { Department, RosterEntry, Role } from '~/types/models'

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
  // rejected server-side. The Team page gates the UI on auth.isAdmin.
  async function update(email: string, patch: RosterPatch) {
    const ref = doc(db(), 'roster', email.toLowerCase())
    await updateDoc(ref, { ...patch, updatedAt: new Date().toISOString() })
  }

  return { watchAll, update }
}
