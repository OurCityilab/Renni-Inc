<!--
  DecisionMemoBuilder — Pass A reusable copy-only decision memo.
  Drives any TemplateStudioSection that opts in via
  `section.decisionMemo: { enabled, kind, title, starterCards?, ... }`.

  POSTURE (do not relax)
  ----------------------
    - Pure UI + clipboard. Local component state only. No Firestore
      writes, no AI calls, no save handler.
    - Each card carries: decision · options · evidence · criteria
      · recommendation · risk · owner · dueDate · definitionOfDone.
    - The student fills the cards, copies markdown, and pastes into
      Working Draft.
-->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import BuilderHandoffCallout from '~/components/BuilderHandoffCallout.vue'
import type {
  DecisionMemoBuilderCard,
  DecisionMemoBuilderConfig
} from '~/types/templateStudio'

const props = defineProps<{
  config: DecisionMemoBuilderConfig
}>()

const config = computed<DecisionMemoBuilderConfig>(() => props.config)

const FIELDS: Array<{
  key: keyof DecisionMemoBuilderCard
  label: string
  placeholder: string
  type: 'text' | 'textarea'
}> = [
  { key: 'decision', label: 'Decision', placeholder: 'What is the call?', type: 'text' },
  { key: 'options', label: 'Options considered', placeholder: 'A · B · C', type: 'textarea' },
  { key: 'evidence', label: 'Evidence', placeholder: 'numbers / quotes / observation', type: 'textarea' },
  { key: 'criteria', label: 'Criteria', placeholder: 'how the team chose', type: 'textarea' },
  { key: 'recommendation', label: 'Recommendation', placeholder: 'the chosen path + why', type: 'textarea' },
  { key: 'risk', label: 'Risk', placeholder: 'what could make this wrong', type: 'text' },
  { key: 'owner', label: 'Owner', placeholder: 'role / name', type: 'text' },
  { key: 'dueDate', label: 'Due', placeholder: 'when this lands', type: 'text' },
  { key: 'definitionOfDone', label: 'Definition of done', placeholder: 'what proves it is done', type: 'textarea' }
]

function emptyCard(): DecisionMemoBuilderCard {
  return {
    decision: '',
    options: '',
    evidence: '',
    criteria: '',
    recommendation: '',
    risk: '',
    owner: '',
    dueDate: '',
    definitionOfDone: ''
  }
}

function seedCards(): DecisionMemoBuilderCard[] {
  if (config.value.starterCards && config.value.starterCards.length) {
    return config.value.starterCards.map((c) => ({ ...emptyCard(), ...c }))
  }
  const n = Math.max(1, config.value.cardCount ?? 2)
  return Array.from({ length: n }, () => emptyCard())
}

const cards = reactive<DecisionMemoBuilderCard[]>(seedCards())
const copyButtonLabel = ref<string>('Copy memo')

function addCard(): void {
  cards.push(emptyCard())
}

function removeCard(idx: number): void {
  cards.splice(idx, 1)
  if (cards.length === 0) addCard()
}

function clearAll(): void {
  const n = Math.max(1, config.value.cardCount ?? 2)
  cards.splice(0, cards.length)
  for (let i = 0; i < n; i++) addCard()
}

function cardIsBlank(card: DecisionMemoBuilderCard): boolean {
  return FIELDS.every((f) => !String(card[f.key] ?? '').trim())
}

function fieldValue(
  card: DecisionMemoBuilderCard,
  key: keyof DecisionMemoBuilderCard
): string {
  const v = card[key]
  return typeof v === 'string' ? v : ''
}

function buildMarkdown(): string {
  const lead = config.value.copyTitle ? `## ${config.value.copyTitle}\n\n` : ''
  const visible = cards.filter((c) => !cardIsBlank(c))
  if (visible.length === 0) {
    return `${lead}_No decisions captured yet._`
  }
  const blocks = visible.map((card, idx) => {
    const title = (card.decision ?? '').trim() || `Decision ${idx + 1}`
    const lines: string[] = [`### ${title}`]
    for (const f of FIELDS) {
      if (f.key === 'decision') continue
      const v = fieldValue(card, f.key).trim()
      if (!v) continue
      lines.push(`- **${f.label}:** ${v}`)
    }
    return lines.join('\n')
  })
  return `${lead}${blocks.join('\n\n')}`
}

async function copyMemo(): Promise<void> {
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
        copyButtonLabel.value = 'Copy memo'
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
    class="rounded-lg border border-violet-300 bg-violet-50/30 p-4 text-sm shadow-sm flex flex-col gap-4 min-w-0"
    aria-label="Decision Memo Builder"
  >
    <header class="space-y-1">
      <p class="text-[11px] uppercase tracking-wide text-violet-800">
        Builder
      </p>
      <h3 class="text-base font-semibold text-violet-900">
        {{ config.title }}
      </h3>
      <p v-if="config.intro" class="text-xs text-violet-900">{{ config.intro }}</p>
    </header>

    <BuilderHandoffCallout />

    <p
      class="rounded border border-violet-200 bg-white p-2 text-[11px] italic text-neutral-700"
    >
      This memo helps you build the decision. It does not submit,
      approve, or save the final section for you.
    </p>

    <div class="space-y-3">
      <article
        v-for="(card, idx) in cards"
        :key="idx"
        class="rounded border border-stone-200 bg-white p-3"
      >
        <header class="mb-2 flex items-baseline justify-between gap-2">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-stone-700">
            Decision {{ idx + 1 }}
          </p>
          <button
            type="button"
            class="text-[11px] text-stone-500 hover:text-rose-700"
            @click="removeCard(idx)"
          >
            Remove
          </button>
        </header>

        <div class="grid gap-2">
          <label
            v-for="f in FIELDS"
            :key="f.key"
            class="block text-[11px] text-stone-700"
          >
            <span class="font-semibold uppercase tracking-wide">{{ f.label }}</span>
            <input
              v-if="f.type === 'text'"
              :value="fieldValue(card, f.key)"
              type="text"
              :placeholder="f.placeholder"
              class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs"
              @input="(e) => { (card as Record<string, string>)[f.key as string] = (e.target as HTMLInputElement).value }"
            />
            <textarea
              v-else
              :value="fieldValue(card, f.key)"
              :placeholder="f.placeholder"
              rows="2"
              class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs"
              @input="(e) => { (card as Record<string, string>)[f.key as string] = (e.target as HTMLTextAreaElement).value }"
            />
          </label>
        </div>
      </article>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="rounded border border-violet-400 bg-white px-2 py-1 text-xs font-medium text-violet-900 hover:bg-violet-100"
        @click="addCard"
      >
        + Add decision
      </button>
      <button
        type="button"
        class="rounded border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100"
        @click="clearAll"
      >
        Clear all
      </button>
    </div>

    <div class="rounded border border-stone-200 bg-stone-50 p-3">
      <p class="mb-1 text-[11px] font-semibold uppercase tracking-wide text-stone-700">
        Output (markdown memo)
      </p>
      <pre
        class="whitespace-pre overflow-x-auto rounded border border-stone-200 bg-white p-2 font-mono text-[11px] text-stone-800"
      >{{ buildMarkdown() }}</pre>
      <div class="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="rounded border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-stone-800 hover:bg-stone-100"
          @click="copyMemo"
        >
          {{ copyButtonLabel }}
        </button>
        <span class="text-[11px] text-stone-500">
          Copy this output into Working Draft, edit it in your own
          words, then save with the existing Save button below.
        </span>
      </div>
    </div>
  </section>
</template>
