<!--
  CustomerArchetypePicker — pure UI + clipboard.
  Renders a card deck of 15 Renni Inc. customer archetypes,
  shows detail when selected, and lets the student copy the
  selection (with optional per-archetype custom notes) as
  markdown for Working Draft.

  POSTURE (do not relax)
  ----------------------
    - Local component state only. No Firestore writes, no AI calls,
      no save handler, no automatic Working-Draft writes.
    - Archetypes are STARTING HYPOTHESES, not verified facts. The
      copy in the panel and the markdown output both reinforce
      this so the team validates with real evidence.
    - The picker NEVER overwrites existing Customer Profile Builder
      selections. It is purely additive — students still customize
      and run the existing classifier.
-->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import BuilderHandoffCallout from '~/components/BuilderHandoffCallout.vue'
import {
  customerArchetypes,
  archetypesForSection,
  formatArchetypesAsMarkdown,
  type CustomerArchetype,
  type CustomerArchetypeId
} from '~/utils/customerArchetypes'

const props = withDefaults(
  defineProps<{
    sectionId?: string
    productOptions?: string[]
    compact?: boolean
    /** Hard cap on simultaneous archetype selections. Defaults to
     *  3 — students typically pick 1–2 primary + an optional
     *  comparison archetype. */
    maxSelections?: number
  }>(),
  {
    sectionId: '',
    productOptions: () => [],
    compact: false,
    maxSelections: 3
  }
)

const selectedIds = ref<CustomerArchetypeId[]>([])
const customNotes = reactive<Partial<Record<CustomerArchetypeId, string>>>({})
const expandedId = ref<CustomerArchetypeId | null>(null)
const copyButtonLabel = ref('Copy archetypes')

const recommendedSet = computed<Set<CustomerArchetypeId>>(() => {
  const list = archetypesForSection(props.sectionId)
  return new Set(list.map((a) => a.id))
})

const orderedArchetypes = computed<readonly CustomerArchetype[]>(() => {
  if (recommendedSet.value.size === 0) return customerArchetypes
  // Sort recommended first, preserving original order within each bucket.
  const recommended = customerArchetypes.filter((a) =>
    recommendedSet.value.has(a.id)
  )
  const others = customerArchetypes.filter(
    (a) => !recommendedSet.value.has(a.id)
  )
  return [...recommended, ...others]
})

function isSelected(id: CustomerArchetypeId): boolean {
  return selectedIds.value.includes(id)
}

function isAtCap(): boolean {
  return selectedIds.value.length >= props.maxSelections
}

function toggleSelected(id: CustomerArchetypeId): void {
  if (isSelected(id)) {
    selectedIds.value = selectedIds.value.filter((x) => x !== id)
    expandedId.value =
      expandedId.value === id ? null : expandedId.value
    return
  }
  if (isAtCap()) return
  selectedIds.value = [...selectedIds.value, id]
  expandedId.value = id
}

function setExpanded(id: CustomerArchetypeId): void {
  expandedId.value = expandedId.value === id ? null : id
}

function clearAll(): void {
  selectedIds.value = []
  expandedId.value = null
  for (const k of Object.keys(customNotes)) {
    delete customNotes[k as CustomerArchetypeId]
  }
}

const selectedArchetypes = computed<CustomerArchetype[]>(() =>
  selectedIds.value
    .map((id) => customerArchetypes.find((a) => a.id === id))
    .filter((a): a is CustomerArchetype => Boolean(a))
)

function buildMarkdown(): string {
  return formatArchetypesAsMarkdown(selectedIds.value, customNotes)
}

async function copyOutput(): Promise<void> {
  const text = buildMarkdown()
  try {
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      await navigator.clipboard.writeText(text)
      copyButtonLabel.value = 'Copied ✓'
      window.setTimeout(() => {
        copyButtonLabel.value = 'Copy archetypes'
      }, 2000)
    } else {
      copyButtonLabel.value = 'Copy unavailable — select and copy manually'
    }
  } catch {
    copyButtonLabel.value = 'Copy failed — try again'
  }
}
</script>

<template>
  <section
    class="rounded-lg border border-sky-300 bg-sky-50/40 p-3 text-sm shadow-sm flex flex-col gap-3 min-w-0"
    aria-label="Customer Archetype Picker"
  >
    <header class="space-y-1">
      <p class="text-[11px] uppercase tracking-wide text-sky-800">
        Builder · customer archetypes
      </p>
      <h3 class="text-base font-semibold text-sky-900">
        Pick a starting customer archetype
      </h3>
      <p class="text-xs text-sky-900">
        Choose one or two archetypes that feel closest to a Renni
        Inc. customer you're trying to reach. Each card shows a
        profile, likely needs, objections, and what evidence to
        collect. You'll customize what's actually true for Renni Inc.
        in the next step.
      </p>
      <p class="text-[11px] italic text-sky-900">
        Customer archetypes are starting hypotheses, not verified
        facts. The team validates them with real evidence before
        committing.
      </p>
    </header>

    <BuilderHandoffCallout v-if="!compact" />

    <p
      class="rounded border border-sky-200 bg-white p-2 text-[11px] italic text-neutral-700"
    >
      This picker helps you choose and explain a customer type. It
      does not submit, approve, or save the final section for you.
      Copy useful output into Working Draft, edit it in your own
      words, add evidence, then save.
    </p>

    <!-- Card deck -->
    <ul class="grid gap-2 sm:grid-cols-2 md:grid-cols-3 min-w-0">
      <li
        v-for="archetype in orderedArchetypes"
        :key="archetype.id"
        class="rounded border bg-white p-2 text-xs min-w-0"
        :class="
          isSelected(archetype.id)
            ? 'border-sky-500 ring-2 ring-sky-200'
            : 'border-stone-200'
        "
      >
        <header class="flex items-baseline justify-between gap-1 min-w-0">
          <p class="font-semibold text-stone-900 break-words">
            {{ archetype.label }}
          </p>
          <span
            v-if="recommendedSet.has(archetype.id)"
            class="ml-1 inline-flex items-center rounded border border-sky-300 bg-sky-50 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-sky-900"
            title="Suggested for this section"
          >
            Suggested
          </span>
        </header>
        <p class="mt-0.5 text-[11px] text-stone-700 break-words">
          {{ archetype.shortProfile }}
        </p>
        <p class="mt-0.5 text-[11px] italic text-stone-500 break-words">
          "{{ archetype.exampleQuote }}"
        </p>
        <div class="mt-1 flex flex-wrap items-center gap-1">
          <button
            type="button"
            class="rounded border px-1.5 py-0.5 text-[10px] font-medium"
            :class="
              isSelected(archetype.id)
                ? 'border-sky-500 bg-sky-50 text-sky-900'
                : isAtCap()
                ? 'border-stone-200 bg-stone-50 text-stone-400 cursor-not-allowed'
                : 'border-sky-300 bg-white text-sky-900 hover:bg-sky-50'
            "
            :disabled="!isSelected(archetype.id) && isAtCap()"
            @click="toggleSelected(archetype.id)"
          >
            {{ isSelected(archetype.id) ? '✓ Selected' : 'Select' }}
          </button>
          <button
            type="button"
            class="text-[10px] text-stone-500 hover:text-sky-800"
            @click="setExpanded(archetype.id)"
          >
            {{ expandedId === archetype.id ? 'Hide details' : 'See details' }}
          </button>
        </div>
      </li>
    </ul>

    <!-- Detail panel for the currently expanded archetype -->
    <article
      v-if="expandedId"
      class="rounded border border-sky-200 bg-white p-3 text-xs"
    >
      <p class="text-[11px] uppercase tracking-wide text-sky-800">
        Detail · {{ expandedId }}
      </p>
      <template
        v-for="archetype in customerArchetypes"
        :key="archetype.id"
      >
        <div v-if="archetype.id === expandedId" class="space-y-2 mt-1">
          <p class="text-sm font-semibold text-stone-900">
            {{ archetype.label }}
          </p>
          <p class="italic text-stone-600">
            "{{ archetype.exampleQuote }}"
          </p>
          <dl class="space-y-1">
            <div>
              <dt class="font-semibold text-stone-700">Likely needs</dt>
              <ul class="ml-4 list-disc space-y-0.5 text-stone-700">
                <li v-for="(n, i) in archetype.likelyNeeds" :key="i">{{ n }}</li>
              </ul>
            </div>
            <div>
              <dt class="font-semibold text-stone-700">Likely objections</dt>
              <ul class="ml-4 list-disc space-y-0.5 text-stone-700">
                <li v-for="(n, i) in archetype.likelyObjections" :key="i">{{ n }}</li>
              </ul>
            </div>
            <div>
              <dt class="font-semibold text-stone-700">Likely products</dt>
              <p class="text-stone-700">{{ archetype.likelyProducts.join(', ') }}</p>
            </div>
            <div>
              <dt class="font-semibold text-stone-700">Likely channels</dt>
              <p class="text-stone-700">{{ archetype.likelyChannels.join(', ') }}</p>
            </div>
            <div>
              <dt class="font-semibold text-stone-700">Evidence to collect</dt>
              <ul class="ml-4 list-disc space-y-0.5 text-stone-700">
                <li v-for="(n, i) in archetype.evidenceToCollect" :key="i">{{ n }}</li>
              </ul>
            </div>
            <div>
              <dt class="font-semibold text-rose-800">What not to assume</dt>
              <ul class="ml-4 list-disc space-y-0.5 text-rose-800">
                <li v-for="(n, i) in archetype.whatNotToAssume" :key="i">{{ n }}</li>
              </ul>
            </div>
          </dl>
        </div>
      </template>
    </article>

    <!-- Per-selected custom notes -->
    <div v-if="selectedArchetypes.length > 0" class="space-y-2">
      <p class="text-[11px] font-semibold uppercase tracking-wide text-sky-900">
        Customize for Renni Inc.
      </p>
      <div
        v-for="archetype in selectedArchetypes"
        :key="archetype.id"
        class="rounded border border-stone-200 bg-white p-2"
      >
        <label class="block text-[11px] text-stone-700">
          <span class="font-semibold text-stone-800">
            How does the {{ archetype.label }} show up for Renni Inc.?
          </span>
          <textarea
            v-model="customNotes[archetype.id]"
            rows="2"
            placeholder="What's actually true for our customer? Specific behaviors, settings, or quotes you've heard."
            class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs"
          />
        </label>
      </div>
    </div>

    <!-- Output -->
    <div class="rounded border border-stone-200 bg-stone-50 p-2">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-[11px] font-semibold uppercase tracking-wide text-stone-700">
          Output (markdown)
        </p>
        <div class="flex flex-wrap items-center gap-1">
          <button
            type="button"
            class="rounded border border-stone-300 bg-white px-2 py-0.5 text-[10px] font-medium text-stone-700 hover:bg-stone-100"
            @click="clearAll"
          >
            Clear all
          </button>
          <button
            type="button"
            class="rounded border border-sky-300 bg-white px-2 py-0.5 text-[10px] font-medium text-sky-900 hover:bg-sky-50"
            @click="copyOutput"
          >
            {{ copyButtonLabel }}
          </button>
        </div>
      </div>
      <pre
        class="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded border border-stone-200 bg-white p-2 font-mono text-[11px] text-stone-800"
      >{{ buildMarkdown() }}</pre>
      <p class="mt-1 text-[10px] italic text-stone-500">
        Copy this output into Working Draft, edit it in your own
        words, add structured evidence for any major claim, then
        save with the existing Save button below.
      </p>
    </div>
  </section>
</template>
