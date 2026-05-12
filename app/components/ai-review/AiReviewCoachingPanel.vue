<script setup lang="ts">
// AI Leadership Review Coaching panel.
//
// Posture (do not relax):
//   - The deterministic report renders above this panel and remains
//     the source of truth.
//   - The panel never autoruns. The leader must click Generate.
//   - The panel labels every output as coaching, never approval.
//   - The output stays in local state — never persisted, never
//     mutates the payload.
import { computed } from 'vue'
import type {
  AiReviewCoachingUrgency,
  AiReviewReportPayload
} from '~/types/aiReviewReports'
import { AI_REVIEW_COACHING_SAFETY_REMINDER } from '~/types/aiReviewReports'
import { useAiReviewCoaching } from '~/composables/useAiReviewCoaching'

const props = defineProps<{
  payload: AiReviewReportPayload
  /** Compact mode is used on the chapter detail page so the panel
   *  stays vertically lean inside the deliverable detail layout. */
  compact?: boolean
}>()

const {
  coaching,
  loading,
  error,
  errorCode,
  generateCoaching,
  clearCoaching
} = useAiReviewCoaching()

function onClickGenerate() {
  // Clone the payload (defensive) so the composable never sees the
  // reactive proxy directly. The endpoint also re-clones server-side.
  const snapshot = JSON.parse(JSON.stringify(props.payload)) as AiReviewReportPayload
  void generateCoaching(snapshot)
}

const URGENCY_TONE: Record<AiReviewCoachingUrgency, string> = {
  low: 'border-neutral-300 text-neutral-700',
  medium: 'border-amber-300 bg-amber-50 text-amber-800',
  high: 'border-rose-300 bg-rose-50 text-rose-800'
}

const safetyReminder = AI_REVIEW_COACHING_SAFETY_REMINDER

const errorIsDisabled = computed(() => errorCode.value === 'ai_disabled')
</script>

<template>
  <section
    class="space-y-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
    aria-label="AI Leadership Coaching"
  >
    <header class="flex flex-wrap items-baseline justify-between gap-2">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          AI Leadership Coaching
        </p>
        <p class="text-[11px] italic text-neutral-500">
          {{ safetyReminder }}
        </p>
      </div>
      <div class="flex shrink-0 gap-2 text-xs">
        <button
          type="button"
          class="rounded border border-phoenix-400 bg-phoenix-600 px-3 py-1 font-medium text-white hover:bg-phoenix-700 disabled:opacity-50"
          :disabled="loading"
          @click="onClickGenerate()"
        >
          {{ loading ? 'Generating…' : coaching ? 'Regenerate coaching' : 'Generate AI Coaching' }}
        </button>
        <button
          v-if="coaching"
          type="button"
          class="rounded border border-neutral-300 bg-white px-3 py-1 text-neutral-700 hover:bg-neutral-50"
          @click="clearCoaching()"
        >Clear</button>
      </div>
    </header>

    <p
      v-if="!coaching && !loading && !error"
      class="rounded-md border border-amber-200 bg-amber-50/60 p-2 text-xs text-amber-900"
    >
      This coaching is based only on the current report payload. It may
      miss context that is not captured in the system. The deterministic
      report above remains the source of truth.
    </p>

    <p
      v-if="error"
      class="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800"
    >
      <template v-if="errorIsDisabled">
        AI coaching is unavailable right now. The deterministic report
        above is unaffected.
      </template>
      <template v-else>
        Could not generate coaching: {{ error }}
      </template>
    </p>

    <div v-if="coaching" class="space-y-4 text-sm text-neutral-800">
      <section>
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Executive summary
        </p>
        <p class="mt-1 whitespace-pre-wrap">{{ coaching.executiveSummary }}</p>
      </section>

      <section v-if="coaching.coachingPriorities.length">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Coaching priorities
        </p>
        <ul class="mt-1 space-y-2">
          <li
            v-for="(p, i) in coaching.coachingPriorities"
            :key="`cp-${i}`"
            class="rounded-md border border-neutral-200 p-2 text-xs"
          >
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <p class="font-medium text-neutral-900">{{ p.issue }}</p>
              <span
                class="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide"
                :class="URGENCY_TONE[p.urgency]"
              >{{ p.urgency }}</span>
            </div>
            <p class="mt-1 text-neutral-700">
              <span class="font-medium">Evidence:</span> {{ p.evidenceFromPayload }}
            </p>
            <p class="text-neutral-700">
              <span class="font-medium">Why it matters:</span> {{ p.whyItMatters }}
            </p>
            <p class="text-neutral-700">
              <span class="font-medium">Coaching move:</span> {{ p.coachingMove }}
            </p>
            <p class="text-neutral-700">
              <span class="font-medium">Owner:</span> {{ p.owner }}
            </p>
            <p class="text-neutral-700">
              <span class="font-medium">Definition of done:</span> {{ p.definitionOfDone }}
            </p>
          </li>
        </ul>
      </section>

      <section v-if="coaching.strongestAreas.length">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Strongest areas
        </p>
        <ul class="mt-1 space-y-1.5">
          <li
            v-for="(s, i) in coaching.strongestAreas"
            :key="`st-${i}`"
            class="rounded-md border border-emerald-200 bg-emerald-50/40 p-2 text-xs"
          >
            <p class="font-medium text-emerald-900">{{ s.area }}</p>
            <p class="text-neutral-700">
              <span class="font-medium">Evidence:</span> {{ s.evidenceFromPayload }}
            </p>
            <p class="text-neutral-700">
              <span class="font-medium">Why it matters:</span> {{ s.whyItMatters }}
            </p>
          </li>
        </ul>
      </section>

      <section v-if="coaching.weakestAreas.length">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Weakest areas
        </p>
        <ul class="mt-1 space-y-1.5">
          <li
            v-for="(w, i) in coaching.weakestAreas"
            :key="`wk-${i}`"
            class="rounded-md border border-amber-200 bg-amber-50/40 p-2 text-xs"
          >
            <p class="font-medium text-amber-900">{{ w.area }}</p>
            <p class="text-neutral-700">
              <span class="font-medium">Issue:</span> {{ w.issue }}
            </p>
            <p class="text-neutral-700">
              <span class="font-medium">Recommended fix:</span> {{ w.recommendedFix }}
            </p>
            <p v-if="w.owner" class="text-neutral-700">
              <span class="font-medium">Owner:</span> {{ w.owner }}
            </p>
          </li>
        </ul>
      </section>

      <section v-if="coaching.missingEvidence.length">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Missing evidence
        </p>
        <ul class="mt-1 space-y-1.5">
          <li
            v-for="(m, i) in coaching.missingEvidence"
            :key="`me-${i}`"
            class="rounded-md border border-amber-200 bg-amber-50/40 p-2 text-xs"
          >
            <p class="font-medium text-amber-900">{{ m.sectionOrDeliverable }}</p>
            <p class="text-neutral-700">
              <span class="font-medium">Issue:</span> {{ m.issue }}
            </p>
            <p class="text-neutral-700">
              <span class="font-medium">Needed evidence:</span> {{ m.neededEvidence }}
            </p>
            <p v-if="m.owner" class="text-neutral-700">
              <span class="font-medium">Owner:</span> {{ m.owner }}
            </p>
          </li>
        </ul>
      </section>

      <section v-if="coaching.escalationItems.length">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Escalation items
        </p>
        <ul class="mt-1 space-y-1.5">
          <li
            v-for="(e, i) in coaching.escalationItems"
            :key="`es-${i}`"
            class="rounded-md border border-rose-200 bg-rose-50/40 p-2 text-xs"
          >
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <p class="font-medium text-rose-900">{{ e.issue }}</p>
              <span
                class="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide"
                :class="URGENCY_TONE[e.urgency]"
              >{{ e.urgency }}</span>
            </div>
            <p class="text-neutral-700">
              <span class="font-medium">Escalate to:</span> {{ e.escalateTo }}
            </p>
            <p class="text-neutral-700">
              <span class="font-medium">Reason:</span> {{ e.reason }}
            </p>
          </li>
        </ul>
      </section>

      <section v-if="coaching.recommendedNextActions.length">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Recommended next actions
        </p>
        <ul class="mt-1 space-y-1.5">
          <li
            v-for="(a, i) in coaching.recommendedNextActions"
            :key="`na-${i}`"
            class="rounded-md border border-neutral-200 p-2 text-xs"
          >
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <p class="font-medium text-neutral-900">{{ a.action }}</p>
              <span
                class="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide"
                :class="URGENCY_TONE[a.urgency]"
              >{{ a.urgency }}</span>
            </div>
            <p class="text-neutral-700">
              <span class="font-medium">Owner:</span> {{ a.owner }}
            </p>
            <p class="text-neutral-700">
              <span class="font-medium">Definition of done:</span> {{ a.definitionOfDone }}
            </p>
          </li>
        </ul>
      </section>

      <section v-if="coaching.suggestedTalkingPoints.length">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Suggested talking points
        </p>
        <ul class="mt-1 list-disc space-y-1 pl-5 text-xs text-neutral-700">
          <li
            v-for="(t, i) in coaching.suggestedTalkingPoints"
            :key="`tp-${i}`"
          >{{ t }}</li>
        </ul>
      </section>

      <section v-if="coaching.limitations.length">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Limitations
        </p>
        <ul class="mt-1 list-disc space-y-1 pl-5 text-xs italic text-neutral-600">
          <li
            v-for="(l, i) in coaching.limitations"
            :key="`lm-${i}`"
          >{{ l }}</li>
        </ul>
      </section>

      <p
        class="rounded-md border border-neutral-200 bg-neutral-50 p-2 text-[11px] italic text-neutral-700"
      >
        {{ coaching.safetyReminder }}
      </p>
    </div>
  </section>
</template>
