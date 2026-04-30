<!--
  RetailPitchBuilder — Pass B specialized copy-only retail-carry
  pitch builder. Drives any TemplateStudioSection that opts in via
  `section.retailPitch: { enabled, kind, title, ... }`.

  POSTURE (do not relax)
  ----------------------
    - Pure UI + clipboard. Local component state only. No Firestore
      writes, no AI calls, no save handler.
    - Helps the team prepare a Phoenix Nest retail carry pitch as
      a pitch (buyer · SKU · shelf fit · price/margin · proof ·
      readiness · ask · risk · next step). Frames Phoenix Nest as
      retail carry, not generic marketing.
    - Per-field opt-in via include flags.
    - Optional product autocomplete on the SKU column when the
      parent passes productOptions; the input remains free text.
-->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import BuilderHandoffCallout from '~/components/BuilderHandoffCallout.vue'
import type {
  RetailPitchBuilderConfig,
  RetailPitchBuilderStarterCard
} from '~/types/templateStudio'

const props = defineProps<{
  config: RetailPitchBuilderConfig
  productOptions?: string[]
}>()

const config = computed<RetailPitchBuilderConfig>(() => props.config)

interface Card extends RetailPitchBuilderStarterCard {}

function emptyCard(): Card {
  return {
    buyer: '',
    productSku: '',
    shelfFit: '',
    priceMargin: '',
    proof: '',
    readiness: '',
    ask: '',
    risk: '',
    nextStep: ''
  }
}

function seedCards(): Card[] {
  if (config.value.starterCards && config.value.starterCards.length) {
    return config.value.starterCards.map((c) => ({ ...emptyCard(), ...c }))
  }
  return [emptyCard()]
}

const cards = reactive<Card[]>(seedCards())
const copyButtonLabel = ref<string>('Copy pitch notes')

interface FieldDef {
  key: keyof Card
  label: string
  enabledFlag: keyof RetailPitchBuilderConfig
  placeholder: string
  type: 'text' | 'textarea'
  productAutocomplete?: boolean
}

const FIELDS: FieldDef[] = [
  { key: 'buyer', label: 'Buyer', enabledFlag: 'includeBuyer', placeholder: 'named retail buyer (Phoenix Nest contact)', type: 'text' },
  { key: 'productSku', label: 'Product / SKU', enabledFlag: 'includeProductSku', placeholder: 'product proposed for the shelf', type: 'text', productAutocomplete: true },
  { key: 'shelfFit', label: 'Shelf fit', enabledFlag: 'includeShelfFit', placeholder: 'why this product belongs on this buyer\'s shelf', type: 'textarea' },
  { key: 'priceMargin', label: 'Price / margin logic', enabledFlag: 'includePriceMargin', placeholder: 'wholesale · retail · margin assumption', type: 'textarea' },
  { key: 'proof', label: 'Proof', enabledFlag: 'includeProof', placeholder: 'sell-through · customer quote · comparable', type: 'textarea' },
  { key: 'readiness', label: 'Readiness', enabledFlag: 'includeReadiness', placeholder: 'inventory + production we can defend', type: 'textarea' },
  { key: 'ask', label: 'Ask', enabledFlag: 'includeAsk', placeholder: 'specific yes/no the buyer can act on', type: 'textarea' },
  { key: 'risk', label: 'Risk', enabledFlag: 'includeRisk', placeholder: 'what could make this pitch wrong', type: 'text' },
  { key: 'nextStep', label: 'Next step', enabledFlag: 'includeNextStep', placeholder: 'after the meeting', type: 'text' }
]

const visibleFields = computed<FieldDef[]>(() =>
  FIELDS.filter((f) => Boolean(config.value[f.enabledFlag]))
)

const hasProductOptions = computed<boolean>(
  () => (props.productOptions?.length ?? 0) > 0
)

const datalistId = computed<string>(() => `rpb-products-${config.value.kind}`)

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
  cards.splice(0, cards.length, emptyCard())
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
    return `${lead}_No pitch cards captured yet._`
  }
  const blocks = visible.map((card, idx) => {
    const title = (card.buyer ?? '').trim() || `Pitch card ${idx + 1}`
    const lines: string[] = [`### ${title}`]
    for (const f of visibleFields.value) {
      if (f.key === 'buyer') continue // already in heading
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
        copyButtonLabel.value = 'Copy pitch notes'
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
    class="rounded-lg border border-amber-300 bg-amber-50/30 p-4 text-sm shadow-sm flex flex-col gap-4 min-w-0"
    aria-label="Retail Pitch Builder"
  >
    <header class="space-y-1">
      <p class="text-[11px] uppercase tracking-wide text-amber-800">
        Builder · {{ config.kind }}
      </p>
      <h3 class="text-base font-semibold text-amber-900">{{ config.title }}</h3>
      <p v-if="config.intro" class="text-xs text-amber-900">{{ config.intro }}</p>
    </header>

    <BuilderHandoffCallout />

    <p class="rounded border border-amber-200 bg-white p-2 text-[11px] italic text-neutral-700">
      This builder helps you prepare a retail carry pitch. It does
      not submit, approve, or save the final section for you.
    </p>

    <datalist v-if="hasProductOptions" :id="datalistId">
      <option v-for="opt in productOptions" :key="opt" :value="opt" />
    </datalist>

    <div class="space-y-3">
      <article
        v-for="(card, idx) in cards"
        :key="idx"
        class="rounded border border-stone-200 bg-white p-3"
      >
        <header class="mb-2 flex items-baseline justify-between gap-2">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-stone-700">
            Pitch card {{ idx + 1 }}
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
            :key="f.key as string"
            class="block text-[11px] text-stone-700"
          >
            <span class="font-semibold uppercase tracking-wide">{{ f.label }}</span>
            <input
              v-if="f.type === 'text'"
              :value="fieldValue(card, f.key)"
              type="text"
              :placeholder="f.placeholder"
              :list="f.productAutocomplete && hasProductOptions ? datalistId : undefined"
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
        class="rounded border border-amber-400 bg-white px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
        @click="addCard"
      >
        + Add pitch card
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
