<script setup lang="ts">
// Chapter hub — replaces the legacy single-page workspace mount on
// /deliverables/[id]. Renders the chapter-level surface (overview
// header is owned by the page; this component focuses on section
// cards, compact chapter progress, and the Playbook-ready preview).
//
// Per-section editing happens on /deliverables/[id]/sections/[id]
// via DeliverableSectionWorkspace. This hub never opens the inline
// editor — it just routes to it.
//
// Posture (do not relax):
//   - no Firestore writes (read-only watcher only)
//   - no submit gate logic (lives on the parent page + ApprovalActions)
//   - no Playbook readiness change (still finalText-only)
//   - no AI calls
//   - no builder mounts
//   - no provisioning (hub does not create the output doc; the section
//     workspace handles that on first edit)
import { computed } from 'vue'
import { useDeliverableOutputs } from '~/composables/useDeliverableOutputs'
import type { Deliverable, Task } from '~/types/models'
import type { TemplateStudio, TemplateStudioSection } from '~/types/templateStudio'
import type { RequirementCoverageSummary } from '~/utils/requirementCoverage'
import {
  summarizeChapterProgress,
  type SectionProgress
} from '~/utils/deliverableOutputProgress'
import DeliverablePlaybookPreview from '~/components/DeliverablePlaybookPreview.vue'
import CSuiteAdvisorCard from '~/components/CSuiteAdvisorCard.vue'
import { getLikelyOwner } from '~/data/chapterOwners'

const props = defineProps<{
  deliverable: Deliverable
  studio: TemplateStudio
  // Page-level permission check. Hub itself is read-only, but we use
  // canEdit to color the empty-state copy on cards (e.g. "Start by
  // adding…" vs "No output has been started for this section yet.").
  canEdit: boolean
  // C-Suite Advisor V1 inputs. Threaded through from the chapter
  // page so the hub doesn't refetch tasks / requirement coverage.
  // Optional + defaulted so legacy callers (none today, but rollback
  // shape) keep working.
  relatedTasks?: Task[]
  relatedTasksLoading?: boolean
  requirementCoverage?: RequirementCoverageSummary | null
}>()

const outputs = useDeliverableOutputs()
const { data: output, loading } = outputs.watchOutput(() => props.deliverable.id)

const chapterProgress = computed(() =>
  summarizeChapterProgress(props.studio, output.value)
)

interface CardModel {
  section: TemplateStudioSection
  index: number
  progress: SectionProgress
  href: string
}

const cards = computed<CardModel[]>(() =>
  props.studio.sections.map((section, idx) => ({
    section,
    index: idx + 1,
    progress: chapterProgress.value.perSection[idx],
    href: `/deliverables/${props.deliverable.id}/sections/${section.id}`
  }))
)

// Likely-owner cue. Sourced from the canonical chapterOwners map
// (see app/data/chapterOwners.ts) so this and PlaybookWritingScaffold
// stay in sync — prior to Sprint 1B both components shipped their own
// 13-row map and disagreed on Ch 11. Display only; never overrides
// ownerUid / ownerEmail / approverUid on the deliverable itself.
const likelyOwner = computed<string>(() => getLikelyOwner(props.deliverable.id))

function fmtWhen(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
}
</script>

<template>
  <section class="space-y-4">
    <!-- Chapter overview / orientation -->
    <header class="card space-y-1">
      <p class="text-xs uppercase tracking-wide text-neutral-500">
        Chapter overview
      </p>
      <h2 class="text-lg font-semibold text-neutral-900">
        {{ studio.title }}
      </h2>
      <p class="text-sm text-neutral-700">
        Pick a section to work on. Each section opens a focused workspace with
        guidance, source notes, draft and final Playbook text, evidence, and
        any builder tools that apply. Save returns you here to see progress
        and the Playbook preview update.
      </p>
      <p class="text-xs text-neutral-600">
        <span class="font-medium text-neutral-700">Likely owner to push this next:</span>
        {{ likelyOwner }}.
      </p>
    </header>

    <!-- C-Suite Advisor V1 — deterministic operating signals.
         Read-only / display-only. Never persists, never creates
         tasks, never approves or submits. -->
    <CSuiteAdvisorCard
      :deliverable="deliverable"
      :studio="studio"
      :tasks="relatedTasks ?? []"
      :output="output"
      :requirement-coverage="requirementCoverage ?? null"
      :loading="(loading || relatedTasksLoading) === true"
    />

    <!-- Compact chapter progress (display-only). Submit gate lives
         elsewhere; these chips never affect submit eligibility or
         Playbook readiness. -->
    <section class="card space-y-1">
      <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
        Chapter progress
      </p>
      <p
        v-if="loading"
        class="text-xs text-neutral-500"
      >Loading progress…</p>
      <dl
        v-else
        class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-neutral-700 sm:grid-cols-4"
      >
        <div>
          <dt class="inline font-medium text-neutral-600">Final text</dt>
          <dd class="inline">
            : {{ chapterProgress.finalDone }}/{{ chapterProgress.totalSections }}
          </dd>
        </div>
        <div>
          <dt class="inline font-medium text-neutral-600">Draft</dt>
          <dd class="inline">
            : {{ chapterProgress.draftDone }}/{{ chapterProgress.totalSections }}
          </dd>
        </div>
        <div>
          <dt class="inline font-medium text-neutral-600">Your team's thinking</dt>
          <dd class="inline">
            : {{ chapterProgress.sourceNotesDone }}/{{ chapterProgress.totalSections }}
          </dd>
        </div>
        <div>
          <dt class="inline font-medium text-neutral-600">Evidence</dt>
          <dd class="inline">
            : {{ chapterProgress.evidenceCovered }}/{{ chapterProgress.totalSections }}
          </dd>
        </div>
        <div v-if="chapterProgress.marketBuilderEnabledTotal > 0">
          <dt class="inline font-medium text-neutral-600">Market Builder</dt>
          <dd class="inline">
            : {{ chapterProgress.marketBuilderEnabledStarted }}/{{ chapterProgress.marketBuilderEnabledTotal }}
          </dd>
        </div>
        <div v-if="chapterProgress.marketFitEnabledTotal > 0">
          <dt class="inline font-medium text-neutral-600">Market Fit</dt>
          <dd class="inline">
            : {{ chapterProgress.marketFitEnabledStarted }}/{{ chapterProgress.marketFitEnabledTotal }}
          </dd>
        </div>
        <div v-if="chapterProgress.brandFitEnabledTotal > 0">
          <dt class="inline font-medium text-neutral-600">Brand Fit</dt>
          <dd class="inline">
            : {{ chapterProgress.brandFitEnabledStarted }}/{{ chapterProgress.brandFitEnabledTotal }}
          </dd>
        </div>
        <div v-if="chapterProgress.pricingStrategyEnabledTotal > 0">
          <dt class="inline font-medium text-neutral-600">Pricing strategy</dt>
          <dd class="inline">
            : {{ chapterProgress.pricingStrategyEnabledStarted }}/{{ chapterProgress.pricingStrategyEnabledTotal }}
          </dd>
        </div>
        <div v-if="chapterProgress.needsAttention > 0">
          <dt class="inline font-medium text-amber-700">Needs attention</dt>
          <dd class="inline text-amber-700">
            : {{ chapterProgress.needsAttention }}
          </dd>
        </div>
      </dl>
      <p class="text-[11px] italic text-neutral-500">
        Display-only. Submit-for-review still depends only on required
        requirement-task coverage. Playbook readiness still depends only on
        finalText.
      </p>
    </section>

    <!-- Section cards -->
    <section v-if="!loading || cards.length" class="space-y-2">
      <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
        Sections of this chapter
      </p>
      <ol class="grid gap-3 md:grid-cols-2">
        <li
          v-for="card in cards"
          :key="card.section.id"
          class="card space-y-2"
        >
          <header class="space-y-0.5">
            <p class="text-xs uppercase tracking-wide text-neutral-500">
              Section {{ card.index }}
            </p>
            <h3 class="text-sm font-semibold text-neutral-900">
              {{ card.section.title }}
            </h3>
            <p
              v-if="card.section.lesson"
              class="text-xs text-neutral-700"
            >{{ card.section.lesson }}</p>
            <p
              v-if="card.progress.updatedAt"
              class="text-[11px] text-neutral-500"
            >
              Last saved {{ fmtWhen(card.progress.updatedAt) }}
            </p>
          </header>

          <!-- Status chips. Always rendered so card height is stable. -->
          <ul class="flex flex-wrap gap-1.5 text-[11px]">
            <li
              :class="[
                'rounded-full border px-2 py-0.5 uppercase tracking-wide',
                card.progress.hasFinal
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-neutral-300 bg-neutral-50 text-neutral-600'
              ]"
            >Final {{ card.progress.hasFinal ? '✓' : '—' }}</li>
            <li
              :class="[
                'rounded-full border px-2 py-0.5 uppercase tracking-wide',
                card.progress.hasDraft
                  ? 'border-sky-300 bg-sky-50 text-sky-800'
                  : 'border-neutral-300 bg-neutral-50 text-neutral-600'
              ]"
            >Draft {{ card.progress.hasDraft ? '✓' : '—' }}</li>
            <li
              :class="[
                'rounded-full border px-2 py-0.5 uppercase tracking-wide',
                card.progress.hasSourceNotes
                  ? 'border-sky-300 bg-sky-50 text-sky-800'
                  : 'border-neutral-300 bg-neutral-50 text-neutral-600'
              ]"
            >Notes {{ card.progress.hasSourceNotes ? '✓' : '—' }}</li>
            <li
              v-if="card.progress.evidenceCount > 0 || card.progress.structuredEvidenceCount > 0"
              class="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 uppercase tracking-wide text-emerald-800"
            >
              Evidence
              {{ card.progress.evidenceCount + card.progress.structuredEvidenceCount }}
            </li>
            <li
              v-if="card.progress.marketBuilderEnabled"
              :class="[
                'rounded-full border px-2 py-0.5 uppercase tracking-wide',
                card.progress.marketBuilderCount > 0
                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                  : 'border-neutral-300 bg-neutral-50 text-neutral-600'
              ]"
            >
              Market Builder
              {{ card.progress.marketBuilderCount > 0 ? '✓' : '—' }}
            </li>
            <li
              v-if="card.progress.marketFitEnabled"
              :class="[
                'rounded-full border px-2 py-0.5 uppercase tracking-wide',
                card.progress.marketFitStarted
                  ? 'border-violet-300 bg-violet-50 text-violet-800'
                  : 'border-neutral-300 bg-neutral-50 text-neutral-600'
              ]"
            >
              Market Fit
              {{ card.progress.marketFitStarted ? '✓' : '—' }}
            </li>
            <li
              v-if="card.progress.brandFitEnabled"
              :class="[
                'rounded-full border px-2 py-0.5 uppercase tracking-wide',
                card.progress.brandFitStarted
                  ? 'border-rose-300 bg-rose-50 text-rose-800'
                  : 'border-neutral-300 bg-neutral-50 text-neutral-600'
              ]"
            >
              Brand Fit
              {{ card.progress.brandFitStarted ? '✓' : '—' }}
            </li>
            <!-- Pricing Strategy chips. Display-only — never feeds the
                 submit gate or Playbook readiness. -->
            <li
              v-if="card.progress.pricingStrategyEnabled"
              :class="[
                'rounded-full border px-2 py-0.5 uppercase tracking-wide',
                card.progress.pricingStrategyStarted
                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                  : 'border-neutral-300 bg-neutral-50 text-neutral-600'
              ]"
            >
              Pricing
              {{ card.progress.pricingStrategyStarted ? '✓' : '—' }}
            </li>
            <li
              v-if="card.progress.pricingStrategyEnabled && card.progress.pricingStrategyPriceSet"
              class="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 uppercase tracking-wide text-emerald-800"
            >Price set</li>
            <li
              v-if="card.progress.pricingStrategyEnabled && card.progress.pricingStrategyMarginWarning"
              class="rounded-full border border-rose-300 bg-rose-50 px-2 py-0.5 uppercase tracking-wide text-rose-800"
            >Margin warning</li>
            <li
              v-if="card.progress.pricingStrategyEnabled && card.progress.pricingStrategyStarted && card.progress.pricingStrategyNeedsComps"
              class="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 uppercase tracking-wide text-amber-800"
            >Needs comps</li>
            <li
              v-if="card.progress.pricingStrategyEnabled && card.progress.pricingStrategyStarted && card.progress.pricingStrategyNeedsValidation"
              class="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 uppercase tracking-wide text-amber-800"
            >Needs validation</li>
            <li
              v-if="card.progress.needsAttention"
              class="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 uppercase tracking-wide text-amber-800"
            >Needs attention</li>
          </ul>

          <!-- Empty-state copy when nothing is started yet. -->
          <p
            v-if="!card.progress.hasSourceNotes && !card.progress.hasDraft && !card.progress.hasFinal"
            class="text-xs italic text-neutral-500"
          >
            <template v-if="canEdit">
              Start by adding the facts, observations, or source notes this
              section should use.
            </template>
            <template v-else>
              No output has been started for this section yet.
            </template>
          </p>
          <p
            v-else-if="!card.progress.hasFinal"
            class="text-xs italic text-neutral-500"
          >
            Final Playbook text has not been written yet. Use the section
            workspace to turn notes and builder work into a clean final
            version.
          </p>

          <NuxtLink
            :to="card.href"
            class="btn-primary inline-flex w-fit items-center text-xs"
          >Work on this section →</NuxtLink>
        </li>
      </ol>
    </section>

    <!-- Playbook-ready preview, extracted from the legacy workspace. -->
    <DeliverablePlaybookPreview
      :studio="studio"
      :output="output"
      :loading="loading"
    />
  </section>
</template>
