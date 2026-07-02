<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useStudioAuthStore } from '~/stores/studioAuth'
import { usePortfolioArtifact } from '~/composables/usePortfolioArtifact'
import type { PortfolioArtifact, PortfolioArtifactType } from '~/types/studio/models'
import { portfolioArtifactTypeLabels } from '~/utils/studioLabels'

definePageMeta({ layout: 'studio' })

const statusChipClass: Record<PortfolioArtifact['coachStatus'], string> = {
  draft: 'chip-draft',
  needs_review: 'chip-review',
  approved: 'chip-approved'
}
const statusLabel: Record<PortfolioArtifact['coachStatus'], string> = {
  draft: 'Draft',
  needs_review: 'Needs review',
  approved: 'Approved'
}

const studioAuth = useStudioAuthStore()
const studentUid = studioAuth.profile?.uid ?? ''

const artifactApi = usePortfolioArtifact()
const artifacts = artifactApi.watchByStudent(studentUid)

// --- new artifact form ---
const showNewForm = ref(false)
const newForm = reactive({
  artifactType: 'reflection' as PortfolioArtifactType,
  title: '',
  content: ''
})
const savingNew = ref(false)

const writeError = ref<string | null>(null)

async function saveNewArtifact() {
  if (!newForm.title.trim() || !newForm.content.trim() || savingNew.value) return
  savingNew.value = true
  writeError.value = null
  try {
    await artifactApi.create(studentUid, newForm.artifactType, newForm.title, newForm.content)
    newForm.title = ''
    newForm.content = ''
    showNewForm.value = false
  } catch {
    writeError.value = "Couldn't save the artifact. Check your connection and try again."
  } finally {
    savingNew.value = false
  }
}

// --- per-card edit state ---
const editingId = ref<string | null>(null)
const editForm = reactive({ title: '', content: '' })
const savingEditId = ref<string | null>(null)
const copiedId = ref<string | null>(null)

function startEdit(artifact: PortfolioArtifact) {
  editingId.value = artifact.id
  editForm.title = artifact.title
  editForm.content = artifact.content
}

function cancelEdit() {
  editingId.value = null
}

async function saveEdit(artifact: PortfolioArtifact) {
  if (!editForm.title.trim() || savingEditId.value) return
  savingEditId.value = artifact.id
  writeError.value = null
  try {
    await artifactApi.updateContent(artifact.id, editForm.title, editForm.content)
    editingId.value = null
  } catch {
    writeError.value = "Couldn't save your changes. Check your connection and try again."
  } finally {
    savingEditId.value = null
  }
}

async function submitForReview(artifact: PortfolioArtifact) {
  writeError.value = null
  try {
    await artifactApi.submitForReview(artifact.id)
  } catch {
    writeError.value = "Couldn't submit for review. Check your connection and try again."
  }
}

async function removeArtifact(artifact: PortfolioArtifact) {
  if (!confirm(`Delete "${artifact.title}"? This can't be undone.`)) return
  writeError.value = null
  try {
    await artifactApi.remove(artifact.id)
  } catch {
    writeError.value = "Couldn't delete the artifact. Check your connection and try again."
  }
}

async function copyArtifact(artifact: PortfolioArtifact) {
  const text = `${artifact.title}\n\n${artifact.content}`
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      await artifactApi.markExported(artifact.id)
      copiedId.value = artifact.id
      window.setTimeout(() => {
        if (copiedId.value === artifact.id) copiedId.value = null
      }, 2000)
    }
  } catch {
    // Clipboard permission denied — button label just won't flip to
    // "Copied", nothing else depends on this succeeding.
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-lg font-semibold">My Portfolio</h1>
      <button class="btn-secondary" @click="showNewForm = !showNewForm">
        {{ showNewForm ? 'Cancel' : '+ New artifact' }}
      </button>
    </div>

    <p v-if="writeError" class="text-sm text-rose-700">{{ writeError }}</p>

    <div v-if="showNewForm" class="card space-y-3">
      <label class="block text-sm">
        <span class="font-medium text-neutral-700">Type</span>
        <select v-model="newForm.artifactType" class="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
          <option v-for="(label, value) in portfolioArtifactTypeLabels" :key="value" :value="value">
            {{ label }}
          </option>
        </select>
      </label>
      <label class="block text-sm">
        <span class="font-medium text-neutral-700">Title</span>
        <input
          v-model="newForm.title"
          type="text"
          class="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          placeholder="e.g. My brand sentence"
        >
      </label>
      <label class="block text-sm">
        <span class="font-medium text-neutral-700">Content</span>
        <textarea
          v-model="newForm.content"
          rows="4"
          class="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          placeholder="Paste or write the finished piece here"
        />
      </label>
      <button
        class="btn-primary w-full"
        :disabled="savingNew || !newForm.title.trim() || !newForm.content.trim()"
        @click="saveNewArtifact"
      >
        {{ savingNew ? 'Saving…' : 'Save artifact' }}
      </button>
    </div>

    <div v-if="artifacts.loading.value" class="card text-sm text-neutral-500">
      Loading your portfolio…
    </div>

    <div v-else-if="!artifacts.data.value.length" class="card text-sm text-neutral-600">
      Nothing here yet. Finished work from The Lab and The Markets will show up here — or add one yourself above.
    </div>

    <div v-for="artifact in artifacts.data.value" :key="artifact.id" class="card space-y-3">
      <div class="flex items-start justify-between gap-3">
        <span class="chip bg-studio-100 text-studio-800">{{ portfolioArtifactTypeLabels[artifact.artifactType] }}</span>
        <span :class="statusChipClass[artifact.coachStatus]">{{ statusLabel[artifact.coachStatus] }}</span>
      </div>

      <template v-if="editingId === artifact.id">
        <input
          v-model="editForm.title"
          type="text"
          class="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium"
        >
        <textarea
          v-model="editForm.content"
          rows="5"
          class="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <div class="flex flex-wrap gap-2">
          <button
            class="btn-primary"
            :disabled="savingEditId === artifact.id || !editForm.title.trim()"
            @click="saveEdit(artifact)"
          >
            {{ savingEditId === artifact.id ? 'Saving…' : 'Save' }}
          </button>
          <button class="btn-secondary" @click="cancelEdit">Cancel</button>
        </div>
      </template>

      <template v-else>
        <div>
          <h2 class="text-base font-semibold">{{ artifact.title }}</h2>
          <p class="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{{ artifact.content }}</p>
        </div>
        <p v-if="artifact.coachFeedback" class="rounded-md bg-amber-50 p-2 text-sm text-amber-800">
          Coach feedback: {{ artifact.coachFeedback }}
        </p>

        <div class="flex flex-wrap gap-2">
          <button class="btn-secondary" @click="copyArtifact(artifact)">
            {{ copiedId === artifact.id ? 'Copied ✓' : 'Copy' }}
          </button>
          <button
            v-if="artifact.coachStatus !== 'approved'"
            class="btn-secondary"
            @click="startEdit(artifact)"
          >
            Edit
          </button>
          <button
            v-if="artifact.coachStatus === 'draft'"
            class="btn-secondary"
            @click="submitForReview(artifact)"
          >
            Submit for review
          </button>
          <button class="btn-secondary" disabled title="Coming soon">Ask AI to improve</button>
          <button
            v-if="artifact.coachStatus === 'draft'"
            class="btn-secondary text-rose-700"
            @click="removeArtifact(artifact)"
          >
            Delete
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
