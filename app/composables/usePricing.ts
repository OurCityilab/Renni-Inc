import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  type Unsubscribe
} from 'firebase/firestore'
import { onMounted, onScopeDispose, ref } from 'vue'
import type { Department, PricingCategory, PricingScenario } from '~/types/models'

export type PricingPatch = Partial<{
  productName: string
  brand: string
  category: PricingCategory
  unitCost: number
  salePrice: number
  plannedQuantity: number
  soldQuantity: number | null
  fixedCostShare: number | null
  notes: string | null
  ownerEmail: string
  ownerUid: string | null
  department: Department
}>

export function usePricing() {
  function db() {
    return useNuxtApp().$firebase.db
  }
  function col() {
    return collection(db(), 'pricingScenarios')
  }

  // Reactive list. onSnapshot starts in onMounted so $firebase isn't touched
  // on SSR (client-only plugin).
  function watchList() {
    const data = ref<PricingScenario[]>([])
    const loading = ref(true)
    let unsub: Unsubscribe | null = null

    onMounted(() => {
      unsub = onSnapshot(col(), (snap) => {
        data.value = snap.docs.map((d) => d.data() as PricingScenario)
        loading.value = false
      })
    })
    onScopeDispose(() => {
      if (unsub) unsub()
    })
    return { data, loading }
  }

  // Firestore rule limits writes to admin/coceo/cfo. The UI gates the
  // buttons on the same check so a rejected write isn't the first feedback.
  async function update(id: string, patch: PricingPatch) {
    const ref = doc(db(), 'pricingScenarios', id)
    await updateDoc(ref, { ...patch, updatedAt: new Date().toISOString() })
  }

  async function create(id: string, payload: PricingPatch & { productName: string; brand: string }) {
    const ref = doc(db(), 'pricingScenarios', id)
    const now = new Date().toISOString()
    await setDoc(ref, {
      id,
      soldQuantity: null,
      fixedCostShare: null,
      notes: null,
      ...payload,
      createdAt: now,
      updatedAt: now
    })
  }

  return { watchList, update, create }
}
