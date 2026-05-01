<script setup lang="ts">
// Read-only preview for saved local builder state. This component never
// writes, never approves, never submits, and never turns builder rows
// into final Playbook text automatically. It only makes saved rows
// visible to reviewers beside the student's final narrative.
import type { DeliverableOutputBuilderState } from '~/types/models'
import type { TemplateStudioSection } from '~/types/templateStudio'

const props = defineProps<{
  section: TemplateStudioSection
  builderState?: DeliverableOutputBuilderState | null
}>()

type Row = Record<string, string>

function rowsHaveContent(rows: Row[]): boolean {
  return rows.some((row) =>
    Object.values(row).some((value) => String(value ?? '').trim().length > 0)
  )
}

const universalRows = computed<Row[]>(
  () => props.builderState?.universalTable?.rows ?? []
)
const retailRows = computed<Row[]>(
  () => props.builderState?.retailPitch?.rows ?? []
)
const hasUniversalRows = computed<boolean>(() => rowsHaveContent(universalRows.value))
const hasRetailRows = computed<boolean>(() => rowsHaveContent(retailRows.value))
const displayUniversalRows = computed<Row[]>(() =>
  universalRows.value.filter((row) =>
    Object.values(row).some((value) => String(value ?? '').trim().length > 0)
  )
)
const displayRetailRows = computed<Row[]>(() =>
  retailRows.value.filter((row) =>
    Object.values(row).some((value) => String(value ?? '').trim().length > 0)
  )
)

const retailFields = computed(() => {
  const cfg = props.section.retailPitch
  if (!cfg?.enabled) return []
  return [
    { key: 'buyer', label: 'Buyer', show: cfg.includeBuyer },
    { key: 'productSku', label: 'Product / SKU', show: cfg.includeProductSku },
    { key: 'shelfFit', label: 'Shelf fit', show: cfg.includeShelfFit },
    { key: 'priceMargin', label: 'Price / margin logic', show: cfg.includePriceMargin },
    { key: 'proof', label: 'Proof', show: cfg.includeProof },
    { key: 'readiness', label: 'Readiness', show: cfg.includeReadiness },
    { key: 'ask', label: 'Ask', show: cfg.includeAsk },
    { key: 'risk', label: 'Risk', show: cfg.includeRisk },
    { key: 'nextStep', label: 'Next step', show: cfg.includeNextStep }
  ].filter((field) => field.show)
})
</script>

<template>
  <div
    v-if="hasUniversalRows || hasRetailRows"
    class="mt-2 space-y-2 text-xs"
  >
    <div v-if="hasUniversalRows && section.universalTable?.enabled">
      <p class="font-medium uppercase tracking-wide text-neutral-500">
        Saved table rows
      </p>
      <div class="mt-1 overflow-x-auto rounded border border-neutral-200">
        <table class="min-w-full divide-y divide-neutral-200 bg-white text-left">
          <thead class="bg-neutral-50 text-[11px] uppercase tracking-wide text-neutral-600">
            <tr>
              <th
                v-for="col in section.universalTable.columns"
                :key="col.key"
                class="px-2 py-1 font-semibold"
              >
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 text-neutral-700">
            <tr
              v-for="(row, idx) in displayUniversalRows"
              :key="`saved-universal-${idx}`"
            >
              <td
                v-for="col in section.universalTable.columns"
                :key="`${idx}-${col.key}`"
                class="px-2 py-1 align-top"
              >
                {{ row[col.key] || '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="hasRetailRows && section.retailPitch?.enabled">
      <p class="font-medium uppercase tracking-wide text-neutral-500">
        Saved retail pitch cards
      </p>
      <ul class="mt-1 space-y-1.5">
        <li
          v-for="(row, idx) in displayRetailRows"
          :key="`saved-retail-${idx}`"
          class="rounded border border-neutral-200 bg-neutral-50 p-2"
        >
          <p class="font-medium text-neutral-900">
            {{ row.buyer || `Pitch card ${idx + 1}` }}
          </p>
          <dl class="mt-1 grid gap-1 sm:grid-cols-2">
            <template
              v-for="field in retailFields"
              :key="field.key"
            >
              <div v-if="field.key !== 'buyer' && row[field.key]">
                <dt class="font-medium text-neutral-600">{{ field.label }}</dt>
                <dd class="text-neutral-800">{{ row[field.key] }}</dd>
              </div>
            </template>
          </dl>
        </li>
      </ul>
    </div>
  </div>
</template>
