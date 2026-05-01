<script setup lang="ts">
// Read-only Playbook-ready preview, extracted from the legacy
// DeliverableOutputWorkspace so the chapter hub can render the same
// roll-up without instantiating the full workspace. Mirrors the
// legacy preview semantics:
//   - per-section final text (or italic empty-state placeholder)
//   - evidence links (label + url + type)
//   - structured evidence entries (claim, evidence, source, risk,
//     next validation, confidence chip)
//   - market builder demand entries (likely buyer, market size,
//     scenarios, strongest evidence, weakest assumption, validation)
//   - market fit summary (target profile, primary market, positioning,
//     scenario snapshot, source gap, etc.)
//   - brand fit summary (brand signal, target match, references,
//     production risk, recommended adjustment, next best move)
//
// Pure display: no Firestore reads, no save, no AI calls.
import type {
  DeliverableOutput,
  DeliverableOutputSection
} from '~/types/models'
import type {
  TemplateStudio,
  TemplateStudioSection
} from '~/types/templateStudio'
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

const props = defineProps<{
  studio: TemplateStudio
  output: DeliverableOutput | null
  loading?: boolean
}>()

function persistedSection(s: TemplateStudioSection): DeliverableOutputSection | null {
  return props.output?.sections?.[s.id] ?? null
}
function persistedMarketFit(s: TemplateStudioSection) {
  return persistedSection(s)?.marketFit ?? null
}
function persistedBrandFit(s: TemplateStudioSection) {
  return persistedSection(s)?.brandFit ?? null
}
function persistedPricingStrategy(s: TemplateStudioSection) {
  return persistedSection(s)?.pricingStrategy ?? null
}
function pricingDerivedFor(s: TemplateStudioSection) {
  return computePricingDerived(persistedPricingStrategy(s))
}
function pricingCompFor(s: TemplateStudioSection) {
  return interpretPricingCompPosition(persistedPricingStrategy(s))
}
function pricingAnalysisFor(s: TemplateStudioSection) {
  return analyzePricingComps(persistedPricingStrategy(s))
}
function pricingSegmentFor(s: TemplateStudioSection) {
  return interpretPricingSegment(persistedPricingStrategy(s))
}
function pricingCompsWithUrls(s: TemplateStudioSection) {
  const ps = persistedPricingStrategy(s)
  if (!ps?.comparablePrices?.length) return []
  return ps.comparablePrices
    .map((c) => ({ ...c, _safeUrl: safePricingCompUrl(c.url) }))
    .filter((c) => c._safeUrl)
}
</script>

<template>
  <section class="card space-y-3">
    <header>
      <p class="text-xs uppercase tracking-wide text-neutral-500">
        Playbook-ready preview
      </p>
      <h3 class="font-medium text-neutral-900">{{ studio.title }}</h3>
      <p class="text-xs text-neutral-600">
        Read-only roll-up of the final Playbook text from each section. This is
        what your team is preparing for the Brand &amp; Operations Playbook.
      </p>
    </header>

    <p v-if="loading" class="text-xs text-neutral-500">Loading preview…</p>

    <ol v-else class="space-y-3">
      <li
        v-for="s in studio.sections"
        :key="`preview-${s.id}`"
        class="rounded-md border border-neutral-200 p-3"
      >
        <p class="text-sm font-medium text-neutral-900">{{ s.title }}</p>
        <p
          v-if="(persistedSection(s)?.finalText ?? '').trim()"
          class="mt-1 whitespace-pre-wrap text-sm text-neutral-800"
        >{{ persistedSection(s)!.finalText }}</p>
        <p v-else class="mt-1 text-xs italic text-neutral-500">
          Final Playbook text has not been written yet. Use the section workspace
          to turn notes and builder work into a clean final version.
        </p>

        <SavedBuilderStatePreview
          :section="s"
          :builder-state="persistedSection(s)?.builderState"
        />

        <ul
          v-if="(persistedSection(s)?.evidenceLinks?.length ?? 0) > 0"
          class="mt-2 space-y-0.5 text-xs"
        >
          <li
            v-for="link in persistedSection(s)!.evidenceLinks"
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
          v-if="(persistedSection(s)?.structuredEvidence?.length ?? 0) > 0"
          class="mt-2 space-y-1.5"
        >
          <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Evidence
          </p>
          <ul class="space-y-1.5 text-xs">
            <li
              v-for="entry in persistedSection(s)!.structuredEvidence"
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
          v-if="s.marketBuilder?.enabled && (persistedSection(s)?.marketBuilderEntries?.length ?? 0) > 0"
          class="mt-2 space-y-1.5"
        >
          <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Demand estimate
          </p>
          <ul class="space-y-1.5 text-xs">
            <li
              v-for="entry in persistedSection(s)!.marketBuilderEntries"
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
          v-if="s.marketFit?.enabled && persistedMarketFit(s)"
          class="mt-2 space-y-1 text-xs"
        >
          <p class="font-medium uppercase tracking-wide text-neutral-500">
            Market fit
          </p>
          <p
            v-if="(persistedMarketFit(s)!.productFacts?.productName || '').trim() ||
                  (persistedMarketFit(s)!.productFacts?.price != null)"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Product:</span>
            {{ persistedMarketFit(s)!.productFacts?.productName || '—' }}
            <span v-if="persistedMarketFit(s)!.productFacts?.price != null">
              · {{ fmtCurrency(persistedMarketFit(s)!.productFacts!.price ?? null) }}
            </span>
          </p>
          <p
            v-if="(persistedMarketFit(s)!.recommendation?.likelyPrimaryMarket || '').trim()"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Primary market:</span>
            {{ persistedMarketFit(s)!.recommendation!.likelyPrimaryMarket }}
            <span v-if="(persistedMarketFit(s)!.recommendation?.likelySecondaryMarket || '').trim()">
              · secondary: {{ persistedMarketFit(s)!.recommendation!.likelySecondaryMarket }}
            </span>
          </p>
          <p
            v-if="(persistedMarketFit(s)!.recommendation?.launchOrValidationMarket || '').trim()"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Launch / validation market:</span>
            {{ persistedMarketFit(s)!.recommendation!.launchOrValidationMarket }}
          </p>
          <p
            v-if="(persistedMarketFit(s)!.recommendation?.positioningSummary || '').trim()"
            class="whitespace-pre-wrap text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Positioning:</span>
            {{ persistedMarketFit(s)!.recommendation!.positioningSummary }}
          </p>
          <p
            v-if="(persistedMarketFit(s)!.recommendation?.strongestEvidence || '').trim()"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Strongest evidence:</span>
            {{ persistedMarketFit(s)!.recommendation!.strongestEvidence }}
          </p>
          <p
            v-if="(persistedMarketFit(s)!.recommendation?.weakestAssumption || '').trim()"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Weakest assumption:</span>
            {{ persistedMarketFit(s)!.recommendation!.weakestAssumption }}
          </p>
          <p
            v-if="(persistedMarketFit(s)!.recommendation?.recommendedNextValidation || '').trim()"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Next validation:</span>
            {{ persistedMarketFit(s)!.recommendation!.recommendedNextValidation }}
          </p>
          <template v-if="buildDemandSnapshot(persistedMarketFit(s))">
            <p class="text-neutral-700">
              <span class="font-medium text-neutral-600">Selected segment:</span>
              {{ buildDemandSnapshot(persistedMarketFit(s))!.segmentName }}
            </p>
            <p
              v-if="buildDemandSnapshot(persistedMarketFit(s))!.targetProfile"
              class="text-neutral-700"
            >
              <span class="font-medium text-neutral-600">Target profile:</span>
              {{ buildDemandSnapshot(persistedMarketFit(s))!.targetProfile }}
            </p>
            <p
              v-if="buildDemandSnapshot(persistedMarketFit(s))!.baseBuyers != null
                    || buildDemandSnapshot(persistedMarketFit(s))!.baseRevenue != null"
              class="text-neutral-700"
            >
              <span class="font-medium text-neutral-600">Base scenario:</span>
              {{ fmtNumber(buildDemandSnapshot(persistedMarketFit(s))!.baseBuyers) }} buyers ·
              {{ fmtCurrency(buildDemandSnapshot(persistedMarketFit(s))!.baseRevenue) }} revenue
            </p>
            <p
              v-if="buildDemandSnapshot(persistedMarketFit(s))!.tradeoff"
              class="text-neutral-700"
            >
              <span class="font-medium text-neutral-600">Key tradeoff:</span>
              {{ buildDemandSnapshot(persistedMarketFit(s))!.tradeoff }}
            </p>
          </template>
        </div>

        <!-- Brand Fit roll-up -->
        <div
          v-if="s.brandFit?.enabled && buildBrandFitSnapshot(persistedBrandFit(s))"
          class="mt-2 space-y-1 text-xs"
        >
          <p class="font-medium uppercase tracking-wide text-neutral-500">
            Brand fit
          </p>
          <p
            v-if="buildBrandFitSnapshot(persistedBrandFit(s))!.brandSignal"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Brand signal:</span>
            {{ buildBrandFitSnapshot(persistedBrandFit(s))!.brandSignal }}
          </p>
          <p
            v-if="buildBrandFitSnapshot(persistedBrandFit(s))!.targetCustomerMatch"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Target match:</span>
            {{ buildBrandFitSnapshot(persistedBrandFit(s))!.targetCustomerMatch }}
          </p>
          <p
            v-if="buildBrandFitSnapshot(persistedBrandFit(s))!.strongestReference"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Strongest reference:</span>
            {{ buildBrandFitSnapshot(persistedBrandFit(s))!.strongestReference }}
          </p>
          <p
            v-if="buildBrandFitSnapshot(persistedBrandFit(s))!.recommendedAdjustment"
            class="whitespace-pre-wrap text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Recommended adjustment:</span>
            {{ buildBrandFitSnapshot(persistedBrandFit(s))!.recommendedAdjustment }}
          </p>
          <p
            v-if="buildBrandFitSnapshot(persistedBrandFit(s))!.nextBestMove"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Next best move:</span>
            {{ buildBrandFitSnapshot(persistedBrandFit(s))!.nextBestMove }}
          </p>
        </div>

        <!-- Pricing Strategy roll-up (Ch. 8 Section 2 only). Compact
             read-only summary of the pricing strategy builder state.
             Pure display — never replaces finalText, never gates
             Playbook readiness, never writes to pricingScenarios. -->
        <div
          v-if="s.pricingStrategy?.enabled && persistedPricingStrategy(s)"
          class="mt-2 space-y-1 text-xs"
        >
          <p class="font-medium uppercase tracking-wide text-neutral-500">
            Pricing strategy
          </p>
          <p
            v-if="(persistedPricingStrategy(s)!.productName || '').trim()"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Product:</span>
            {{ persistedPricingStrategy(s)!.productName }}
          </p>
          <p
            v-if="persistedPricingStrategy(s)!.proposedPrice != null"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Proposed price:</span>
            ${{ fmtPricingMoney(persistedPricingStrategy(s)!.proposedPrice) }}
          </p>
          <p class="text-neutral-700">
            <span class="font-medium text-neutral-600">Total unit cost:</span>
            ${{ fmtPricingMoney(pricingDerivedFor(s).totalUnitCost) }}
          </p>
          <p
            v-if="pricingDerivedFor(s).unitMargin != null"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Unit margin:</span>
            <span :class="pricingDerivedFor(s).belowCost ? 'text-rose-700 font-medium' : ''">
              ${{ fmtPricingMoney(pricingDerivedFor(s).unitMargin) }}
            </span>
          </p>
          <p
            v-if="pricingDerivedFor(s).grossMarginPct != null"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Gross margin:</span>
            {{ fmtPricingPct(pricingDerivedFor(s).grossMarginPct) }}
          </p>
          <p
            v-if="pricingDerivedFor(s).breakEvenUnits != null"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Break-even:</span>
            {{ fmtPricingUnits(pricingDerivedFor(s).breakEvenUnits) }} units
          </p>
          <p
            v-if="pricingDerivedFor(s).targetMarginPrice != null"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Target-margin price:</span>
            ${{ fmtPricingMoney(pricingDerivedFor(s).targetMarginPrice) }}
          </p>
          <p
            v-if="pricingCompFor(s).min != null && pricingCompFor(s).max != null"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Comp range:</span>
            ${{ fmtPricingMoney(pricingCompFor(s).min) }}–${{ fmtPricingMoney(pricingCompFor(s).max) }}
            <span v-if="pricingCompFor(s).median != null">
              · median ${{ fmtPricingMoney(pricingCompFor(s).median) }}
            </span>
          </p>
          <p class="text-neutral-700">
            <span class="font-medium text-neutral-600">Comp evidence:</span>
            {{ pricingAnalysisFor(s).evidence.label }}
            ({{ pricingAnalysisFor(s).evidence.validCompCount }})
          </p>
          <p
            v-if="pricingCompFor(s).band !== 'needs_evidence'"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Price position:</span>
            {{ pricingCompFor(s).label }}
          </p>
          <p
            v-if="(persistedPricingStrategy(s)!.targetSegment || '').trim()"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Best-fit segment:</span>
            {{ pricingSegmentFor(s).label }}
          </p>
          <p
            v-if="persistedPricingStrategy(s)!.confidence"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Confidence:</span>
            {{ persistedPricingStrategy(s)!.confidence }}
          </p>
          <p
            v-if="(persistedPricingStrategy(s)!.validationStep || '').trim()"
            class="text-neutral-700"
          >
            <span class="font-medium text-neutral-600">Validation step:</span>
            {{ persistedPricingStrategy(s)!.validationStep }}
          </p>
          <!-- V1.1 — render student-supplied source links if any. Pure
               display; URLs are filtered through safeCompUrl so non
               http/https schemes never reach an <a href>. -->
          <ul
            v-if="pricingCompsWithUrls(s).length > 0"
            class="space-y-0.5"
          >
            <li
              v-for="c in pricingCompsWithUrls(s)"
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
