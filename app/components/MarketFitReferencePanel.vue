<script setup lang="ts">
// Read-only roll-up of Market Fit Builder snapshots pulled from
// another chapter's deliverableOutputs document. Used by the Chapter 8
// "Demand model from Chapter 7" panel and the Chapter 11 "Carry
// readiness" panel. The component never mutates anything — it accepts
// already-flattened rows and renders them. All write paths stay in
// MarketFitBuilder.vue.
import type { MarketFitBuilder } from '~/types/models'
import {
  fmtCurrency,
  fmtNumber
} from '~/utils/marketBuilderMath'
import {
  detectSourceGap,
  findStrongestCompType,
  selectedSegment,
  selectedSegmentRows
} from '~/utils/marketFitNarrative'

export interface ReferencedMarketFitRow {
  // Stable id of the source chapter's section, used as a v-for key
  // and shown in the breadcrumb.
  sourceLabel: string
  sectionId: string
  sectionTitle: string
  fit: MarketFitBuilder
}

defineProps<{
  rows: ReferencedMarketFitRow[]
  loading: boolean
  emptyMessage: string
}>()
</script>

<template>
  <div>
    <p v-if="loading" class="text-xs text-neutral-500">Loading market fit data…</p>
    <p
      v-else-if="rows.length === 0"
      class="text-xs italic text-neutral-500"
    >{{ emptyMessage }}</p>
    <ul v-else class="space-y-2">
      <li
        v-for="row in rows"
        :key="`mfit-ref-${row.sectionId}`"
        class="rounded-md border border-neutral-200 bg-white p-2 text-sm"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <p class="font-medium text-neutral-900">
            {{ row.fit.productFacts?.productName?.trim() || 'Untitled product' }}
            <span
              v-if="row.fit.productFacts?.price != null"
              class="ml-1 text-neutral-500"
            >· {{ fmtCurrency(row.fit.productFacts.price ?? null) }}</span>
          </p>
          <span class="text-xs text-neutral-500">
            From {{ row.sourceLabel }} · {{ row.sectionTitle }}
          </span>
        </div>
        <dl class="mt-1 space-y-0.5 text-xs text-neutral-700">
          <div v-if="selectedSegment(row.fit)">
            <dt class="inline font-medium text-neutral-600">Selected segment:</dt>
            {{ selectedSegment(row.fit)?.name?.trim() || 'Unnamed segment' }}
            <span
              v-if="selectedSegment(row.fit)?.roleInStrategy"
              class="ml-1 text-neutral-500"
            >· role: {{ selectedSegment(row.fit)!.roleInStrategy!.replace(/_/g, ' ') }}</span>
          </div>
          <div v-if="selectedSegment(row.fit)?.profile?.profileName?.trim()">
            <dt class="inline font-medium text-neutral-600">Target profile:</dt>
            {{ selectedSegment(row.fit)!.profile!.profileName }}
          </div>
          <div v-if="selectedSegment(row.fit)?.reachableAudience != null">
            <dt class="inline font-medium text-neutral-600">Reachable audience:</dt>
            {{ fmtNumber(selectedSegment(row.fit)!.reachableAudience ?? null) }}
          </div>
          <div v-if="findStrongestCompType(row.fit.comparables)">
            <dt class="inline font-medium text-neutral-600">Strongest comp type:</dt>
            {{ findStrongestCompType(row.fit.comparables)!.label.toLowerCase() }}
            ({{ findStrongestCompType(row.fit.comparables)!.strongCount }} strong of
            {{ findStrongestCompType(row.fit.comparables)!.totalCount }})
          </div>
          <div v-if="detectSourceGap(row.fit.evidenceRequests).hasGap">
            <dt class="inline font-medium text-neutral-600">Source gap:</dt>
            <template v-if="detectSourceGap(row.fit.evidenceRequests).noRequestsAtAll">
              no evidence requests logged yet
            </template>
            <template v-else>
              {{ detectSourceGap(row.fit.evidenceRequests).openRequests.length }}
              open
            </template>
          </div>
        </dl>
        <table
          v-if="selectedSegmentRows(row.fit)"
          class="mt-1 min-w-full text-xs"
        >
          <thead>
            <tr class="text-left text-neutral-500">
              <th class="py-0.5 pr-2 font-medium">Scenario</th>
              <th class="py-0.5 pr-2 font-medium">Buyers</th>
              <th class="py-0.5 pr-2 font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="r in selectedSegmentRows(row.fit) ?? []"
              :key="`mfit-ref-row-${row.sectionId}-${r.level}`"
            >
              <td class="py-0.5 pr-2 font-medium capitalize text-neutral-700">{{ r.level }}</td>
              <td class="py-0.5 pr-2 text-neutral-800">{{ fmtNumber(r.buyers) }}</td>
              <td class="py-0.5 pr-2 font-medium text-neutral-900">{{ fmtCurrency(r.revenue) }}</td>
            </tr>
          </tbody>
        </table>
        <p
          v-if="(row.fit.recommendation?.strongestEvidence || '').trim()"
          class="mt-1 text-xs text-neutral-700"
        >
          <span class="font-medium text-neutral-600">Strongest evidence:</span>
          {{ row.fit.recommendation!.strongestEvidence }}
        </p>
        <p
          v-if="(row.fit.recommendation?.weakestAssumption || '').trim()"
          class="text-xs text-neutral-700"
        >
          <span class="font-medium text-neutral-600">Weakest assumption:</span>
          {{ row.fit.recommendation!.weakestAssumption }}
        </p>
        <p
          v-if="(row.fit.recommendation?.recommendedNextValidation || '').trim()"
          class="text-xs text-neutral-700"
        >
          <span class="font-medium text-neutral-600">Next validation:</span>
          {{ row.fit.recommendation!.recommendedNextValidation }}
        </p>
      </li>
    </ul>
  </div>
</template>
