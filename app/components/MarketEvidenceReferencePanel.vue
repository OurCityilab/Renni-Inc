<script setup lang="ts">
// Read-only roll-up of Market Builder demand entries pulled from
// another chapter's deliverableOutputs document. Used by the Chapter 8
// "Demand assumptions from Chapter 7" reference panel and the Chapter
// 11 "Retail carry evidence from Chapters 7 and 8" panel. The component
// never mutates anything — it accepts already-flattened entries and
// renders them. All write paths stay in the owning workspace.
import type { MarketBuilderEntry } from '~/types/models'
import {
  SCENARIO_LABEL_COPY,
  confidenceTone,
  deriveBuyers,
  deriveRevenue,
  fmtCurrency,
  fmtNumber
} from '~/utils/marketBuilderMath'

export interface ReferencedMarketEntry {
  // Stable id of the section the entry was authored under in the source
  // chapter. Used as a v-for key plus a "From … · Section" breadcrumb
  // so the reference still names where each entry came from.
  sectionId: string
  sectionTitle: string
  entry: MarketBuilderEntry
}

defineProps<{
  // Source-chapter label rendered in the breadcrumb above each entry,
  // e.g. "Chapter 7" or "Chapter 7 · Pricing summary".
  sourceLabel: string
  entries: ReferencedMarketEntry[]
  loading: boolean
  emptyMessage: string
}>()
</script>

<template>
  <div>
    <p v-if="loading" class="text-xs text-neutral-500">Loading demand assumptions…</p>
    <p
      v-else-if="entries.length === 0"
      class="text-xs italic text-neutral-500"
    >
      {{ emptyMessage }}
    </p>
    <ul v-else class="space-y-2">
      <li
        v-for="row in entries"
        :key="`ref-market-${row.sectionId}-${row.entry.id}`"
        class="rounded-md border border-neutral-200 bg-white p-2 text-sm"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <p class="font-medium text-neutral-900">{{ row.entry.productName }}</p>
          <span
            v-if="row.entry.confidence"
            class="rounded-full border px-2 py-0.5 text-xs uppercase tracking-wide"
            :class="confidenceTone(row.entry.confidence)"
          >{{ row.entry.confidence }} confidence</span>
        </div>
        <p class="text-xs text-neutral-500">
          From {{ sourceLabel }} · {{ row.sectionTitle }}
        </p>
        <dl class="mt-1 space-y-0.5 text-xs text-neutral-700">
          <div v-if="row.entry.primaryMarket">
            <dt class="inline font-medium text-neutral-600">Primary market:</dt> {{ row.entry.primaryMarket }}
          </div>
        </dl>
        <ul
          v-if="(row.entry.scenarios?.length ?? 0) > 0"
          class="mt-1 space-y-0.5 text-xs text-neutral-700"
        >
          <li
            v-for="scn in row.entry.scenarios"
            :key="`ref-scn-${row.entry.id}-${scn.id}`"
          >
            <span class="font-medium text-neutral-600">
              {{ SCENARIO_LABEL_COPY[scn.label] }}:
            </span>
            {{ fmtNumber(deriveBuyers(scn)) }} buyers ·
            {{ fmtCurrency(deriveRevenue(scn)) }} revenue
          </li>
        </ul>
        <p v-if="row.entry.strongestEvidence" class="mt-1 text-xs text-neutral-700">
          <span class="font-medium text-neutral-600">Strongest evidence:</span>
          {{ row.entry.strongestEvidence }}
        </p>
        <p v-if="row.entry.weakestAssumption" class="text-xs text-neutral-700">
          <span class="font-medium text-neutral-600">Weakest assumption:</span>
          {{ row.entry.weakestAssumption }}
        </p>
        <p v-if="row.entry.nextValidation" class="text-xs text-neutral-700">
          <span class="font-medium text-neutral-600">Next validation:</span>
          {{ row.entry.nextValidation }}
        </p>
      </li>
    </ul>
  </div>
</template>
