<!--
  UniversalChecklistBuilder — Pass A reusable copy-only checklist /
  SOP. Drives any TemplateStudioSection that opts in via
  `section.universalChecklist: { enabled, kind, title, rows?, ... }`.

  POSTURE (do not relax)
  ----------------------
    - Pure UI + clipboard. Local component state only. No Firestore
      writes, no AI calls, no save handler.
    - The student fills the checklist, copies markdown, and pastes
      into Working Draft.
    - Field set is configurable via `config.fields`. When omitted,
      every supported field column renders.
-->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import BuilderHandoffCallout from '~/components/BuilderHandoffCallout.vue'
import type {
  UniversalChecklistBuilderConfig,
  UniversalChecklistBuilderField,
  UniversalChecklistBuilderRow
} from '~/types/templateStudio'

const props = defineProps<{
  config: UniversalChecklistBuilderConfig
}>()

const config = computed<UniversalChecklistBuilderConfig>(() => props.config)

const ALL_FIELDS: readonly UniversalChecklistBuilderField[] = [
  'owner',
  'due',
  'status',
  'materials',
  'backup',
  'doneSignal',
  'risk',
  'nextStep'
] as const

const STATUS_OPTIONS: readonly string[] = [
  'Not started',
  'In progress',
  'Ready',
  'Blocked'
] as const

const FIELD_LABELS: Record<UniversalChecklistBuilderField, string> = {
  owner: 'Owner',
  due: 'Due',
  status: 'Status',
  materials: 'Materials',
  backup: 'Backup',
  doneSignal: 'Done signal',
  risk: 'Risk',
  nextStep: 'Next step'
}

const visibleFields = computed<readonly UniversalChecklistBuilderField[]>(() => {
  if (config.value.fields && config.value.fields.length) return config.value.fields
  return ALL_FIELDS
})

function emptyRow(): UniversalChecklistBuilderRow {
  return {
    label: '',
    owner: '',
    due: '',
    status: 'Not started',
    materials: '',
    backup: '',
    doneSignal: '',
    risk: '',
    nextStep: ''
  }
}

function seedRows(): UniversalChecklistBuilderRow[] {
  if (config.value.rows && config.value.rows.length) {
    return config.value.rows.map((r) => ({ ...emptyRow(), ...r }))
  }
  return [emptyRow(), emptyRow(), emptyRow()]
}

const rows = reactive<UniversalChecklistBuilderRow[]>(seedRows())
const copyButtonLabel = ref<string>('Copy checklist')

function addRow(): void {
  rows.push(emptyRow())
}

function removeRow(idx: number): void {
  rows.splice(idx, 1)
  if (rows.length === 0) addRow()
}

function clearAll(): void {
  rows.splice(0, rows.length, emptyRow(), emptyRow(), emptyRow())
}

function rowIsBlank(row: UniversalChecklistBuilderRow): boolean {
  return (
    !row.label?.trim() &&
    !row.owner?.trim() &&
    !row.due?.trim() &&
    !row.materials?.trim() &&
    !row.backup?.trim() &&
    !row.doneSignal?.trim() &&
    !row.risk?.trim() &&
    !row.nextStep?.trim()
  )
}

function cellValue(
  row: UniversalChecklistBuilderRow,
  field: UniversalChecklistBuilderField
): string {
  const v = row[field]
  return typeof v === 'string' ? v : ''
}

function buildMarkdown(): string {
  const headers = ['Item', ...visibleFields.value.map((f) => FIELD_LABELS[f])]
  const header = `| ${headers.join(' | ')} |`
  const sep = `| ${headers.map(() => '---').join(' | ')} |`
  const visible = rows.filter((r) => !rowIsBlank(r))
  const body =
    visible.length === 0
      ? `| ${headers.map(() => '___').join(' | ')} |`
      : visible
          .map((r) => {
            const cells = [
              (r.label ?? '').trim() || '—',
              ...visibleFields.value.map((f) => {
                const v = cellValue(r, f).trim()
                return v || '—'
              })
            ]
            return `| ${cells.join(' | ')} |`
          })
          .join('\n')
  const lead = config.value.copyTitle ? `### ${config.value.copyTitle}\n\n` : ''
  return `${lead}${header}\n${sep}\n${body}`
}

async function copyChecklist(): Promise<void> {
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
        copyButtonLabel.value = 'Copy checklist'
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
    aria-label="Universal Checklist Builder"
  >
    <header class="space-y-1">
      <p class="text-[11px] uppercase tracking-wide text-emerald-800">
        Builder
      </p>
      <h3 class="text-base font-semibold text-emerald-900">
        {{ config.title }}
      </h3>
      <p v-if="config.intro" class="text-xs text-emerald-900">{{ config.intro }}</p>
    </header>

    <BuilderHandoffCallout />

    <p
      class="rounded border border-emerald-200 bg-white p-2 text-[11px] italic text-neutral-700"
    >
      This checklist helps you build the answer. It does not submit,
      approve, or save the final section for you.
    </p>

    <div class="space-y-3">
      <article
        v-for="(row, idx) in rows"
        :key="idx"
        class="rounded border border-stone-200 bg-white p-3"
      >
        <header class="mb-2 flex items-baseline justify-between gap-2">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-stone-700">
            Item {{ idx + 1 }}
          </p>
          <button
            type="button"
            class="text-[11px] text-stone-500 hover:text-rose-700"
            @click="removeRow(idx)"
          >
            Remove
          </button>
        </header>

        <label class="block text-[11px] text-stone-700">
          <span class="font-semibold uppercase tracking-wide">Item</span>
          <input
            v-model="row.label"
            type="text"
            placeholder="What is this step / task / item?"
            class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs"
          />
        </label>

        <div class="mt-2 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          <template v-for="field in visibleFields" :key="field">
            <label class="block text-[11px] text-stone-700">
              <span class="font-semibold uppercase tracking-wide">{{ FIELD_LABELS[field] }}</span>
              <select
                v-if="field === 'status'"
                v-model="row.status"
                class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs"
              >
                <option v-for="opt in STATUS_OPTIONS" :key="opt" :value="opt">
                  {{ opt }}
                </option>
              </select>
              <input
                v-else
                :value="cellValue(row, field)"
                type="text"
                :placeholder="
                  field === 'due' ? 'e.g., before launch · 2026-05-12'
                  : field === 'owner' ? 'role / name'
                  : field === 'materials' ? 'what is needed'
                  : field === 'backup' ? 'who covers if owner is out'
                  : field === 'doneSignal' ? 'what proves it is done'
                  : field === 'risk' ? 'what could go wrong'
                  : field === 'nextStep' ? 'next concrete move'
                  : ''
                "
                class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs"
                @input="(e) => { row[field as 'owner'|'due'|'materials'|'backup'|'doneSignal'|'risk'|'nextStep'] = (e.target as HTMLInputElement).value }"
              />
            </label>
          </template>
        </div>
      </article>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="rounded border border-emerald-400 bg-white px-2 py-1 text-xs font-medium text-emerald-900 hover:bg-emerald-100"
        @click="addRow"
      >
        + Add item
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
          @click="copyChecklist"
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
