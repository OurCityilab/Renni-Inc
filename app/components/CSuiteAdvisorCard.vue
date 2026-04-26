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
  SEVERITY_CHIP_CLASS,
  SEVERITY_LABEL,
  SOURCE_LABEL,
  generateAdvisorSignals
} from '~/utils/cSuiteAdvisor'

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
      <!-- Top priority — pulled out so the card opens with the most
           important thing for the chief to see. -->
      <article
        v-if="topPriority"
        class="space-y-1 rounded-md border border-neutral-300 bg-white p-2 text-xs"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            Top priority
          </p>
          <span
            class="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide"
            :class="SEVERITY_CHIP_CLASS[topPriority.severity]"
          >{{ SEVERITY_LABEL[topPriority.severity] }} · {{ SOURCE_LABEL[topPriority.source] }}</span>
        </div>
        <h4 class="font-semibold text-neutral-900">{{ topPriority.title }}</h4>
        <p class="text-neutral-800">{{ topPriority.summary }}</p>
        <p v-if="topPriority.gap" class="text-neutral-700">
          <span class="font-medium text-neutral-600">Gap:</span> {{ topPriority.gap }}
        </p>
        <p class="text-neutral-700">
          <span class="font-medium text-neutral-600">Owner:</span> {{ topPriority.owner }}
          <span v-if="(topPriority.supportingRoles?.length ?? 0) > 0">
            · support: {{ topPriority.supportingRoles!.join(' · ') }}
          </span>
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
        <p class="text-neutral-900">
          <span class="font-medium text-neutral-600">Next action:</span>
          {{ topPriority.nextAction }}
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
      </article>

      <!-- Other priorities today — show up to two more signals -->
      <div v-if="nextTwo.length > 0" class="space-y-1">
        <p class="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
          Other priorities today
        </p>
        <article
          v-for="sig in nextTwo"
          :key="sig.id"
          class="space-y-1 rounded-md border border-neutral-200 bg-neutral-50 p-2 text-xs"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h4 class="font-medium text-neutral-900">{{ sig.title }}</h4>
            <span
              class="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide"
              :class="SEVERITY_CHIP_CLASS[sig.severity]"
            >{{ SEVERITY_LABEL[sig.severity] }}</span>
          </div>
          <p class="text-neutral-700">{{ sig.summary }}</p>
          <p class="text-neutral-700">
            <span class="font-medium text-neutral-600">Owner:</span> {{ sig.owner }}
          </p>
          <p class="text-neutral-900">
            <span class="font-medium text-neutral-600">Next action:</span>
            {{ sig.nextAction }}
          </p>
        </article>
      </div>

      <!-- View all — collapsible -->
      <details v-if="remaining.length > 0" class="rounded-md border border-neutral-200 bg-white p-2">
        <summary class="cursor-pointer text-xs font-medium text-neutral-700">
          View all signals ({{ remaining.length }} more)
        </summary>
        <div class="mt-2 space-y-2">
          <article
            v-for="sig in remaining"
            :key="sig.id"
            class="space-y-1 rounded-md border border-neutral-200 bg-neutral-50 p-2 text-xs"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h4 class="font-medium text-neutral-900">{{ sig.title }}</h4>
              <span
                class="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide"
                :class="SEVERITY_CHIP_CLASS[sig.severity]"
              >{{ SEVERITY_LABEL[sig.severity] }}</span>
            </div>
            <p class="text-neutral-700">{{ sig.summary }}</p>
            <p v-if="sig.gap" class="text-neutral-700">
              <span class="font-medium text-neutral-600">Gap:</span> {{ sig.gap }}
            </p>
            <p class="text-neutral-700">
              <span class="font-medium text-neutral-600">Owner:</span> {{ sig.owner }}
              <span v-if="(sig.supportingRoles?.length ?? 0) > 0">
                · support: {{ sig.supportingRoles!.join(' · ') }}
              </span>
            </p>
            <p v-if="sig.dependency" class="text-neutral-700">
              <span class="font-medium text-neutral-600">Dependency:</span> {{ sig.dependency }}
            </p>
            <p class="text-neutral-900">
              <span class="font-medium text-neutral-600">Next action:</span>
              {{ sig.nextAction }}
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
          </article>
        </div>
      </details>

      <p class="text-[11px] italic text-neutral-500">
        Advisor signals are read-only and display-only. They do not change the
        submit gate, Playbook readiness, or approval state.
      </p>
    </template>
  </section>
</template>
