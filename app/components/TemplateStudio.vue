<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Deliverable, Task } from '~/types/models'
import type {
  TemplateStudio,
  TemplateStudioRequirement
} from '~/types/templateStudio'

const props = defineProps<{
  deliverable: Deliverable
  studio: TemplateStudio
  relatedTasks: Task[]
  relatedTasksLoading: boolean
  canAssign: boolean
}>()

// Requirement coverage derivation. A task "covers" a requirement when its
// requirementId matches. Status rolls up into one of five visual states
// so chiefs can scan at a glance.
type Coverage = 'none' | 'planned' | 'in_progress' | 'blocked' | 'done'

function coverageFor(req: TemplateStudioRequirement): {
  state: Coverage
  linked: Task[]
} {
  const linked = props.relatedTasks.filter((t) => t.requirementId === req.id)
  if (!linked.length) return { state: 'none', linked }
  if (linked.some((t) => t.status === 'blocked')) return { state: 'blocked', linked }
  if (linked.every((t) => t.status === 'done')) return { state: 'done', linked }
  if (linked.some((t) => t.status === 'in_progress'))
    return { state: 'in_progress', linked }
  return { state: 'planned', linked }
}

const coverageLabel: Record<Coverage, string> = {
  none: 'No task yet',
  planned: 'Task planned',
  in_progress: 'In progress',
  blocked: 'Blocked',
  done: 'Complete'
}
const coverageTone: Record<Coverage, string> = {
  none: 'border-neutral-300 text-neutral-600',
  planned: 'border-sky-300 bg-sky-50 text-sky-800',
  in_progress: 'border-amber-300 bg-amber-50 text-amber-800',
  blocked: 'border-rose-300 bg-rose-50 text-rose-800',
  done: 'border-emerald-300 bg-emerald-50 text-emerald-800'
}

const outcomeBadge: Record<TemplateStudio['connectedOutcome'], string> = {
  'TechTown pop-up': 'bg-phoenix-100 text-phoenix-800',
  Playbook: 'bg-sky-100 text-sky-800',
  'Phoenix Nest pitch': 'bg-amber-100 text-amber-800'
}

// Inline task-create dialog keyed by requirement id so only one opens at
// a time.
const openForRequirement = ref<string | null>(null)
function toggleCreateFor(req: TemplateStudioRequirement) {
  openForRequirement.value =
    openForRequirement.value === req.id ? null : req.id
}

// Resolve the matching suggestedTask for a requirement (if any) and turn
// its `dependency` string into a human-readable planner note. Suggested
// tasks are curriculum hints — their `dependency` field is a requirement
// id or a prose hint, never a task id, so we surface it as helper text
// and leave the form's dependsOn picker for real prerequisite tasks.
function plannerNoteFor(req: TemplateStudioRequirement): string {
  const suggested = props.studio.suggestedTasks.find(
    (t) => t.requirementId === req.id
  )
  if (!suggested?.dependency) return ''
  const target = props.studio.requirements.find(
    (r) => r.id === suggested.dependency
  )
  if (target) {
    return `Plan this after: "${target.label}". Pick the real prerequisite task below if one exists.`
  }
  // Free-text hint that didn't match a requirement id.
  return `Planning hint: ${suggested.dependency}.`
}

const completedRequirementCount = computed(
  () =>
    props.studio.requirements.filter(
      (r) => coverageFor(r).state === 'done'
    ).length
)
const coveredRequirementCount = computed(
  () =>
    props.studio.requirements.filter(
      (r) => coverageFor(r).state !== 'none'
    ).length
)
</script>

<template>
  <div class="space-y-4">
    <!-- What you are building -->
    <section class="card space-y-3">
      <header class="flex flex-wrap items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="text-xs uppercase tracking-wide text-neutral-500">
            Template Studio
          </p>
          <h2 class="text-lg font-semibold text-neutral-900">
            {{ studio.title }}
          </h2>
        </div>
        <span
          class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
          :class="outcomeBadge[studio.connectedOutcome]"
        >
          Supports: {{ studio.connectedOutcome }}
        </span>
      </header>

      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <p class="text-xs font-medium text-neutral-500">What you are building</p>
          <p class="mt-1 text-sm text-neutral-800">{{ studio.finalOutput }}</p>
        </div>
        <div>
          <p class="text-xs font-medium text-neutral-500">Why it matters</p>
          <p class="mt-1 text-sm text-neutral-800">{{ studio.whyItMatters }}</p>
        </div>
        <div>
          <p class="text-xs font-medium text-neutral-500">Purpose</p>
          <p class="mt-1 text-sm text-neutral-700">{{ studio.purpose }}</p>
        </div>
        <div>
          <p class="text-xs font-medium text-neutral-500">Learning objective</p>
          <p class="mt-1 text-sm text-neutral-700">{{ studio.learningObjective }}</p>
        </div>
      </div>
    </section>

    <!-- Source notes reminder -->
    <section class="rounded-md border border-phoenix-200 bg-phoenix-50 p-3 text-sm text-phoenix-900">
      <p class="font-medium">Write your own source notes first.</p>
      <p class="mt-1 text-sm">
        Before any future AI coaching can critique or polish your work, capture
        the team's own thinking in <strong>Owner notes</strong> below:
        what decision did your team make, why did you make it, what evidence
        supports it, and what do you still want help improving?
      </p>
    </section>

    <!-- Guided sections -->
    <section v-if="studio.sections.length" class="card space-y-3">
      <h3 class="text-sm font-semibold">Work through each section</h3>
      <ol class="space-y-3">
        <li
          v-for="(s, i) in studio.sections"
          :key="s.title"
          class="rounded-md border border-neutral-200 p-3"
        >
          <p class="text-xs uppercase tracking-wide text-neutral-500">
            Section {{ i + 1 }}
          </p>
          <p class="font-medium text-neutral-900">{{ s.title }}</p>
          <p class="mt-2 text-sm text-neutral-700">{{ s.lesson }}</p>
          <p
            v-if="s.example"
            class="mt-2 rounded bg-neutral-50 p-2 text-xs text-neutral-700"
          >
            <span class="font-medium">Example:</span> {{ s.example }}
          </p>
          <div v-if="s.studentPrompts.length" class="mt-2">
            <p class="text-xs font-medium text-neutral-500">Think through:</p>
            <ul class="mt-1 list-disc space-y-1 pl-5 text-sm text-neutral-700">
              <li v-for="p in s.studentPrompts" :key="p">{{ p }}</li>
            </ul>
          </div>
          <div
            v-if="s.requiredInputs && s.requiredInputs.length"
            class="mt-2 text-xs text-neutral-600"
          >
            <span class="font-medium">You'll need:</span>
            {{ s.requiredInputs.join(', ') }}
          </div>
          <div
            v-if="s.completionCriteria && s.completionCriteria.length"
            class="mt-2 rounded bg-emerald-50 p-2 text-xs text-emerald-900"
          >
            <p class="font-medium">Done when:</p>
            <ul class="mt-1 list-disc space-y-1 pl-5">
              <li v-for="c in s.completionCriteria" :key="c">{{ c }}</li>
            </ul>
          </div>
        </li>
      </ol>
    </section>

    <!-- Requirements with coverage + task creation -->
    <section v-if="studio.requirements.length" class="card space-y-2">
      <header class="flex flex-wrap items-baseline justify-between gap-2">
        <h3 class="text-sm font-semibold">Requirements for approval</h3>
        <span v-if="relatedTasksLoading" class="text-xs text-neutral-500">
          Checking task coverage…
        </span>
        <span v-else class="text-xs text-neutral-500">
          {{ coveredRequirementCount }} of {{ studio.requirements.length }} covered
          <span v-if="completedRequirementCount !== coveredRequirementCount">
            · {{ completedRequirementCount }} complete
          </span>
        </span>
      </header>
      <ul class="space-y-2">
        <li
          v-for="req in studio.requirements"
          :key="req.id"
          class="rounded-md border border-neutral-200 p-2 space-y-1"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="font-medium text-neutral-900">
                {{ req.label }}
                <span
                  v-if="req.requiredForApproval"
                  class="ml-1 text-xs text-rose-600"
                >required</span>
              </p>
              <p class="text-xs text-neutral-600">{{ req.description }}</p>
              <p
                v-if="req.evidenceType"
                class="text-xs text-neutral-500"
              >Evidence: {{ req.evidenceType }}</p>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <span
                class="rounded-full border px-2 py-0.5 text-xs"
                :class="relatedTasksLoading
                  ? 'border-neutral-300 text-neutral-500'
                  : coverageTone[coverageFor(req).state]"
              >{{ relatedTasksLoading ? 'Checking…' : coverageLabel[coverageFor(req).state] }}</span>
              <button
                v-if="canAssign"
                class="text-xs text-phoenix-700 hover:underline"
                @click="toggleCreateFor(req)"
              >
                {{ openForRequirement === req.id ? 'Close' : 'Create task' }}
              </button>
            </div>
          </div>

          <!-- Linked tasks summary -->
          <ul
            v-if="!relatedTasksLoading && coverageFor(req).linked.length"
            class="mt-1 space-y-0.5 text-xs text-neutral-600"
          >
            <li v-for="t in coverageFor(req).linked" :key="t.id">
              ↳ {{ t.title }}
              <span class="text-neutral-500">· {{ t.ownerEmail }}</span>
              <span v-if="t.dueDate" class="text-neutral-500">
                · due {{ t.dueDate }}
              </span>
            </li>
          </ul>

          <!-- Per-requirement task creation. Prefills title / DoD /
               department / deliverable / requirementId from the studio. -->
          <TaskCreateForm
            v-if="openForRequirement === req.id && canAssign"
            :preset-department="req.department ?? deliverable.department"
            :preset-deliverable-id="deliverable.id"
            :preset-playbook-chapter="req.playbookChapter ?? deliverable.chapter"
            :preset-requirement-id="req.id"
            :preset-title="req.suggestedTaskTitle || `Cover: ${req.label}`"
            :preset-definition-of-done="req.definitionOfDone || ''"
            :preset-planner-note="plannerNoteFor(req)"
            lock-deliverable
            title="Create task from this requirement"
            @created="openForRequirement = null"
            @cancel="openForRequirement = null"
          />
        </li>
      </ul>
    </section>

    <!-- Suggested tasks (curriculum hints; planners still assign explicitly) -->
    <section
      v-if="studio.suggestedTasks.length"
      class="card space-y-2"
    >
      <h3 class="text-sm font-semibold">Suggested task plan</h3>
      <p class="text-xs text-neutral-600">
        These are suggested tasks for this deliverable. Create the ones that
        fit your team and deadline — they're not required in this exact form.
      </p>
      <ul class="space-y-1 text-sm">
        <li
          v-for="t in studio.suggestedTasks"
          :key="t.title"
          class="rounded border border-dashed border-neutral-300 p-2 text-neutral-700"
        >
          <p class="font-medium text-neutral-800">{{ t.title }}</p>
          <p class="text-xs text-neutral-600">
            <span v-if="t.department">{{ t.department }}</span>
            <span v-if="t.ownerRole"> · {{ t.ownerRole }}</span>
            <span v-if="t.dueOffsetDays != null">
              · suggested +{{ t.dueOffsetDays }} days
            </span>
          </p>
          <p v-if="t.definitionOfDone" class="mt-1 text-xs text-neutral-500">
            Done when: {{ t.definitionOfDone }}
          </p>
        </li>
      </ul>
    </section>

    <!-- Required evidence -->
    <section
      v-if="studio.requiredEvidence.length"
      class="card space-y-2"
    >
      <h3 class="text-sm font-semibold">Evidence to attach</h3>
      <ul class="space-y-1 text-sm text-neutral-700">
        <li
          v-for="e in studio.requiredEvidence"
          :key="e.id"
          class="flex items-start gap-2"
        >
          <span
            class="mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-xs"
            :class="e.required
              ? 'border-rose-300 bg-rose-50 text-rose-700'
              : 'border-neutral-300 text-neutral-600'"
          >{{ e.required ? 'required' : 'optional' }}</span>
          <div>
            <p class="font-medium text-neutral-900">{{ e.label }}</p>
            <p class="text-xs text-neutral-600">{{ e.description }}</p>
          </div>
        </li>
      </ul>
    </section>

    <!-- AI-ready guidance: describe future guardrails, do not call AI. -->
    <section
      v-if="studio.aiGuidance"
      class="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm"
    >
      <p class="font-medium text-neutral-800">
        Coming: AI coaching (not live yet)
      </p>
      <p class="mt-1 text-xs text-neutral-600">
        When AI guidance turns on, it will only do what's listed here.
        {{ studio.aiGuidance.approvalGuardrail }}
      </p>
      <div class="mt-2 grid gap-2 sm:grid-cols-2">
        <div>
          <p class="text-xs font-medium text-emerald-700">AI can help with</p>
          <ul class="mt-1 list-disc space-y-0.5 pl-5 text-xs text-neutral-700">
            <li v-for="h in studio.aiGuidance.allowedHelp" :key="h">{{ h }}</li>
          </ul>
        </div>
        <div>
          <p class="text-xs font-medium text-rose-700">AI will not do</p>
          <ul class="mt-1 list-disc space-y-0.5 pl-5 text-xs text-neutral-700">
            <li v-for="h in studio.aiGuidance.disallowedHelp" :key="h">{{ h }}</li>
          </ul>
        </div>
      </div>
      <p
        v-if="studio.aiGuidance.studentMustProvideSourceNotes"
        class="mt-2 text-xs text-neutral-600"
      >
        You'll always provide your own source notes before AI can critique.
      </p>
    </section>
  </div>
</template>
