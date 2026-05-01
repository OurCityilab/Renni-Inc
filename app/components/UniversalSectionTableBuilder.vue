<!--
  UniversalSectionTableBuilder — Pass A reusable copy-only table.
  Drives any TemplateStudioSection that opts in via
  `section.universalTable: { enabled, kind, title, columns, ... }`.

  POSTURE (do not relax)
  ----------------------
    - Pure UI + clipboard. Local component state only. No Firestore
      imports, no direct writes, no AI calls, no /api/* requests, no
      automatic Working-Draft writes. The parent workspace may persist
      row state through the existing section Save button.
    - The builder helps the student build the answer. It does NOT
      submit, approve, or save the final section — that's still
      the existing Working Draft + Save flow.
    - Append-only behavior on row mutations. Add, remove, clear all
      are explicit student actions; nothing happens silently.
    - Optional product autocomplete via HTML5 <datalist>: the input
      remains free text. Selecting a suggestion fills the bound
      input with the chosen string and never auto-fills any other
      field.
-->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import BuilderHandoffCallout from '~/components/BuilderHandoffCallout.vue'
import type {
  CopyOnlyBuilderColumn,
  UniversalTableBuilderConfig
} from '~/types/templateStudio'

type Row = Record<string, string>

const props = defineProps<{
  config: UniversalTableBuilderConfig
  productOptions?: string[]
  initialRows?: Row[]
}>()
const emit = defineEmits<{
  'update:rows': [rows: Row[]]
}>()

const config = computed<UniversalTableBuilderConfig>(() => props.config)

function emptyRow(): Row {
  const row: Row = {}
  for (const col of config.value.columns) {
    if (col.type === 'select' && col.options && col.options.length) {
      row[col.key] = col.options[0]
    } else {
      row[col.key] = ''
    }
  }
  return row
}

function seedRows(): Row[] {
  if (props.initialRows && props.initialRows.length) {
    return props.initialRows.map((r) => ({ ...emptyRow(), ...r }))
  }
  if (config.value.starterRows && config.value.starterRows.length) {
    return config.value.starterRows.map((r) => ({ ...emptyRow(), ...r }))
  }
  const n = Math.max(1, config.value.starterRowCount ?? 3)
  return Array.from({ length: n }, () => emptyRow())
}

const rows = reactive<Row[]>(seedRows())
const copyButtonLabel = ref<string>('Copy table')

function snapshotRows(): Row[] {
  return rows.map((r) => ({ ...r }))
}

function emitRows(): void {
  emit('update:rows', snapshotRows())
}

function addRow(): void {
  rows.push(emptyRow())
  emitRows()
}

function removeRow(idx: number): void {
  rows.splice(idx, 1)
  if (rows.length === 0) addRow()
  else emitRows()
}

function clearAll(): void {
  rows.splice(0, rows.length)
  const n = Math.max(1, config.value.starterRowCount ?? 3)
  for (let i = 0; i < n; i++) addRow()
  emitRows()
}

function rowIsBlank(row: Row): boolean {
  return Object.values(row).every((v) => !String(v ?? '').trim())
}

const datalistId = computed<string>(
  () => `usbtb-products-${config.value.kind}`
)

function shouldAttachDatalist(col: CopyOnlyBuilderColumn): boolean {
  return Boolean(col.productAutocomplete && (props.productOptions?.length ?? 0) > 0)
}

function buildMarkdown(): string {
  const cols = config.value.columns
  const header = `| ${cols.map((c) => c.label).join(' | ')} |`
  const sep = `| ${cols.map(() => '---').join(' | ')} |`
  const visible = rows.filter((r) => !rowIsBlank(r))
  const body =
    visible.length === 0
      ? `| ${cols.map(() => '___').join(' | ')} |`
      : visible
          .map((r) => {
            const cells = cols.map((c) => {
              const v = (r[c.key] ?? '').trim()
              return v || '—'
            })
            return `| ${cells.join(' | ')} |`
          })
          .join('\n')
  const lead = config.value.copyTitle ? `### ${config.value.copyTitle}\n\n` : ''
  return `${lead}${header}\n${sep}\n${body}`
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
    class="rounded-lg border border-sky-300 bg-sky-50/30 p-4 text-sm shadow-sm flex flex-col gap-4 min-w-0"
    aria-label="Universal Section Table Builder"
  >
    <header class="space-y-1">
      <p class="text-[11px] uppercase tracking-wide text-sky-800">
        Builder
      </p>
      <h3 class="text-base font-semibold text-sky-900">
        {{ config.title }}
      </h3>
      <p v-if="config.intro" class="text-xs text-sky-900">{{ config.intro }}</p>
      <p
        v-if="config.evidencePrompt"
        class="text-[11px] italic text-sky-900"
      >
        {{ config.evidencePrompt }}
      </p>
    </header>

    <BuilderHandoffCallout />

    <p
      class="rounded border border-sky-200 bg-white p-2 text-[11px] italic text-neutral-700"
    >
      This table helps you build the answer. It does not submit,
      approve, or save the final section for you. The section Save
      button keeps these rows for next time.
    </p>

    <!-- Shared product-name datalist (rendered once when enabled). -->
    <datalist
      v-if="(productOptions?.length ?? 0) > 0"
      :id="datalistId"
    >
      <option v-for="opt in productOptions" :key="opt" :value="opt" />
    </datalist>

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
                :list="shouldAttachDatalist(col) ? datalistId : undefined"
                class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs"
                @input="emitRows"
              />
            </template>
            <template v-else-if="col.type === 'number'">
              <input
                v-model="row[col.key]"
                type="text"
                inputmode="decimal"
                :placeholder="col.placeholder"
                class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs"
                @input="emitRows"
              />
            </template>
            <template v-else-if="col.type === 'select'">
              <select
                v-model="row[col.key]"
                class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs"
                @change="emitRows"
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
            <template v-else-if="col.type === 'textarea'">
              <textarea
                v-model="row[col.key]"
                :placeholder="col.placeholder"
                rows="2"
                class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs"
                @input="emitRows"
              />
            </template>
          </label>
        </div>
      </article>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="rounded border border-sky-400 bg-white px-2 py-1 text-xs font-medium text-sky-900 hover:bg-sky-100"
        @click="addRow"
      >
        + Add row
      </button>
      <button
        type="button"
        class="rounded border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100"
        @click="clearAll"
      >
        Clear all
      </button>
    </div>

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
          Copy this output into Working Draft, edit it in your own
          words, then save with the existing Save button below.
        </span>
      </div>
    </div>
  </section>
</template>
