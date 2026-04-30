<!--
  ExecutiveAdvisorCoachPanel — V2 management coach UI for chiefs.
  Shipped on the C-suite Project Navigator page.

  POSTURE
  -------
    - The Advisor PREPARES; the chief DECIDES. The disclaimer line
      is non-removable copy on every render.
    - Read-only. The panel never approves, submits, mutates a
      status, or creates a task. The "Recommended task title"
      cards are copy-paste suggestions only — the chief seeds them
      manually through the existing Tasks form.
    - Failure-tolerant. If the Advisor API errors out (rate-limited,
      flag disabled, provider failure), the panel surfaces the
      error inline. The Project Navigator continues to render.
    - One mode at a time. The mode picker is a chip set; each chip
      maps to one V2 mode (daily-chief-brief, run-the-room, …).
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { getAuth } from 'firebase/auth'
import {
  ADVISOR_MODE_META,
  ADVISOR_MODES,
  type AdvisorMode,
  type AdvisorModeResult,
  type AdvisorActionCard
} from '~/types/executiveAdvisor'

const auth = useAuthStore()

const isExecutive = computed<boolean>(() => {
  if (!auth.profile) return false
  if (auth.isAdmin) return true
  if (auth.isCoCEO) return true
  if (auth.isChief) return true
  return false
})

const activeMode = ref<AdvisorMode | null>(null)
const focus = ref('')
const focusHint = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const result = ref<AdvisorModeResult | null>(null)

function priorityChipClass(p: AdvisorActionCard['priority']): string {
  switch (p) {
    case 'P0':
      return 'border-rose-300 bg-rose-50 text-rose-900'
    case 'P1':
      return 'border-amber-300 bg-amber-50 text-amber-900'
    case 'P2':
      return 'border-neutral-300 bg-neutral-50 text-neutral-700'
  }
}

async function runMode(mode: AdvisorMode): Promise<void> {
  if (loading.value) return
  activeMode.value = mode
  loading.value = true
  error.value = null
  result.value = null

  try {
    const fbAuth = getAuth()
    const user = fbAuth.currentUser
    if (!user) {
      throw new Error('You need to sign in again to use the Advisor.')
    }
    const idToken = await user.getIdToken(false)
    const body: Record<string, unknown> = { mode }
    const focusValue = focus.value.trim()
    const focusHintValue = focusHint.value.trim()
    if (focusValue) body.focus = focusValue
    if (focusHintValue) body.focusHint = focusHintValue

    const res = await fetch('/api/ai/executive-advisor', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg =
        (json && typeof json === 'object' && 'message' in json &&
          typeof (json as Record<string, unknown>).message === 'string')
          ? ((json as Record<string, unknown>).message as string)
          : `Advisor request failed (${res.status}).`
      throw new Error(msg)
    }
    result.value = json as AdvisorModeResult
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section
    v-if="isExecutive"
    class="space-y-3 min-w-0"
    aria-label="Executive Advisor coach panel"
  >
    <header class="space-y-1">
      <h2 class="text-sm font-semibold text-neutral-700">
        Executive Advisor — management coach
      </h2>
      <p class="text-xs text-neutral-500">
        Ask the Advisor what to push on, how to run the room, how to
        rescue a section, where coverage is missing, or whether to
        approve. Choose a mode below.
      </p>
      <p
        class="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-900"
      >
        Advisor prepares · Chiefs decide. Every recommendation is a
        suggestion that needs human review.
      </p>
    </header>

    <div class="flex flex-wrap items-center gap-1.5 text-xs">
      <button
        v-for="mode in ADVISOR_MODES"
        :key="mode"
        type="button"
        class="rounded border px-2 py-1 transition-colors"
        :class="
          activeMode === mode
            ? 'border-phoenix-500 bg-phoenix-50 text-phoenix-900'
            : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
        "
        :disabled="loading"
        @click="runMode(mode)"
      >
        <span class="font-semibold">{{ ADVISOR_MODE_META[mode].title }}</span>
        <span class="ml-1 italic text-neutral-500 text-[10px]">
          “{{ ADVISOR_MODE_META[mode].promptPhrase }}”
        </span>
      </button>
    </div>

    <div class="grid gap-2 md:grid-cols-2 min-w-0">
      <label class="block text-xs font-medium text-neutral-700">
        Focus (optional)
        <input
          v-model="focus"
          type="text"
          placeholder="Section id, deliverable id, or short prompt"
          class="mt-1 w-full rounded border border-neutral-300 p-1.5 text-sm"
        />
      </label>
      <label class="block text-xs font-medium text-neutral-700">
        Focus hint (optional)
        <input
          v-model="focusHint"
          type="text"
          placeholder="Free-text scope, e.g. 'Phoenix Nest readiness'"
          class="mt-1 w-full rounded border border-neutral-300 p-1.5 text-sm"
        />
      </label>
    </div>

    <p v-if="loading" class="text-xs italic text-neutral-600">
      Asking the Advisor…
    </p>

    <p
      v-if="error"
      class="rounded border border-rose-200 bg-rose-50 p-2 text-xs text-rose-900"
      role="alert"
    >
      {{ error }}
    </p>

    <article
      v-if="result"
      class="space-y-3 rounded-md border border-neutral-200 bg-white p-3 min-w-0"
    >
      <header class="space-y-0.5">
        <p class="text-[11px] uppercase tracking-wide text-neutral-500">
          {{ ADVISOR_MODE_META[result.mode]?.title ?? result.mode }}
        </p>
        <p class="text-sm font-semibold text-neutral-900 break-words">
          {{ result.headline }}
        </p>
      </header>

      <section
        v-if="result.unknowns && result.unknowns.length"
        class="rounded border border-amber-200 bg-amber-50/60 p-2 text-xs text-neutral-800"
      >
        <p class="font-semibold text-amber-900">
          Unknowns the Advisor flagged:
        </p>
        <ul class="mt-1 ml-4 list-disc space-y-0.5">
          <li v-for="(u, i) in result.unknowns" :key="i">{{ u }}</li>
        </ul>
      </section>

      <ul
        v-if="result.cards.length"
        class="grid gap-2 md:grid-cols-2 min-w-0"
      >
        <li
          v-for="(card, idx) in result.cards"
          :key="idx"
          class="rounded border border-neutral-200 bg-neutral-50/40 p-3 min-w-0"
        >
          <header class="flex flex-wrap items-baseline justify-between gap-2 min-w-0">
            <p class="text-sm font-semibold text-neutral-900 break-words">
              {{ card.title }}
            </p>
            <span
              class="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              :class="priorityChipClass(card.priority)"
            >
              {{ card.priority }}
            </span>
          </header>

          <dl class="mt-1 space-y-0.5 text-xs text-neutral-700">
            <div class="break-words">
              <dt class="inline font-semibold text-neutral-800">Why it matters:</dt>
              {{ ' ' + card.whyItMatters }}
            </div>
            <div class="break-words">
              <dt class="inline font-semibold text-neutral-800">Owner:</dt>
              {{ ' ' + card.owner }}
              <span class="text-neutral-500"> · </span>
              <dt class="inline font-semibold text-neutral-800">Due:</dt>
              {{ ' ' + card.dueDate }}
            </div>
            <div v-if="card.dependency" class="break-words">
              <dt class="inline font-semibold text-neutral-800">Depends on:</dt>
              {{ ' ' + card.dependency }}
            </div>
            <div v-if="card.playbookChapter" class="break-words text-[11px] italic text-neutral-600">
              {{ card.playbookChapter }}
            </div>
            <div class="break-words">
              <dt class="inline font-semibold text-neutral-800">Exact next action:</dt>
              {{ ' ' + card.exactNextAction }}
            </div>
            <div class="break-words">
              <dt class="inline font-semibold text-neutral-800">What to say:</dt>
              {{ ' ' + card.whatChiefShouldSay }}
            </div>
            <div class="break-words">
              <dt class="inline font-semibold text-neutral-800">Done signal:</dt>
              {{ ' ' + card.doneSignal }}
            </div>
            <div class="break-words text-rose-800">
              <dt class="inline font-semibold">Risk if ignored:</dt>
              {{ ' ' + card.riskIfIgnored }}
            </div>
          </dl>

          <NuxtLink
            v-if="card.sectionLink"
            :to="card.sectionLink"
            class="mt-2 inline-flex rounded border border-phoenix-300 bg-phoenix-50 px-2 py-1 text-xs font-medium text-phoenix-900 hover:bg-phoenix-100 break-words"
          >
            Open the section →
          </NuxtLink>

          <p
            v-if="!card.sourceIds.length"
            class="mt-1 text-[11px] italic text-neutral-500"
          >
            Ungrounded suggestion — confirm before acting.
          </p>

          <p class="mt-1 text-[11px] italic text-neutral-500">
            Human review required. Advisor never auto-creates,
            auto-approves, or changes status.
          </p>
        </li>
      </ul>

      <details
        v-if="result.extra"
        class="rounded border border-neutral-200 bg-neutral-50/60 p-2 text-[11px] text-neutral-700"
      >
        <summary class="cursor-pointer font-semibold text-neutral-800">
          Mode-specific structured output
        </summary>
        <pre class="mt-1 whitespace-pre-wrap break-words">{{ JSON.stringify(result.extra, null, 2) }}</pre>
      </details>
    </article>
  </section>
</template>
