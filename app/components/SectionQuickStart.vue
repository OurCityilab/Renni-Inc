<script setup lang="ts">
// SectionQuickStart — Customer Segments QuickStart Sprint.
//
// V1 scope (do not relax):
//   - mounts ONLY when section.guidedQuickStart?.enabled is true
//   - V1 only renders the customer-segment composer; future variants
//     can branch on other guidedQuickStart.* sub-configs without
//     changing this prop API
//   - never auto-saves; emits an `apply` payload that the parent
//     workspace assigns to the existing local draft + dirty-flag
//   - never overwrites student text silently (append/replace/cancel
//     prompt when the target field is non-empty)
//   - never targets Final Playbook text; the parent never reads
//     finalText from the payload, and the apply UI exposes only
//     "Use in Working Draft" + "Add to Team Thinking"
//   - no AI; the starter draft is a deterministic template with
//     bracketed placeholders the student must fill in
//   - no points / badges / XP / streaks / leaderboard — serious
//     apprenticeship framing only
import { computed, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import type {
  GuidedQuickStartConfig,
  TemplateStudioSection
} from '~/types/templateStudio'

interface SegmentDraft {
  // The base segment from the picklist, or empty when fully custom.
  segment: string
  // Free-text override; takes precedence over `segment` when filled.
  customSegment: string
  // Need from picklist or custom.
  need: string
  customNeed: string
  // Why this group matters (single-select from picklist).
  importance: string
  // Evidence / proof tier (single-select from picklist).
  evidence: string
}

const props = defineProps<{
  section: TemplateStudioSection
  deliverableId: string
  // Read-only snapshots used by the apply confirmation flow so the
  // component can detect non-empty targets without binding to the
  // parent's draft state.
  currentSourceNotes: string
  currentDraftText: string
  // Mirrors the workspace's editingEnabled gate. Disables the apply
  // buttons when the deliverable is in_review/approved or the viewer
  // lacks edit rights.
  editingEnabled: boolean
}>()

const emit = defineEmits<{
  // The parent (DeliverableOutputWorkspace) decides how to merge the
  // payload into its local drafts buffer and call markDirty(). The
  // QuickStart never writes to Firestore directly.
  (
    e: 'apply',
    payload: {
      target: 'sourceNotes' | 'draftText'
      // 'set' = target was empty, just place the text.
      // 'replace' = target was non-empty, student confirmed replace.
      // 'append' = target was non-empty, student confirmed append.
      mode: 'set' | 'replace' | 'append'
      text: string
    }
  ): void
}>()

const auth = useAuthStore()
const viewerIsLeader = computed<boolean>(
  () =>
    auth.isAdmin ||
    auth.isCoCEO ||
    auth.isChief ||
    auth.profile?.role === 'coo'
)

// Default-open for regular members on a fresh section so they don't
// stare at a blank page. Default-collapsed for leaders so they can
// review without the panel taking up space they don't need.
const sectionHasAnyContent = computed<boolean>(
  () =>
    Boolean(
      props.currentSourceNotes.trim() || props.currentDraftText.trim()
    )
)
const open = ref<boolean>(
  !viewerIsLeader.value && !sectionHasAnyContent.value
)

const config = computed<GuidedQuickStartConfig | null>(
  () => props.section.guidedQuickStart ?? null
)
const builder = computed(() => config.value?.customerSegmentBuilder ?? null)

// ---- Local state -------------------------------------------------
function emptySegment(): SegmentDraft {
  return {
    segment: '',
    customSegment: '',
    need: '',
    customNeed: '',
    importance: '',
    evidence: ''
  }
}

const segments = ref<SegmentDraft[]>([emptySegment()])

function addSegment() {
  if (segments.value.length >= 5) return
  segments.value.push(emptySegment())
}
function removeSegment(idx: number) {
  if (segments.value.length <= 1) {
    segments.value.splice(idx, 1, emptySegment())
    return
  }
  segments.value.splice(idx, 1)
}
function pickSegment(idx: number, value: string) {
  const s = segments.value[idx]
  if (!s) return
  if (s.segment === value && !s.customSegment) {
    s.segment = ''
  } else {
    s.segment = value
    s.customSegment = ''
  }
}
function pickNeed(idx: number, value: string) {
  const s = segments.value[idx]
  if (!s) return
  if (s.need === value && !s.customNeed) {
    s.need = ''
  } else {
    s.need = value
    s.customNeed = ''
  }
}
function pickImportance(idx: number, value: string) {
  const s = segments.value[idx]
  if (!s) return
  s.importance = s.importance === value ? '' : value
}
function pickEvidence(idx: number, value: string) {
  const s = segments.value[idx]
  if (!s) return
  s.evidence = s.evidence === value ? '' : value
}

// A segment counts as "filled enough" once it has a segment name,
// a need, and an importance OR evidence selection. We keep this lax
// so a student who hasn't chosen evidence yet can still see a
// preview — the deterministic generator handles missing fields
// gracefully with bracketed placeholders.
function segmentReady(s: SegmentDraft): boolean {
  const hasSegment = (s.customSegment || s.segment).trim().length > 0
  const hasNeed = (s.customNeed || s.need).trim().length > 0
  return hasSegment && hasNeed
}
const readyCount = computed<number>(
  () => segments.value.filter(segmentReady).length
)

// ---- Confidence warning ------------------------------------------
const ASSUMPTION_OPTION = 'assumption only — needs validation'
const hasAssumptionOnly = computed<boolean>(
  () => segments.value.some((s) => s.evidence === ASSUMPTION_OPTION)
)

// ---- Deterministic starter draft ---------------------------------
const ORDINALS = [
  'first',
  'second',
  'third',
  'fourth',
  'fifth'
]

function evidenceClause(evidence: string): string {
  if (!evidence) return '[name what we observed]'
  if (evidence === ASSUMPTION_OPTION) {
    return 'we are assuming this and we still need to validate it'
  }
  return evidence
}

function importanceClause(importance: string): string {
  if (!importance) return '[name which output this matters for]'
  return importance
}

function buildStarterDraft(): string {
  const ready = segments.value.filter(segmentReady)
  if (!ready.length) return ''
  const lines: string[] = []
  ready.forEach((s, i) => {
    const ord = ORDINALS[i] ?? `segment ${i + 1}`
    const segName = (s.customSegment || s.segment).trim()
    const need = (s.customNeed || s.need).trim()
    const ev = evidenceClause(s.evidence)
    const imp = importanceClause(s.importance)
    lines.push(
      `Our ${ord} customer segment is ${segName}. They need ${need}. We believe this because ${ev}. This segment matters for ${imp}. [add a real example]`
    )
  })
  // Closing reflection — explicitly leaves a placeholder so the
  // student must add a validation step before review.
  const firstName =
    (ready[0]!.customSegment || ready[0]!.segment).trim()
  const closer = hasAssumptionOnly.value
    ? `Our strongest first segment may be ${firstName}, but we still need to validate [add survey or customer evidence we have].`
    : `Our strongest first segment may be ${firstName}, but we still need to validate [name what we still need to test].`
  lines.push(closer)
  return lines.join('\n\n')
}

function buildTeamThinkingNotes(): string {
  const ready = segments.value.filter(segmentReady)
  if (!ready.length) return ''
  const lines: string[] = ['QuickStart notes:']
  ready.forEach((s) => {
    const segName = (s.customSegment || s.segment).trim()
    const need = (s.customNeed || s.need).trim()
    const importance = s.importance || '[importance not yet chosen]'
    const evidence = s.evidence || '[evidence not yet chosen]'
    lines.push(
      `- ${segName}: needs ${need} (matters for ${importance}; evidence: ${evidence})`
    )
  })
  return lines.join('\n')
}

// Live preview — auto-rebuilds when inputs change. Cheap; pure
// string composition over at most 5 small objects.
const draftPreview = computed<string>(() => buildStarterDraft())
const teamThinkingPreview = computed<string>(() =>
  buildTeamThinkingNotes()
)

// ---- Apply flow --------------------------------------------------
type ApplyTarget = 'sourceNotes' | 'draftText'
const pendingApply = ref<ApplyTarget | null>(null)

function targetIsEmpty(target: ApplyTarget): boolean {
  if (target === 'sourceNotes') return !props.currentSourceNotes.trim()
  return !props.currentDraftText.trim()
}

function textForTarget(target: ApplyTarget): string {
  return target === 'sourceNotes'
    ? teamThinkingPreview.value
    : draftPreview.value
}

function requestApply(target: ApplyTarget) {
  if (!props.editingEnabled) return
  if (!textForTarget(target).trim()) return
  if (targetIsEmpty(target)) {
    emit('apply', {
      target,
      mode: 'set',
      text: textForTarget(target)
    })
    pendingApply.value = null
    return
  }
  // Non-empty target — show the append/replace/cancel prompt.
  pendingApply.value = target
}

function commitApply(mode: 'append' | 'replace') {
  const target = pendingApply.value
  if (!target) return
  emit('apply', {
    target,
    mode,
    text: textForTarget(target)
  })
  pendingApply.value = null
}

function cancelApply() {
  pendingApply.value = null
}

// Tab / step indicator. We're deliberately minimal here — the brief
// allows "stepper or progress row" and we use a labeled progress row
// rather than a hard wizard so the form remains scrollable.
const stepStatus = computed<{ index: 1 | 2 | 3 | 4; label: string }>(() => {
  if (readyCount.value === 0) {
    return { index: 1, label: 'Step 1 of 4 — pick customer groups' }
  }
  const allHaveImportance = segments.value
    .filter(segmentReady)
    .every((s) => s.importance.length > 0)
  if (!allHaveImportance) {
    return { index: 2, label: 'Step 2 of 4 — pick why each matters' }
  }
  const allHaveEvidence = segments.value
    .filter(segmentReady)
    .every((s) => s.evidence.length > 0)
  if (!allHaveEvidence) {
    return { index: 3, label: 'Step 3 of 4 — choose evidence' }
  }
  return { index: 4, label: 'Step 4 of 4 — build starter draft' }
})

function visibleStepNumber(target: 1 | 2 | 3 | 4): boolean {
  return stepStatus.value.index >= target
}
</script>

<template>
  <section
    v-if="config?.enabled && builder"
    class="rounded-md border border-phoenix-300 bg-phoenix-50/50"
    aria-label="Section QuickStart"
  >
    <header class="flex flex-wrap items-baseline justify-between gap-2 p-3">
      <div class="space-y-0.5">
        <p class="text-[11px] font-semibold uppercase tracking-wider text-phoenix-700">
          {{ config.missionLabel || 'Mission' }} · QuickStart
        </p>
        <h3 class="text-sm font-semibold text-neutral-900">
          {{ config.title }}
        </h3>
        <p
          v-if="config.description"
          class="text-xs text-neutral-700"
        >{{ config.description }}</p>
      </div>
      <button
        type="button"
        class="text-xs text-phoenix-700 hover:underline"
        @click="open = !open"
      >{{ open ? 'Hide QuickStart' : 'Show QuickStart' }}</button>
    </header>

    <div v-if="open" class="space-y-3 border-t border-phoenix-200 p-3">
      <!-- Step indicator. Read-only progress row; not a hard wizard. -->
      <p class="text-[11px] font-medium uppercase tracking-wider text-phoenix-700">
        {{ stepStatus.label }}
      </p>
      <ol class="flex flex-wrap gap-1.5 text-[11px]" aria-label="QuickStart progress">
        <li
          v-for="n in 4"
          :key="`step-${n}`"
          :class="[
            'rounded-full border px-2 py-0.5 uppercase tracking-wide',
            visibleStepNumber(n as 1 | 2 | 3 | 4)
              ? 'border-phoenix-400 bg-phoenix-100 text-phoenix-900'
              : 'border-neutral-300 bg-white text-neutral-500'
          ]"
        >Step {{ n }}</li>
      </ol>

      <!-- Per-segment cards. -->
      <ol class="space-y-3">
        <li
          v-for="(seg, idx) in segments"
          :key="`seg-${idx}`"
          class="rounded-md border border-neutral-200 bg-white p-3 text-xs"
        >
          <div class="flex items-baseline justify-between gap-2">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
              Segment {{ idx + 1 }}
            </p>
            <button
              v-if="segments.length > 1"
              type="button"
              class="text-[11px] text-rose-700 hover:underline"
              :disabled="!editingEnabled"
              @click="removeSegment(idx)"
            >Remove</button>
          </div>

          <!-- Customer group chips. -->
          <p class="mt-2 font-medium text-neutral-700">Pick a customer group</p>
          <div class="mt-1 flex flex-wrap gap-1.5">
            <button
              v-for="opt in builder.segmentOptions"
              :key="`segopt-${idx}-${opt}`"
              type="button"
              :disabled="!editingEnabled"
              :class="[
                'rounded-full border px-2 py-0.5 text-[11px]',
                seg.segment === opt
                  ? 'border-phoenix-500 bg-phoenix-100 text-phoenix-900 font-medium'
                  : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
              ]"
              @click="pickSegment(idx, opt)"
            >{{ opt }}</button>
          </div>
          <label class="mt-2 block text-[11px] font-medium text-neutral-700">
            Or describe a custom group
            <input
              v-model="seg.customSegment"
              type="text"
              :disabled="!editingEnabled"
              placeholder="e.g. Saturday morning donut crowd"
              class="mt-1 w-full rounded border border-neutral-300 p-1.5 text-xs disabled:bg-neutral-50"
            />
          </label>

          <!-- Need chips. -->
          <p class="mt-3 font-medium text-neutral-700">What does this group need?</p>
          <div class="mt-1 flex flex-wrap gap-1.5">
            <button
              v-for="opt in builder.needOptions"
              :key="`needopt-${idx}-${opt}`"
              type="button"
              :disabled="!editingEnabled"
              :class="[
                'rounded-full border px-2 py-0.5 text-[11px]',
                seg.need === opt
                  ? 'border-sky-500 bg-sky-100 text-sky-900 font-medium'
                  : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
              ]"
              @click="pickNeed(idx, opt)"
            >{{ opt }}</button>
          </div>
          <label class="mt-2 block text-[11px] font-medium text-neutral-700">
            Or describe a custom need
            <input
              v-model="seg.customNeed"
              type="text"
              :disabled="!editingEnabled"
              placeholder="e.g. a weekend gift under $20"
              class="mt-1 w-full rounded border border-neutral-300 p-1.5 text-xs disabled:bg-neutral-50"
            />
          </label>

          <!-- Importance picklist. -->
          <p class="mt-3 font-medium text-neutral-700">Why does this group matter?</p>
          <div class="mt-1 flex flex-wrap gap-1.5">
            <button
              v-for="opt in builder.importanceOptions"
              :key="`impopt-${idx}-${opt}`"
              type="button"
              :disabled="!editingEnabled"
              :class="[
                'rounded-full border px-2 py-0.5 text-[11px]',
                seg.importance === opt
                  ? 'border-emerald-500 bg-emerald-100 text-emerald-900 font-medium'
                  : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
              ]"
              @click="pickImportance(idx, opt)"
            >{{ opt }}</button>
          </div>

          <!-- Evidence picklist. -->
          <p class="mt-3 font-medium text-neutral-700">What is our proof?</p>
          <div class="mt-1 flex flex-wrap gap-1.5">
            <button
              v-for="opt in builder.evidenceOptions"
              :key="`evopt-${idx}-${opt}`"
              type="button"
              :disabled="!editingEnabled"
              :class="[
                'rounded-full border px-2 py-0.5 text-[11px]',
                seg.evidence === opt
                  ? 'border-amber-500 bg-amber-100 text-amber-900 font-medium'
                  : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
              ]"
              @click="pickEvidence(idx, opt)"
            >{{ opt }}</button>
          </div>

          <!-- Confidence warning. Non-blocking; never gates anything. -->
          <p
            v-if="seg.evidence === ASSUMPTION_OPTION"
            class="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-900"
          >
            This is okay for a first draft, but mark confidence
            <span class="font-medium">low</span> and add a validation step before final review.
            Add this as a Defend entry later when you have proof.
          </p>
        </li>
      </ol>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded border border-phoenix-300 bg-white px-2 py-1 text-xs font-medium text-phoenix-900 hover:bg-phoenix-50"
          :disabled="!editingEnabled || segments.length >= 5"
          @click="addSegment"
        >+ Add another segment</button>
      </div>

      <!-- Live preview of the deterministic starter draft. -->
      <section
        v-if="draftPreview"
        class="rounded-md border border-sky-200 bg-sky-50/60 p-3"
        aria-label="Starter draft preview"
      >
        <p class="text-[11px] font-semibold uppercase tracking-wider text-sky-700">
          Starter draft preview
        </p>
        <p class="mt-1 text-[11px] italic text-neutral-600">
          Scaffolding only. Replace bracketed placeholders with real specifics
          before saving. This will land in <strong>Working draft</strong>, not
          Final Playbook text.
        </p>
        <pre
          class="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded border border-sky-100 bg-white p-2 text-xs text-neutral-800"
        >{{ draftPreview }}</pre>

        <!-- Apply actions. Working Draft is the default action;
             Team Thinking is secondary; Final Playbook text is
             intentionally absent. -->
        <div class="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            class="btn-primary text-xs"
            :disabled="!editingEnabled"
            @click="requestApply('draftText')"
          >Use in Working Draft</button>
          <button
            type="button"
            class="rounded border border-neutral-300 bg-white px-2 py-1 font-medium text-neutral-700 hover:bg-neutral-50"
            :disabled="!editingEnabled || !teamThinkingPreview"
            @click="requestApply('sourceNotes')"
          >Add to Team Thinking</button>
          <span class="text-[11px] italic text-neutral-500">
            Edit before saving — this is a starter, not a final answer.
          </span>
        </div>

        <!-- Append / replace / cancel prompt for non-empty targets.
             Mirrors the brief verbatim: never overwrite student
             writing silently. -->
        <div
          v-if="pendingApply"
          class="mt-3 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900"
        >
          <p class="font-medium">
            <template v-if="pendingApply === 'draftText'">
              Working Draft already has text.
            </template>
            <template v-else>
              Your team's thinking already has text.
            </template>
            Add this to the end of your current draft or replace it?
          </p>
          <div class="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded border border-amber-400 bg-white px-2 py-1 font-medium text-amber-900 hover:bg-amber-100"
              @click="commitApply('append')"
            >Append</button>
            <button
              type="button"
              class="rounded border border-rose-400 bg-white px-2 py-1 font-medium text-rose-900 hover:bg-rose-100"
              @click="commitApply('replace')"
            >Replace</button>
            <button
              type="button"
              class="rounded border border-neutral-300 bg-white px-2 py-1 text-neutral-700 hover:bg-neutral-50"
              @click="cancelApply"
            >Cancel</button>
          </div>
        </div>
      </section>

      <p
        v-else-if="readyCount === 0"
        class="text-[11px] italic text-neutral-600"
      >
        Pick a customer group and a need to see a starter draft preview.
      </p>

      <p class="text-[11px] italic text-neutral-500">
        QuickStart is a scaffolding tool. It does not save automatically — click
        Save section after you edit the draft.
      </p>
    </div>
  </section>
</template>
