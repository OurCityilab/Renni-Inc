import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  type Unsubscribe
} from 'firebase/firestore'
import { onMounted, onScopeDispose, ref } from 'vue'
import type { BmcBlock, BmcBlockKey, Department } from '~/types/models'

export interface BmcPatch {
  content?: string
  ownerDepartment?: Department | null
  ownerEmail?: string | null
  status?: 'draft' | 'reviewed' | null
  updatedByEmail?: string | null
}

export function useBmc() {
  function db() {
    return useNuxtApp().$firebase.db
  }
  function col() {
    return collection(db(), 'bmcBlocks')
  }

  // Reactive list of the 9 blocks. Rules limit reads to signed-in users;
  // subscription starts in onMounted so SSR doesn't touch $firebase.
  function watchAll() {
    const data = ref<BmcBlock[]>([])
    const loading = ref(true)
    let unsub: Unsubscribe | null = null

    onMounted(() => {
      unsub = onSnapshot(col(), (snap) => {
        data.value = snap.docs.map((d) => d.data() as BmcBlock)
        loading.value = false
      })
    })
    onScopeDispose(() => {
      if (unsub) unsub()
    })
    return { data, loading }
  }

  // Rules limit writes to admin / Co-CEO / CSGO. UI gates buttons to match.
  async function update(id: BmcBlockKey, patch: BmcPatch) {
    const ref = doc(db(), 'bmcBlocks', id)
    await updateDoc(ref, { ...patch, updatedAt: new Date().toISOString() })
  }

  return { watchAll, update }
}
