<script setup lang="ts">
// /playbook/print — Final Submission Mode.
//
// Read-only print-ready Playbook. Designed to be saved as PDF via the
// browser's Print dialog. Reuses the existing data pipeline (deliverables
// + deliverableOutputs + studio resolver + shared preview component) so
// the printed document matches the live in-app preview byte-for-byte.
//
// Posture (do not relax):
//   - layout:false so the app shell never reaches the print preview
//   - never writes to Firestore
//   - never copies draftText into finalText
//   - never advances approval / output readiness / submit gate
//   - mode toggle (current ↔ final) is purely a display choice; both
//     modes route through the same shared normalizer

import { computed, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useDeliverables } from '~/composables/useDeliverables'
import { useDeliverableOutputs } from '~/composables/useDeliverableOutputs'
import { getTemplateStudioForDeliverable } from '~/data/templateStudios'
import type { Deliverable, DeliverableOutput } from '~/types/models'
import type { TemplateStudio } from '~/types/templateStudio'
import {
  summarizePlaybookReadiness,
  readinessStatusLabel,
  type ReadinessChapterInput
} from '~/utils/playbookReadiness'
import type { PreviewMode } from '~/utils/playbookPreview'
import DeliverablePlaybookPreview from '~/components/DeliverablePlaybookPreview.vue'

definePageMeta({ layout: false })

const auth = useAuthStore()
const deliverables = useDeliverables()
const outputs = useDeliverableOutputs()

const { data: allDeliverables, loading: deliverablesLoading } =
  deliverables.watchList()

// Studio-backed ids drive the live output subscriptions; non-studio
// deliverables are still listed in the readiness page but skipped by
// the chapter content section (DeliverablePlaybookPreview requires a
// studio). This mirrors the existing /export-center behavior.
const studioBackedIds = computed<string[]>(() =>
  allDeliverables.value
    .filter((d) => Boolean(getTemplateStudioForDeliverable(d)))
    .map((d) => d.id)
)
const { data: outputsByDeliverableId, loading: outputsLoading } =
  outputs.watchManyOutputs(studioBackedIds)

const loading = computed(
  () => deliverablesLoading.value || outputsLoading.value
)

function studioFor(d: Deliverable): TemplateStudio | null {
  return getTemplateStudioForDeliverable(d)
}
function outputFor(d: Deliverable): DeliverableOutput | null {
  return outputsByDeliverableId.value[d.id] ?? null
}

// Group deliverables by chapter so the print document follows the
// Playbook structure (cover → TOC → readiness → chapter 1, chapter 2,
// …). Deterministic chapter-number order matches the Markdown export.
interface PrintChapter {
  chapter: number
  title: string
  department: string | null
  deliverables: Deliverable[]
}
const chapters = computed<PrintChapter[]>(() => {
  const grouped = new Map<number, PrintChapter>()
  for (const d of allDeliverables.value) {
    const chapter = Number(d.chapter)
    if (!chapter) continue
    const studio = studioFor(d)
    const title = studio?.title || d.title
    const existing = grouped.get(chapter)
    if (existing) {
      existing.deliverables.push(d)
      if (!existing.title) existing.title = title
    } else {
      grouped.set(chapter, {
        chapter,
        title,
        department: d.department,
        deliverables: [d]
      })
    }
  }
  return Array.from(grouped.values()).sort((a, b) => a.chapter - b.chapter)
})

const readinessInputChapters = computed<ReadinessChapterInput[]>(() =>
  chapters.value.map((ch) => ({
    chapter: ch.chapter,
    title: ch.title,
    deliverables: ch.deliverables.map((d) => ({
      deliverable: d,
      studio: studioFor(d),
      output: outputFor(d)
    }))
  }))
)
const readiness = computed(() =>
  summarizePlaybookReadiness({
    chapters: readinessInputChapters.value,
    mode: 'export'
  })
)

// Preview mode toggle. Defaults to 'current' so in-flight Playbooks
// print with the fallback chain visible. Per-deliverable, approved
// deliverables still render their final text first (because the
// fallback chain prefers finalText whenever present), so the toggle is
// a global lens, not an approval override.
const previewMode = ref<PreviewMode>('current')

// Per-deliverable mode picker so approved deliverables can pin
// themselves to 'final' while in-flight ones default to 'current'. The
// shared normalizer's fallback chain means a finalText-complete
// approved deliverable looks identical in either mode.
function modeFor(d: Deliverable): PreviewMode {
  if (d.status === 'approved' && previewMode.value === 'current') {
    return 'final'
  }
  return previewMode.value
}

// Save-as-PDF affordance. Pure call to window.print(). SSR-safe
// (gated by typeof window).
function triggerPrint() {
  if (typeof window === 'undefined') return
  window.print()
}

const today = computed(() =>
  new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
)
</script>

<template>
  <main class="print-document min-h-screen bg-white text-neutral-900">
    <!-- On-screen toolbar. Hidden when printing via .print-hidden. -->
    <div
      class="print-hidden sticky top-0 z-10 border-b border-neutral-200 bg-white"
    >
      <div class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
        <div class="flex items-center gap-3">
          <NuxtLink to="/playbook" class="text-phoenix-700 hover:underline">
            ← Back to Playbook
          </NuxtLink>
          <span class="text-neutral-400">·</span>
          <span class="font-medium">Final Submission Mode</span>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <div
            class="inline-flex overflow-hidden rounded border border-neutral-300 text-xs"
            role="tablist"
            aria-label="Preview mode"
          >
            <button
              type="button"
              :class="[
                'px-3 py-1',
                previewMode === 'current'
                  ? 'bg-phoenix-700 text-white'
                  : 'bg-white text-neutral-700 hover:bg-neutral-50'
              ]"
              :aria-pressed="previewMode === 'current'"
              @click="previewMode = 'current'"
            >Current saved</button>
            <button
              type="button"
              :class="[
                'border-l border-neutral-300 px-3 py-1',
                previewMode === 'final'
                  ? 'bg-phoenix-700 text-white'
                  : 'bg-white text-neutral-700 hover:bg-neutral-50'
              ]"
              :aria-pressed="previewMode === 'final'"
              @click="previewMode = 'final'"
            >Final preview</button>
          </div>
          <button
            type="button"
            class="rounded border border-phoenix-300 bg-white px-3 py-1 text-xs font-medium text-phoenix-800 hover:bg-phoenix-50 disabled:opacity-50"
            :disabled="loading"
            @click="triggerPrint()"
          >Print / Save as PDF</button>
        </div>
      </div>
      <div class="mx-auto max-w-5xl px-4 pb-2 text-[11px] italic text-neutral-500">
        Use your browser's print dialog and choose Save as PDF.
        Approved deliverables print using final text; in-flight ones use
        the current saved state (with draft / source-note fallback labeled).
      </div>
    </div>

    <p
      v-if="loading"
      class="print-hidden mx-auto max-w-5xl px-4 py-6 text-sm text-neutral-500"
    >
      Loading Playbook…
    </p>

    <p
      v-else-if="!auth.user"
      class="print-hidden mx-auto max-w-5xl px-4 py-6 text-sm text-rose-700"
    >
      Sign in to view the print-ready Playbook.
    </p>

    <p
      v-else-if="!chapters.length"
      class="print-hidden mx-auto max-w-5xl px-4 py-6 text-sm text-neutral-500"
    >
      No Playbook chapters have been seeded yet.
    </p>

    <article
      v-else
      class="mx-auto w-full max-w-5xl px-6 py-6"
      aria-label="Renni Inc. Playbook (printable)"
    >
      <!-- Ready-to-print signal on screen only. Hidden in print. -->
      <p
        class="print-hidden mb-4 inline-block rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs text-emerald-800"
      >
        Ready to print · {{ readiness.totalChapters }} chapters ·
        {{ readiness.totalDeliverables }} deliverables ·
        {{ readiness.totalSections }} sections
      </p>

      <!-- ============================================================
           Cover page
           ============================================================ -->
      <section class="print-cover space-y-3 text-center" aria-label="Cover">
        <p class="text-xs uppercase tracking-[0.2em] text-neutral-500">
          Renni Inc.
        </p>
        <h1 class="text-3xl font-semibold text-neutral-900">
          Brand &amp; Operations Playbook
        </h1>
        <p class="mx-auto max-w-xl text-sm text-neutral-700">
          House Phoenix-led launch · Lumen, Notice, and Humble Oven
          supporting brands · TechTown pop-up · Phoenix Nest retail
          carry pitch.
        </p>
        <div class="pt-6 text-xs text-neutral-500">
          <p>Final Submission Mode</p>
          <p>Generated {{ today }}</p>
        </div>
        <p class="pt-12 text-[11px] italic text-neutral-500">
          Renaissance High School × Renni Inc. — final project documentation.
          This export reflects the current saved state at generation time.
          Draft and source-note fallback may appear where final Playbook
          text is missing.
        </p>
      </section>

      <!-- ============================================================
           Table of contents
           ============================================================ -->
      <section class="print-toc mt-12 space-y-3" aria-label="Table of contents">
        <h2 class="text-xl font-semibold">Table of contents</h2>
        <ol class="space-y-1.5 text-sm">
          <li
            v-for="ch in readiness.chapters"
            :key="`toc-${ch.chapter}`"
            class="flex items-baseline justify-between gap-3 border-b border-dotted border-neutral-200 pb-1"
          >
            <span class="font-medium text-neutral-800">
              Chapter {{ ch.chapter }} · {{ ch.title }}
            </span>
            <span class="text-xs text-neutral-600">{{ ch.statusLabel }}</span>
          </li>
        </ol>
      </section>

      <!-- ============================================================
           Readiness page
           ============================================================ -->
      <section class="print-readiness mt-12 space-y-4" aria-label="Readiness">
        <h2 class="text-xl font-semibold">Readiness summary</h2>
        <p class="text-xs italic text-neutral-500">
          Warning-only counts. They never gate submission, approval, or
          export. Counts reflect the current saved state at the time
          this document was generated.
        </p>

        <div class="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div class="rounded border border-neutral-200 p-3">
            <p class="text-xs uppercase tracking-wide text-neutral-500">Chapters</p>
            <p class="text-2xl font-semibold">{{ readiness.totalChapters }}</p>
          </div>
          <div class="rounded border border-neutral-200 p-3">
            <p class="text-xs uppercase tracking-wide text-neutral-500">Deliverables</p>
            <p class="text-2xl font-semibold">{{ readiness.totalDeliverables }}</p>
          </div>
          <div class="rounded border border-neutral-200 p-3">
            <p class="text-xs uppercase tracking-wide text-neutral-500">Sections</p>
            <p class="text-2xl font-semibold">{{ readiness.totalSections }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <div class="rounded border border-emerald-200 bg-emerald-50/40 p-2">
            <p class="font-medium text-emerald-800">Approved deliverables</p>
            <p class="text-lg font-semibold">{{ readiness.approvedDeliverables }}</p>
          </div>
          <div class="rounded border border-sky-200 bg-sky-50/40 p-2">
            <p class="font-medium text-sky-800">Submitted for review</p>
            <p class="text-lg font-semibold">{{ readiness.inReviewDeliverables }}</p>
          </div>
          <div class="rounded border border-rose-200 bg-rose-50/40 p-2">
            <p class="font-medium text-rose-800">Needs revision</p>
            <p class="text-lg font-semibold">{{ readiness.needsRevisionDeliverables }}</p>
          </div>
          <div class="rounded border border-neutral-200 p-2">
            <p class="font-medium text-neutral-700">In progress</p>
            <p class="text-lg font-semibold">{{ readiness.draftDeliverables }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <div class="rounded border border-emerald-200 p-2">
            <p class="font-medium text-emerald-800">Sections with final text</p>
            <p class="text-lg font-semibold">{{ readiness.sectionsWithFinalText }}</p>
          </div>
          <div class="rounded border border-amber-200 p-2">
            <p class="font-medium text-amber-800">Draft fallback</p>
            <p class="text-lg font-semibold">{{ readiness.sectionsWithDraftFallback }}</p>
          </div>
          <div class="rounded border border-amber-200 p-2">
            <p class="font-medium text-amber-800">Source-note fallback</p>
            <p class="text-lg font-semibold">{{ readiness.sectionsWithSourceNotesFallback }}</p>
          </div>
          <div class="rounded border border-neutral-200 p-2">
            <p class="font-medium text-neutral-700">Missing sections</p>
            <p class="text-lg font-semibold">{{ readiness.sectionsMissing }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 text-xs">
          <div class="rounded border border-neutral-200 p-2">
            <p class="font-medium text-neutral-700">Evidence links</p>
            <p class="text-lg font-semibold">{{ readiness.evidenceLinkCount }}</p>
          </div>
          <div class="rounded border border-neutral-200 p-2">
            <p class="font-medium text-neutral-700">Structured evidence entries</p>
            <p class="text-lg font-semibold">{{ readiness.structuredEvidenceCount }}</p>
          </div>
        </div>
      </section>

      <!-- ============================================================
           Chapter content
           ============================================================ -->
      <template v-for="ch in chapters" :key="`chapter-${ch.chapter}`">
        <section class="print-chapter-divider mt-12 space-y-2 text-center">
          <p class="text-xs uppercase tracking-[0.2em] text-neutral-500">
            Chapter {{ ch.chapter }}
          </p>
          <h2 class="text-2xl font-semibold">{{ ch.title }}</h2>
          <p
            v-if="ch.department"
            class="text-sm text-neutral-600"
          >
            Department: {{ ch.department }}
          </p>
        </section>

        <section class="print-chapter mt-6 space-y-6">
          <article
            v-for="d in ch.deliverables"
            :key="`deliverable-${d.id}`"
            class="print-deliverable space-y-3"
          >
            <header class="space-y-1 border-b border-neutral-200 pb-2">
              <h3 class="text-lg font-semibold">{{ d.title }}</h3>
              <p class="text-xs text-neutral-600">
                Status: {{ readinessStatusLabel(d.status) }}
                <span v-if="d.ownerEmail"> · Owner: {{ d.ownerEmail }}</span>
                <span v-if="d.approverEmail"> · Approver: {{ d.approverEmail }}</span>
                <span v-if="d.dueDate"> · Due: {{ d.dueDate }}</span>
              </p>
            </header>

            <DeliverablePlaybookPreview
              v-if="studioFor(d)"
              :studio="studioFor(d)!"
              :output="outputFor(d)"
              :loading="false"
              :mode="modeFor(d)"
              :deliverable="d"
              :show-evidence="true"
              :show-structured-evidence="true"
              :show-missing-sections="true"
              :show-builders="true"
            />

            <p
              v-else
              class="text-sm italic text-neutral-600"
            >
              This deliverable is not studio-backed; no section content is
              available for the printable Playbook.
            </p>
          </article>
        </section>
      </template>

      <!-- ============================================================
           Appendix — missing items list
           ============================================================ -->
      <section class="print-appendix mt-12 space-y-3">
        <h2 class="text-xl font-semibold">Appendix · Readiness gaps</h2>
        <p class="text-xs italic text-neutral-500">
          Warning-only. These items show what is still missing or
          showing fallback content in the current saved Playbook.
        </p>
        <p
          v-if="!readiness.missingItems.length"
          class="text-sm text-emerald-700"
        >
          No missing sections detected. Every section has at least some
          saved content.
        </p>
        <ul
          v-else
          class="space-y-1 text-sm"
        >
          <li
            v-for="(item, idx) in readiness.missingItems"
            :key="`missing-${idx}`"
            class="rounded border border-amber-200 bg-amber-50/40 p-2"
          >
            <p class="font-medium text-neutral-900">
              Ch. {{ item.chapter }} · {{ item.chapterTitle }} —
              {{ item.deliverableTitle }} — {{ item.sectionTitle }}
            </p>
            <p class="text-xs text-neutral-700">{{ item.note }}</p>
          </li>
        </ul>
      </section>

      <!-- Footer line printed at the bottom of the appendix page. -->
      <footer class="mt-12 border-t border-neutral-200 pt-3 text-center text-xs text-neutral-500">
        Renni Inc. | Brand &amp; Operations Playbook | Final Project
      </footer>
    </article>
  </main>
</template>
