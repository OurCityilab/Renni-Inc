<script setup lang="ts">
// Read-only AI Critique V1 panel for the Market Evidence Suite.
//
// Posture (do not relax in V1):
//   - coach, never approver
//   - transient: result lives in component state, never written to
//     Firestore, lost on refresh
//   - one section at a time, user-triggered, no autosave / no auto-run
//   - the panel renders the structured response verbatim and never
//     pastes any of it into source notes / draft / final / structured
//     evidence / Market Builder entries
//
// The parent (DeliverableOutputWorkspace) is responsible for
// assembling the section-scoped request payload and only mounting the
// panel when (a) the chapter is Ch 7 / 8 / 11, (b) the section has
// marketBuilder.enabled, and (c) the section has at least some
// student-authored input. We re-check (c) here as a defense in depth
// so the button stays disabled if the parent ever forgets.
import { computed, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import type {
  AiCritiqueRiskLevel,
  MarketEvidenceCritiqueRequest,
  MarketEvidenceCritiqueResponse
} from '~/types/aiCritique'

const auth = useAuthStore()

const props = defineProps<{
  request: MarketEvidenceCritiqueRequest
}>()

const result = ref<MarketEvidenceCritiqueResponse | null>(null)
const loading = ref(false)
const errorMessage = ref<string | null>(null)

// Defense in depth — also enforced in the parent. The button stays
// disabled if the section is empty so we never spend a model call on
// nothing.
const hasStudentInput = computed(() => {
  const r = props.request
  if ((r.sourceNotes ?? '').trim()) return true
  if ((r.draftText ?? '').trim()) return true
  if ((r.finalText ?? '').trim()) return true
  if ((r.evidenceLinks?.length ?? 0) > 0) return true
  if ((r.structuredEvidence?.length ?? 0) > 0) return true
  if ((r.marketBuilderEntries?.length ?? 0) > 0) return true
  return false
})

const buttonDisabled = computed(() => loading.value || !hasStudentInput.value)

function riskTone(level: AiCritiqueRiskLevel): string {
  if (level === 'high') return 'border-rose-300 bg-rose-50 text-rose-800'
  if (level === 'medium') return 'border-amber-300 bg-amber-50 text-amber-800'
  return 'border-emerald-300 bg-emerald-50 text-emerald-800'
}

// Student-facing error copy. We deliberately do NOT surface raw server
// messages, stack traces, provider details, secret names, or status
// codes — students see one of these short prompts and that's it. The
// raw error is dropped on the floor; the network tab still has it for
// developers who need to debug.
const SIGN_IN_MESSAGE = 'You need to be signed in and authorized to use this coach.'
const DISABLED_MESSAGE = 'AI critique is not configured on this server yet.'
const GENERIC_MESSAGE = 'The coach could not review this section. Try again after checking your notes.'

interface FetchError {
  status?: number
  statusCode?: number
  data?: { code?: string }
}

function studentFacingError(e: unknown): string {
  const err = (e ?? {}) as FetchError
  const status = err.status ?? err.statusCode
  const code = err.data?.code
  if (status === 401 || status === 403 || code === 'ai_unauthorized') {
    return SIGN_IN_MESSAGE
  }
  if (status === 503 || code === 'ai_disabled') {
    return DISABLED_MESSAGE
  }
  return GENERIC_MESSAGE
}

async function review() {
  // Defense in depth — `loading` already disables the button via
  // `buttonDisabled`, but a synchronous re-entry guard makes a
  // double-click a no-op even if the parent rebinds the handler.
  if (buttonDisabled.value) return
  loading.value = true
  errorMessage.value = null
  // Clear any prior result so the user can see the loading state
  // distinct from a stale prior critique.
  result.value = null
  try {
    // Acquire a fresh Firebase ID token before the request. The token
    // travels only to our local Nuxt endpoint, never to the AI
    // provider — the server verifies it with Firebase Admin and only
    // then issues the model call. If we don't have a signed-in user
    // here, fail fast with a clear sign-in message; we do not call the
    // endpoint without a token.
    const fbUser = auth.user
    if (!fbUser) {
      errorMessage.value = SIGN_IN_MESSAGE
      return
    }
    let idToken: string
    try {
      idToken = await fbUser.getIdToken()
    } catch {
      errorMessage.value = SIGN_IN_MESSAGE
      return
    }
    if (!idToken) {
      errorMessage.value = SIGN_IN_MESSAGE
      return
    }
    // $fetch sends a POST with a JSON body. We pass props.request
    // verbatim — the server validates and size-caps before it ever
    // reaches the model. No auth state, no Firebase web config, no
    // unrelated student data leave the page; only the section-scoped
    // payload + the bearer token in the header.
    const data = await $fetch<MarketEvidenceCritiqueResponse>(
      '/api/ai/market-evidence-critique',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
        body: props.request
      }
    )
    result.value = data
  } catch (e: unknown) {
    errorMessage.value = studentFacingError(e)
  } finally {
    loading.value = false
  }
}

function clear() {
  result.value = null
  errorMessage.value = null
}
</script>

<template>
  <section class="space-y-3 rounded-md border border-sky-200 bg-sky-50/50 p-3">
    <header class="space-y-0.5">
      <p class="text-xs uppercase tracking-wide text-neutral-500">
        AI critique · market evidence
      </p>
      <h4 class="text-sm font-semibold text-neutral-900">
        Coach this section against the market evidence rubric
      </h4>
      <p class="text-xs text-neutral-600">
        Send this section's source notes, draft, evidence, and demand estimates
        to the AI coach for a structured critique. Suggestions only — nothing is
        saved or submitted.
      </p>
    </header>

    <!-- Persistent responsible-AI copy. Stays visible above and below
         the result so a student reading the critique can't lose track
         of the disclaimers. -->
    <ul class="list-disc space-y-0.5 pl-5 text-xs text-neutral-700">
      <li>AI is a coach, not an approver.</li>
      <li>AI cannot submit or approve this deliverable.</li>
      <li>Student source notes remain the source of truth.</li>
      <li>Verify every source and number before using a suggestion.</li>
      <li>Do not paste suggestions blindly into final Playbook text.</li>
    </ul>

    <!-- Pre-click guidance for empty sections. Prominent enough that
         students see it before clicking, but framed as a suggestion
         (the button stays disabled, so this is the explainer). The
         coach itself also handles blank input gracefully on the
         server, so we never accidentally invent evidence. -->
    <p
      v-if="!hasStudentInput"
      class="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900"
    >
      Add source notes, evidence, or demand estimates before running critique.
      The coach can review your thinking, but it cannot critique a blank section.
    </p>

    <div class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="btn-primary text-xs"
        :disabled="buttonDisabled"
        @click="review"
      >
        {{ loading ? 'Reviewing…' : 'Review market evidence' }}
      </button>
      <button
        v-if="result"
        type="button"
        class="text-xs text-neutral-600 hover:underline"
        :disabled="loading"
        @click="clear"
      >Clear critique</button>
    </div>

    <p
      v-if="errorMessage"
      class="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700"
    >
      {{ errorMessage }}
    </p>

    <article
      v-if="result"
      class="space-y-2 rounded-md border border-neutral-200 bg-white p-3 text-sm"
    >
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <p class="text-xs uppercase tracking-wide text-neutral-500">
          Coach response
        </p>
        <span
          class="rounded-full border px-2 py-0.5 text-xs uppercase tracking-wide"
          :class="riskTone(result.riskLevel)"
        >{{ result.riskLevel }} risk</span>
      </div>

      <section v-if="result.strengths.length">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Strengths
        </p>
        <ul class="mt-1 list-disc space-y-0.5 pl-5 text-xs text-neutral-700">
          <li v-for="(s, i) in result.strengths" :key="`str-${i}`">{{ s }}</li>
        </ul>
      </section>

      <section v-if="result.missingEvidence.length">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Missing evidence
        </p>
        <ul class="mt-1 list-disc space-y-0.5 pl-5 text-xs text-neutral-700">
          <li v-for="(m, i) in result.missingEvidence" :key="`miss-${i}`">{{ m }}</li>
        </ul>
      </section>

      <section v-if="result.weakAssumptions.length">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Weak assumptions
        </p>
        <ul class="mt-1 list-disc space-y-0.5 pl-5 text-xs text-neutral-700">
          <li v-for="(w, i) in result.weakAssumptions" :key="`weak-${i}`">{{ w }}</li>
        </ul>
      </section>

      <section v-if="result.consistencyChecks.length">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Consistency checks
        </p>
        <ul class="mt-1 list-disc space-y-0.5 pl-5 text-xs text-neutral-700">
          <li v-for="(c, i) in result.consistencyChecks" :key="`con-${i}`">{{ c }}</li>
        </ul>
      </section>

      <section v-if="result.questionsToAnswer.length">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Questions to answer
        </p>
        <ul class="mt-1 list-disc space-y-0.5 pl-5 text-xs text-neutral-700">
          <li v-for="(q, i) in result.questionsToAnswer" :key="`q-${i}`">{{ q }}</li>
        </ul>
      </section>

      <section v-if="(result.suggestedRevision || '').trim()">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Suggested revision
          <span class="ml-1 rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-amber-800">
            suggestion · not final text
          </span>
        </p>
        <p class="mt-1 whitespace-pre-wrap text-xs text-neutral-700">
          {{ result.suggestedRevision }}
        </p>
      </section>

      <section v-if="result.nextValidationSteps.length">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Next validation steps
        </p>
        <ul class="mt-1 list-disc space-y-0.5 pl-5 text-xs text-neutral-700">
          <li
            v-for="(n, i) in result.nextValidationSteps"
            :key="`next-${i}`"
          >{{ n }}</li>
        </ul>
      </section>

      <p class="pt-1 text-[11px] italic text-neutral-500">
        Reminder: this critique is not saved. Refreshing the page clears it.
        AI cannot approve or submit the deliverable.
      </p>
    </article>
  </section>
</template>
