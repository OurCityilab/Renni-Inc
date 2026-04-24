<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDeliverables } from '~/composables/useDeliverables'
import { useTasks } from '~/composables/useTasks'
import type { Deliverable, Task } from '~/types/models'

const deliverables = useDeliverables()
const tasks = useTasks()
const { data: all, loading: deliverablesLoading } = deliverables.watchList()
// Tasks are the source of truth for execution. Rolling up per chapter here
// so each chapter card can show whether there's actually work planned.
const { data: allTasks, loading: tasksLoading } = tasks.watchAll()
const loading = computed(() => deliverablesLoading.value || tasksLoading.value)

// ---- per-chapter rollup ----

type ChapterStatus =
  | 'not_started'
  | 'in_progress'
  | 'in_review'
  | 'needs_revision'
  | 'approved'

interface ChapterRollup {
  chapter: number
  title: string
  ownerEmail: string | null
  deliverables: Deliverable[]
  total: number
  drafts: number
  inReview: number
  needsRevision: number
  approved: number
  overdue: number
  percentApproved: number
  nextDue: string | null
  status: ChapterStatus
  taskTotal: number
  taskDone: number
  taskBlocked: number
}

function today() {
  const t = new Date()
  return new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime()
}

function isOverdue(d: Deliverable, todayMs: number) {
  if (d.status === 'approved') return false
  const [y, m, day] = (d.dueDate || '').split('-').map(Number)
  if (!y || !m || !day) return false
  return new Date(y, m - 1, day).getTime() < todayMs
}

function hasActivity(d: Deliverable): boolean {
  if ((d.statusHistory?.length ?? 0) > 0) return true
  if ((d.notes?.trim() || '').length > 0) return true
  if ((d.linkedDocUrl?.trim() || '').length > 0) return true
  if (d.submittedForReviewAt) return true
  return false
}

function classify(ds: Deliverable[]): ChapterStatus {
  if (ds.length === 0) return 'not_started'
  if (ds.every((d) => d.status === 'approved')) return 'approved'
  if (ds.some((d) => d.status === 'needs_revision')) return 'needs_revision'
  if (ds.some((d) => d.status === 'in_review')) return 'in_review'
  if (ds.some(hasActivity)) return 'in_progress'
  return 'not_started'
}

// Per-chapter task buckets. Tasks carry either deliverableId (preferred)
// or playbookChapter (the backfill script fills this from the linked
// deliverable). We union both so legacy rows without a chapter still
// count via their deliverable.
const tasksByChapter = computed<Map<number, Task[]>>(() => {
  const m = new Map<number, Task[]>()
  const chapterByDeliverable = new Map<string, number>()
  for (const d of all.value) {
    if (d.id && d.chapter) chapterByDeliverable.set(d.id, d.chapter)
  }
  for (const t of allTasks.value) {
    let chapter: number | null = null
    if (t.deliverableId && chapterByDeliverable.has(t.deliverableId)) {
      chapter = chapterByDeliverable.get(t.deliverableId)!
    } else if (t.playbookChapter != null) {
      chapter = t.playbookChapter
    }
    if (chapter == null) continue
    const arr = m.get(chapter) ?? []
    arr.push(t)
    m.set(chapter, arr)
  }
  return m
})

const chapters = computed<ChapterRollup[]>(() => {
  const byChapter = new Map<number, Deliverable[]>()
  for (const d of all.value) {
    const key = Number(d.chapter)
    if (!key) continue
    const arr = byChapter.get(key) ?? []
    arr.push(d)
    byChapter.set(key, arr)
  }
  const todayMs = today()
  const out: ChapterRollup[] = []
  for (const [chapter, ds] of byChapter) {
    const approved = ds.filter((d) => d.status === 'approved').length
    const futureDues = ds
      .filter((d) => d.status !== 'approved' && d.dueDate)
      .map((d) => d.dueDate!)
      .sort()
    const chapterTasks = tasksByChapter.value.get(chapter) ?? []
    const taskDone = chapterTasks.filter((t) => t.status === 'done').length
    const taskBlocked = chapterTasks.filter((t) => t.status === 'blocked').length
    // Title and primary owner fall back to the first deliverable in the
    // chapter (V1 has one deliverable per chapter; this also handles the
    // future case of multiple by picking the lowest-id representative).
    const primary = [...ds].sort((a, b) => a.id.localeCompare(b.id))[0]
    out.push({
      chapter,
      title: primary?.title ?? `Chapter ${chapter}`,
      ownerEmail: primary?.ownerEmail ?? null,
      deliverables: [...ds].sort((a, b) => a.id.localeCompare(b.id)),
      total: ds.length,
      drafts: ds.filter((d) => d.status === 'draft').length,
      inReview: ds.filter((d) => d.status === 'in_review').length,
      needsRevision: ds.filter((d) => d.status === 'needs_revision').length,
      approved,
      overdue: ds.filter((d) => isOverdue(d, todayMs)).length,
      percentApproved: ds.length ? Math.round((approved / ds.length) * 100) : 0,
      nextDue: futureDues[0] ?? null,
      status: classify(ds),
      taskTotal: chapterTasks.length,
      taskDone,
      taskBlocked
    })
  }
  return out.sort((a, b) => a.chapter - b.chapter)
})

// ---- company-wide summary ----

const totalChapters = computed(() => chapters.value.length)
const approvedChapters = computed(
  () => chapters.value.filter((c) => c.status === 'approved').length
)
const chaptersNeedingRevision = computed(
  () => chapters.value.filter((c) => c.status === 'needs_revision').length
)
const pendingApprovals = computed(() =>
  chapters.value.reduce((sum, c) => sum + c.inReview, 0)
)
const overdueDeliverables = computed(() =>
  chapters.value.reduce((sum, c) => sum + c.overdue, 0)
)
const totalApprovedDeliverables = computed(() =>
  chapters.value.reduce((sum, c) => sum + c.approved, 0)
)

// ---- expand/collapse ----

const expanded = ref<Record<number, boolean>>({})
function toggle(ch: number) {
  expanded.value[ch] = !expanded.value[ch]
}

const statusTone: Record<ChapterStatus, string> = {
  not_started: 'border-neutral-300 text-neutral-600',
  in_progress: 'border-amber-300 bg-amber-50 text-amber-800',
  in_review: 'border-sky-300 bg-sky-50 text-sky-800',
  needs_revision: 'border-rose-300 bg-rose-50 text-rose-800',
  approved: 'border-emerald-300 bg-emerald-50 text-emerald-800'
}

const statusLabel: Record<ChapterStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  in_review: 'In review',
  needs_revision: 'Needs revision',
  approved: 'Approved'
}
</script>

<template>
  <section class="space-y-5">
    <header>
      <p class="text-sm text-neutral-500">Renni Inc. Brand &amp; Operations Playbook</p>
      <h1 class="text-2xl font-semibold">Playbook Chapter Status</h1>
      <p class="text-sm text-neutral-600">
        Each chapter rolls up from its deliverables. Status reflects the current
        state across owners, reviewers, and approvals.
      </p>
    </header>

    <div class="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <KpiCard label="Chapters" :value="totalChapters" />
      <KpiCard label="Approved chapters" :value="approvedChapters" tone="good" />
      <KpiCard
        label="Needs revision"
        :value="chaptersNeedingRevision"
        :tone="chaptersNeedingRevision > 0 ? 'warn' : 'default'"
      />
      <KpiCard label="Pending reviews" :value="pendingApprovals" />
      <KpiCard
        label="Overdue items"
        :value="overdueDeliverables"
        :tone="overdueDeliverables > 0 ? 'warn' : 'default'"
      />
      <KpiCard
        label="Approved deliverables"
        :value="totalApprovedDeliverables"
        tone="good"
      />
    </div>

    <p v-if="loading" class="text-sm text-neutral-500">Loading chapters…</p>
    <p v-else-if="!chapters.length" class="text-sm text-neutral-500">
      No deliverables seeded yet.
    </p>

    <ul v-else class="space-y-2">
      <li
        v-for="c in chapters"
        :key="c.chapter"
        class="card space-y-2"
      >
        <header class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs uppercase tracking-wide text-neutral-500">
              Chapter {{ c.chapter }}
            </p>
            <p class="font-medium text-neutral-900">{{ c.title }}</p>
            <p class="text-xs text-neutral-500">
              {{ c.ownerEmail || 'unassigned' }}
              <span v-if="c.nextDue"> · next due {{ c.nextDue }}</span>
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <span
              class="rounded-full border px-2 py-0.5 text-xs"
              :class="statusTone[c.status]"
            >{{ statusLabel[c.status] }}</span>
            <button
              class="text-xs text-phoenix-700 hover:underline"
              @click="toggle(c.chapter)"
            >
              {{ expanded[c.chapter] ? 'Collapse' : 'View deliverables' }}
            </button>
          </div>
        </header>

        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600">
          <span>Total {{ c.total }}</span>
          <span>Drafts {{ c.drafts }}</span>
          <span>In review {{ c.inReview }}</span>
          <span>Needs revision {{ c.needsRevision }}</span>
          <span class="text-emerald-700">Approved {{ c.approved }}</span>
          <span v-if="c.overdue > 0" class="text-rose-700">Overdue {{ c.overdue }}</span>
        </div>

        <!-- Task coverage: Tasks are the source of truth for execution, so
             surface the count per chapter here alongside deliverable status. -->
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span
            v-if="c.taskTotal === 0"
            class="text-amber-800"
          >No tasks planned yet</span>
          <template v-else>
            <span class="text-neutral-600">Tasks {{ c.taskDone }} / {{ c.taskTotal }} done</span>
            <span
              v-if="c.taskBlocked > 0"
              class="text-rose-700"
            >Blocked {{ c.taskBlocked }}</span>
          </template>
        </div>

        <div>
          <div class="flex items-baseline justify-between text-xs text-neutral-600">
            <span>Approval progress</span>
            <span>{{ c.percentApproved }}%</span>
          </div>
          <div class="mt-1 h-2 w-full overflow-hidden rounded bg-neutral-100">
            <div
              class="h-full rounded bg-emerald-500"
              :style="{ width: c.percentApproved + '%' }"
            />
          </div>
        </div>

        <ul
          v-if="expanded[c.chapter]"
          class="space-y-2 border-t border-neutral-200 pt-2"
        >
          <li
            v-for="d in c.deliverables"
            :key="d.id"
          >
            <DeliverableRow :deliverable="d" show-owner />
          </li>
        </ul>
      </li>
    </ul>
  </section>
</template>
