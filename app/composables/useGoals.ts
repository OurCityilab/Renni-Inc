import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
  type Unsubscribe
} from 'firebase/firestore'
import { onMounted, onScopeDispose, ref } from 'vue'
import type { Department, Goal, GoalStatus } from '~/types/models'

export function useGoals() {
  // Resolve $firebase lazily — it's provided by a client-only plugin.
  function db() {
    return useNuxtApp().$firebase.db
  }
  function col() {
    return collection(db(), 'goals')
  }

  async function list(): Promise<Goal[]> {
    const snap = await getDocs(col())
    return snap.docs.map((d) => d.data() as Goal)
  }

  async function listByDepartment(department: Department): Promise<Goal[]> {
    const q = query(col(), where('department', '==', department))
    const snap = await getDocs(q)
    return snap.docs.map((d) => d.data() as Goal)
  }

  // Reactive list — primary driver for the Goals page so edits reflect
  // immediately. onSnapshot starts in onMounted so we never touch $firebase
  // during SSR/setup (it's provided by a client-only plugin).
  function watchList() {
    const data = ref<Goal[]>([])
    const loading = ref(true)
    let unsub: Unsubscribe | null = null

    onMounted(() => {
      unsub = onSnapshot(col(), (snap) => {
        data.value = snap.docs.map((d) => d.data() as Goal)
        loading.value = false
      })
    })
    onScopeDispose(() => {
      if (unsub) unsub()
    })
    return { data, loading }
  }

  // --- mutations ---
  // Firestore rule: admin/coceo can always update; a chief can update only
  // if they own the goal. Members are read-only. These helpers don't try
  // to enforce that — the rule does. The UI gates the buttons.

  async function setCurrent(id: string, current: number) {
    const ref = doc(db(), 'goals', id)
    await updateDoc(ref, { current, updatedAt: new Date().toISOString() })
  }

  async function setStatus(id: string, status: GoalStatus) {
    const ref = doc(db(), 'goals', id)
    await updateDoc(ref, { status, updatedAt: new Date().toISOString() })
  }

  return { list, listByDepartment, watchList, setCurrent, setStatus }
}
