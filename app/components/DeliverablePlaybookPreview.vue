<script setup lang="ts">
// Shared read-only Playbook preview component.
//
// Uses `normalizeDeliverablePreview` to decide what content text to show
// per section (final-only vs. fallback chain) and what fallback /
// missing-section label to surface. Builder rollups (Market Builder,
// Market Fit, Brand Fit, Pricing Strategy), evidence links, and
// structured evidence are rendered from the persisted section payload
// the normalizer carries through, so the rich review surface stays
// intact across all preview modes.
//
// Pure display:
//   - no Firestore reads, no save, no AI calls
//   - never mutates the output object
//   - never copies draftText into finalText
//   - never changes output readiness or approval semantics
import { computed } from 'vue'
import type {
  Deliverable,
  DeliverableOutput,
  DeliverableOutputSection
} from '~/types/models'
import type {
  TemplateStudio,
  TemplateStudioSection
} from '~/types/templateStudio'
import {
  normalizeDeliverablePreview,
  type NormalizedPreviewSection,
  type PreviewMode
} from '~/utils/playbookPreview'
import {
  SCENARIO_LABEL_COPY,
  confidenceTone,
  deriveBuyers,
  deriveRevenue,
  fmtCurrency,
  fmtNumber
} from '~/utils/marketBuilderMath'
import { buildDemandSnapshot } from '~/utils/marketFitNarrative'
import { buildBrandFitSnapshot } from '~/utils/brandFitNarrative'
import {
  analyzeComps as analyzePricingComps,
  computeDerived as computePricingDerived,
  formatMoney as fmtPricingMoney,
  formatPct as fmtPricingPct,
  formatUnits as fmtPricingUnits,
  interpretCompPosition as interpretPricingCompPosition,
  interpretSegment as interpretPricingSegment,
  safeCompUrl as safePricingCompUrl
} from '~/utils/pricingStrategyMath'

const props = withDefaults(
  defineProps<{
    studio: TemplateStudio
    output: DeliverableOutput | null
    loading?: boolean
    // Preview mode. Defaults to 'final' so legacy mounts (chapter hub,
    // approved-state playbook expansion) keep their existing strict
    // final-text behavior. Pass 'current' to enable the fallback chain
    // (finalText → draftText → sourceNotes → missing) for in-flight
    // work. 'export' mirrors current but is used by export adapters
    // for the same fallback semantics.
    mode?: PreviewMode
    // Optional deliverable summary, used for the heading metadata when
    // the renderer is mounted outside the chapter hub.
    deliverable?: Pick<Deliverable, 'id' | 'title' | 'chapter' | 'status'>
    showEvidence?: boolean
    showStructuredEvidence?: boolean
    showMissingSections?: boolean
    showBuilders?: boolean
    compact?: boolean
  }>(),
  {
    loading: false,
    mode: 'final',
    deliverable: undefined,
    showEvidence: true,
    showStructuredEvidence: true,
    showMissingSections: true,
    showBuilders: true,
    compact: false
  }
)

// The studio's actual section objects (with marketFit/marketBuilder/
// brandFit/pricingStrategy enable flags) are needed for the rich
// rollups. Index them by id so each normalized section can look up its
// studio counterpart without an O(N²) scan.
const studioSectionById = computed<Record<string, TemplateStudioSection>>(() => {
  const out: Record<string, TemplateStudioSection> = {}
  for (const s of props.studio.sections) out[s.id] = s
  return out
})

const preview = computed(() => {
  const fallbackDeliverable: Pick<
    Deliverable,
    'id' | 'title' | 'chapter' | 'status'
  > = props.deliverable ?? {
    id: props.output?.deliverableId ?? '',
    title: props.studio.title,
    chapter: 0,
    status: 'draft'
  }
  return normalizeDeliverablePreview({
    deliverable: fallbackDeliverable,
    studio: props.studio,
    output: props.output,
    mode: props.mode
  })
})

function persistedFor(section: NormalizedPreviewSection): DeliverableOutputSection | null {
  return section.persistedSection
}
function studioForSection(section: NormalizedPreviewSection): TemplateStudioSection | null {
  return studioSectionById.value[section.sectionId] ?? null
}
function pricingDerivedFor(section: NormalizedPreviewSection) {
  return computePricingDerived(persistedFor(section)?.pricingStrategy ?? null)
}
function pricingCompFor(section: NormalizedPreviewSection) {
  return interpretPricingCompPosition(persistedFor(section)?.pricingStrategy ?? null)
}
function pricingAnalysisFor(section: NormalizedPreviewSection) {
  return analyzePricingComps(persistedFor(section)?.pricingStrategy ?? null)
}
function pricingSegmentFor(section: NormalizedPreviewSection) {
  return interpretPricingSegment(persistedFor(section)?.pricingStrategy ?? null)
}
function pricingCompsWithUrls(section: NormalizedPreviewSection) {
  const ps = persistedFor(section)?.pricingStrategy
  if (!ps?.comparablePrices?.length) return []
  return ps.comparablePrices
    .map((c) => ({ ...c, _safeUrl: safePricingCompUrl(c.url) }))
    .filter((c) => c._safeUrl)
}

const headerCopy = computed<string>(() => {
  if (props.mode === 'final') {
    return 'Read-only roll-up of the final Playbook text from each section. This is what your team is preparing for the Brand & Operations Playbook.'
  }
  return 'Read-only preview of the current saved state. Where final Playbook text is missing, draft text and source notes are shown so reviewers can see what is in flight. This is not the approved final Playbook.'
})
</script>

<template>
  <section class="card space-y-3">
    <header>
      <p class="text-xs uppercase tracking-wide text-neutral-500">
        {{ preview.modeLabel }}
      </p>
      <h3 class="font-medium text-neutral-900">{{ preview.title }}</h3>
      <p class="text-xs text-neutral-600">{{ headerCopy }}</p>
      <p
        v-if="preview.totalSections > 0"
        class="mt-1 text-[11px] text-neutral-500"
      >
        {{ preview.sectionsWithFinalText }} of {{ preview.totalSections }} sections have final Playbook text<span v-if="preview.sectionsWithFallback > 0">
          · {{ preview.sectionsWithFallback }} showing fallback content
        </span><span v-if="preview.sectionsMissing > 0">
          · {{ preview.sectionsMissing }} still missing
        </span>.
      </p>
    </header>

    <p v-if="loading" class="text-xs text-neutral-500">Loading preview…</p>

    <ol v-else class="space-y-3">
      <li
        v-for="section in preview.sections"
        :key="`preview-${section.sectionId}`"
        class="rounded-md border border-neutral-200 p-3"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <p class="text-sm font-medium text-neutral-900">{{ section.title }}</p>
          <span
            v-if="!section.isMissing && section.contentSource !== 'finalText'"
            class="rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-amber-800"
          >{{ section.contentSourceLabel }}</span>
          <span
            v-else-if="section.contentSource === 'finalText'"
            class="rounded-full border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-emerald-800"
          >{{ section.contentSourceLabel }}</span>
        </div>

        <p
          v-if="!section.isMissing"
          class="mt-1 whitespace-pre-wrap text-sm text-neutral-800"
        >{{ section.content }}</p>

        <p
          v-else-if="showMissingSections"
          class="mt-1 text-xs italic text-neutral-500"
        >
          <template v-if="mode === 'final'">
            Missing final Playbook text. Use the section workspace to turn
            notes and builder work into a clean final version.
          </template>
          <template v-else>
            {{ section.missingLabel }}
          </template>
        </p>

        <p
          v-if="!section.isMissing && section.contentSource !== 'finalText' && showMissingSections"
          class="mt-1 text-[11px] italic text-amber-800"
        >{{ section.missingLabel }}</p>

        <SavedBuilderStatePreview
          v-if="showBuilders && persistedFor(section) && studioForSection(section)"
          :section="studioForSection(section)!"
          :builder-state="persistedFor(section)!.builderState"
        />

        <ul
          v-if="showEvidence && section.evidenceLinks.length > 0"
          class="mt-2 space-y-0.5 text-xs"
        >
          <li
            v-for="link in section.evidenceLinks"
            :key="`preview-link-${link.id}`"
          >
            ↳
            <a
              :href="link.url"
              target="_blank"
              rel="noopener"
              class="text-phoenix-700 hover:underline"
            >{{ link.label }}</a>
            <span class="ml-1 uppercase tracking-wide text-neutral-500">
              {{ link.type }}
            </span>
          </li>
        </ul>

        <!-- Structured evidence -->
        <div
          v-if="showStructuredEvidence && section.structuredEvidence.length > 0"
          class="mt-2 space-y-1.5"
        >
          <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Evidence
          </p>
          <ul class="space-y-1.5 text-xs">
            <li
              v-for="entry in section.structuredEvidence"
              :key="`preview-evidence-${entry.id}`"
              class="rounded border border-neutral-200 bg-neutral-50 p-2"
            >
              <div class="flex flex-wrap items-baseline justify-between gap-2">
                <p class="font-medium text-neutral-900">{{ entry.claim }}</p>
                <span
                  v-if="entry.confidence"
                  class="rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wide"
                  :class="confidenceTone(entry.confidence)"
                >{{ entry.confidence }}</span>
              </div>
              <p class="text-neutral-700">
                <span class="font-medium text-neutral-600">Evidence:</span>
                {{ entry.evidence }}
              </p>
              <p class="text-neutral-700">
                <span class="font-medium text-neutral-600">Source:</span>
                {{ entry.source }}
              </p>
              <p v-if="entry.risk" class="text-neutral-700">
                <span class="font-medium text-neutral-600">Risk:</span>
                {{ entry.risk }}
              </p>
              <p v-if="entry.nextValidation" class="text-neutral-700">
                <span class="font-medium text-neutral-600">Next validation:</span>
                {{ entry.nextValidation }}
              </p>
            </li>
          </ul>
        </div>

        <!-- Market Builder demand entries -->
        <div
          v-if="showBuilders && studioForSection(section)?.marketBuilder?.enabled
            && (persistedFor(section)?.marketBuilderEntries?.length ?? 0) > 0"
          class="mt-2 space-y-1.5"
        >
          <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Demand estimate
          </p>
          <ul class="space-y-1.5 text-xs">
            <li
              v-for="entry in persistedFor(section)!.marketBuilderEntries"
              :key="`preview-market-${entry.id}`"
              class="rounded border border-neutral-200 bg-neutral-50 p-2"
            >
              <div class="flex flex-wrap items-baseline justify-between gap-2">
                <p class="font-medium text-neutral-900">{{ entry.productName }}</p>
                <span
                  v-if="entry.confidence"
                  class="rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wide"
                  :class="confidenceTone(entry.confidence)"
                >{{ entry.confidence }}</span>
              </div>
              <p
                v-if="entry.primaryMarket || entry.secondaryMarket"
                class="text-neutral-700"
              >
                <span class="font-medium text-neutral-600">Likely buyer:</span>
                {{ entry.primaryMarket || '—' }}
                <span v-if="entry.secondaryMarket"> · also {{ entry.secondaryMarket }}</span>
              </p>
              <p
                v-if="entry.schoolMarketSize != null || entry.broaderMarketSize != null"
                class="text-neutral-700"
              >
                <span class="font-medium text-neutral-600">Market size:</span>
                <span v-if="entry.schoolMarketSize != null">school {{ fmtNumber(entry.schoolMarketSize) }}</span>
                <span v-if="entry.schoolMarketSize != null && entry.broaderMarketSize != null"> · </span>
                <span v-if="entry.broaderMarketSize != null">broader {{ fmtNumber(entry.broaderMarketSize) }}</span>
              </p>
              <ul
                v-if="(entry.scenarios?.length ?? 0) > 0"
                class="mt-1 space-y-0.5"
              >
                <li
                  v-for="scn in entry.scenarios"
                  :key="`preview-market-${entry.id}-${scn.id}`"
                  class="text-neutral-700"
                >
                  <span class="font-medium text-neutral-600">
                    {{ SCENARIO_LABEL_COPY[scn.label] }}:
                  </span>
                  {{ fmtNumber(deriveBuyers(scn)) }} buyers ·
                  {{ fmtCurrency(deriveRevenue(scn)) }} revenue
                </li>
              </ul>
              <p v-if="entry.strongestEvidence" class="mt-1 text-neutral-700">
                <span class="font-medium text-neutral-600">Strongest evidence:</span>
                {{ entry.strongestEvidence }}
              </p>
              <p v-if="entry.weakestAssumption" class="text-neutral-700">
                <span class="font-medium text-neutral-600">Weakest assumption:</span>
                {{ entry.weakestAssumption }}
              </p>
              <p v-if="entry.nextValidation" class="text-neutral-700">
                <span class="font-medium text-neutral-600">Next validation:</span>
                {{ entry.nextValidation }}
              </p>
            </li>
          </ul>
        </div>

        <!-- Market Fit roll-up -->
        <div
          v-if="showBuilders && studioForSection(section)?.marketFit?.enabled
            && persistedFor(section)?.marketFit"
          class="mt-2 space-y-1 text-xs"
        >
          <p class="font-medium uppercase tracking-wide text-neutral-500">
            Market fit
          </p>
          <p
            v-if="(persistedFor(section)!.marketFit!.productFacts?.productName || '').trim()
              || (persistedFor(section)!.marketFit!.productFacts?.price != null)"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Product:</span>
            {{ persistedFor(section)!.marketFit!.productFacts?.productName || '—' }}
            <span v-if="persistedFor(section)!.marketFit!.productFacts?.price != null">
              · {{ fmtCurrency(persistedFor(section)!.marketFit!.productFacts!.price ?? null) }}
            </span>
          </p>
          <p
            v-if="(persistedFor(section)!.marketFit!.recommendation?.likelyPrimaryMarket || '').trim()"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Primary market:</span>
            {{ persistedFor(section)!.marketFit!.recommendation!.likelyPrimaryMarket }}
            <span v-if="(persistedFor(section)!.marketFit!.recommendation?.likelySecondaryMarket || '').trim()">
              · secondary: {{ persistedFor(section)!.marketFit!.recommendation!.likelySecondaryMarket }}
            </span>
          </p>
          <p
            v-if="(persistedFor(section)!.marketFit!.recommendation?.launchOrValidationMarket || '').trim()"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Launch / validation market:</span>
            {{ persistedFor(section)!.marketFit!.recommendation!.launchOrValidationMarket }}
          </p>
          <p
            v-if="(persistedFor(section)!.marketFit!.recommendation?.positioningSummary || '').trim()"
            class="whitespace-pre-wrap text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Positioning:</span>
            {{ persistedFor(section)!.marketFit!.recommendation!.positioningSummary }}
          </p>
          <p
            v-if="(persistedFor(section)!.marketFit!.recommendation?.strongestEvidence || '').trim()"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Strongest evidence:</span>
            {{ persistedFor(section)!.marketFit!.recommendation!.strongestEvidence }}
          </p>
          <p
            v-if="(persistedFor(section)!.marketFit!.recommendation?.weakestAssumption || '').trim()"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Weakest assumption:</span>
            {{ persistedFor(section)!.marketFit!.recommendation!.weakestAssumption }}
          </p>
          <p
            v-if="(persistedFor(section)!.marketFit!.recommendation?.recommendedNextValidation || '').trim()"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Next validation:</span>
            {{ persistedFor(section)!.marketFit!.recommendation!.recommendedNextValidation }}
          </p>
          <template v-if="buildDemandSnapshot(persistedFor(section)!.marketFit ?? null)">
            <p class="text-neutral-700">
              <span class="font-medium text-neutral-600">Selected segment:</span>
              {{ buildDemandSnapshot(persistedFor(section)!.marketFit ?? null)!.segmentName }}
            </p>
            <p
              v-if="buildDemandSnapshot(persistedFor(section)!.marketFit ?? null)!.targetProfile"
              class="text-neutral-700"
            >
              <span class="font-medium text-neutral-600">Target profile:</span>
              {{ buildDemandSnapshot(persistedFor(section)!.marketFit ?? null)!.targetProfile }}
            </p>
            <p
              v-if="buildDemandSnapshot(persistedFor(section)!.marketFit ?? null)!.baseBuyers != null
                || buildDemandSnapshot(persistedFor(section)!.marketFit ?? null)!.baseRevenue != null"
              class="text-neutral-700"
            >
              <span class="font-medium text-neutral-600">Base scenario:</span>
              {{ fmtNumber(buildDemandSnapshot(persistedFor(section)!.marketFit ?? null)!.baseBuyers) }} buyers ·
              {{ fmtCurrency(buildDemandSnapshot(persistedFor(section)!.marketFit ?? null)!.baseRevenue) }} revenue
            </p>
            <p
              v-if="buildDemandSnapshot(persistedFor(section)!.marketFit ?? null)!.tradeoff"
              class="text-neutral-700"
            >
              <span class="font-medium text-neutral-600">Key tradeoff:</span>
              {{ buildDemandSnapshot(persistedFor(section)!.marketFit ?? null)!.tradeoff }}
            </p>
          </template>
        </div>

        <!-- Brand Fit roll-up -->
        <div
          v-if="showBuilders && studioForSection(section)?.brandFit?.enabled
            && buildBrandFitSnapshot(persistedFor(section)?.brandFit ?? null)"
          class="mt-2 space-y-1 text-xs"
        >
          <p class="font-medium uppercase tracking-wide text-neutral-500">
            Brand fit
          </p>
          <p
            v-if="buildBrandFitSnapshot(persistedFor(section)?.brandFit ?? null)!.brandSignal"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Brand signal:</span>
            {{ buildBrandFitSnapshot(persistedFor(section)?.brandFit ?? null)!.brandSignal }}
          </p>
          <p
            v-if="buildBrandFitSnapshot(persistedFor(section)?.brandFit ?? null)!.targetCustomerMatch"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Target match:</span>
            {{ buildBrandFitSnapshot(persistedFor(section)?.brandFit ?? null)!.targetCustomerMatch }}
          </p>
          <p
            v-if="buildBrandFitSnapshot(persistedFor(section)?.brandFit ?? null)!.strongestReference"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Strongest reference:</span>
            {{ buildBrandFitSnapshot(persistedFor(section)?.brandFit ?? null)!.strongestReference }}
          </p>
          <p
            v-if="buildBrandFitSnapshot(persistedFor(section)?.brandFit ?? null)!.recommendedAdjustment"
            class="whitespace-pre-wrap text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Recommended adjustment:</span>
            {{ buildBrandFitSnapshot(persistedFor(section)?.brandFit ?? null)!.recommendedAdjustment }}
          </p>
          <p
            v-if="buildBrandFitSnapshot(persistedFor(section)?.brandFit ?? null)!.nextBestMove"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Next best move:</span>
            {{ buildBrandFitSnapshot(persistedFor(section)?.brandFit ?? null)!.nextBestMove }}
          </p>
        </div>

        <!-- Pricing Strategy roll-up (Ch. 8 Section 2 only). -->
        <div
          v-if="showBuilders && studioForSection(section)?.pricingStrategy?.enabled
            && persistedFor(section)?.pricingStrategy"
          class="mt-2 space-y-1 text-xs"
        >
          <p class="font-medium uppercase tracking-wide text-neutral-500">
            Pricing strategy
          </p>
          <p
            v-if="(persistedFor(section)!.pricingStrategy!.productName || '').trim()"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Product:</span>
            {{ persistedFor(section)!.pricingStrategy!.productName }}
          </p>
          <p
            v-if="persistedFor(section)!.pricingStrategy!.proposedPrice != null"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Proposed price:</span>
            ${{ fmtPricingMoney(persistedFor(section)!.pricingStrategy!.proposedPrice) }}
          </p>
          <p class="text-neutral-700">
            <span class="font-medium text-neutral-600">Total unit cost:</span>
            ${{ fmtPricingMoney(pricingDerivedFor(section).totalUnitCost) }}
          </p>
          <p
            v-if="pricingDerivedFor(section).unitMargin != null"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Unit margin:</span>
            <span :class="pricingDerivedFor(section).belowCost ? 'text-rose-700 font-medium' : ''">
              ${{ fmtPricingMoney(pricingDerivedFor(section).unitMargin) }}
            </span>
          </p>
          <p
            v-if="pricingDerivedFor(section).grossMarginPct != null"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Gross margin:</span>
            {{ fmtPricingPct(pricingDerivedFor(section).grossMarginPct) }}
          </p>
          <p
            v-if="pricingDerivedFor(section).breakEvenUnits != null"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Break-even:</span>
            {{ fmtPricingUnits(pricingDerivedFor(section).breakEvenUnits) }} units
          </p>
          <p
            v-if="pricingDerivedFor(section).targetMarginPrice != null"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Target-margin price:</span>
            ${{ fmtPricingMoney(pricingDerivedFor(section).targetMarginPrice) }}
          </p>
          <p
            v-if="pricingCompFor(section).min != null && pricingCompFor(section).max != null"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Comp range:</span>
            ${{ fmtPricingMoney(pricingCompFor(section).min) }}–${{ fmtPricingMoney(pricingCompFor(section).max) }}
            <span v-if="pricingCompFor(section).median != null">
              · median ${{ fmtPricingMoney(pricingCompFor(section).median) }}
            </span>
          </p>
          <p class="text-neutral-700">
            <span class="font-medium text-neutral-600">Comp evidence:</span>
            {{ pricingAnalysisFor(section).evidence.label }}
            ({{ pricingAnalysisFor(section).evidence.validCompCount }})
          </p>
          <p
            v-if="pricingCompFor(section).band !== 'needs_evidence'"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Price position:</span>
            {{ pricingCompFor(section).label }}
          </p>
          <p
            v-if="(persistedFor(section)!.pricingStrategy!.targetSegment || '').trim()"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Best-fit segment:</span>
            {{ pricingSegmentFor(section).label }}
          </p>
          <p
            v-if="persistedFor(section)!.pricingStrategy!.confidence"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Confidence:</span>
            {{ persistedFor(section)!.pricingStrategy!.confidence }}
          </p>
          <p
            v-if="(persistedFor(section)!.pricingStrategy!.validationStep || '').trim()"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Validation step:</span>
            {{ persistedFor(section)!.pricingStrategy!.validationStep }}
          </p>
          <ul
            v-if="pricingCompsWithUrls(section).length > 0"
            class="space-y-0.5"
          >
            <li
              v-for="c in pricingCompsWithUrls(section)"
              :key="`pricing-comp-link-${c.id}`"
              class="text-neutral-700"
            >
              ↳
              <a
                :href="c._safeUrl ?? undefined"
                target="_blank"
                rel="noopener noreferrer"
                class="text-phoenix-700 hover:underline"
              >{{ c.name || 'Comparable source' }}</a>
              <span v-if="c.price != null"> · ${{ fmtPricingMoney(c.price) }}</span>
              <span v-if="c.sourceName"> · {{ c.sourceName }}</span>
            </li>
          </ul>
        </div>
      </li>
    </ol>
  </section>
</template>
