<!--
  Finance Table Builder — launch-critical structured surface for
  Ch. 7 / 8 finance sections. One shared component, five table
  variants selected by the `kind` prop:
    unit-cost          — Ch. 8 unit-cost
    break-even         — Ch. 7 margin-and-break-even / Ch. 8 break-even
    revenue-scenarios  — Ch. 8 revenue-scenarios
    donation-scenarios — Ch. 8 donation-scenarios
    kpi                — Ch. 8 key-financial-kpis

  POSTURE (do not relax)
  ----------------------
    - Pure UI + clipboard. Local component state only. No Firestore
      writes, no AI calls, no /api/* requests, no automatic Working
      Draft writes.
    - Copy-only output: the student presses "Copy" to copy a markdown
      table, then pastes into Working Draft and edits in their own
      words.
    - Calculations are deterministic and inline:
        unit-cost           total = material + labor + packaging + other
        break-even          margin = price − cost; units = ceil(fixed / margin)
                            margin ≤ 0 → student-facing warning
        revenue-scenarios   revenue = quantity × price
        donation-scenarios  total = count × average gift
    - Mounts only when `section.financeTable?.enabled` is true. The
      kind selector lives on the section's metadata.
-->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import BuilderHandoffCallout from '~/components/BuilderHandoffCallout.vue'
import {
  unitCostRowsToImport,
  breakEvenRowsToImport,
  revenueScenarioRowsToImport,
  donationScenarioRowsToImport,
  starterKpiRows
} from '~/utils/productCatalog'

type FinanceTableKind =
  | 'unit-cost'
  | 'break-even'
  | 'revenue-scenarios'
  | 'donation-scenarios'
  | 'kpi'

type FieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'calculated'

interface ColumnDef {
  /** Field key on the row object. */
  key: string
  /** Visible label. */
  label: string
  type: FieldType
  /** Placeholder for free-text + number columns. */
  placeholder?: string
  /** Options for select columns. */
  options?: string[]
  /** Calculation function for `calculated` columns. Receives the row
   *  and returns the rendered value. */
  calc?: (row: Row) => string
  /** Optional warning string when the row is in a bad state (e.g.
   *  break-even with non-positive margin). Returned plain string,
   *  rendered next to the calculated cell. */
  warningFor?: (row: Row) => string | null
  /** Whether the column is visually wider (for free-text columns
   *  like assumption / source). */
  wide?: boolean
}

type Row = Record<string, string>

const props = defineProps<{
  kind: FinanceTableKind
  // Optional shared product-name list (from app/utils/productCatalog).
  // When non-empty, the per-row "Product" text column gets a native
  // HTML5 <datalist> autocomplete so students can pick a catalog
  // product instead of retyping. The input remains free-text;
  // v-model and the import / copy / save flow are unchanged.
  productOptions?: string[]
}>()

// ---- Column / row config per kind --------------------------------

function calcUnitCostTotal(r: Row): string {
  const m = parseNum(r['materialCost'])
  const l = parseNum(r['laborCost'])
  const p = parseNum(r['packagingFees'])
  const o = parseNum(r['otherCost'])
  if (m === null && l === null && p === null && o === null) return ''
  const sum = (m ?? 0) + (l ?? 0) + (p ?? 0) + (o ?? 0)
  return formatCurrency(sum)
}

function calcUnitMargin(r: Row): string {
  const cost = parseNum(r['unitCost'])
  const price = parseNum(r['salePrice'])
  if (cost === null || price === null) return ''
  return formatCurrency(price - cost)
}

function unitMarginNumber(r: Row): number | null {
  const cost = parseNum(r['unitCost'])
  const price = parseNum(r['salePrice'])
  if (cost === null || price === null) return null
  return price - cost
}

function calcUnitsToBreakEven(r: Row): string {
  const fixed = parseNum(r['fixedCost'])
  const margin = unitMarginNumber(r)
  if (fixed === null || margin === null) return ''
  if (margin <= 0) return '—'
  const units = Math.ceil(fixed / margin)
  return String(units)
}

function breakEvenWarning(r: Row): string | null {
  const margin = unitMarginNumber(r)
  if (margin === null) return null
  if (margin <= 0) {
    return 'Price must be higher than unit cost to break even.'
  }
  return null
}

function calcRevenue(r: Row): string {
  const q = parseNum(r['quantity'])
  const p = parseNum(r['price'])
  if (q === null || p === null) return ''
  return formatCurrency(q * p)
}

function calcDonationTotal(r: Row): string {
  const c = parseNum(r['count'])
  const g = parseNum(r['avgGift'])
  if (c === null || g === null) return ''
  return formatCurrency(c * g)
}

interface KindConfig {
  title: string
  intro: string
  copyHelper: string
  warningBanner?: string
  columns: ColumnDef[]
  /** Initial empty-row template. */
  rowTemplate: Row
  /** Number of starter rows when the builder first mounts. */
  starterRowCount: number
}

const CONFIGS: Record<FinanceTableKind, KindConfig> = {
  'unit-cost': {
    title: 'Unit Cost Table',
    intro:
      'List every product. Add the costs that exist only because we sold the unit. The builder sums them per row.',
    copyHelper:
      'Copy the table into Working Draft, edit it in your own words, then save with the existing Save button below.',
    columns: [
      { key: 'product', label: 'Product', type: 'text', placeholder: 'House Phoenix beanie', wide: true },
      { key: 'materialCost', label: 'Material / product', type: 'number', placeholder: '0.00' },
      { key: 'laborCost', label: 'Labor / prep', type: 'number', placeholder: '0.00' },
      { key: 'packagingFees', label: 'Packaging / fees', type: 'number', placeholder: '0.00' },
      { key: 'otherCost', label: 'Other', type: 'number', placeholder: '0.00' },
      { key: 'totalUnitCost', label: 'Total unit cost', type: 'calculated', calc: calcUnitCostTotal },
      { key: 'source', label: 'Source', type: 'text', placeholder: 'Vendor quote · comparable · assumption', wide: true },
      { key: 'assumption', label: 'Assumption', type: 'text', placeholder: 'e.g., per 100-unit run', wide: true }
    ],
    rowTemplate: {
      product: '',
      materialCost: '',
      laborCost: '',
      packagingFees: '',
      otherCost: '',
      source: '',
      assumption: ''
    },
    starterRowCount: 3
  },
  'break-even': {
    title: 'Break-Even Table',
    intro:
      'For each product: unit cost, sale price, fixed-cost share, and the units needed to break even. Numbers first; the builder calculates margin and break-even.',
    copyHelper:
      'Copy the table into Working Draft, edit it in your own words, then save with the existing Save button below.',
    columns: [
      { key: 'product', label: 'Product', type: 'text', placeholder: 'House Phoenix beanie', wide: true },
      { key: 'unitCost', label: 'Unit cost', type: 'number', placeholder: '0.00' },
      { key: 'salePrice', label: 'Sale price', type: 'number', placeholder: '0.00' },
      { key: 'unitMargin', label: 'Unit margin', type: 'calculated', calc: calcUnitMargin, warningFor: breakEvenWarning },
      { key: 'fixedCost', label: 'Fixed cost / goal', type: 'number', placeholder: '0.00' },
      { key: 'unitsToBreakEven', label: 'Units to break even', type: 'calculated', calc: calcUnitsToBreakEven },
      { key: 'assumption', label: 'Assumption', type: 'text', placeholder: 'e.g., 50% allocation rule', wide: true }
    ],
    rowTemplate: {
      product: '',
      unitCost: '',
      salePrice: '',
      fixedCost: '',
      assumption: ''
    },
    starterRowCount: 3
  },
  'revenue-scenarios': {
    title: 'Revenue Scenarios Table',
    intro:
      'Build low / target / stretch revenue per product per scenario. The builder calculates revenue = quantity × price.',
    copyHelper:
      'Copy the table into Working Draft, edit it in your own words, then save with the existing Save button below.',
    columns: [
      { key: 'scenario', label: 'Scenario', type: 'select', options: ['Low', 'Target', 'Stretch'] },
      { key: 'product', label: 'Product', type: 'text', placeholder: 'Beanie', wide: true },
      { key: 'quantity', label: 'Quantity', type: 'number', placeholder: '0' },
      { key: 'price', label: 'Price', type: 'number', placeholder: '0.00' },
      { key: 'revenue', label: 'Revenue', type: 'calculated', calc: calcRevenue },
      { key: 'assumption', label: 'Assumption', type: 'text', placeholder: 'e.g., 30% sell-through', wide: true },
      { key: 'confidence', label: 'Confidence', type: 'select', options: ['low', 'medium', 'high'] }
    ],
    rowTemplate: {
      scenario: 'Target',
      product: '',
      quantity: '',
      price: '',
      assumption: '',
      confidence: 'medium'
    },
    starterRowCount: 3
  },
  'donation-scenarios': {
    title: 'Donation Scenarios Table',
    intro:
      'Project donation revenue separately from product sales. The builder calculates total = count × average gift.',
    copyHelper:
      'Copy the table into Working Draft, edit it in your own words, then save with the existing Save button below.',
    columns: [
      { key: 'donorType', label: 'Donor type', type: 'text', placeholder: 'Friends and family', wide: true },
      { key: 'count', label: 'Count', type: 'number', placeholder: '0' },
      { key: 'avgGift', label: 'Average gift', type: 'number', placeholder: '0.00' },
      { key: 'total', label: 'Total', type: 'calculated', calc: calcDonationTotal },
      { key: 'assumption', label: 'Assumption', type: 'text', placeholder: 'e.g., one ask per visitor', wide: true },
      { key: 'confidence', label: 'Confidence', type: 'select', options: ['low', 'medium', 'high'] }
    ],
    rowTemplate: {
      donorType: '',
      count: '',
      avgGift: '',
      assumption: '',
      confidence: 'medium'
    },
    starterRowCount: 2
  },
  'kpi': {
    title: 'KPI Table',
    intro:
      'KPI = Key Performance Indicator — the number leaders watch to know if the team is on track. List 4–7. Each one needs a target, a source, an owner, and a review rhythm.',
    copyHelper:
      'Copy the table into Working Draft, edit it in your own words, then save with the existing Save button below.',
    columns: [
      { key: 'kpi', label: 'KPI', type: 'text', placeholder: 'Gross revenue', wide: true },
      { key: 'formula', label: 'Formula / definition', type: 'text', placeholder: 'sum of all sales (Square + cash)', wide: true },
      { key: 'target', label: 'Target', type: 'text', placeholder: '$1,800' },
      { key: 'source', label: 'Source', type: 'text', placeholder: '/revenue · /pricing', wide: true },
      { key: 'owner', label: 'Owner', type: 'text', placeholder: 'CFO' },
      { key: 'reviewRhythm', label: 'Review rhythm', type: 'text', placeholder: 'Weekly · post-event' }
    ],
    rowTemplate: {
      kpi: '',
      formula: '',
      target: '',
      source: '',
      owner: '',
      reviewRhythm: ''
    },
    starterRowCount: 3
  }
}

const config = computed<KindConfig>(() => CONFIGS[props.kind])

// ---- Local state -------------------------------------------------

const rows = reactive<Row[]>(seedRows())
const copyButtonLabel = ref<string>('Copy table')

function seedRows(): Row[] {
  return Array.from({ length: config.value.starterRowCount }, () => ({
    ...config.value.rowTemplate
  }))
}

function addRow(): void {
  rows.push({ ...config.value.rowTemplate })
}

function removeRow(idx: number): void {
  rows.splice(idx, 1)
  if (rows.length === 0) {
    addRow()
  }
}

function clearAll(): void {
  rows.splice(0, rows.length)
  for (let i = 0; i < config.value.starterRowCount; i++) {
    addRow()
  }
}

// ---- Product catalog import --------------------------------------
//
// Append-only. Helpers in productCatalog dedupe candidate rows
// against existing rows by product name (case-insensitive), so
// repeated clicks of the same Import button never duplicate
// catalog products. Edited values on existing rows are never
// touched. Donations are excluded from product helpers; donation
// import has its own helper.
//
// `importLabel` returns null when the kind has no useful import.
// `runImport` is a no-op when the helper returns zero new rows.

const importLabel = computed<string | null>(() => {
  switch (props.kind) {
    case 'unit-cost':
    case 'break-even':
    case 'revenue-scenarios':
      return 'Import product list'
    case 'donation-scenarios':
      return 'Import donation starter row'
    case 'kpi':
      return 'Add starter KPIs'
  }
})

const importStatus = ref<string>('')

function productKeyForKind(): string {
  switch (props.kind) {
    case 'unit-cost':
    case 'break-even':
    case 'revenue-scenarios':
      return 'product'
    case 'donation-scenarios':
      return 'donorType'
    case 'kpi':
      return 'kpi'
  }
}

function buildImportRows(): Row[] {
  const target = {
    existingRows: rows.slice(),
    productKey: productKeyForKind()
  }
  switch (props.kind) {
    case 'unit-cost':
      return unitCostRowsToImport(target)
    case 'break-even':
      return breakEvenRowsToImport(target)
    case 'revenue-scenarios':
      return revenueScenarioRowsToImport(target)
    case 'donation-scenarios':
      return donationScenarioRowsToImport(target)
    case 'kpi':
      return starterKpiRows(target)
  }
}

function runImport(): void {
  const candidates = buildImportRows()
  if (candidates.length === 0) {
    importStatus.value = 'Nothing new to import — every starter row is already in the table.'
    window.setTimeout(() => {
      importStatus.value = ''
    }, 4000)
    return
  }

  // Replace fully-blank starter rows in-place with the first imported
  // rows so the import doesn't leave empty rows hanging at the top
  // when the table is still on its starter shape. Anything past the
  // last blank slot is appended.
  let replaceIndex = 0
  let replaced = 0
  for (const candidate of candidates) {
    while (replaceIndex < rows.length && !rowIsBlank(rows[replaceIndex])) {
      replaceIndex++
    }
    if (replaceIndex < rows.length) {
      rows.splice(replaceIndex, 1, candidate)
      replaceIndex++
      replaced++
    } else {
      rows.push(candidate)
    }
  }
  const appended = candidates.length - replaced
  const replacedNote = replaced ? `replaced ${replaced} blank row${replaced === 1 ? '' : 's'}` : ''
  const appendedNote = appended ? `added ${appended} row${appended === 1 ? '' : 's'}` : ''
  const parts = [replacedNote, appendedNote].filter(Boolean)
  importStatus.value = `Imported ${candidates.length} starter row${candidates.length === 1 ? '' : 's'} (${parts.join(', ')}). Edit the values before saving.`
  window.setTimeout(() => {
    importStatus.value = ''
  }, 6000)
}

// ---- Helpers -----------------------------------------------------

function parseNum(v: unknown): number | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function formatCurrency(n: number): string {
  if (Math.abs(n - Math.round(n)) < 1e-9) {
    return `$${Math.round(n).toLocaleString()}`
  }
  return `$${n.toFixed(2)}`
}

function rowIsBlank(row: Row): boolean {
  return Object.entries(row).every(([_, v]) => !String(v ?? '').trim())
}

function calculatedValue(col: ColumnDef, row: Row): string {
  if (col.type !== 'calculated') return ''
  return col.calc?.(row) ?? ''
}

function warningFor(col: ColumnDef, row: Row): string | null {
  if (col.type !== 'calculated' || !col.warningFor) return null
  return col.warningFor(row)
}

// ---- Markdown copy -----------------------------------------------

function buildMarkdown(): string {
  const cols = config.value.columns
  const header = `| ${cols.map((c) => c.label).join(' | ')} |`
  const sep = `| ${cols.map(() => '---').join(' | ')} |`
  const visibleRows = rows.filter((r) => !rowIsBlank(r))
  const body =
    visibleRows.length === 0
      ? `| ${cols.map(() => '___').join(' | ')} |`
      : visibleRows
          .map((r) => {
            const cells = cols.map((c) => {
              if (c.type === 'calculated') {
                const v = calculatedValue(c, r)
                return v || '—'
              }
              const v = (r[c.key] ?? '').trim()
              return v || '—'
            })
            return `| ${cells.join(' | ')} |`
          })
          .join('\n')
  return [header, sep, body].join('\n')
}

async function copyTable(): Promise<void> {
  const text = buildMarkdown()
  try {
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      await navigator.clipboard.writeText(text)
      copyButtonLabel.value = 'Copied ✓'
      window.setTimeout(() => {
        copyButtonLabel.value = 'Copy table'
      }, 2000)
    } else {
      copyButtonLabel.value = 'Copy unavailable — select and copy manually'
    }
  } catch {
    copyButtonLabel.value = 'Copy failed — try again'
  }
}
</script>

<template>
  <section
    class="rounded-lg border border-amber-300 bg-amber-50/30 p-4 text-sm shadow-sm flex flex-col gap-4 min-w-0"
    aria-label="Finance Table Builder"
  >
    <header class="space-y-1">
      <p class="text-[11px] uppercase tracking-wide text-amber-800">
        Builder
      </p>
      <h3 class="text-base font-semibold text-amber-900">
        {{ config.title }}
        <span
          class="ml-2 inline-flex items-center rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900"
        >
          Pilot
        </span>
      </h3>
      <p class="text-xs text-amber-900">{{ config.intro }}</p>
    </header>

    <BuilderHandoffCallout />

    <p
      v-if="config.warningBanner"
      class="rounded border border-rose-300 bg-rose-50 p-2 text-xs text-rose-900"
    >
      {{ config.warningBanner }}
    </p>

    <!-- Shared product-name datalist for every row's product column.
         Native HTML5 autocomplete; the input stays free-text and
         v-model is unchanged. Rendered once per builder instance. -->
    <datalist
      v-if="productOptions && productOptions.length"
      :id="`ftb-products-${kind}`"
    >
      <option v-for="opt in productOptions" :key="opt" :value="opt" />
    </datalist>

    <!-- ===== Row editor ===== -->
    <div class="space-y-3">
      <article
        v-for="(row, idx) in rows"
        :key="idx"
        class="rounded border border-stone-200 bg-white p-3"
      >
        <header class="mb-2 flex items-baseline justify-between gap-2">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-stone-700">
            Row {{ idx + 1 }}
          </p>
          <button
            type="button"
            class="text-[11px] text-stone-500 hover:text-rose-700"
            @click="removeRow(idx)"
          >
            Remove
          </button>
        </header>

        <div class="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          <label
            v-for="col in config.columns"
            :key="col.key"
            class="block text-[11px] text-stone-700"
            :class="col.wide ? 'sm:col-span-2 md:col-span-2' : ''"
          >
            <span class="font-semibold uppercase tracking-wide">{{ col.label }}</span>
            <template v-if="col.type === 'text'">
              <input
                v-model="row[col.key]"
                type="text"
                :placeholder="col.placeholder"
                :list="
                  col.key === 'product' && productOptions && productOptions.length
                    ? `ftb-products-${kind}`
                    : undefined
                "
                class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs"
              />
            </template>
            <template v-else-if="col.type === 'number'">
              <input
                v-model="row[col.key]"
                type="text"
                inputmode="decimal"
                :placeholder="col.placeholder"
                class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs"
              />
            </template>
            <template v-else-if="col.type === 'select'">
              <select
                v-model="row[col.key]"
                class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs"
              >
                <option
                  v-for="opt in col.options ?? []"
                  :key="opt"
                  :value="opt"
                >
                  {{ opt }}
                </option>
              </select>
            </template>
            <template v-else-if="col.type === 'calculated'">
              <p
                class="mt-1 rounded border border-stone-200 bg-stone-50 p-1 text-xs font-mono text-stone-800"
              >
                {{ calculatedValue(col, row) || '—' }}
              </p>
              <p
                v-if="warningFor(col, row)"
                class="mt-1 text-[11px] font-semibold text-rose-800"
              >
                {{ warningFor(col, row) }}
              </p>
            </template>
          </label>
        </div>
      </article>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="rounded border border-amber-400 bg-white px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
        @click="addRow"
      >
        + Add row
      </button>
      <button
        v-if="importLabel"
        type="button"
        class="rounded border border-amber-400 bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-200"
        @click="runImport"
      >
        {{ importLabel }}
      </button>
      <button
        type="button"
        class="rounded border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100"
        @click="clearAll"
      >
        Clear all
      </button>
    </div>
    <p
      v-if="importLabel"
      class="text-[11px] italic text-stone-600"
    >
      Imported values are starter assumptions. Edit them before saving.
    </p>
    <p
      v-if="importStatus"
      class="text-[11px] font-semibold text-amber-900"
      role="status"
    >
      {{ importStatus }}
    </p>

    <!-- ===== Copy block ===== -->
    <div class="rounded border border-stone-200 bg-stone-50 p-3">
      <p class="mb-1 text-[11px] font-semibold uppercase tracking-wide text-stone-700">
        Output (markdown table)
      </p>
      <pre
        class="whitespace-pre overflow-x-auto rounded border border-stone-200 bg-white p-2 font-mono text-[11px] text-stone-800"
      >{{ buildMarkdown() }}</pre>
      <div class="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="rounded border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-stone-800 hover:bg-stone-100"
          @click="copyTable"
        >
          {{ copyButtonLabel }}
        </button>
        <span class="text-[11px] text-stone-500">
          {{ config.copyHelper }}
        </span>
      </div>
    </div>
  </section>
</template>
