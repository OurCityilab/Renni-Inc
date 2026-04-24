<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { usePricing } from '~/composables/usePricing'
import { useTransactions } from '~/composables/useTransactions'
import type { PricingCategory, PricingScenario } from '~/types/models'

const auth = useAuthStore()
const pricing = usePricing()
const tx = useTransactions()
const { data: scenarios, loading } = pricing.watchList()
const { data: transactions } = tx.watchList()

// Mirrors the Firestore rule: admin, Co-CEO, or CFO may edit. Everyone
// signed in can read.
const canEdit = computed(
  () => auth.isAdmin || auth.isCoCEO || auth.profile?.role === 'cfo'
)

const CATEGORIES: PricingCategory[] = ['apparel', 'baked-goods', 'donation', 'other']

// ---- derived math helpers ----

function revenue(s: PricingScenario): number {
  return s.salePrice * s.plannedQuantity
}
function variableCost(s: PricingScenario): number {
  return s.unitCost * s.plannedQuantity
}
function grossProfit(s: PricingScenario): number {
  return revenue(s) - variableCost(s)
}
function grossMarginPercent(s: PricingScenario): number | null {
  const r = revenue(s)
  if (r <= 0) return null
  return (grossProfit(s) / r) * 100
}
function contributionMargin(s: PricingScenario): number {
  return s.salePrice - s.unitCost
}
function breakEvenUnits(s: PricingScenario): number | null {
  const fc = s.fixedCostShare
  if (fc == null || fc <= 0) return null
  const cm = contributionMargin(s)
  if (cm <= 0) return null
  return Math.ceil(fc / cm)
}

// Donations have unit cost 0 and a nominal sale price — flagging them as
// "unprofitable" adds noise. Treat them as informational instead.
function isDonation(s: PricingScenario): boolean {
  return s.category === 'donation'
}

function isUnprofitable(s: PricingScenario): boolean {
  if (isDonation(s)) return false
  return s.salePrice <= s.unitCost
}

function plannedShortOfBreakEven(s: PricingScenario): boolean {
  const be = breakEvenUnits(s)
  if (be == null) return false
  return s.plannedQuantity < be
}

function hasWarning(s: PricingScenario): boolean {
  return isUnprofitable(s) || plannedShortOfBreakEven(s)
}

function fmtMoney(n: number): string {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}
function fmtPercent(n: number | null): string {
  return n == null ? '—' : `${n.toFixed(1)}%`
}
function fmtVarianceMoney(n: number): string {
  // Signed money display so students see positive/negative variance at a glance.
  const sign = n > 0 ? '+' : ''
  return `${sign}${fmtMoney(n)}`
}
function fmtVarianceUnits(n: number): string {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n}`
}

// ---- actuals map (sales only, keyed by pricingScenarioId) ----
// Donations intentionally excluded: they carry pricingScenarioId=null and
// get aggregated separately via donationActualRevenue.
const scenarioActuals = computed(() => {
  const map = new Map<string, { qty: number; revenue: number; profit: number }>()
  for (const t of transactions.value) {
    if (t.type !== 'sale') continue
    const id = t.pricingScenarioId
    if (!id) continue
    const cur = map.get(id) ?? { qty: 0, revenue: 0, profit: 0 }
    cur.qty += t.quantity ?? 0
    cur.revenue += t.grossRevenue ?? 0
    cur.profit += t.estimatedGrossProfit ?? 0
    map.set(id, cur)
  }
  return map
})

const donationActualRevenue = computed(() =>
  transactions.value
    .filter((t) => t.type === 'donation')
    .reduce((sum, t) => sum + (t.grossRevenue ?? 0), 0)
)

function actualSoldQty(s: PricingScenario): number {
  if (s.category === 'donation') return 0
  return scenarioActuals.value.get(s.id)?.qty ?? 0
}
function actualRevenue(s: PricingScenario): number {
  if (s.category === 'donation') return donationActualRevenue.value
  return scenarioActuals.value.get(s.id)?.revenue ?? 0
}
function actualProfit(s: PricingScenario): number {
  // Donations: est. profit equals revenue (unit cost is 0).
  if (s.category === 'donation') return donationActualRevenue.value
  return scenarioActuals.value.get(s.id)?.profit ?? 0
}
function remainingQty(s: PricingScenario): number {
  if (s.category === 'donation') return 0
  return Math.max(0, (s.plannedQuantity ?? 0) - actualSoldQty(s))
}
function sellThroughPercent(s: PricingScenario): number | null {
  if (s.category === 'donation') return null
  if (!s.plannedQuantity || s.plannedQuantity <= 0) return null
  return (actualSoldQty(s) / s.plannedQuantity) * 100
}
function revenueVariance(s: PricingScenario): number {
  return actualRevenue(s) - revenue(s)
}
function unitVariance(s: PricingScenario): number {
  if (s.category === 'donation') return 0
  return actualSoldQty(s) - (s.plannedQuantity ?? 0)
}

type ActualState = 'sold_out' | 'behind_plan' | 'no_sales' | 'on_track' | null
function actualStatus(s: PricingScenario): ActualState {
  if (s.category === 'donation') return null
  const sold = actualSoldQty(s)
  const planned = s.plannedQuantity ?? 0
  if (planned <= 0) return null
  if (sold >= planned) return 'sold_out'
  if (sold === 0) return 'no_sales'
  return 'behind_plan'
}
function isAboveProjection(s: PricingScenario): boolean {
  // Only meaningful for rows with a projection to beat.
  if (s.category === 'donation') {
    return actualRevenue(s) > revenue(s) && revenue(s) > 0
  }
  return actualSoldQty(s) > 0 && actualRevenue(s) > revenue(s) && revenue(s) > 0
}

// ---- summary cards ----

const visible = computed(() => [...scenarios.value].sort((a, b) =>
  (a.brand + a.productName).localeCompare(b.brand + b.productName)
))

const projectedRevenue = computed(() =>
  visible.value.reduce((sum, s) => sum + revenue(s), 0)
)
const projectedProfit = computed(() =>
  visible.value.reduce((sum, s) => sum + grossProfit(s), 0)
)
// Sell-through math excludes donations (nominal units, not inventory).
const plannedUnits = computed(() =>
  visible.value
    .filter((s) => s.category !== 'donation')
    .reduce((sum, s) => sum + (s.plannedQuantity || 0), 0)
)
const actualRevenueTotal = computed(() =>
  transactions.value.reduce((sum, t) => sum + (t.grossRevenue ?? 0), 0)
)
const actualProfitTotal = computed(() =>
  transactions.value.reduce((sum, t) => sum + (t.estimatedGrossProfit ?? 0), 0)
)
const unitsSold = computed(() =>
  transactions.value
    .filter((t) => t.type === 'sale')
    .reduce((sum, t) => sum + (t.quantity ?? 0), 0)
)
const overallSellThrough = computed<number | null>(() => {
  if (plannedUnits.value <= 0) return null
  return (unitsSold.value / plannedUnits.value) * 100
})
const revenueVarianceTotal = computed(
  () => actualRevenueTotal.value - projectedRevenue.value
)

// ---- edit state ----

type DraftFields = {
  productName: string
  brand: string
  category: PricingCategory
  unitCost: number
  salePrice: number
  plannedQuantity: number
  fixedCostShare: number | null
  notes: string
}

const editingId = ref<string | null>(null)
const draft = ref<DraftFields>({
  productName: '',
  brand: '',
  category: 'apparel',
  unitCost: 0,
  salePrice: 0,
  plannedQuantity: 0,
  fixedCostShare: null,
  notes: ''
})
const savingId = ref<string | null>(null)
const rowError = ref<Record<string, string>>({})

function startEdit(s: PricingScenario) {
  editingId.value = s.id
  draft.value = {
    productName: s.productName,
    brand: s.brand,
    category: s.category,
    unitCost: s.unitCost,
    salePrice: s.salePrice,
    plannedQuantity: s.plannedQuantity,
    fixedCostShare: s.fixedCostShare ?? null,
    notes: s.notes ?? ''
  }
  rowError.value[s.id] = ''
}

function cancelEdit() {
  editingId.value = null
}

// v-model.number on an empty input yields '' (not NaN), so the draft
// fields can arrive as empty strings, NaN, or non-numeric text at runtime
// despite the type annotations. Validate explicitly before writing.
function isBlank(v: unknown): boolean {
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

function validateDraft(d: DraftFields): string | null {
  if (!d.productName.trim()) return 'Product name is required.'
  if (!d.brand.trim()) return 'Brand is required.'

  const unitCost = parseNumber(d.unitCost)
  if (unitCost === null) return 'Unit cost is required and must be a number.'
  if (unitCost < 0) return 'Unit cost must be zero or positive.'

  const salePrice = parseNumber(d.salePrice)
  if (salePrice === null) return 'Sale price is required and must be a number.'
  if (salePrice < 0) return 'Sale price must be zero or positive.'

  const plannedQuantity = parseNumber(d.plannedQuantity)
  if (plannedQuantity === null) return 'Planned quantity is required and must be a number.'
  if (plannedQuantity < 0) return 'Planned quantity must be zero or positive.'

  // fixedCostShare is optional. Blank → save as null. Non-blank must parse
  // and be non-negative; otherwise surface a clear error.
  if (!isBlank(d.fixedCostShare)) {
    const fc = parseNumber(d.fixedCostShare)
    if (fc === null) return 'Fixed cost share must be a number, or left blank.'
    if (fc < 0) return 'Fixed cost share must be zero or positive (or left blank).'
  }
  return null
}

async function save(s: PricingScenario) {
  const d = draft.value
  const err = validateDraft(d)
  if (err) {
    rowError.value[s.id] = err
    return
  }
  savingId.value = s.id
  rowError.value[s.id] = ''
  try {
    // Re-parse now that validation has passed. The non-null assertions are
    // safe: validateDraft guarantees each required field parses.
    const unitCost = parseNumber(d.unitCost)!
    const salePrice = parseNumber(d.salePrice)!
    const plannedQuantity = parseNumber(d.plannedQuantity)!
    const fixedCostShare = isBlank(d.fixedCostShare)
      ? null
      : parseNumber(d.fixedCostShare)

    await pricing.update(s.id, {
      productName: d.productName.trim(),
      brand: d.brand.trim(),
      category: d.category,
      unitCost,
      salePrice,
      plannedQuantity,
      fixedCostShare,
      notes: d.notes.trim() || null
    })
    editingId.value = null
  } catch (e) {
    rowError.value[s.id] = e instanceof Error ? e.message : String(e)
  } finally {
    savingId.value = null
  }
}
</script>

<template>
  <section class="space-y-5">
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-sm text-neutral-500">Finance · plan</p>
        <h1 class="text-2xl font-semibold">Pricing &amp; Break-Even</h1>
        <p class="text-sm text-neutral-600">
          Per-product projections for the TechTown pop-up. Edits are limited to the CFO, Co-CEOs, and the program lead.
        </p>
      </div>
      <NuxtLink
        to="/revenue"
        class="shrink-0 rounded-md border border-neutral-200 bg-white px-3 py-2 text-xs hover:border-phoenix-300"
      >
        Track actual pop-up revenue →
      </NuxtLink>
    </header>

    <!-- Plan row -->
    <div class="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
      <KpiCard label="Projected revenue" :value="fmtMoney(projectedRevenue)" tone="good" />
      <KpiCard
        label="Projected gross profit"
        :value="fmtMoney(projectedProfit)"
        :tone="projectedProfit >= 0 ? 'good' : 'warn'"
      />
      <KpiCard label="Units planned" :value="plannedUnits" />
      <KpiCard label="Sell-through" :value="fmtPercent(overallSellThrough)" />
    </div>

    <!-- Actual row -->
    <div class="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
      <KpiCard label="Actual revenue" :value="fmtMoney(actualRevenueTotal)" tone="good" />
      <KpiCard label="Actual est. gross profit" :value="fmtMoney(actualProfitTotal)" />
      <KpiCard label="Units sold" :value="unitsSold" />
      <KpiCard
        label="Revenue variance"
        :value="fmtVarianceMoney(revenueVarianceTotal)"
        :tone="revenueVarianceTotal >= 0 ? 'good' : 'warn'"
      />
    </div>

    <p v-if="loading" class="text-sm text-neutral-500">Loading pricing scenarios…</p>
    <p v-else-if="!visible.length" class="text-sm text-neutral-500">
      No pricing scenarios yet. Run <code>npm run seed:pricing</code> to load placeholder data.
    </p>

    <ul v-else class="space-y-2">
      <li
        v-for="s in visible"
        :key="s.id"
        class="card space-y-2"
        :class="{ 'border-rose-200 bg-rose-50/40': hasWarning(s) }"
      >
        <!-- Read view -->
        <div v-if="editingId !== s.id" class="space-y-2">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-medium text-neutral-900">
                {{ s.brand }} — {{ s.productName }}
              </p>
              <p class="text-xs text-neutral-500">
                {{ s.category }}<span v-if="s.ownerEmail"> · {{ s.ownerEmail }}</span>
              </p>
              <p v-if="s.notes" class="mt-1 text-xs text-neutral-600">{{ s.notes }}</p>
            </div>
            <div class="flex flex-wrap shrink-0 items-center gap-2">
              <!-- Plan-level chips -->
              <span
                v-if="isUnprofitable(s)"
                class="rounded-full border border-rose-300 bg-rose-50 px-2 py-0.5 text-xs text-rose-800"
              >Not profitable</span>
              <span
                v-else-if="plannedShortOfBreakEven(s)"
                class="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs text-amber-800"
              >Plan short of break-even</span>
              <span
                v-if="isDonation(s)"
                class="rounded-full border border-sky-300 bg-sky-50 px-2 py-0.5 text-xs text-sky-800"
              >Donation target · not inventory</span>
              <!-- Actuals chips (non-donation only) -->
              <span
                v-if="actualStatus(s) === 'sold_out'"
                class="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800"
              >Sold out</span>
              <span
                v-else-if="actualStatus(s) === 'behind_plan'"
                class="rounded-full border border-orange-300 bg-orange-50 px-2 py-0.5 text-xs text-orange-800"
              >Behind plan</span>
              <span
                v-else-if="actualStatus(s) === 'no_sales'"
                class="rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-600"
              >No sales yet</span>
              <!-- Independent "beat projection" chip -->
              <span
                v-if="isAboveProjection(s)"
                class="rounded-full border border-teal-300 bg-teal-50 px-2 py-0.5 text-xs text-teal-800"
              >Revenue above projection</span>
              <button
                v-if="canEdit"
                class="text-xs text-phoenix-700 hover:underline"
                @click="startEdit(s)"
              >Edit</button>
            </div>
          </div>

          <dl class="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-md border border-neutral-200 p-2">
              <dt class="text-xs text-neutral-500">Unit cost · sale price</dt>
              <dd class="text-neutral-900">
                {{ fmtMoney(s.unitCost) }} → {{ fmtMoney(s.salePrice) }}
              </dd>
            </div>
            <div class="rounded-md border border-neutral-200 p-2">
              <dt class="text-xs text-neutral-500">Planned quantity</dt>
              <dd class="text-neutral-900">{{ s.plannedQuantity }}</dd>
            </div>
            <div class="rounded-md border border-neutral-200 p-2">
              <dt class="text-xs text-neutral-500">Projected revenue · gross profit</dt>
              <dd class="text-neutral-900">
                {{ fmtMoney(revenue(s)) }} · {{ fmtMoney(grossProfit(s)) }}
              </dd>
            </div>
            <div class="rounded-md border border-neutral-200 p-2">
              <dt class="text-xs text-neutral-500">Gross margin · contribution</dt>
              <dd class="text-neutral-900">
                {{ fmtPercent(grossMarginPercent(s)) }} · {{ fmtMoney(contributionMargin(s)) }}
              </dd>
            </div>
            <div
              v-if="s.fixedCostShare != null && s.fixedCostShare > 0"
              class="rounded-md border border-neutral-200 p-2 sm:col-span-2"
            >
              <dt class="text-xs text-neutral-500">Fixed-cost share · break-even units</dt>
              <dd class="text-neutral-900">
                {{ fmtMoney(s.fixedCostShare) }} ·
                <span v-if="breakEvenUnits(s) != null">{{ breakEvenUnits(s) }} units</span>
                <span v-else class="text-neutral-500">—</span>
              </dd>
            </div>
          </dl>

          <!-- Actuals reconciliation. Non-donation: sold/remaining + revenue/profit + variance.
               Donation: projected target vs actual revenue only (no sell-through). -->
          <div
            v-if="!isDonation(s)"
            class="rounded-md border border-dashed border-neutral-300 p-2"
          >
            <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Actuals so far
            </p>
            <dl class="mt-1 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt class="text-xs text-neutral-500">Sold · Remaining</dt>
                <dd class="text-neutral-900">
                  {{ actualSoldQty(s) }} · {{ remainingQty(s) }}
                </dd>
              </div>
              <div>
                <dt class="text-xs text-neutral-500">Actual revenue</dt>
                <dd class="text-neutral-900">{{ fmtMoney(actualRevenue(s)) }}</dd>
              </div>
              <div>
                <dt class="text-xs text-neutral-500">Actual est. profit</dt>
                <dd class="text-neutral-900">{{ fmtMoney(actualProfit(s)) }}</dd>
              </div>
              <div>
                <dt class="text-xs text-neutral-500">Variance · sell-through</dt>
                <dd class="text-neutral-900">
                  <span :class="revenueVariance(s) >= 0 ? 'text-emerald-700' : 'text-rose-700'">
                    {{ fmtVarianceMoney(revenueVariance(s)) }}
                  </span>
                  <span class="text-xs text-neutral-500">
                    · {{ fmtVarianceUnits(unitVariance(s)) }} units ·
                    {{ fmtPercent(sellThroughPercent(s)) }}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          <div
            v-else
            class="rounded-md border border-dashed border-sky-200 bg-sky-50/40 p-2"
          >
            <p class="text-xs font-medium uppercase tracking-wide text-sky-800">
              Donation actuals
            </p>
            <dl class="mt-1 grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt class="text-xs text-neutral-500">Donation target</dt>
                <dd class="text-neutral-900">{{ fmtMoney(revenue(s)) }}</dd>
              </div>
              <div>
                <dt class="text-xs text-neutral-500">Actual donations</dt>
                <dd class="text-neutral-900">{{ fmtMoney(actualRevenue(s)) }}</dd>
              </div>
              <div>
                <dt class="text-xs text-neutral-500">Variance</dt>
                <dd
                  :class="revenueVariance(s) >= 0 ? 'text-emerald-700' : 'text-rose-700'"
                >{{ fmtVarianceMoney(revenueVariance(s)) }}</dd>
              </div>
            </dl>
            <p class="mt-2 text-xs text-neutral-500">
              Donations aren't inventory — unit counts and sell-through don't apply.
              Live totals are captured on <NuxtLink to="/revenue" class="text-phoenix-700 hover:underline">/revenue</NuxtLink>.
            </p>
          </div>
        </div>

        <!-- Edit view -->
        <div v-else class="space-y-2">
          <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <label class="text-xs font-medium text-neutral-800">
              Product name
              <input v-model="draft.productName" type="text"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm" />
            </label>
            <label class="text-xs font-medium text-neutral-800">
              Brand
              <input v-model="draft.brand" type="text"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm" />
            </label>
            <label class="text-xs font-medium text-neutral-800">
              Category
              <select v-model="draft.category"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm">
                <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
              </select>
            </label>
            <label class="text-xs font-medium text-neutral-800">
              Unit cost (USD)
              <input v-model.number="draft.unitCost" type="number" min="0" step="0.01"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm" />
            </label>
            <label class="text-xs font-medium text-neutral-800">
              Sale price (USD)
              <input v-model.number="draft.salePrice" type="number" min="0" step="0.01"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm" />
            </label>
            <label class="text-xs font-medium text-neutral-800">
              Planned quantity
              <input v-model.number="draft.plannedQuantity" type="number" min="0" step="1"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm" />
            </label>
            <label class="text-xs font-medium text-neutral-800 sm:col-span-2">
              Fixed-cost share (optional)
              <input v-model.number="draft.fixedCostShare" type="number" min="0" step="0.01"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                placeholder="Leave blank if none allocated" />
            </label>
          </div>
          <label class="block text-xs font-medium text-neutral-800">
            Notes
            <textarea v-model="draft.notes" rows="2"
              class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm" />
          </label>
          <div class="flex justify-end gap-2">
            <button class="btn-secondary" @click="cancelEdit">Cancel</button>
            <button
              class="btn-primary"
              :disabled="savingId === s.id"
              @click="save(s)"
            >{{ savingId === s.id ? 'Saving…' : 'Save' }}</button>
          </div>
        </div>

        <p v-if="rowError[s.id]" class="text-xs text-rose-600">{{ rowError[s.id] }}</p>
      </li>
    </ul>
  </section>
</template>
