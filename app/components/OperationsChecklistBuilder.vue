<!--
  Operations Checklist Builder — launch-critical structured surface
  for Ch. 9 operations sections. One shared component, four checklist
  variants selected by the `kind` prop:
    inventory       — Ch. 9 inventory: item · quantity · location ·
                      owner · issue · packed?
    day-of-sop      — Ch. 9 day-of-sop: time · step · owner ·
                      materials · done signal · backup
    baked-goods-sop — Ch. 9 baked-goods-sop: step · food safety
                      concern · owner · materials · done signal ·
                      backup. Ships with the "not legal food-safety
                      advice" student-facing warning banner.
    continuity      — Ch. 9 continuity: item / process · status ·
                      owner · link / location · warning · next step

  POSTURE (do not relax)
  ----------------------
    - Pure UI + clipboard. Local component state only. No Firestore
      writes, no AI calls, no /api/* requests, no automatic Working
      Draft writes.
    - Copy-only output: the student presses "Copy" to copy a markdown
      table, then pastes into Working Draft and edits in their own
      words.
    - The baked-goods variant carries a non-legal-advice warning
      banner; the warning text itself is part of the kind config so
      it can never be removed by a section author who only edits
      studio metadata.
    - Mounts only when `section.operationsChecklist?.enabled` is true.
      The kind selector lives on the section's metadata.
-->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import BuilderHandoffCallout from '~/components/BuilderHandoffCallout.vue'
import { inventoryRowsToImport } from '~/utils/productCatalog'

type OperationsChecklistKind =
  | 'inventory'
  | 'day-of-sop'
  | 'baked-goods-sop'
  | 'continuity'

type FieldType = 'text' | 'select'

interface ColumnDef {
  key: string
  label: string
  type: FieldType
  placeholder?: string
  options?: string[]
  /** Wider column on the row editor for free-text fields. */
  wide?: boolean
}

interface KindConfig {
  title: string
  intro: string
  copyHelper: string
  warningBanner?: string
  columns: ColumnDef[]
  rowTemplate: Row
  starterRowCount: number
}

type Row = Record<string, string>

const props = defineProps<{
  kind: OperationsChecklistKind
}>()

// ---- Column / row config per kind --------------------------------

const CONFIGS: Record<OperationsChecklistKind, KindConfig> = {
  inventory: {
    title: 'Inventory Checklist',
    intro:
      'List every item we need to bring. Owner is the person who confirms it gets to the venue. Packed? is checked the morning of the event.',
    copyHelper:
      'Copy the table into Working Draft, edit it in your own words, then save with the existing Save button below.',
    columns: [
      { key: 'item', label: 'Item', type: 'text', placeholder: 'House Phoenix beanie · size M', wide: true },
      { key: 'quantity', label: 'Quantity', type: 'text', placeholder: '12' },
      { key: 'location', label: 'Location', type: 'text', placeholder: 'Storage cage · vendor pickup', wide: true },
      { key: 'owner', label: 'Owner', type: 'text', placeholder: 'COO · CMO · CFO' },
      { key: 'issue', label: 'Issue / risk', type: 'text', placeholder: 'Vendor invoice unpaid', wide: true },
      { key: 'packed', label: 'Packed?', type: 'select', options: ['No', 'Yes'] }
    ],
    rowTemplate: {
      item: '',
      quantity: '',
      location: '',
      owner: '',
      issue: '',
      packed: 'No'
    },
    starterRowCount: 3
  },
  'day-of-sop': {
    title: 'Day-of SOP',
    intro:
      'Walk the day in order. Each step has an owner, the materials it depends on, the signal that says it is done, and a backup if the owner cannot run it.',
    copyHelper:
      'Copy the table into Working Draft, edit it in your own words, then save with the existing Save button below.',
    columns: [
      { key: 'time', label: 'Time / order', type: 'text', placeholder: '8:30 · Step 1' },
      { key: 'step', label: 'Step', type: 'text', placeholder: 'Set up tables and signage', wide: true },
      { key: 'owner', label: 'Owner', type: 'text', placeholder: 'COO' },
      { key: 'materials', label: 'Materials', type: 'text', placeholder: 'Tables · banner · zip ties', wide: true },
      { key: 'doneSignal', label: 'Done signal', type: 'text', placeholder: 'Photo to chief Slack', wide: true },
      { key: 'backup', label: 'Backup', type: 'text', placeholder: 'Co-CEO covers if COO absent' }
    ],
    rowTemplate: {
      time: '',
      step: '',
      owner: '',
      materials: '',
      doneSignal: '',
      backup: ''
    },
    starterRowCount: 4
  },
  'baked-goods-sop': {
    title: 'Baked Goods SOP',
    intro:
      'For every baked-goods step: name a food-safety concern, the owner, the materials, the signal that says it is done, and a backup. Vague answers are dangerous.',
    copyHelper:
      'Copy the table into Working Draft, edit it in your own words, then save with the existing Save button below.',
    warningBanner:
      'This is not legal food-safety advice. Follow school, event, and instructor requirements.',
    columns: [
      { key: 'step', label: 'Step', type: 'text', placeholder: 'Transport cookies to venue', wide: true },
      { key: 'concern', label: 'Food safety concern', type: 'text', placeholder: 'Temp / allergens / cross-contact', wide: true },
      { key: 'owner', label: 'Owner', type: 'text', placeholder: 'COO · baker' },
      { key: 'materials', label: 'Materials', type: 'text', placeholder: 'Sealed containers · gloves · labels', wide: true },
      { key: 'doneSignal', label: 'Done signal', type: 'text', placeholder: 'Containers labeled with allergen list', wide: true },
      { key: 'backup', label: 'Backup / notes', type: 'text', placeholder: 'Approved by instructor', wide: true }
    ],
    rowTemplate: {
      step: '',
      concern: '',
      owner: '',
      materials: '',
      doneSignal: '',
      backup: ''
    },
    starterRowCount: 3
  },
  continuity: {
    title: 'Continuity Checklist',
    intro:
      'Hand the next cohort what they need to start a Renni Inc. cycle without re-learning everything. List every system, account, process, and asset that has to keep working — with status, owner, where to find it, any warning, and the next step.',
    copyHelper:
      'Copy the table into Working Draft, edit it in your own words, then save with the existing Save button below.',
    columns: [
      { key: 'item', label: 'Item / process', type: 'text', placeholder: 'Square account · vendor invoices', wide: true },
      { key: 'status', label: 'Status', type: 'select', options: ['Ready', 'In progress', 'At risk', 'Blocked'] },
      { key: 'owner', label: 'Owner', type: 'text', placeholder: 'CFO' },
      { key: 'link', label: 'Link / location', type: 'text', placeholder: 'Drive folder · cabinet shelf', wide: true },
      { key: 'warning', label: 'Warning / risk', type: 'text', placeholder: 'Password rotates 5/15', wide: true },
      { key: 'nextStep', label: 'Next step', type: 'text', placeholder: 'Hand off Square login by Monday', wide: true }
    ],
    rowTemplate: {
      item: '',
      status: 'In progress',
      owner: '',
      link: '',
      warning: '',
      nextStep: ''
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

// ---- Product catalog import (inventory only) ---------------------
//
// Append-only. We deliberately scope this to the inventory checklist
// — Day-of SOP / Baked Goods SOP / Continuity describe processes
// not products, so importing the product list there would clutter
// the SOP without helping. Other kinds get no import button.
//
// Existing rows that already name a catalog product (case-insensitive
// match on the `item` column) are skipped so repeated clicks never
// duplicate. Edited values on existing rows are never touched.

const importLabel = computed<string | null>(() => {
  return props.kind === 'inventory' ? 'Import product list' : null
})

const importStatus = ref<string>('')

function runImport(): void {
  if (props.kind !== 'inventory') return
  const candidates = inventoryRowsToImport({
    existingRows: rows.slice(),
    productKey: 'item'
  })
  if (candidates.length === 0) {
    importStatus.value = 'Nothing new to import — every product is already in the checklist.'
    window.setTimeout(() => {
      importStatus.value = ''
    }, 4000)
    return
  }

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
  importStatus.value = `Imported ${candidates.length} product${candidates.length === 1 ? '' : 's'} (${parts.join(', ')}). Confirm quantity, location, and owner before saving.`
  window.setTimeout(() => {
    importStatus.value = ''
  }, 6000)
}

// ---- Helpers -----------------------------------------------------

function rowIsBlank(row: Row): boolean {
  return Object.entries(row).every(([_, v]) => !String(v ?? '').trim())
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
    class="rounded-lg border border-emerald-300 bg-emerald-50/30 p-4 text-sm shadow-sm flex flex-col gap-4 min-w-0"
    aria-label="Operations Checklist Builder"
  >
    <header class="space-y-1">
      <p class="text-[11px] uppercase tracking-wide text-emerald-800">
        Builder
      </p>
      <h3 class="text-base font-semibold text-emerald-900">
        {{ config.title }}
        <span
          class="ml-2 inline-flex items-center rounded bg-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-900"
        >
          Pilot
        </span>
      </h3>
      <p class="text-xs text-emerald-900">{{ config.intro }}</p>
    </header>

    <BuilderHandoffCallout />

    <p
      v-if="config.warningBanner"
      class="rounded border border-rose-300 bg-rose-50 p-2 text-xs text-rose-900"
    >
      {{ config.warningBanner }}
    </p>

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
          </label>
        </div>
      </article>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="rounded border border-emerald-400 bg-white px-2 py-1 text-xs font-medium text-emerald-900 hover:bg-emerald-100"
        @click="addRow"
      >
        + Add row
      </button>
      <button
        v-if="importLabel"
        type="button"
        class="rounded border border-emerald-400 bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-900 hover:bg-emerald-200"
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
      class="text-[11px] font-semibold text-emerald-900"
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
