<script setup lang="ts">
// C-Suite Advisor V1 — chapter-hub display card.
//
// Posture (do not relax in V1):
//   - read-only / display-only — no Firestore writes
//   - no AI calls
//   - no "Create task" button (suggested tasks render as copy text only)
//   - never approves / submits / changes status
//   - top priority + 3 signals visible by default; "View all" expands
//   - empty state when there are no flags
//   - status-aware: when the deliverable is approved or in_review the
//     utility itself returns at most one info signal, so we never
//     render edit-push language in those states

import { computed } from 'vue'
import type { Deliverable, DeliverableOutput, Task } from '~/types/models'
import type { TemplateStudio } from '~/types/templateStudio'
import type { RequirementCoverageSummary } from '~/utils/requirementCoverage'
import type { AdvisorSignal } from '~/types/advisor'
import {
  SOURCE_LABEL,
  generateAdvisorSignals
} from '~/utils/cSuiteAdvisor'
import {
  DISPLAY_LABEL_CHIP_CLASS,
  getAdvisorDisplayLabel
} from '~/utils/advisorDisplay'

const props = defineProps<{
  deliverable: Deliverable
  studio: TemplateStudio | null
  tasks: Task[]
  output: DeliverableOutput | null
  requirementCoverage?: RequirementCoverageSummary | null
  // Soft loading flag — when the chapter page is still resolving
  // tasks or output we render a small "Loading…" line instead of
  // a no-flags celebration that would flip the moment data lands.
  loading?: boolean
}>()

const signals = computed<AdvisorSignal[]>(() =>
  generateAdvisorSignals({
    deliverable: props.deliverable,
    studio: props.studio,
    tasks: props.tasks,
    output: props.output,
    requirementCoverage: props.requirementCoverage ?? null
  })
)

// Top priority is the first signal after severity sort. We also show
// up to two more signals as "Other priorities today." The remaining
// signals collapse under a "View all" details element so the hub
// stays compact.
const topPriority = computed<AdvisorSignal | null>(() => signals.value[0] ?? null)
const nextTwo = computed<AdvisorSignal[]>(() => signals.value.slice(1, 3))
const remaining = computed<AdvisorSignal[]>(() => signals.value.slice(3))

// Status-aware framing copy — the utility already drops a single
// monitoring/review info signal when status is approved/in_review,
// but we still flip the card subtitle so chiefs see the framing
// without scanning the signal list first.
const subtitle = computed(() => {
  if (props.deliverable.status === 'approved') {
    return 'Approved — monitoring only. Use signals for handoff or future revision.'
  }
  if (props.deliverable.status === 'in_review') {
    return 'In review — use signals as review questions; authors should not be editing.'
  }
  return 'Advisory operating brief — chiefs and instructor still decide.'
})

// Render a signal in three blocks: chip + title row, body, suggested
// task. Helper kept inline so the template is one block per signal.
</script>

<template>
  <section class="card space-y-2">
    <header class="space-y-0.5">
      <p class="text-xs uppercase tracking-wide text-neutral-500">
        C-Suite Advisor
      </p>
      <h3 class="text-base font-semibold text-neutral-900">
        What should chiefs push today?
      </h3>
      <p class="text-xs text-neutral-700">{{ subtitle }}</p>
    </header>

    <p v-if="loading" class="text-xs italic text-neutral-500">
      Loading advisor signals…
    </p>

    <p
      v-else-if="!studio"
      class="text-xs italic text-neutral-500"
    >
      This deliverable is not studio-backed. Advisor signals are limited; chiefs
      should review against the rubric directly.
    </p>

    <p
      v-else-if="signals.length === 0"
      class="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-900"
    >
      No major advisor flags. Continue reviewing final text, evidence quality, and
      approval rubric.
    </p>

    <template v-else>
      <!-- V1.1 — single visible top-priority row + collapsed
           details. The cockpit pattern: chiefs answer "what's the
           top issue, who owns it, what's next" without scrolling.
           Full detail (gap, dependency, process order, suggested
           task) lives one click away. -->
      <article
        v-if="topPriority"
        class="rounded-md border border-neutral-300 bg-white text-xs"
      >
        <details class="group">
          <summary class="cursor-pointer space-y-1 p-2">
            <div class="flex flex-wrap items-center gap-1.5">
              <span
                class="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide"
                :class="DISPLAY_LABEL_CHIP_CLASS[getAdvisorDisplayLabel(topPriority).label]"
              >{{ getAdvisorDisplayLabel(topPriority).label }}</span>
              <span class="rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-violet-800">
                Owner · {{ topPriority.owner }}
              </span>
              <span class="rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-neutral-700">
                {{ SOURCE_LABEL[topPriority.source] }}
              </span>
              <span class="ml-auto text-[10px] text-neutral-500 group-open:hidden">
                Tap for detail ▸
              </span>
              <span class="ml-auto text-[10px] text-neutral-500 hidden group-open:inline">
                Hide detail ▾
              </span>
            </div>
            <p class="text-neutral-900">
              <span class="font-medium">{{ topPriority.title }}.</span>
              {{ topPriority.nextAction }}
            </p>
          </summary>
          <div class="space-y-1 border-t border-neutral-200 p-2">
            <p class="text-neutral-800">
              <span class="font-medium text-neutral-600">What this means:</span>
              {{ getAdvisorDisplayLabel(topPriority).explanation }}
            </p>
            <p class="text-neutral-800">
              <span class="font-medium text-neutral-600">Why it matters:</span>
              {{ getAdvisorDisplayLabel(topPriority).whyItMatters }}
            </p>
            <p class="text-neutral-800">
              <span class="font-medium text-neutral-600">How to fix:</span>
              {{ getAdvisorDisplayLabel(topPriority).howToFix }}
            </p>
            <p class="text-neutral-700">{{ topPriority.summary }}</p>
            <p v-if="topPriority.gap" class="text-neutral-700">
              <span class="font-medium text-neutral-600">Gap:</span> {{ topPriority.gap }}
            </p>
            <p
              v-if="(topPriority.supportingRoles?.length ?? 0) > 0"
              class="text-neutral-700"
            >
              <span class="font-medium text-neutral-600">Support:</span>
              {{ topPriority.supportingRoles!.join(' · ') }}
            </p>
            <p v-if="topPriority.dependency" class="text-neutral-700">
              <span class="font-medium text-neutral-600">Dependency:</span> {{ topPriority.dependency }}
            </p>
            <ol
              v-if="(topPriority.processOrder?.length ?? 0) > 0"
              class="ml-4 list-decimal space-y-0.5 text-neutral-700"
            >
              <li v-for="(p, i) in topPriority.processOrder" :key="`top-proc-${i}`">{{ p }}</li>
            </ol>
            <p
              v-if="topPriority.taskCoverage"
              class="text-neutral-700"
            >
              <span class="font-medium text-neutral-600">Task coverage:</span>
              {{ topPriority.taskCoverage.status }}
              <span v-if="topPriority.taskCoverage.relatedRequirementId">
                · req {{ topPriority.taskCoverage.relatedRequirementId }}
              </span>
            </p>
            <div
              v-if="topPriority.suggestedTask"
              class="rounded border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-900"
            >
              <p class="font-semibold">Suggested task (copy only — chiefs create the task)</p>
              <p>
                <span class="font-medium">Title:</span> {{ topPriority.suggestedTask.title }}
              </p>
              <p>
                <span class="font-medium">Owner:</span> {{ topPriority.suggestedTask.owner }}
                · due {{ topPriority.suggestedTask.dueDate }}
              </p>
              <p v-if="topPriority.suggestedTask.dependency">
                <span class="font-medium">Depends on:</span> {{ topPriority.suggestedTask.dependency }}
              </p>
              <p>
                <span class="font-medium">Definition of done:</span>
                {{ topPriority.suggestedTask.definitionOfDone }}
              </p>
              <p v-if="topPriority.suggestedTask.playbookChapter">
                <span class="font-medium">Playbook:</span> {{ topPriority.suggestedTask.playbookChapter }}
              </p>
            </div>
          </div>
        </details>
      </article>

      <!-- Other priorities — collapsed list of compact rows.
           Each row carries the chip + owner + one-line next
           action; expanding a row reveals the full detail. -->
      <details
        v-if="nextTwo.length > 0 || remaining.length > 0"
        class="rounded-md border border-neutral-200 bg-white"
      >
        <summary class="cursor-pointer p-2 text-xs font-medium text-neutral-700">
          Other priorities ({{ nextTwo.length + remaining.length }})
        </summary>
        <ul class="space-y-1 border-t border-neutral-200 p-2 text-xs">
          <li
            v-for="sig in [...nextTwo, ...remaining]"
            :key="sig.id"
          >
            <details class="rounded-md border border-neutral-200 bg-neutral-50">
              <summary class="cursor-pointer space-y-1 p-2">
                <div class="flex flex-wrap items-center gap-1.5">
                  <span
                    class="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide"
                    :class="DISPLAY_LABEL_CHIP_CLASS[getAdvisorDisplayLabel(sig).label]"
                  >{{ getAdvisorDisplayLabel(sig).label }}</span>
                  <span class="rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-violet-800">
                    {{ sig.owner }}
                  </span>
                  <span class="rounded-full border border-neutral-300 bg-white px-2 py-0.5 text-[10px] uppercase tracking-wide text-neutral-700">
                    {{ SOURCE_LABEL[sig.source] }}
                  </span>
                </div>
                <p class="text-neutral-900">
                  <span class="font-medium">{{ sig.title }}.</span>
                  {{ sig.nextAction }}
                </p>
              </summary>
              <div class="space-y-1 border-t border-neutral-200 p-2">
                <p class="text-neutral-700">
                  <span class="font-medium text-neutral-600">Why it matters:</span>
                  {{ getAdvisorDisplayLabel(sig).whyItMatters }}
                </p>
                <p class="text-neutral-700">
                  <span class="font-medium text-neutral-600">How to fix:</span>
                  {{ getAdvisorDisplayLabel(sig).howToFix }}
                </p>
                <p class="text-neutral-700">{{ sig.summary }}</p>
                <p v-if="sig.gap" class="text-neutral-700">
                  <span class="font-medium text-neutral-600">Gap:</span> {{ sig.gap }}
                </p>
                <p v-if="(sig.supportingRoles?.length ?? 0) > 0" class="text-neutral-700">
                  <span class="font-medium text-neutral-600">Support:</span>
                  {{ sig.supportingRoles!.join(' · ') }}
                </p>
                <p v-if="sig.dependency" class="text-neutral-700">
                  <span class="font-medium text-neutral-600">Dependency:</span> {{ sig.dependency }}
                </p>
                <div
                  v-if="sig.suggestedTask"
                  class="rounded border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-900"
                >
                  <p class="font-semibold">Suggested task (copy only)</p>
                  <p>
                    <span class="font-medium">Title:</span> {{ sig.suggestedTask.title }}
                    · owner {{ sig.suggestedTask.owner }}
                    · due {{ sig.suggestedTask.dueDate }}
                  </p>
                  <p>
                    <span class="font-medium">Definition of done:</span>
                    {{ sig.suggestedTask.definitionOfDone }}
                  </p>
                </div>
              </div>
            </details>
          </li>
        </ul>
      </details>

      <p class="text-[11px] italic text-neutral-500">
        Advisor signals are read-only and display-only. They do not change the
        submit gate, Playbook readiness, or approval state. Open
        <NuxtLink to="/c-suite-advisor" class="text-phoenix-700 hover:underline">C-Suite Advisor</NuxtLink>
        for the leadership cockpit across chapters.
      </p>
    </template>
  </section>
</template>
