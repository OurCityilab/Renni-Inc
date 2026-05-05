<script setup lang="ts">
// Intelligence Sync panel — pure display-only "what to gather next"
// surface. Reuses the existing read-only data flow (deliverables /
// tasks / outputs already loaded by the parent page) and renders
// gather-next issues from generateIntelligenceSyncIssues().
//
// Posture (do not relax):
//   - read-only / display-only — never persists, never calls AI
//   - never gates submit, never affects Playbook readiness
//   - copy-only AI coach prompt per issue; no in-app API call
//   - student-friendly chips matched to the advisor display
//     vocabulary so chiefs see consistent words across surfaces

import { computed, ref } from 'vue'
import type {
  Deliverable,
  DeliverableOutput,
  Task
} from '~/types/models'
import { getTemplateStudioForDeliverable } from '~/data/templateStudios'
import {
  generateIntelligenceSyncIssues,
  SYNC_SEVERITY_CHIP_CLASS,
  SYNC_SEVERITY_LABEL,
  SYNC_SOURCE_LABEL
} from '~/utils/intelligenceSync'
import type { IntelligenceSyncIssue } from '~/types/intelligence'
import {
  aggregateAdvisorSignals,
  type AggregatedAdvisorSignal
} from '~/utils/cSuiteAdvisor'

const props = defineProps<{
  deliverables: Deliverable[]
  tasks: Task[]
  outputs: Record<string, DeliverableOutput | null>
  // Optional pre-aggregated advisor signals. When the caller already
  // computed signals (cockpit, presentation-readiness page), pass
  // them in so we don't aggregate twice.
  advisorSignals?: AggregatedAdvisorSignal[]
  loading?: boolean
}>()

// When the caller doesn't pass signals, generate them locally so the
// presentation-readiness rule still has the input it needs.
const effectiveSignals = computed<AggregatedAdvisorSignal[]>(() => {
  if (props.advisorSignals) return props.advisorSignals
  return aggregateAdvisorSignals({
    deliverables: props.deliverables,
    tasks: props.tasks,
    outputs: props.outputs,
    studioResolver: (d) => getTemplateStudioForDeliverable(d)
  })
})

const issues = computed<IntelligenceSyncIssue[]>(() =>
  generateIntelligenceSyncIssues({
    deliverables: props.deliverables,
    tasks: props.tasks,
    outputs: props.outputs,
    studioResolver: (d) => getTemplateStudioForDeliverable(d),
    advisorSignals: effectiveSignals.value
  })
)

const topThree = computed<IntelligenceSyncIssue[]>(() =>
  issues.value.slice(0, 3)
)
const remaining = computed<IntelligenceSyncIssue[]>(() =>
  issues.value.slice(3)
)

// Local clipboard helper — same pattern the export center uses.
const copiedKey = ref<string | null>(null)
async function copy(key: string, content: string) {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return
  try {
    await navigator.clipboard.writeText(content)
    copiedKey.value = key
    setTimeout(() => {
      if (copiedKey.value === key) copiedKey.value = null
    }, 1500)
  } catch {
    // Best-effort. Students can still select the textarea content.
  }
}
</script>

<template>
  <section class="card space-y-2 border-violet-200 bg-violet-50/30">
    <header class="space-y-0.5">
      <p class="text-xs font-semibold uppercase tracking-wide text-violet-700">
        Intelligence Sync
      </p>
      <h3 class="text-base font-semibold text-neutral-900">
        What to gather next so the analysis means something
      </h3>
      <p class="text-xs text-neutral-700">
        Read-only deterministic checks across Ch. 7 segment → Ch. 8 pricing →
        Ch. 10 campaign → Ch. 11 carry → presentation readiness.
      </p>
      <p class="text-[11px] italic text-neutral-700">
        This is a checklist, not a grade. Submit-for-review and Playbook
        readiness are unchanged — the only signal here that actually affects
        submit-for-review is required-task coverage in the C-Suite Advisor.
      </p>
      <p class="text-[11px] italic text-neutral-500">
        AI coach prompts here are copy-only. The system of record is
        student-authored work in Renni Command Center. AI can coach and ask
        questions, but it cannot approve, submit, or invent missing evidence.
      </p>
    </header>

    <p v-if="loading" class="text-xs italic text-neutral-500">
      Loading sync gaps…
    </p>

    <p
      v-else-if="issues.length === 0"
      class="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-900"
    >
      No major sync gaps found. Keep checking source notes, evidence quality,
      and final presentation readiness.
    </p>

    <template v-else>
      <!-- Top three issues — first one always expanded so chiefs
           open on the highest-priority gather-next. -->
      <article
        v-for="(issue, idx) in topThree"
        :key="`sync-top-${issue.id}`"
        class="rounded-md border border-neutral-300 bg-white text-xs"
      >
        <details :open="idx === 0" class="group">
          <summary class="cursor-pointer space-y-1 p-2">
            <div class="flex flex-wrap items-center gap-1.5">
              <span
                class="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide"
                :class="SYNC_SEVERITY_CHIP_CLASS[issue.severity]"
              >{{ SYNC_SEVERITY_LABEL[issue.severity] }}</span>
              <span class="rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-violet-800">
                Owner · {{ issue.owner }}
              </span>
              <span class="rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-neutral-700">
                {{ SYNC_SOURCE_LABEL[issue.source] }}
              </span>
              <NuxtLink
                v-if="issue.route"
                :to="issue.route"
                class="ml-auto text-[10px] text-phoenix-700 hover:underline"
              >Open chapter →</NuxtLink>
            </div>
            <p class="text-neutral-900">
              <span class="font-medium">{{ issue.title }}.</span>
              {{ issue.nextAction }}
            </p>
          </summary>
          <div class="space-y-2 border-t border-neutral-200 p-2">
            <p class="text-neutral-700">{{ issue.summary }}</p>
            <div v-if="issue.whatToGather.length" class="space-y-0.5">
              <p class="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                What to gather
              </p>
              <ul class="ml-4 list-disc space-y-0.5 text-neutral-800">
                <li v-for="(w, i) in issue.whatToGather" :key="`g-${issue.id}-${i}`">{{ w }}</li>
              </ul>
            </div>
            <p class="text-neutral-700">
              <span class="font-medium text-neutral-600">Why it matters:</span>
              {{ issue.whyItMatters }}
            </p>
            <p
              v-if="(issue.helpFrom?.length ?? 0) > 0"
              class="text-neutral-700"
            >
              <span class="font-medium text-neutral-600">Help from:</span>
              {{ issue.helpFrom!.join(' · ') }}
            </p>
            <p class="text-neutral-700">
              <span class="font-medium text-neutral-600">Done looks like:</span>
              {{ issue.doneLooksLike }}
            </p>
            <details class="rounded border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-900">
              <summary class="cursor-pointer font-semibold">
                Prompt for AI coach (copy-only)
              </summary>
              <p class="my-1 italic">
                Copy this into Claude / ChatGPT externally. Renni Command Center never sends this anywhere.
              </p>
              <textarea
                readonly
                rows="6"
                class="w-full rounded border border-amber-200 bg-white p-1.5 font-mono text-[10px] leading-snug"
                :value="issue.aiCoachPrompt"
              />
              <button
                type="button"
                class="mt-1 rounded border border-amber-300 bg-white px-2 py-0.5 text-[11px] font-medium text-amber-900 hover:bg-amber-100"
                @click="copy(`coach-${issue.id}`, issue.aiCoachPrompt)"
              >{{ copiedKey === `coach-${issue.id}` ? 'Copied ✓' : 'Copy prompt' }}</button>
            </details>
          </div>
        </details>
      </article>

      <details
        v-if="remaining.length > 0"
        class="rounded-md border border-neutral-200 bg-white"
      >
        <summary class="cursor-pointer p-2 text-xs font-medium text-neutral-700">
          More to gather ({{ remaining.length }})
        </summary>
        <ul class="space-y-1 border-t border-neutral-200 p-2 text-xs">
          <li
            v-for="issue in remaining"
            :key="`sync-more-${issue.id}`"
          >
            <details class="rounded-md border border-neutral-200 bg-neutral-50">
              <summary class="cursor-pointer space-y-1 p-2">
                <div class="flex flex-wrap items-center gap-1.5">
                  <span
                    class="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide"
                    :class="SYNC_SEVERITY_CHIP_CLASS[issue.severity]"
                  >{{ SYNC_SEVERITY_LABEL[issue.severity] }}</span>
                  <span class="rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-violet-800">
                    {{ issue.owner }}
                  </span>
                  <span class="rounded-full border border-neutral-300 bg-white px-2 py-0.5 text-[10px] uppercase tracking-wide text-neutral-700">
                    {{ SYNC_SOURCE_LABEL[issue.source] }}
                  </span>
                </div>
                <p class="text-neutral-900">
                  <span class="font-medium">{{ issue.title }}.</span>
                  {{ issue.nextAction }}
                </p>
              </summary>
              <div class="space-y-1 border-t border-neutral-200 p-2">
                <p class="text-neutral-700">{{ issue.summary }}</p>
                <ul
                  v-if="issue.whatToGather.length"
                  class="ml-4 list-disc space-y-0.5 text-neutral-800"
                >
                  <li v-for="(w, i) in issue.whatToGather" :key="`gm-${issue.id}-${i}`">{{ w }}</li>
                </ul>
                <p class="text-neutral-700">
                  <span class="font-medium text-neutral-600">Why it matters:</span>
                  {{ issue.whyItMatters }}
                </p>
                <p class="text-neutral-700">
                  <span class="font-medium text-neutral-600">Done looks like:</span>
                  {{ issue.doneLooksLike }}
                </p>
                <details class="rounded border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-900">
                  <summary class="cursor-pointer font-semibold">
                    Prompt for AI coach (copy-only)
                  </summary>
                  <textarea
                    readonly
                    rows="6"
                    class="mt-1 w-full rounded border border-amber-200 bg-white p-1.5 font-mono text-[10px] leading-snug"
                    :value="issue.aiCoachPrompt"
                  />
                  <button
                    type="button"
                    class="mt-1 rounded border border-amber-300 bg-white px-2 py-0.5 text-[11px] font-medium text-amber-900 hover:bg-amber-100"
                    @click="copy(`coach-${issue.id}`, issue.aiCoachPrompt)"
                  >{{ copiedKey === `coach-${issue.id}` ? 'Copied ✓' : 'Copy prompt' }}</button>
                </details>
              </div>
            </details>
          </li>
        </ul>
      </details>

      <p class="text-[11px] italic text-neutral-500">
        Heuristic checks for Ch. 10 / Ch. 11 read chapter copy by keyword. If
        your team already addressed this with different wording, treat it as
        done — chiefs and instructor still decide.
      </p>
    </template>
  </section>
</template>
