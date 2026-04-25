<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import {
  useDeliverableOutputs,
  type NewEvidenceLinkInput,
  type SectionSavePayload
} from '~/composables/useDeliverableOutputs'
import type {
  Deliverable,
  DeliverableEvidenceLink,
  DeliverableOutput,
  DeliverableOutputSection,
  DeliverableOutputSectionStatus,
  EvidenceLinkType
} from '~/types/models'
import type {
  TemplateStudio,
  TemplateStudioSection
} from '~/types/templateStudio'

const props = defineProps<{
  deliverable: Deliverable
  studio: TemplateStudio
  // Page-level permission check (admin / Co-CEO / COO / owner / dept chief).
  canEdit: boolean
}>()

const auth = useAuthStore()
const outputs = useDeliverableOutputs()
const { data: output, loading } = outputs.watchOutput(() => props.deliverable.id)

// Editing is only the active path while the deliverable is in
// draft/needs_revision. in_review and approved render read-only so
// reviewers see a stable artifact and authors can't quietly mutate
// content under review. Firestore rules match this V1 behavior so the
// lock is enforced server-side, not just by the UI.
const editingEnabled = computed(
  () =>
    props.canEdit &&
    (props.deliverable.status === 'draft' ||
      props.deliverable.status === 'needs_revision')
)

const lockMessage = computed(() => {
  if (props.deliverable.status === 'in_review') {
    return 'This deliverable is in review. Output is read-only until the approver returns it or approves it.'
  }
  if (props.deliverable.status === 'approved') {
    return 'This deliverable is approved. Output is preserved as the final Playbook artifact.'
  }
  if (!props.canEdit) {
    return 'You can read this output. Editing is limited to the owner, the department chief, Co-CEOs, the COO, and the program lead.'
  }
  return ''
})

// Lazy-create the output doc the first time an authorized editor opens
// the workspace. Idempotent — does nothing if the doc already exists.
const provisioningError = ref<string | null>(null)
async function ensureOutputDoc() {
  if (!editingEnabled.value) return
  if (!auth.user || !auth.profile) return
  if (output.value) return
  if (loading.value) return
  try {
    await outputs.createOutputIfMissing(props.deliverable.id, props.studio, {
      uid: auth.user.uid,
      email: auth.profile.email || auth.user.email || ''
    })
  } catch (e) {
    provisioningError.value = e instanceof Error ? e.message : String(e)
  }
}
watch(
  [output, loading],
  ([o, l]) => {
    if (!l && !o) ensureOutputDoc()
  },
  { immediate: true }
)
onMounted(() => {
  // Cover the case where snapshot resolves before the watch handler
  // gets a chance to run on first load.
  if (!loading.value && !output.value) ensureOutputDoc()
})

// --- per-section local drafts. Each section keeps its own dirty buffer
// so saving one section never drops in-progress edits in another.
interface LocalDraft {
  sourceNotes: string
  draftText: string
  finalText: string
  status: DeliverableOutputSectionStatus
}
const drafts = ref<Record<string, LocalDraft>>({})
const dirty = ref<Record<string, boolean>>({})
const savingSectionId = ref<string | null>(null)
const sectionError = ref<Record<string, string>>({})

function persistedSection(s: TemplateStudioSection): DeliverableOutputSection | null {
  return output.value?.sections?.[s.id] ?? null
}

function deriveStatus(d: LocalDraft): DeliverableOutputSectionStatus {
  if (d.status === 'ready') return 'ready'
  const filled =
    d.sourceNotes.trim() !== '' ||
    d.draftText.trim() !== '' ||
    d.finalText.trim() !== ''
  return filled ? 'in_progress' : 'empty'
}

function ensureDraft(s: TemplateStudioSection) {
  if (!drafts.value[s.id]) {
    const persisted = persistedSection(s)
    drafts.value[s.id] = {
      sourceNotes: persisted?.sourceNotes ?? '',
      draftText: persisted?.draftText ?? '',
      finalText: persisted?.finalText ?? '',
      status: persisted?.status ?? 'empty'
    }
    dirty.value[s.id] = false
  }
}

// Snapshot watcher: refresh drafts for any section the editor hasn't
// touched. Same dirty-state pattern Canvas uses to preserve in-progress
// typing while picking up collaborator edits.
watch(
  output,
  (o) => {
    if (!o) return
    for (const s of props.studio.sections) {
      const persisted = o.sections?.[s.id]
      if (!persisted) continue
      if (!drafts.value[s.id]) {
        drafts.value[s.id] = {
          sourceNotes: persisted.sourceNotes ?? '',
          draftText: persisted.draftText ?? '',
          finalText: persisted.finalText ?? '',
          status: persisted.status ?? 'empty'
        }
        dirty.value[s.id] = false
      } else if (!dirty.value[s.id]) {
        drafts.value[s.id] = {
          sourceNotes: persisted.sourceNotes ?? '',
          draftText: persisted.draftText ?? '',
          finalText: persisted.finalText ?? '',
          status: persisted.status ?? 'empty'
        }
      }
    }
  },
  { deep: true, immediate: true }
)

function markDirty(s: TemplateStudioSection) {
  dirty.value[s.id] = true
}

function hasChanges(s: TemplateStudioSection): boolean {
  if (!dirty.value[s.id]) return false
  const d = drafts.value[s.id]
  const persisted = persistedSection(s)
  if (!persisted) return Boolean(d.sourceNotes || d.draftText || d.finalText)
  return (
    d.sourceNotes !== (persisted.sourceNotes ?? '') ||
    d.draftText !== (persisted.draftText ?? '') ||
    d.finalText !== (persisted.finalText ?? '') ||
    d.status !== (persisted.status ?? 'empty')
  )
}

async function save(s: TemplateStudioSection) {
  if (!editingEnabled.value) return
  if (!auth.user || !auth.profile) return
  const d = drafts.value[s.id]
  if (!d) return
  savingSectionId.value = s.id
  sectionError.value[s.id] = ''
  try {
    const payload: SectionSavePayload = {
      sectionTitleSnapshot: s.title,
      sourceNotes: d.sourceNotes,
      draftText: d.draftText,
      finalText: d.finalText,
      status: deriveStatus(d)
    }
    await outputs.saveSection(props.deliverable.id, s.id, payload, {
      uid: auth.user.uid,
      email: auth.profile.email || auth.user.email || ''
    })
    dirty.value[s.id] = false
  } catch (e) {
    sectionError.value[s.id] = e instanceof Error ? e.message : String(e)
  } finally {
    savingSectionId.value = null
  }
}

// --- evidence link form state ---
const linkForms = ref<Record<string, NewEvidenceLinkInput>>({})
const linkErrors = ref<Record<string, string>>({})
const evidenceBusy = ref<string | null>(null)

const EVIDENCE_TYPES: EvidenceLinkType[] = [
  'doc',
  'sheet',
  'slide',
  'folder',
  'image',
  'design',
  'external',
  'other'
]

function ensureLinkForm(s: TemplateStudioSection) {
  if (!linkForms.value[s.id]) {
    linkForms.value[s.id] = {
      label: '',
      url: '',
      type: 'doc',
      requirementId: null
    }
  }
}

function isLikelyUrl(v: string): boolean {
  const t = v.trim()
  return /^https?:\/\/.+/i.test(t)
}

async function addLink(s: TemplateStudioSection) {
  if (!editingEnabled.value) return
  if (!auth.user || !auth.profile) return
  ensureLinkForm(s)
  const f = linkForms.value[s.id]
  linkErrors.value[s.id] = ''
  if (!f.label.trim()) {
    linkErrors.value[s.id] = 'Label is required.'
    return
  }
  if (!isLikelyUrl(f.url)) {
    linkErrors.value[s.id] = 'Link must start with http:// or https://.'
    return
  }
  evidenceBusy.value = s.id
  try {
    const persisted = persistedSection(s)
    await outputs.addEvidenceLink(
      props.deliverable.id,
      s.id,
      persisted?.evidenceLinks ?? [],
      f,
      {
        uid: auth.user.uid,
        email: auth.profile.email || auth.user.email || ''
      }
    )
    linkForms.value[s.id] = {
      label: '',
      url: '',
      type: 'doc',
      requirementId: null
    }
  } catch (e) {
    linkErrors.value[s.id] = e instanceof Error ? e.message : String(e)
  } finally {
    evidenceBusy.value = null
  }
}

async function removeLink(s: TemplateStudioSection, linkId: string) {
  if (!editingEnabled.value) return
  if (!auth.user || !auth.profile) return
  evidenceBusy.value = s.id
  try {
    const persisted = persistedSection(s)
    await outputs.removeEvidenceLink(
      props.deliverable.id,
      s.id,
      persisted?.evidenceLinks ?? [],
      linkId,
      {
        uid: auth.user.uid,
        email: auth.profile.email || auth.user.email || ''
      }
    )
  } catch (e) {
    sectionError.value[s.id] = e instanceof Error ? e.message : String(e)
  } finally {
    evidenceBusy.value = null
  }
}

// --- readiness summary (non-blocking signal) ---
const readiness = computed(() => {
  const sections = props.studio.sections
  let withSourceNotes = 0
  let withDraft = 0
  let withFinal = 0
  let withEvidence = 0
  let missingFinal = 0
  for (const s of sections) {
    const p = persistedSection(s)
    if ((p?.sourceNotes ?? '').trim()) withSourceNotes += 1
    if ((p?.draftText ?? '').trim()) withDraft += 1
    if ((p?.finalText ?? '').trim()) withFinal += 1
    else missingFinal += 1
    if ((p?.evidenceLinks?.length ?? 0) > 0) withEvidence += 1
  }
  return {
    total: sections.length,
    withSourceNotes,
    withDraft,
    withFinal,
    withEvidence,
    missingFinal
  }
})

function fmtWhen(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
}

// Make sure each section has a draft + link form initialized so the
// template can bind v-model into them safely on first render.
watch(
  () => props.studio.sections,
  (sections) => {
    for (const s of sections) {
      ensureDraft(s)
      ensureLinkForm(s)
    }
  },
  { immediate: true }
)
</script>

<template>
  <section class="space-y-4">
    <header class="space-y-1">
      <p class="text-xs uppercase tracking-wide text-neutral-500">
        Output workspace
      </p>
      <h2 class="text-lg font-semibold text-neutral-900">
        Build the {{ studio.title }}
      </h2>
      <p class="text-sm text-neutral-600">
        This is where your team writes the actual deliverable, section by
        section. Source notes capture your thinking, the draft response is
        your working answer, and the final Playbook text is what will roll
        into the Brand &amp; Operations Playbook.
      </p>
    </header>

    <!-- How to use this workspace — short orientation so students know
         which field to use when. Soft guidance, not a process gate. -->
    <section class="rounded-md border border-phoenix-100 bg-phoenix-50/60 p-3">
      <p class="text-xs font-semibold uppercase tracking-wide text-phoenix-800">
        How to use this workspace
      </p>
      <ol class="mt-1 list-decimal space-y-0.5 pl-5 text-xs text-neutral-700">
        <li>Read the section title and any guidance from your chief.</li>
        <li><strong>Source notes:</strong> capture your team's own thinking, decisions, and evidence in your own words.</li>
        <li><strong>Draft response:</strong> turn those notes into a working answer for the section. It can be rough.</li>
        <li><strong>Final Playbook text:</strong> polish the draft so it reads like part of the final Playbook.</li>
        <li>Add <strong>evidence links</strong> (Docs, Slides, folders, images) that back up what you wrote, then save.</li>
      </ol>
    </section>

    <p v-if="lockMessage" class="rounded-md border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-700">
      {{ lockMessage }}
    </p>
    <p v-if="provisioningError" class="text-xs text-rose-600">
      Couldn't initialize the output workspace: {{ provisioningError }}
    </p>

    <!-- Readiness summary (soft signal only; submit gate stays requirement-coverage). -->
    <section class="rounded-md border border-neutral-200 bg-white p-3">
      <p class="text-sm font-medium text-neutral-900">
        Output readiness signal:
        {{ readiness.withFinal }} of {{ readiness.total }} sections have final Playbook text.
      </p>
      <p class="mt-1 text-xs text-neutral-500">
        This is a soft signal to help you see how complete the artifact feels —
        it does <strong>not</strong> block submitting for review.
      </p>
      <p v-if="readiness.missingFinal" class="mt-1 text-xs text-neutral-600">
        {{ readiness.missingFinal }}
        {{ readiness.missingFinal === 1 ? 'section still needs' : 'sections still need' }}
        final Playbook text before this artifact reads as finished.
      </p>
      <p v-else class="mt-1 text-xs text-emerald-700">
        Every section has final Playbook text. Nice.
      </p>
      <dl class="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-neutral-600 sm:grid-cols-4">
        <div><dt class="inline">Source notes</dt><dd class="inline"> · {{ readiness.withSourceNotes }}/{{ readiness.total }}</dd></div>
        <div><dt class="inline">Draft text</dt><dd class="inline"> · {{ readiness.withDraft }}/{{ readiness.total }}</dd></div>
        <div><dt class="inline">Final text</dt><dd class="inline"> · {{ readiness.withFinal }}/{{ readiness.total }}</dd></div>
        <div><dt class="inline">Evidence</dt><dd class="inline"> · {{ readiness.withEvidence }}/{{ readiness.total }}</dd></div>
      </dl>
    </section>

    <p v-if="loading" class="text-sm text-neutral-500">Loading workspace…</p>

    <ol v-else class="space-y-3">
      <li
        v-for="(s, i) in studio.sections"
        :key="s.id"
        class="card space-y-3"
      >
        <header class="space-y-0.5">
          <p class="text-xs uppercase tracking-wide text-neutral-500">
            Section {{ i + 1 }}
          </p>
          <h3 class="font-medium text-neutral-900">{{ s.title }}</h3>
          <p
            v-if="persistedSection(s)?.updatedAt"
            class="text-xs text-neutral-500"
          >
            Last saved {{ fmtWhen(persistedSection(s)!.updatedAt) }}
            <span v-if="persistedSection(s)?.updatedByEmail">
              · {{ persistedSection(s)!.updatedByEmail }}
            </span>
          </p>
        </header>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-neutral-800">
              Source notes
              <textarea
                v-model="drafts[s.id].sourceNotes"
                rows="3"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
                placeholder="What did your team decide, why, and what evidence backs it up?"
                @input="markDirty(s)"
              />
            </label>
            <p class="mt-1 text-xs text-neutral-500">
              Start here. Capture your team's own thinking, decisions, evidence,
              and questions in your own words.
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-neutral-800">
              Draft response
              <textarea
                v-model="drafts[s.id].draftText"
                rows="4"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
                placeholder="A working answer for this section — turn your source notes into sentences."
                @input="markDirty(s)"
              />
            </label>
            <p class="mt-1 text-xs text-neutral-500">
              Use this as the working version. It can be rough while your team
              is still improving the section.
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-neutral-800">
              Final Playbook text
              <textarea
                v-model="drafts[s.id].finalText"
                rows="5"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
                placeholder="The polished version that should read like part of the final Playbook."
                @input="markDirty(s)"
              />
            </label>
            <p class="mt-1 text-xs text-neutral-500">
              This is the polished version that should read like part of the
              final Brand &amp; Operations Playbook.
            </p>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2">
            <label
              v-if="editingEnabled"
              class="text-xs text-neutral-700"
            >
              Mark this section
              <select
                v-model="drafts[s.id].status"
                class="ml-1 rounded border border-neutral-300 p-1 text-xs"
                @change="markDirty(s)"
              >
                <option value="empty">Not started</option>
                <option value="in_progress">In progress</option>
                <option value="ready">Ready for review</option>
              </select>
            </label>
            <button
              v-if="editingEnabled"
              class="btn-primary text-xs"
              :disabled="savingSectionId === s.id || !hasChanges(s)"
              @click="save(s)"
            >
              {{ savingSectionId === s.id ? 'Saving…' : 'Save section' }}
            </button>
          </div>
          <p v-if="sectionError[s.id]" class="text-xs text-rose-600">
            {{ sectionError[s.id] }}
          </p>
        </div>

        <!-- Evidence links per section. Manual links only — no Drive API. -->
        <section class="space-y-2 rounded-md border border-neutral-200 bg-neutral-50 p-2">
          <header class="flex items-baseline justify-between">
            <h4 class="text-xs font-medium text-neutral-800">Evidence links</h4>
            <span class="text-xs text-neutral-500">
              {{ persistedSection(s)?.evidenceLinks?.length ?? 0 }} linked
            </span>
          </header>
          <p class="text-xs text-neutral-500">
            Attach Google Docs, Slides, folders, images, or other proof that
            supports this section.
          </p>
          <ul
            v-if="persistedSection(s) && (persistedSection(s)!.evidenceLinks?.length ?? 0) > 0"
            class="space-y-1 text-sm"
          >
            <li
              v-for="link in persistedSection(s)!.evidenceLinks"
              :key="link.id"
              class="flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-neutral-200 bg-white p-2"
            >
              <div class="min-w-0">
                <a
                  :href="link.url"
                  target="_blank"
                  rel="noopener"
                  class="font-medium text-phoenix-700 hover:underline"
                >{{ link.label }}</a>
                <span class="ml-2 text-xs uppercase tracking-wide text-neutral-500">
                  {{ link.type }}
                </span>
                <p class="text-xs text-neutral-500 truncate">{{ link.url }}</p>
              </div>
              <button
                v-if="editingEnabled"
                class="text-xs text-rose-700 hover:underline"
                :disabled="evidenceBusy === s.id"
                @click="removeLink(s, link.id)"
              >Remove</button>
            </li>
          </ul>
          <p v-else class="text-xs text-neutral-500">
            No evidence linked yet. Paste a Doc, Sheet, Slide, folder, or image URL.
          </p>

          <div v-if="editingEnabled" class="grid gap-2 sm:grid-cols-3">
            <label class="text-xs font-medium text-neutral-800">
              Label
              <input
                v-model="linkForms[s.id].label"
                type="text"
                placeholder="e.g. Beanie vendor quote"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
              />
            </label>
            <label class="text-xs font-medium text-neutral-800 sm:col-span-2">
              URL
              <input
                v-model="linkForms[s.id].url"
                type="url"
                placeholder="https://…"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
              />
            </label>
            <label class="text-xs font-medium text-neutral-800">
              Type
              <select
                v-model="linkForms[s.id].type"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
              >
                <option v-for="t in EVIDENCE_TYPES" :key="t" :value="t">{{ t }}</option>
              </select>
            </label>
            <label
              v-if="studio.requirements.length"
              class="text-xs font-medium text-neutral-800 sm:col-span-2"
            >
              Linked requirement (optional)
              <select
                v-model="linkForms[s.id].requirementId"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
              >
                <option :value="null">— None —</option>
                <option
                  v-for="r in studio.requirements"
                  :key="r.id"
                  :value="r.id"
                >{{ r.label }}</option>
              </select>
            </label>
            <div class="sm:col-span-3 flex items-center justify-between gap-2">
              <p v-if="linkErrors[s.id]" class="text-xs text-rose-600">
                {{ linkErrors[s.id] }}
              </p>
              <button
                class="btn-primary text-xs"
                :disabled="evidenceBusy === s.id"
                @click="addLink(s)"
              >
                {{ evidenceBusy === s.id ? 'Adding…' : 'Add evidence link' }}
              </button>
            </div>
          </div>
        </section>
      </li>
    </ol>

    <!-- Playbook-ready preview — read-only roll-up of every section's final text. -->
    <section class="card space-y-3">
      <header>
        <p class="text-xs uppercase tracking-wide text-neutral-500">
          Playbook-ready preview
        </p>
        <h3 class="font-medium text-neutral-900">{{ studio.title }}</h3>
        <p class="text-xs text-neutral-600">
          Read-only roll-up of the final Playbook text from each section above.
          This is what your team is preparing for the Brand &amp; Operations
          Playbook.
        </p>
      </header>
      <ol class="space-y-3">
        <li
          v-for="s in studio.sections"
          :key="`preview-${s.id}`"
          class="rounded-md border border-neutral-200 p-3"
        >
          <p class="text-sm font-medium text-neutral-900">{{ s.title }}</p>
          <p
            v-if="(persistedSection(s)?.finalText ?? '').trim()"
            class="mt-1 whitespace-pre-wrap text-sm text-neutral-800"
          >{{ persistedSection(s)!.finalText }}</p>
          <p v-else class="mt-1 text-xs italic text-neutral-500">
            Final text not added yet.
          </p>
          <ul
            v-if="(persistedSection(s)?.evidenceLinks?.length ?? 0) > 0"
            class="mt-2 space-y-0.5 text-xs"
          >
            <li
              v-for="link in persistedSection(s)!.evidenceLinks"
              :key="`preview-link-${link.id}`"
            >
              ↳
              <a
                :href="link.url"
                target="_blank"
                rel="noopener"
                class="text-phoenix-700 hover:underline"
              >{{ link.label }}</a>
              <span class="ml-1 uppercase tracking-wide text-neutral-500">
                {{ link.type }}
              </span>
            </li>
          </ul>
        </li>
      </ol>
    </section>
  </section>
</template>
