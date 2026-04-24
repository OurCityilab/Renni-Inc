import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
  type Unsubscribe
} from 'firebase/firestore'
import { onMounted, onScopeDispose, ref } from 'vue'
import type { Department, PopUpTransaction, PopUpTransactionType } from '~/types/models'

// Minimum fields the caller must supply; the rest (id, createdAt, updatedAt,
// grossRevenue, estimatedGrossProfit) are derived inside `create` so every
// record in the ledger is internally consistent.
export interface NewTransactionInput {
  type: PopUpTransactionType
  productName: string
  pricingScenarioId?: string | null
  brand: string
  category: PopUpTransaction['category']
  quantity: number
  unitPrice: number
  unitCost?: number | null
  paymentMethod?: string | null
  note?: string | null
  recordedByUid: string
  recordedByEmail: string
  department: Department
}

export function useTransactions() {
  function db() {
    return useNuxtApp().$firebase.db
  }
  function col() {
    return collection(db(), 'popUpTransactions')
  }

  // Reactive list of every pop-up transaction. Subscription is started in
  // onMounted so SSR never touches $firebase.
  function watchList() {
    const data = ref<PopUpTransaction[]>([])
    const loading = ref(true)
    let unsub: Unsubscribe | null = null

    onMounted(() => {
      unsub = onSnapshot(col(), (snap) => {
        data.value = snap.docs.map((d) => ({
          ...(d.data() as Omit<PopUpTransaction, 'id'>),
          id: d.id
        }))
        loading.value = false
      })
    })
    onScopeDispose(() => {
      if (unsub) unsub()
    })
    return { data, loading }
  }

  // Parse helpers. The composable is a public API — the page already
  // validates inputs before calling, but we also refuse to silently write
  // zeros or NaN if someone calls create() directly from elsewhere.
  function isBlank(v: unknown): boolean {
    return (
      v === null ||
      v === undefined ||
      (typeof v === 'string' && v.trim() === '')
    )
  }
  function parseFiniteNumber(v: unknown): number | null {
    if (isBlank(v)) return null
    const n = typeof v === 'number' ? v : Number(v)
    return Number.isFinite(n) ? n : null
  }

  async function create(input: NewTransactionInput) {
    const now = new Date().toISOString()

    // Required: quantity and unitPrice must be finite, non-negative numbers.
    const qty = parseFiniteNumber(input.quantity)
    if (qty === null) {
      throw new Error('quantity must be a finite number')
    }
    if (qty < 0) {
      throw new Error('quantity must be zero or positive')
    }
    const price = parseFiniteNumber(input.unitPrice)
    if (price === null) {
      throw new Error('unitPrice must be a finite number')
    }
    if (price < 0) {
      throw new Error('unitPrice must be zero or positive')
    }

    // Optional: unitCost null/undefined/blank stays null. If a value is
    // provided, it must parse to a finite, non-negative number.
    let cost: number | null = null
    if (!isBlank(input.unitCost)) {
      const parsed = parseFiniteNumber(input.unitCost)
      if (parsed === null) {
        throw new Error('unitCost must be a finite number when provided')
      }
      if (parsed < 0) {
        throw new Error('unitCost must be zero or positive when provided')
      }
      cost = parsed
    }

    const grossRevenue = qty * price
    // Donations have no meaningful cost; estimated profit equals revenue.
    // Sales and adjustments use cost (or 0 when cost is null).
    const estimatedGrossProfit =
      input.type === 'donation' ? grossRevenue : qty * (price - (cost ?? 0))

    const payload = {
      type: input.type,
      productName: input.productName,
      pricingScenarioId: input.pricingScenarioId ?? null,
      brand: input.brand,
      category: input.category,
      quantity: qty,
      unitPrice: price,
      unitCost: cost,
      grossRevenue,
      estimatedGrossProfit,
      paymentMethod: input.paymentMethod?.trim() || null,
      note: input.note?.trim() || null,
      recordedByUid: input.recordedByUid,
      recordedByEmail: input.recordedByEmail,
      department: input.department,
      createdAt: now,
      updatedAt: now
    }
    const ref = await addDoc(col(), payload)
    return ref.id
  }

  // Guarded by rules to admin/coceo/cfo. UI gates these controls on the
  // same check so rejected writes aren't the first feedback.
  async function updateTransaction(id: string, patch: Partial<PopUpTransaction>) {
    const ref = doc(db(), 'popUpTransactions', id)
    await updateDoc(ref, { ...patch, updatedAt: new Date().toISOString() })
  }

  async function deleteTransaction(id: string) {
    const ref = doc(db(), 'popUpTransactions', id)
    await deleteDoc(ref)
  }

  return { watchList, create, updateTransaction, deleteTransaction }
}
