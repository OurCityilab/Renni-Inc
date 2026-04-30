<!--
  StrategyMemoBuilder — Pass B specialized copy-only strategy memo
  builder. Drives any TemplateStudioSection that opts in via
  `section.strategyMemo: { enabled, kind, title, fields, ... }`.

  POSTURE (do not relax)
  ----------------------
    - Pure UI + clipboard. Local component state only. No Firestore
      writes, no AI calls, no save handler.
    - Helps the team turn evidence into an action plan (insight ·
      evidence · recommendation · owner · due date · dependency ·
      definition of done · next validation · risk).
    - Field set is fully configurable per section via
      `config.fields`.
-->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import BuilderHandoffCallout from '~/components/BuilderHandoffCallout.vue'
import type {
  StrategyMemoBuilderConfig,
  StrategyMemoBuilderField,
  StrategyMemoBuilderStarterCard
} from '~/types/templateStudio'

const props = defineProps<{
  config: StrategyMemoBuilderConfig
}>()

const config = computed<StrategyMemoBuilderConfig>(() => props.config)

interface Card extends StrategyMemoBuilderStarterCard {}

function emptyCard(): Card {
  return {
    insight: '',
    evidence: '',
    recommendation: '',
    owner: '',
    dueDate: '',
    dependency: '',
    definitionOfDone: '',
    nextValidation: '',
    risk: ''
  }
}

function seedCards(): Card[] {
  if (config.value.starterCards && config.value.starterCards.length) {
    return config.value.starterCards.map((c) => ({ ...emptyCard(), ...c }))
  }
  const n = Math.max(1, config.value.cardCount ?? 3)
  return Array.from({ length: n }, () => emptyCard())
}

const cards = reactive<Card[]>(seedCards())
const copyButtonLabel = ref<string>('Copy memo')

interface FieldDef {
  key: StrategyMemoBuilderField
  label: string
  placeholder: string
  type: 'text' | 'textarea'
}

const FIELD_DEFS: Record<StrategyMemoBuilderField, FieldDef> = {
  insight: { key: 'insight', label: 'Insight', placeholder: 'one-line insight from this cohort', type: 'textarea' },
  evidence: { key: 'evidence', label: 'Evidence', placeholder: 'numbers · quotes · observation', type: 'textarea' },
  recommendation: { key: 'recommendation', label: 'Recommendation', placeholder: 'what next cohort / team should do', type: 'textarea' },
  owner: { key: 'owner', label: 'Owner', placeholder: 'role / name', type: 'text' },
  dueDate: { key: 'dueDate', label: 'Due', placeholder: 'when this lands', type: 'text' },
  dependency: { key: 'dependency', label: 'Dependency', placeholder: 'upstream work', type: 'text' },
  definitionOfDone: { key: 'definitionOfDone', label: 'Definition of done', placeholder: 'what proves it is done', type: 'textarea' },
  nextValidation: { key: 'nextValidation', label: 'Next validation', placeholder: 'what would confirm or break this', type: 'text' },
  risk: { key: 'risk', label: 'Risk', placeholder: 'what could make this wrong', type: 'text' }
}

const visibleFields = computed<FieldDef[]>(() => {
  const fields = config.value.fields && config.value.fields.length
    ? config.value.fields
    : (Object.keys(FIELD_DEFS) as StrategyMemoBuilderField[])
  return fields.map((f) => FIELD_DEFS[f]).filter(Boolean)
})

function fieldValue(card: Card, key: StrategyMemoBuilderField): string {
  const v = card[key]
  return typeof v === 'string' ? v : ''
}

function addCard(): void {
  cards.push(emptyCard())
}
function removeCard(idx: number): void {
  cards.splice(idx, 1)
  if (cards.length === 0) addCard()
}
function clearAll(): void {
  const n = Math.max(1, config.value.cardCount ?? 3)
  cards.splice(0, cards.length)
  for (let i = 0; i < n; i++) addCard()
}

function cardIsBlank(card: Card): boolean {
  return visibleFields.value.every((f) => !fieldValue(card, f.key).trim())
}

function buildMarkdown(): string {
  const lead = config.value.copyTitle
    ? `## ${config.value.copyTitle}\n\n`
    : ''
  const visible = cards.filter((c) => !cardIsBlank(c))
  if (visible.length === 0) {
    return `${lead}_No memo cards captured yet._`
  }
  const blocks = visible.map((card, idx) => {
    const insight = fieldValue(card, 'insight').trim()
    const title = insight || `Memo ${idx + 1}`
    const lines: string[] = [`### ${title}`]
    for (const f of visibleFields.value) {
      if (f.key === 'insight') continue // already in heading
      const v = fieldValue(card, f.key).trim()
      if (!v) continue
      lines.push(`- **${f.label}:** ${v}`)
    }
    return lines.join('\n')
  })
  return `${lead}${blocks.join('\n\n')}`
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
    class="rounded-lg border border-indigo-300 bg-indigo-50/30 p-4 text-sm shadow-sm flex flex-col gap-4 min-w-0"
    aria-label="Strategy Memo Builder"
  >
    <header class="space-y-1">
      <p class="text-[11px] uppercase tracking-wide text-indigo-800">
        Builder · {{ config.kind }}
      </p>
      <h3 class="text-base font-semibold text-indigo-900">{{ config.title }}</h3>
      <p v-if="config.intro" class="text-xs text-indigo-900">{{ config.intro }}</p>
    </header>

    <BuilderHandoffCallout />

    <p class="rounded border border-indigo-200 bg-white p-2 text-[11px] italic text-neutral-700">
      This builder helps you turn evidence into an action plan. It
      does not submit, approve, or save the final section for you.
    </p>

    <div class="space-y-3">
      <article
        v-for="(card, idx) in cards"
        :key="idx"
        class="rounded border border-stone-200 bg-white p-3"
      >
        <header class="mb-2 flex items-baseline justify-between gap-2">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-stone-700">
            Memo card {{ idx + 1 }}
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
            v-for="f in visibleFields"
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
              @input="(e) => { (card as Record<string, string>)[f.key] = (e.target as HTMLInputElement).value }"
            />
            <textarea
              v-else
              :value="fieldValue(card, f.key)"
              :placeholder="f.placeholder"
              rows="2"
              class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs"
              @input="(e) => { (card as Record<string, string>)[f.key] = (e.target as HTMLTextAreaElement).value }"
            />
          </label>
        </div>
      </article>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="rounded border border-indigo-400 bg-white px-2 py-1 text-xs font-medium text-indigo-900 hover:bg-indigo-100"
        @click="addCard"
      >
        + Add memo card
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
          @click="copyOutput"
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
