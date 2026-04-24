<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useGoals } from '~/composables/useGoals'
import { usePricing } from '~/composables/usePricing'
import { useTransactions } from '~/composables/useTransactions'
import type {
  Department,
  Goal,
  PopUpTransaction,
  PopUpTransactionType,
  PricingCategory,
  PricingScenario
} from '~/types/models'

const auth = useAuthStore()
const tx = useTransactions()
const pricing = usePricing()
const goals = useGoals()

const { data: transactions, loading: txLoading } = tx.watchList()
const { data: scenarios } = pricing.watchList()
const { data: allGoals } = goals.watchList()

const canAdminTxn = computed(
  () => auth.isAdmin || auth.isCoCEO || auth.profile?.role === 'cfo'
)

// ---- form state ----

type FormType = Exclude<PopUpTransactionType, 'adjustment'>

const formType = ref<FormType>('sale')
const scenarioId = ref<string>('')
const quantity = ref<number | string>(1)
const unitPrice = ref<number | string>(0)
const unitCost = ref<number | string>(0)
const donationAmount = ref<number | string>(0)
const paymentMethod = ref('')
const note = ref('')
const submitting = ref(false)
const formError = ref<string | null>(null)
const formSuccess = ref<string | null>(null)

const sortedScenarios = computed<PricingScenario[]>(() =>
  [...scenarios.value]
    .filter((s) => s.category !== 'donation')
    .sort((a, b) => (a.brand + a.productName).localeCompare(b.brand + b.productName))
)
const selectedScenario = computed<PricingScenario | null>(() => {
  if (!scenarioId.value) return null
  return scenarios.value.find((s) => s.id === scenarioId.value) ?? null
})

// Auto-fill unitPrice/unitCost whenever the picked scenario changes.
// Users can still override either value for promos/discounts.
watch(
  selectedScenario,
  (s) => {
    if (!s) return
    unitPrice.value = s.salePrice
    unitCost.value = s.unitCost
  },
  { immediate: true }
)

function isBlank(v: unknown) {
  return (
    v === null ||
    v === undefined ||
    (typeof v === 'string' && v.trim() === '')
  )
}
function parseNumber(v: unknown): number | null {
  if (isBlank(v)) return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

function resetForm() {
  scenarioId.value = ''
  quantity.value = 1
  unitPrice.value = 0
  unitCost.value = 0
  donationAmount.value = 0
  paymentMethod.value = ''
  note.value = ''
  formError.value = null
}

async function submit() {
  if (!auth.user) {
    formError.value = 'Sign in first.'
    return
  }
  formError.value = null
  formSuccess.value = null

  if (formType.value === 'sale') {
    const s = selectedScenario.value
    if (!s) {
      formError.value = 'Pick a product.'
      return
    }
    const qty = parseNumber(quantity.value)
    const price = parseNumber(unitPrice.value)
    const cost = parseNumber(unitCost.value)
    if (qty === null || qty <= 0) {
      formError.value = 'Quantity must be a positive number.'
      return
    }
    if (price === null || price < 0) {
      formError.value = 'Unit price must be a non-negative number.'
      return
    }
    if (cost === null || cost < 0) {
      formError.value = 'Unit cost must be a non-negative number.'
      return
    }
    submitting.value = true
    try {
      await tx.create({
        type: 'sale',
        productName: s.productName,
        pricingScenarioId: s.id,
        brand: s.brand,
        category: s.category,
        quantity: qty,
        unitPrice: price,
        unitCost: cost,
        paymentMethod: paymentMethod.value,
        note: note.value,
        recordedByUid: auth.user.uid,
        recordedByEmail: auth.profile?.email || auth.user.email || '',
        department: s.department
      })
      formSuccess.value = `Recorded ${qty} × ${s.brand} ${s.productName}.`
      resetForm()
    } catch (e) {
      formError.value = e instanceof Error ? e.message : String(e)
    } finally {
      submitting.value = false
    }
    return
  }

  // Donation
  const amount = parseNumber(donationAmount.value)
  if (amount === null || amount <= 0) {
    formError.value = 'Donation amount must be a positive number.'
    return
  }
  submitting.value = true
  try {
    await tx.create({
      type: 'donation',
      productName: 'Donation',
      pricingScenarioId: null,
      brand: 'Renni Inc.',
      category: 'donation' as PricingCategory,
      quantity: 1,
      unitPrice: amount,
      unitCost: 0,
      paymentMethod: paymentMethod.value,
      note: note.value,
      recordedByUid: auth.user.uid,
      recordedByEmail: auth.profile?.email || auth.user.email || '',
      department: 'finance' as Department
    })
    formSuccess.value = `Recorded donation of $${amount.toFixed(2)}.`
    resetForm()
  } catch (e) {
    formError.value = e instanceof Error ? e.message : String(e)
  } finally {
    submitting.value = false
  }
}

// ---- delete (admin/coceo/cfo) ----

const deletingId = ref<string | null>(null)
const deleteError = ref<string | null>(null)
async function remove(t: PopUpTransaction) {
  if (!canAdminTxn.value) return
  const confirmed =
    typeof window !== 'undefined' &&
    window.confirm(`Delete this ${t.type}? This cannot be undone.`)
  if (!confirmed) return
  deletingId.value = t.id
  deleteError.value = null
  try {
    await tx.deleteTransaction(t.id)
  } catch (e) {
    deleteError.value = e instanceof Error ? e.message : String(e)
  } finally {
    deletingId.value = null
  }
}

// ---- filters + derived lists ----

const typeFilter = ref<'all' | PopUpTransactionType>('all')
const brandFilter = ref<string>('')
const recorderFilter = ref<string>('')

const brandOptions = computed(() => {
  const set = new Set<string>()
  for (const t of transactions.value) if (t.brand) set.add(t.brand)
  return Array.from(set).sort()
})
const recorderOptions = computed(() => {
  const set = new Set<string>()
  for (const t of transactions.value) if (t.recordedByEmail) set.add(t.recordedByEmail)
  return Array.from(set).sort()
})

const visibleTxn = computed(() => {
  return [...transactions.value]
    .filter((t) => typeFilter.value === 'all' || t.type === typeFilter.value)
    .filter((t) => !brandFilter.value || t.brand === brandFilter.value)
    .filter((t) => !recorderFilter.value || t.recordedByEmail === recorderFilter.value)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
})

// ---- summary math (KPIs derive from ALL transactions, not the filtered view;
// filters narrow the list for focused review but shouldn't misstate totals).
// totalRevenue and estimatedProfit are both plain sums across every row so
// adjustments, when they exist, contribute their signed values consistently.
const totalRevenue = computed(() =>
  transactions.value.reduce((sum, t) => sum + (t.grossRevenue ?? 0), 0)
)
const salesRevenue = computed(() =>
  transactions.value
    .filter((t) => t.type === 'sale')
    .reduce((sum, t) => sum + (t.grossRevenue ?? 0), 0)
)
const donationRevenue = computed(() =>
  transactions.value
    .filter((t) => t.type === 'donation')
    .reduce((sum, t) => sum + (t.grossRevenue ?? 0), 0)
)
const estimatedProfit = computed(() =>
  transactions.value.reduce((sum, t) => sum + (t.estimatedGrossProfit ?? 0), 0)
)
const unitsSold = computed(() =>
  transactions.value
    .filter((t) => t.type === 'sale')
    .reduce((sum, t) => sum + (t.quantity ?? 0), 0)
)
const txnCount = computed(() => transactions.value.length)

// ---- donation goal progress ----
// Canonical seeded id per seed-goals.ts pattern: `${dept}-${slugify(name)}`.
const donationGoal = computed<Goal | null>(() => {
  const g = allGoals.value.find(
    (x) => x.department === 'finance' && /donation/i.test(x.metricName)
  )
  return g ?? null
})
const donationPercent = computed<number | null>(() => {
  const g = donationGoal.value
  if (!g || !g.target || g.target <= 0) return null
  return Math.min(100, Math.round((donationRevenue.value / g.target) * 100))
})

function fmtMoney(n: number): string {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}
function fmtWhen(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
}
</script>

<template>
  <section class="space-y-5">
    <header>
      <p class="text-sm text-neutral-500">Finance · live ledger</p>
      <h1 class="text-2xl font-semibold">Pop-Up Revenue</h1>
      <p class="text-sm text-neutral-600">
        Record actual sales and donations taken during the TechTown pop-up.
        Use <NuxtLink to="/pricing" class="text-phoenix-700 hover:underline">Pricing</NuxtLink>
        for projections.
      </p>
    </header>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <KpiCard label="Total revenue" :value="fmtMoney(totalRevenue)" tone="good" />
      <KpiCard label="Product sales" :value="fmtMoney(salesRevenue)" />
      <KpiCard label="Donations" :value="fmtMoney(donationRevenue)" />
      <KpiCard label="Est. gross profit" :value="fmtMoney(estimatedProfit)" />
      <KpiCard label="Units sold" :value="unitsSold" />
      <KpiCard label="Transactions" :value="txnCount" />
    </div>

    <!-- Donation goal progress (only if the goal is seeded) -->
    <section v-if="donationGoal" class="card">
      <header class="flex flex-wrap items-baseline justify-between gap-2">
        <h2 class="text-sm font-semibold">Donation goal</h2>
        <span class="text-xs text-neutral-500">
          {{ fmtMoney(donationRevenue) }} / {{ fmtMoney(donationGoal.target || 0) }}
        </span>
      </header>
      <div class="mt-2 h-2 w-full overflow-hidden rounded bg-neutral-100">
        <div
          class="h-full rounded bg-emerald-500"
          :style="{ width: (donationPercent ?? 0) + '%' }"
        />
      </div>
      <p class="mt-1 text-xs text-neutral-600">
        {{ donationPercent == null ? '—' : `${donationPercent}% of the finance team's donation target.` }}
      </p>
    </section>

    <!-- Quick entry form -->
    <section class="card space-y-3">
      <header class="flex items-center justify-between">
        <h2 class="text-sm font-semibold">Record a transaction</h2>
        <div class="flex gap-1 rounded-md border border-neutral-200 bg-white p-1 text-sm">
          <button
            class="rounded px-3 py-1"
            :class="formType === 'sale' ? 'bg-neutral-100 font-medium' : 'text-neutral-600'"
            @click="formType = 'sale'; formError = null"
          >Sale</button>
          <button
            class="rounded px-3 py-1"
            :class="formType === 'donation' ? 'bg-neutral-100 font-medium' : 'text-neutral-600'"
            @click="formType = 'donation'; formError = null"
          >Donation</button>
        </div>
      </header>

      <div v-if="formType === 'sale'" class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <label class="text-xs font-medium text-neutral-800 sm:col-span-2 lg:col-span-3">
          Product
          <select
            v-model="scenarioId"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
          >
            <option value="">— Pick a product —</option>
            <option v-for="s in sortedScenarios" :key="s.id" :value="s.id">
              {{ s.brand }} — {{ s.productName }} ({{ fmtMoney(s.salePrice) }})
            </option>
          </select>
        </label>
        <label class="text-xs font-medium text-neutral-800">
          Quantity
          <input
            v-model.number="quantity" type="number" min="1" step="1"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
          />
        </label>
        <label class="text-xs font-medium text-neutral-800">
          Unit price
          <input
            v-model.number="unitPrice" type="number" min="0" step="0.01"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
          />
        </label>
        <label class="text-xs font-medium text-neutral-800">
          Unit cost
          <input
            v-model.number="unitCost" type="number" min="0" step="0.01"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
          />
        </label>
      </div>

      <div v-else class="grid gap-2 sm:grid-cols-2">
        <label class="text-xs font-medium text-neutral-800">
          Donation amount (USD)
          <input
            v-model.number="donationAmount" type="number" min="0" step="0.01"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
          />
        </label>
      </div>

      <div class="grid gap-2 sm:grid-cols-2">
        <label class="text-xs font-medium text-neutral-800">
          Payment method (optional)
          <input
            v-model="paymentMethod" type="text" list="payment-methods"
            placeholder="cash, card, venmo, other"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
          />
          <datalist id="payment-methods">
            <option value="cash" />
            <option value="card" />
            <option value="venmo" />
            <option value="other" />
          </datalist>
        </label>
        <label class="text-xs font-medium text-neutral-800">
          Note (optional)
          <input
            v-model="note" type="text"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
          />
        </label>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2">
        <p v-if="formError" class="text-sm text-rose-600">{{ formError }}</p>
        <p v-else-if="formSuccess" class="text-sm text-emerald-700">{{ formSuccess }}</p>
        <p v-else class="text-xs text-neutral-500">Entries are recorded to your account.</p>
        <button
          class="btn-primary"
          :disabled="submitting"
          @click="submit"
        >{{ submitting ? 'Recording…' : 'Record' }}</button>
      </div>
    </section>

    <!-- Transaction list -->
    <section class="space-y-2">
      <header class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-sm font-semibold text-neutral-700">Ledger</h2>
        <div class="flex flex-wrap gap-2 text-sm">
          <select
            v-model="typeFilter"
            class="rounded border border-neutral-300 p-2 text-sm"
          >
            <option value="all">All types</option>
            <option value="sale">Sale</option>
            <option value="donation">Donation</option>
            <option value="adjustment">Adjustment</option>
          </select>
          <select
            v-model="brandFilter"
            class="rounded border border-neutral-300 p-2 text-sm"
          >
            <option value="">All brands</option>
            <option v-for="b in brandOptions" :key="b" :value="b">{{ b }}</option>
          </select>
          <select
            v-model="recorderFilter"
            class="rounded border border-neutral-300 p-2 text-sm"
          >
            <option value="">All recorders</option>
            <option v-for="e in recorderOptions" :key="e" :value="e">{{ e }}</option>
          </select>
        </div>
      </header>

      <p v-if="txLoading" class="text-sm text-neutral-500">Loading ledger…</p>
      <p v-else-if="!visibleTxn.length" class="text-sm text-neutral-500">
        No transactions recorded yet. Use the form above to add the first one.
      </p>

      <ul v-else class="space-y-2">
        <li
          v-for="t in visibleTxn"
          :key="t.id"
          class="card space-y-1"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-medium text-neutral-900">
                {{ t.type === 'donation' ? 'Donation' : `${t.brand} — ${t.productName}` }}
              </p>
              <p class="text-xs text-neutral-500">
                {{ fmtWhen(t.createdAt) }} · {{ t.recordedByEmail }}
                <span v-if="t.paymentMethod"> · {{ t.paymentMethod }}</span>
              </p>
              <p v-if="t.note" class="mt-1 text-xs text-neutral-600">{{ t.note }}</p>
            </div>
            <div class="flex shrink-0 items-center gap-2 text-sm">
              <span
                class="rounded-full border px-2 py-0.5 text-xs"
                :class="{
                  'border-emerald-300 bg-emerald-50 text-emerald-800': t.type === 'sale',
                  'border-sky-300 bg-sky-50 text-sky-800': t.type === 'donation',
                  'border-amber-300 bg-amber-50 text-amber-800': t.type === 'adjustment'
                }"
              >{{ t.type }}</span>
              <span v-if="t.type === 'sale'" class="text-neutral-600 text-xs">
                {{ t.quantity }} ×
              </span>
              <span class="font-medium text-neutral-900">{{ fmtMoney(t.grossRevenue ?? 0) }}</span>
              <span class="text-xs text-neutral-500">
                est. {{ fmtMoney(t.estimatedGrossProfit ?? 0) }}
              </span>
              <button
                v-if="canAdminTxn"
                class="text-xs text-rose-700 hover:underline"
                :disabled="deletingId === t.id"
                @click="remove(t)"
              >{{ deletingId === t.id ? 'Deleting…' : 'Delete' }}</button>
            </div>
          </div>
        </li>
      </ul>
      <p v-if="deleteError" class="text-xs text-rose-600">{{ deleteError }}</p>
    </section>
  </section>
</template>
