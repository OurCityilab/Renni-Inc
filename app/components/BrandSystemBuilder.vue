<!--
  BrandSystemBuilder — Pass B specialized copy-only brand builder.
  Drives any TemplateStudioSection that opts in via
  `section.brandSystem: { enabled, kind, title, ... }`.

  POSTURE (do not relax)
  ----------------------
    - Pure UI + clipboard. Local component state only. No Firestore
      writes, no AI calls, no save handler.
    - Helps the student SHAPE brand decisions (audience, promise,
      voice, visual, proof, do/don't rules, sample copy). It is
      NOT design software — copy-only output.
    - Per-field opt-in via the config. Sections can render only the
      facets the chapter cares about (e.g. cross-brand sections may
      enable doDontRules + voiceTraits but not visualRules).
-->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import BuilderHandoffCallout from '~/components/BuilderHandoffCallout.vue'
import type {
  BrandSystemBuilderConfig,
  BrandSystemBuilderStarterCard
} from '~/types/templateStudio'

const props = defineProps<{
  config: BrandSystemBuilderConfig
}>()

const config = computed<BrandSystemBuilderConfig>(() => props.config)

interface Card extends BrandSystemBuilderStarterCard {}

function emptyCard(): Card {
  return {
    label: '',
    audience: '',
    promise: '',
    voiceTrait: '',
    doRule: '',
    dontRule: '',
    sampleCopy: '',
    visualRule: '',
    proof: ''
  }
}

function seedCards(): Card[] {
  if (config.value.starterCards && config.value.starterCards.length) {
    return config.value.starterCards.map((c) => ({ ...emptyCard(), ...c }))
  }
  return [emptyCard(), emptyCard()]
}

const cards = reactive<Card[]>(seedCards())
const copyButtonLabel = ref<string>('Copy brand notes')

interface FieldDef {
  key: keyof Card
  label: string
  enabledFlag: keyof BrandSystemBuilderConfig
  placeholder: string
  type: 'text' | 'textarea'
}

const FIELDS: FieldDef[] = [
  { key: 'audience', label: 'Audience', enabledFlag: 'audience', placeholder: 'who this brand serves', type: 'text' },
  { key: 'promise', label: 'Promise', enabledFlag: 'promise', placeholder: 'one promise to that audience', type: 'textarea' },
  { key: 'voiceTrait', label: 'Voice trait', enabledFlag: 'voiceTraits', placeholder: 'one tone trait (e.g. warm, blunt, witty)', type: 'text' },
  { key: 'doRule', label: 'Do rule', enabledFlag: 'doDontRules', placeholder: 'a do rule a teammate could follow', type: 'textarea' },
  { key: 'dontRule', label: "Don't rule", enabledFlag: 'doDontRules', placeholder: 'a don\'t rule a teammate could follow', type: 'textarea' },
  { key: 'sampleCopy', label: 'Sample copy', enabledFlag: 'copyExamples', placeholder: 'caption / sign / product line in this voice', type: 'textarea' },
  { key: 'visualRule', label: 'Visual rule', enabledFlag: 'visualRules', placeholder: 'color / type / image direction', type: 'textarea' },
  { key: 'proof', label: 'Proof', enabledFlag: 'proofPoints', placeholder: 'evidence / quote / observation', type: 'textarea' }
]

const visibleFields = computed<FieldDef[]>(() =>
  FIELDS.filter((f) => Boolean(config.value[f.enabledFlag]))
)

function fieldValue(card: Card, key: keyof Card): string {
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
  cards.splice(0, cards.length, emptyCard(), emptyCard())
}

function cardIsBlank(card: Card): boolean {
  if ((card.label ?? '').trim()) return false
  return visibleFields.value.every((f) => !fieldValue(card, f.key).trim())
}

function buildMarkdown(): string {
  const lead = config.value.copyTitle
    ? `## ${config.value.copyTitle}\n\n`
    : ''
  const visible = cards.filter((c) => !cardIsBlank(c))
  if (visible.length === 0) return `${lead}_No brand notes captured yet._`
  const blocks = visible.map((card, idx) => {
    const title = (card.label ?? '').trim() || `Brand card ${idx + 1}`
    const lines: string[] = [`### ${title}`]
    for (const f of visibleFields.value) {
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
        copyButtonLabel.value = 'Copy brand notes'
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
    class="rounded-lg border border-rose-300 bg-rose-50/30 p-4 text-sm shadow-sm flex flex-col gap-4 min-w-0"
    aria-label="Brand System Builder"
  >
    <header class="space-y-1">
      <p class="text-[11px] uppercase tracking-wide text-rose-800">
        Builder · {{ config.kind }}
      </p>
      <h3 class="text-base font-semibold text-rose-900">{{ config.title }}</h3>
      <p v-if="config.intro" class="text-xs text-rose-900">{{ config.intro }}</p>
    </header>

    <BuilderHandoffCallout />

    <p class="rounded border border-rose-200 bg-white p-2 text-[11px] italic text-neutral-700">
      This builder helps you shape brand decisions. It does not
      submit, approve, or save the final section for you.
    </p>

    <div class="space-y-3">
      <article
        v-for="(card, idx) in cards"
        :key="idx"
        class="rounded border border-stone-200 bg-white p-3"
      >
        <header class="mb-2 flex items-baseline justify-between gap-2">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-stone-700">
            Brand card {{ idx + 1 }}
          </p>
          <button
            type="button"
            class="text-[11px] text-stone-500 hover:text-rose-700"
            @click="removeCard(idx)"
          >
            Remove
          </button>
        </header>

        <label class="block text-[11px] text-stone-700">
          <span class="font-semibold uppercase tracking-wide">Label</span>
          <input
            :value="fieldValue(card, 'label')"
            type="text"
            placeholder="brand · facet · or short title"
            class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs"
            @input="(e) => { card.label = (e.target as HTMLInputElement).value }"
          />
        </label>

        <div class="mt-2 grid gap-2">
          <label
            v-for="f in visibleFields"
            :key="f.key as string"
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
        class="rounded border border-rose-400 bg-white px-2 py-1 text-xs font-medium text-rose-900 hover:bg-rose-100"
        @click="addCard"
      >
        + Add brand card
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
        Output (markdown)
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
