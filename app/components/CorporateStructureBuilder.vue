<!--
  CorporateStructureBuilder — educational + planning only.
  Helps students draft a model for entity type, 70/30 ownership,
  student equity allocation, vesting, distributions, governance,
  graduation/exit rules, and the adult/legal review checklist.

  POSTURE (non-negotiable, do not relax)
  --------------------------------------
    - Educational and planning-oriented only. NOT legal, tax,
      securities, accounting, or investment advice.
    - Renders a non-removable safety disclaimer on every view.
    - Local component state only. No Firestore writes, no AI calls,
      no save handler, no automatic Working-Draft writes, no emit.
    - Treated as a primary builder by DeliverableOutputWorkspace —
      Pass A universal builders are suppressed on the same section.
    - Output is markdown the student copies into Working Draft and
      edits in their own words. The chief / instructor reviews
      through the existing approval flow; the builder never claims
      anything is approved.
    - Every output document carries the prefix "Draft educational
      model. Instructor/adult/legal review required before any
      real-world use."
-->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import BuilderHandoffCallout from '~/components/BuilderHandoffCallout.vue'
import type {
  CorporateStructureBuilderConfig,
  CorporateStructureEntityTypeOption
} from '~/types/templateStudio'

const props = defineProps<{
  config: CorporateStructureBuilderConfig
}>()

const config = computed<CorporateStructureBuilderConfig>(() => props.config)

// ---- Section state ----------------------------------------------

interface AllocationRow {
  participant: string
  proposedPercent: string // string so we can warn on partial input
  rationale: string
  vestingApplies: 'Yes' | 'No' | 'Undecided'
  notes: string
}

const selectedEntityTypeIds = ref<string[]>([])
const ownershipNonprofit = ref<number>(
  config.value.ownershipModel.nonprofitSharePercentDefault
)
const ownershipStudent = ref<number>(
  config.value.ownershipModel.studentSharePercentDefault
)
const allocationRows = reactive<AllocationRow[]>([
  {
    participant: '',
    proposedPercent: '',
    rationale: '',
    vestingApplies: 'Undecided',
    notes: ''
  }
])

const vestingState = reactive({
  enabled: config.value.vesting.enabledDefault ? 'Yes' : 'No' as 'Yes' | 'No' | 'Undecided',
  schedule:
    config.value.vesting.scheduleOptions[0] ?? '',
  cliffOrMilestone: '',
  graduationRule: '',
  leavingEarlyRule: '',
  nextCohortRule: '',
  unresolvedReviewQuestion: ''
})

const dividendState = reactive({
  allowed: 'Undecided' as 'Yes' | 'No' | 'Undecided',
  trigger: '',
  paidOrReinvested: '',
  approver: '',
  unresolvedReview: ''
})

const governanceState = reactive({
  productDecisions: '',
  financialDecisions: '',
  equityDecisions: '',
  ourCityRole: '',
  instructorReviewRole: '',
  unresolvedQuestion: ''
})

const continuityState = reactive({
  graduation: '',
  earlyDeparture: '',
  newStudentJoin: '',
  staysWithCompany: '',
  yearlyReview: ''
})

const reviewChecklist = reactive<Record<string, boolean>>({
  entityTypeReviewed: false,
  ownershipModelReviewed: false,
  studentAllocationReviewed: false,
  vestingReviewed: false,
  distributionPolicyReviewed: false,
  governanceReviewed: false,
  graduationRulesReviewed: false,
  unresolvedQuestionsListed: false,
  adultReviewCompleted: false
})

const reviewChecklistLabels: Record<string, string> = {
  entityTypeReviewed: 'Entity type comparison reviewed',
  ownershipModelReviewed: '70/30 ownership model reviewed',
  studentAllocationReviewed: 'Student allocation reviewed',
  vestingReviewed: 'Vesting plan reviewed',
  distributionPolicyReviewed: 'Distribution / dividend policy reviewed',
  governanceReviewed: 'Governance / voting reviewed',
  graduationRulesReviewed: 'Graduation / exit rules reviewed',
  unresolvedQuestionsListed:
    'Unresolved legal / tax / accounting / securities questions listed',
  adultReviewCompleted:
    'Instructor / adult / legal review completed before any real-world use'
}

const copyButtonLabel = ref<string>('Copy draft model')

// ---- Helpers / derived ------------------------------------------

const ownershipTotal = computed<number>(
  () => Number(ownershipNonprofit.value || 0) + Number(ownershipStudent.value || 0)
)
const ownershipTotalIsValid = computed<boolean>(
  () => ownershipTotal.value === 100
)

function parseAllocationPercent(v: string): number {
  const n = Number((v ?? '').toString().trim())
  return Number.isFinite(n) ? n : 0
}

const allocationTotal = computed<number>(() =>
  allocationRows.reduce((acc, r) => acc + parseAllocationPercent(r.proposedPercent), 0)
)

const allocationTargetPool = computed<number>(() =>
  Number(ownershipStudent.value || 0)
)

const allocationMatchesPool = computed<boolean>(
  () => allocationTotal.value === allocationTargetPool.value
)

function selectedEntityTypes(): CorporateStructureEntityTypeOption[] {
  return config.value.entityTypeOptions.filter((opt) =>
    selectedEntityTypeIds.value.includes(opt.id)
  )
}

function toggleEntityType(id: string): void {
  if (selectedEntityTypeIds.value.includes(id)) {
    selectedEntityTypeIds.value = selectedEntityTypeIds.value.filter((x) => x !== id)
  } else {
    selectedEntityTypeIds.value = [...selectedEntityTypeIds.value, id]
  }
}

function isEntityTypeSelected(id: string): boolean {
  return selectedEntityTypeIds.value.includes(id)
}

function addAllocationRow(): void {
  allocationRows.push({
    participant: '',
    proposedPercent: '',
    rationale: '',
    vestingApplies: 'Undecided',
    notes: ''
  })
}

function removeAllocationRow(idx: number): void {
  allocationRows.splice(idx, 1)
  if (allocationRows.length === 0) addAllocationRow()
}

// ---- Markdown copy ----------------------------------------------

function buildMarkdown(): string {
  const lead = config.value.copyTitle
    ? `## ${config.value.copyTitle}\n\n`
    : ''
  const lines: string[] = [
    lead.trim(),
    '> **Draft educational model. Instructor / adult / legal review required before any real-world use.**',
    '> This is not legal, tax, securities, accounting, or investment advice. Renni Command Center cannot create entities, grant equity, or maintain a real cap table.',
    ''
  ]
  // Entity type
  lines.push('### Entity type — under consideration')
  if (selectedEntityTypes().length === 0) {
    lines.push('_No entity type selected yet._')
  } else {
    for (const t of selectedEntityTypes()) {
      lines.push(`- **${t.label}** — ${t.educationalExplanation}`)
      if (t.commonTradeoffs.length) {
        lines.push(`  - Common tradeoffs: ${t.commonTradeoffs.join('; ')}`)
      }
      if (t.adultReviewQuestions.length) {
        lines.push(`  - Adult review questions: ${t.adultReviewQuestions.join('; ')}`)
      }
    }
  }
  lines.push('')
  // Ownership
  lines.push('### Ownership model (draft)')
  lines.push(`- Our City nonprofit: **${ownershipNonprofit.value}%**`)
  lines.push(`- Student ownership pool: **${ownershipStudent.value}%**`)
  if (!ownershipTotalIsValid.value) {
    lines.push(
      `- ⚠ Draft percentages currently total ${ownershipTotal.value}%. Must total 100% before any real-world use.`
    )
  }
  lines.push('')
  // Allocation table
  lines.push('### Student equity allocation (draft)')
  if (allocationRows.every((r) => !r.participant.trim() && !r.proposedPercent.trim())) {
    lines.push('_No allocation rows captured yet._')
  } else {
    lines.push('| Participant / role | Proposed % | Rationale | Vesting? | Notes |')
    lines.push('|---|---|---|---|---|')
    for (const r of allocationRows) {
      if (
        !r.participant.trim() &&
        !r.proposedPercent.trim() &&
        !r.rationale.trim() &&
        !r.notes.trim()
      ) continue
      lines.push(
        `| ${r.participant.trim() || '—'} | ${r.proposedPercent.trim() || '—'} | ${r.rationale.trim() || '—'} | ${r.vestingApplies} | ${r.notes.trim() || '—'} |`
      )
    }
    lines.push(
      `- Total proposed: **${allocationTotal.value}%** (target = student pool ${allocationTargetPool.value}%).`
    )
    if (!allocationMatchesPool.value) {
      lines.push(
        `- ⚠ Student allocation does not yet match the ${allocationTargetPool.value}% student pool.`
      )
    }
  }
  lines.push('')
  // Vesting
  lines.push('### Vesting (draft)')
  lines.push(`- Vesting enabled: **${vestingState.enabled}**`)
  lines.push(`- Schedule option: ${vestingState.schedule || '—'}`)
  lines.push(`- Cliff / milestone: ${vestingState.cliffOrMilestone || '—'}`)
  lines.push(`- Graduation rule: ${vestingState.graduationRule || '—'}`)
  lines.push(`- Leaving-early rule: ${vestingState.leavingEarlyRule || '—'}`)
  lines.push(`- Next-cohort rule: ${vestingState.nextCohortRule || '—'}`)
  lines.push(
    `- Unresolved review question: ${vestingState.unresolvedReviewQuestion || '—'}`
  )
  lines.push('')
  // Distributions
  lines.push('### Distributions / dividends (draft policy)')
  lines.push(`- Allowed: **${dividendState.allowed}**`)
  lines.push(`- Trigger: ${dividendState.trigger || '—'}`)
  lines.push(`- Paid / reinvested first: ${dividendState.paidOrReinvested || '—'}`)
  lines.push(`- Approver: ${dividendState.approver || '—'}`)
  lines.push(
    `- Unresolved tax / accounting review question: ${dividendState.unresolvedReview || '—'}`
  )
  lines.push(
    '- Note: this is not tax or accounting advice. Talk to the instructor and any required adult / legal reviewer before any distribution policy goes live.'
  )
  lines.push('')
  // Governance
  lines.push('### Governance / voting (draft)')
  lines.push(`- Product decisions: ${governanceState.productDecisions || '—'}`)
  lines.push(`- Financial decisions: ${governanceState.financialDecisions || '—'}`)
  lines.push(`- Equity / distribution decisions: ${governanceState.equityDecisions || '—'}`)
  lines.push(`- Our City nonprofit role: ${governanceState.ourCityRole || '—'}`)
  lines.push(
    `- Instructor / adult review role: ${governanceState.instructorReviewRole || '—'}`
  )
  lines.push(
    `- Unresolved governance question: ${governanceState.unresolvedQuestion || '—'}`
  )
  lines.push('')
  // Continuity
  lines.push('### Graduation / exit / continuity (draft)')
  lines.push(`- When a student graduates: ${continuityState.graduation || '—'}`)
  lines.push(`- When a student leaves early: ${continuityState.earlyDeparture || '—'}`)
  lines.push(`- How new students join: ${continuityState.newStudentJoin || '—'}`)
  lines.push(`- What stays with Renni Inc.: ${continuityState.staysWithCompany || '—'}`)
  lines.push(`- Yearly review: ${continuityState.yearlyReview || '—'}`)
  lines.push('')
  // Review checklist
  lines.push('### Adult / legal review checklist')
  for (const key of Object.keys(reviewChecklistLabels)) {
    const checked = reviewChecklist[key]
    lines.push(`- [${checked ? 'x' : ' '}] ${reviewChecklistLabels[key]}`)
  }
  lines.push('')
  // Unresolved questions
  if (config.value.unresolvedLegalQuestionPrompts.length) {
    lines.push('### Unresolved legal / tax / securities / accounting questions')
    for (const q of config.value.unresolvedLegalQuestionPrompts) {
      lines.push(`- ${q}`)
    }
    lines.push(
      '> Add the team\'s answers — and any new questions — in Working Draft. The instructor / adult / legal reviewer must sign off before any real-world use.'
    )
  }
  return lines.join('\n')
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
        copyButtonLabel.value = 'Copy draft model'
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
    class="rounded-lg border border-amber-400 bg-amber-50/30 p-3 text-sm shadow-sm flex flex-col gap-3 min-w-0"
    aria-label="Corporate Structure Builder"
  >
    <header class="space-y-1">
      <p class="text-[11px] uppercase tracking-wide text-amber-800">
        Builder · corporate structure (draft)
      </p>
      <h3 class="text-base font-semibold text-amber-900">
        {{ config.title }}
      </h3>
      <p v-if="config.intro" class="text-xs text-amber-900">
        {{ config.intro }}
      </p>
    </header>

    <BuilderHandoffCallout />

    <!-- Non-removable safety disclaimer -->
    <p
      class="rounded border border-rose-300 bg-rose-50 p-2 text-[12px] font-semibold text-rose-900"
      role="note"
    >
      Draft educational model. Instructor / adult / legal review is
      required before any real-world use. This builder is NOT legal,
      tax, securities, accounting, or investment advice. Renni
      Command Center cannot create entities, grant equity, or
      maintain a real cap table.
    </p>

    <!-- Entity type selector -->
    <section class="space-y-2 rounded border border-stone-200 bg-white p-2">
      <header>
        <p class="text-[11px] font-semibold uppercase tracking-wide text-stone-700">
          1. Entity type — under consideration
        </p>
        <p class="text-[11px] italic text-stone-500">
          Pick one or more to compare. Each option shows a plain-
          English explanation, common tradeoffs, and questions for
          the adult reviewer.
        </p>
      </header>
      <ul class="grid gap-2 sm:grid-cols-2 min-w-0">
        <li
          v-for="opt in config.entityTypeOptions"
          :key="opt.id"
          class="rounded border bg-white p-2 text-[11px]"
          :class="
            isEntityTypeSelected(opt.id)
              ? 'border-amber-500 ring-2 ring-amber-200'
              : 'border-stone-200'
          "
        >
          <header class="flex items-baseline justify-between gap-1">
            <p class="font-semibold text-stone-900 break-words">{{ opt.label }}</p>
            <button
              type="button"
              class="rounded border px-1.5 py-0.5 text-[10px] font-medium"
              :class="
                isEntityTypeSelected(opt.id)
                  ? 'border-amber-500 bg-amber-50 text-amber-900'
                  : 'border-amber-300 bg-white text-amber-900 hover:bg-amber-50'
              "
              @click="toggleEntityType(opt.id)"
            >
              {{ isEntityTypeSelected(opt.id) ? '✓ Selected' : 'Select' }}
            </button>
          </header>
          <p class="mt-1 text-stone-700">{{ opt.educationalExplanation }}</p>
          <details v-if="opt.commonTradeoffs.length || opt.adultReviewQuestions.length" class="mt-1">
            <summary class="cursor-pointer text-stone-600">More detail</summary>
            <div class="mt-1 space-y-1">
              <div v-if="opt.commonTradeoffs.length">
                <p class="font-semibold text-stone-700">Common tradeoffs</p>
                <ul class="ml-4 list-disc text-stone-700">
                  <li v-for="(t, i) in opt.commonTradeoffs" :key="i">{{ t }}</li>
                </ul>
              </div>
              <div v-if="opt.adultReviewQuestions.length">
                <p class="font-semibold text-rose-800">Adult review questions</p>
                <ul class="ml-4 list-disc text-rose-800">
                  <li v-for="(q, i) in opt.adultReviewQuestions" :key="i">{{ q }}</li>
                </ul>
              </div>
            </div>
          </details>
        </li>
      </ul>
    </section>

    <!-- Ownership model -->
    <section class="space-y-2 rounded border border-stone-200 bg-white p-2">
      <header>
        <p class="text-[11px] font-semibold uppercase tracking-wide text-stone-700">
          2. Ownership model (draft)
        </p>
        <p class="text-[11px] italic text-stone-500">
          Default is 30% Our City nonprofit / 70% student pool. This
          is a draft model, not a legal ownership record.
        </p>
      </header>
      <div class="grid gap-2 sm:grid-cols-2">
        <label class="block text-[11px] text-stone-700">
          <span class="font-semibold">Our City nonprofit %</span>
          <input
            v-model.number="ownershipNonprofit"
            type="number"
            min="0"
            max="100"
            :disabled="!config.ownershipModel.allowCustomScenario"
            class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs disabled:bg-stone-50"
          />
        </label>
        <label class="block text-[11px] text-stone-700">
          <span class="font-semibold">Student ownership pool %</span>
          <input
            v-model.number="ownershipStudent"
            type="number"
            min="0"
            max="100"
            :disabled="!config.ownershipModel.allowCustomScenario"
            class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs disabled:bg-stone-50"
          />
        </label>
      </div>
      <p
        v-if="!ownershipTotalIsValid"
        class="rounded border border-rose-300 bg-rose-50 p-1 text-[11px] font-semibold text-rose-900"
      >
        ⚠ Draft percentages must total 100% before you copy this section.
        Currently {{ ownershipTotal }}%.
      </p>
    </section>

    <!-- Student allocation table -->
    <section class="space-y-2 rounded border border-stone-200 bg-white p-2">
      <header>
        <p class="text-[11px] font-semibold uppercase tracking-wide text-stone-700">
          3. Student equity allocation (draft)
        </p>
        <p class="text-[11px] italic text-stone-500">
          Add a row per participant or role. Total must match the
          {{ allocationTargetPool }}% student pool. Draft only — not
          a legal cap table.
        </p>
      </header>
      <div class="space-y-2">
        <article
          v-for="(row, idx) in allocationRows"
          :key="idx"
          class="rounded border border-stone-200 bg-white p-2 text-[11px]"
        >
          <header class="mb-1 flex items-baseline justify-between gap-2">
            <p class="font-semibold uppercase tracking-wide text-stone-700">
              Row {{ idx + 1 }}
            </p>
            <button
              type="button"
              class="text-[10px] text-stone-500 hover:text-rose-700"
              @click="removeAllocationRow(idx)"
            >
              Remove
            </button>
          </header>
          <div class="grid gap-2 sm:grid-cols-2">
            <label class="block">
              <span class="font-semibold">Participant / role</span>
              <input
                v-model="row.participant"
                type="text"
                placeholder="role / name"
                class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs"
              />
            </label>
            <label class="block">
              <span class="font-semibold">Proposed share %</span>
              <input
                v-model="row.proposedPercent"
                type="number"
                min="0"
                max="100"
                inputmode="decimal"
                placeholder="0"
                class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs"
              />
            </label>
            <label class="block sm:col-span-2">
              <span class="font-semibold">Rationale</span>
              <textarea
                v-model="row.rationale"
                rows="2"
                placeholder="why this share — leadership role, time, contribution, etc."
                class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs"
              />
            </label>
            <label class="block">
              <span class="font-semibold">Vesting applies?</span>
              <select
                v-model="row.vestingApplies"
                class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs"
              >
                <option>Undecided</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </label>
            <label class="block">
              <span class="font-semibold">Notes / unresolved question</span>
              <input
                v-model="row.notes"
                type="text"
                placeholder="open question for the reviewer"
                class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs"
              />
            </label>
          </div>
        </article>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="rounded border border-amber-400 bg-white px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
          @click="addAllocationRow"
        >
          + Add row
        </button>
        <span class="text-[11px] text-stone-700">
          Total proposed: <strong>{{ allocationTotal }}%</strong>
          (target = student pool {{ allocationTargetPool }}%)
        </span>
      </div>
      <p
        v-if="!allocationMatchesPool"
        class="rounded border border-amber-300 bg-amber-50 p-1 text-[11px] font-semibold text-amber-900"
      >
        Student allocation does not yet match the {{ allocationTargetPool }}% student pool.
      </p>
    </section>

    <!-- Vesting -->
    <section class="space-y-2 rounded border border-stone-200 bg-white p-2">
      <header>
        <p class="text-[11px] font-semibold uppercase tracking-wide text-stone-700">
          4. Vesting (draft)
        </p>
      </header>
      <div class="grid gap-2 sm:grid-cols-2">
        <label class="block text-[11px] text-stone-700">
          <span class="font-semibold">Vesting enabled?</span>
          <select v-model="vestingState.enabled" class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs">
            <option>Yes</option>
            <option>No</option>
            <option>Undecided</option>
          </select>
        </label>
        <label class="block text-[11px] text-stone-700">
          <span class="font-semibold">Schedule option</span>
          <select v-model="vestingState.schedule" class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs">
            <option v-for="opt in config.vesting.scheduleOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </label>
        <label class="block text-[11px] text-stone-700 sm:col-span-2">
          <span class="font-semibold">Cliff / milestone</span>
          <input v-model="vestingState.cliffOrMilestone" type="text" placeholder="e.g. 1-year cliff, project milestone" class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs" />
        </label>
        <label class="block text-[11px] text-stone-700">
          <span class="font-semibold">Graduation rule</span>
          <input v-model="vestingState.graduationRule" type="text" class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs" />
        </label>
        <label class="block text-[11px] text-stone-700">
          <span class="font-semibold">Leaving-early rule</span>
          <input v-model="vestingState.leavingEarlyRule" type="text" class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs" />
        </label>
        <label class="block text-[11px] text-stone-700 sm:col-span-2">
          <span class="font-semibold">Next-cohort rule</span>
          <input v-model="vestingState.nextCohortRule" type="text" class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs" />
        </label>
        <label class="block text-[11px] text-stone-700 sm:col-span-2">
          <span class="font-semibold">Unresolved review question</span>
          <input v-model="vestingState.unresolvedReviewQuestion" type="text" class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs" />
        </label>
      </div>
      <details v-if="config.vesting.exitRulePrompts.length" class="text-[11px] text-stone-700">
        <summary class="cursor-pointer">Exit-rule prompts</summary>
        <ul class="mt-1 ml-4 list-disc">
          <li v-for="(p, i) in config.vesting.exitRulePrompts" :key="i">{{ p }}</li>
        </ul>
      </details>
    </section>

    <!-- Distributions / dividends -->
    <section class="space-y-2 rounded border border-stone-200 bg-white p-2">
      <header>
        <p class="text-[11px] font-semibold uppercase tracking-wide text-stone-700">
          5. Distributions / dividends (draft policy)
        </p>
        <p class="text-[11px] italic text-rose-800">
          Not tax or accounting advice. Adult / legal review required.
        </p>
      </header>
      <div class="grid gap-2 sm:grid-cols-2">
        <label class="block text-[11px] text-stone-700">
          <span class="font-semibold">Will distributions be allowed?</span>
          <select v-model="dividendState.allowed" class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs">
            <option>Undecided</option>
            <option>Yes</option>
            <option>No</option>
          </select>
        </label>
        <label class="block text-[11px] text-stone-700">
          <span class="font-semibold">What triggers a distribution?</span>
          <input v-model="dividendState.trigger" type="text" class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs" />
        </label>
        <label class="block text-[11px] text-stone-700 sm:col-span-2">
          <span class="font-semibold">What must be paid / reinvested first?</span>
          <input v-model="dividendState.paidOrReinvested" type="text" class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs" />
        </label>
        <label class="block text-[11px] text-stone-700">
          <span class="font-semibold">Approver</span>
          <input v-model="dividendState.approver" type="text" class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs" />
        </label>
        <label class="block text-[11px] text-stone-700">
          <span class="font-semibold">Unresolved tax / accounting review question</span>
          <input v-model="dividendState.unresolvedReview" type="text" class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs" />
        </label>
      </div>
      <details v-if="config.dividendPolicyPrompts.length" class="text-[11px] text-stone-700">
        <summary class="cursor-pointer">Distribution-policy prompts</summary>
        <ul class="mt-1 ml-4 list-disc">
          <li v-for="(p, i) in config.dividendPolicyPrompts" :key="i">{{ p }}</li>
        </ul>
      </details>
    </section>

    <!-- Governance / voting -->
    <section class="space-y-2 rounded border border-stone-200 bg-white p-2">
      <header>
        <p class="text-[11px] font-semibold uppercase tracking-wide text-stone-700">
          6. Governance / voting (draft)
        </p>
      </header>
      <div class="grid gap-2 sm:grid-cols-2">
        <label class="block text-[11px] text-stone-700 sm:col-span-2">
          <span class="font-semibold">Who votes on product decisions?</span>
          <input v-model="governanceState.productDecisions" type="text" class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs" />
        </label>
        <label class="block text-[11px] text-stone-700 sm:col-span-2">
          <span class="font-semibold">Who votes on financial decisions?</span>
          <input v-model="governanceState.financialDecisions" type="text" class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs" />
        </label>
        <label class="block text-[11px] text-stone-700 sm:col-span-2">
          <span class="font-semibold">Who votes on equity / distribution decisions?</span>
          <input v-model="governanceState.equityDecisions" type="text" class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs" />
        </label>
        <label class="block text-[11px] text-stone-700 sm:col-span-2">
          <span class="font-semibold">Role of the Our City nonprofit (30% owner)</span>
          <input v-model="governanceState.ourCityRole" type="text" class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs" />
        </label>
        <label class="block text-[11px] text-stone-700 sm:col-span-2">
          <span class="font-semibold">Role of instructor / adult review</span>
          <input v-model="governanceState.instructorReviewRole" type="text" class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs" />
        </label>
        <label class="block text-[11px] text-stone-700 sm:col-span-2">
          <span class="font-semibold">Unresolved governance question</span>
          <input v-model="governanceState.unresolvedQuestion" type="text" class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs" />
        </label>
      </div>
      <details v-if="config.votingRightsPrompts.length" class="text-[11px] text-stone-700">
        <summary class="cursor-pointer">Voting-rights prompts</summary>
        <ul class="mt-1 ml-4 list-disc">
          <li v-for="(p, i) in config.votingRightsPrompts" :key="i">{{ p }}</li>
        </ul>
      </details>
    </section>

    <!-- Continuity -->
    <section class="space-y-2 rounded border border-stone-200 bg-white p-2">
      <header>
        <p class="text-[11px] font-semibold uppercase tracking-wide text-stone-700">
          7. Graduation / exit / continuity (draft)
        </p>
      </header>
      <div class="grid gap-2 sm:grid-cols-2">
        <label class="block text-[11px] text-stone-700 sm:col-span-2">
          <span class="font-semibold">When a student graduates</span>
          <input v-model="continuityState.graduation" type="text" class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs" />
        </label>
        <label class="block text-[11px] text-stone-700 sm:col-span-2">
          <span class="font-semibold">When a student leaves early</span>
          <input v-model="continuityState.earlyDeparture" type="text" class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs" />
        </label>
        <label class="block text-[11px] text-stone-700 sm:col-span-2">
          <span class="font-semibold">How new students join</span>
          <input v-model="continuityState.newStudentJoin" type="text" class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs" />
        </label>
        <label class="block text-[11px] text-stone-700 sm:col-span-2">
          <span class="font-semibold">What stays with Renni Inc.</span>
          <input v-model="continuityState.staysWithCompany" type="text" class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs" />
        </label>
        <label class="block text-[11px] text-stone-700 sm:col-span-2">
          <span class="font-semibold">What is reviewed each year</span>
          <input v-model="continuityState.yearlyReview" type="text" class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs" />
        </label>
      </div>
      <details v-if="config.graduationRulePrompts.length" class="text-[11px] text-stone-700">
        <summary class="cursor-pointer">Graduation / exit prompts</summary>
        <ul class="mt-1 ml-4 list-disc">
          <li v-for="(p, i) in config.graduationRulePrompts" :key="i">{{ p }}</li>
        </ul>
      </details>
    </section>

    <!-- Adult / legal review checklist -->
    <section class="space-y-2 rounded border border-rose-300 bg-rose-50/40 p-2">
      <header>
        <p class="text-[11px] font-semibold uppercase tracking-wide text-rose-900">
          8. Adult / legal review checklist
        </p>
        <p class="text-[11px] italic text-rose-900">
          Tick each item as the team confirms it has been reviewed.
          Real-world use requires the final box (instructor / adult /
          legal review completed).
        </p>
      </header>
      <ul class="space-y-1 text-[11px]">
        <li v-for="key in Object.keys(reviewChecklistLabels)" :key="key">
          <label class="flex items-start gap-2 text-stone-800">
            <input
              type="checkbox"
              :checked="reviewChecklist[key]"
              class="mt-0.5"
              @change="(e) => { reviewChecklist[key] = (e.target as HTMLInputElement).checked }"
            />
            <span>{{ reviewChecklistLabels[key] }}</span>
          </label>
        </li>
      </ul>
    </section>

    <!-- Output -->
    <section class="rounded border border-stone-200 bg-stone-50 p-2">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-[11px] font-semibold uppercase tracking-wide text-stone-700">
          Output (markdown)
        </p>
        <button
          type="button"
          class="rounded border border-amber-400 bg-white px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
          @click="copyOutput"
        >
          {{ copyButtonLabel }}
        </button>
      </div>
      <pre
        class="mt-1 max-h-72 overflow-auto whitespace-pre-wrap rounded border border-stone-200 bg-white p-2 font-mono text-[11px] text-stone-800"
      >{{ buildMarkdown() }}</pre>
      <p class="mt-1 text-[11px] italic text-stone-500">
        Copy this output into Working Draft, edit it in your own
        words, add structured evidence for major claims, then save
        with the existing Save button. Submit only after instructor
        / adult / legal review.
      </p>
    </section>
  </section>
</template>
