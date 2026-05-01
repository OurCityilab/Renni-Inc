<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useBmc } from '~/composables/useBmc'
import type { BmcBlock, BmcBlockKey } from '~/types/models'
import { BMC_BLOCK_KEYS } from '~/types/models'

const auth = useAuthStore()
const bmc = useBmc()
const { data: blocks, loading } = bmc.watchAll()

// Firestore rule: admin, Co-CEO, or Strategy and Growth (csgo role
// enum) may edit any Canvas block. UI gates the textarea/Save on
// the same predicate so failed writes aren't the first feedback.
const canEdit = computed(
  () =>
    auth.isAdmin ||
    auth.isCoCEO ||
    auth.profile?.role === 'csgo'
)

// Arrange blocks in the classic Canvas reading order so the grid
// matches what students learn in class. Unseeded keys fall back to
// empty cells so a missing seed is visible rather than silent.
const byKey = computed<Partial<Record<BmcBlockKey, BmcBlock>>>(() => {
  const out: Partial<Record<BmcBlockKey, BmcBlock>> = {}
  for (const b of blocks.value) out[b.id] = b
  return out
})

// Per-block local draft so typing doesn't clobber incoming snapshots and
// users only hit Save when they're ready. `dirty[key]` tracks whether
// the current editor has typed anything since last save/load: snapshots
// only refresh non-dirty blocks, so a collaborator's save propagates into
// an untouched textarea but never overwrites work in progress.
const drafts = ref<Record<string, string>>({})
const dirty = ref<Record<string, boolean>>({})
const savingId = ref<string | null>(null)
const rowError = ref<Record<string, string>>({})

function markDirty(key: BmcBlockKey) {
  dirty.value[key] = true
}

// Snapshot handler:
//   - First sighting of a block key → seed draft, not dirty.
//   - Subsequent snapshots → if the editor hasn't typed (dirty=false),
//     refresh the local draft to the newest saved content so another
//     tab's save shows up and Save stays disabled. If dirty=true, leave
//     the draft alone so in-progress typing survives.
watch(
  blocks,
  (list) => {
    for (const b of list) {
      if (!(b.id in drafts.value)) {
        drafts.value[b.id] = b.content ?? ''
        dirty.value[b.id] = false
      } else if (!dirty.value[b.id]) {
        drafts.value[b.id] = b.content ?? ''
      }
    }
  },
  { immediate: true }
)

function hasChanges(key: BmcBlockKey): boolean {
  const b = byKey.value[key]
  if (!b) return false
  return (drafts.value[key] ?? '') !== (b.content ?? '')
}

async function save(key: BmcBlockKey) {
  if (!canEdit.value) return
  savingId.value = key
  rowError.value[key] = ''
  try {
    await bmc.update(key, {
      content: drafts.value[key] ?? '',
      updatedByEmail: auth.profile?.email || auth.user?.email || null
    })
    // Our own successful save: the incoming snapshot will carry the value
    // we just wrote. Clearing dirty here lets the watcher's refresh branch
    // treat that echo as a no-op and keeps Save disabled until next edit.
    dirty.value[key] = false
  } catch (e) {
    rowError.value[key] = e instanceof Error ? e.message : String(e)
  } finally {
    savingId.value = null
  }
}

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

const statusTone = {
  draft: 'border-neutral-300 text-neutral-600',
  reviewed: 'border-emerald-300 bg-emerald-50 text-emerald-800'
} as const
</script>

<template>
  <section class="space-y-5">
    <header>
      <p class="text-sm text-neutral-500">Strategy</p>
      <h1 class="text-2xl font-semibold">Business Model Canvas</h1>
      <p class="text-sm text-neutral-600">
        The Business Model Canvas explains how Renni Inc. and House Phoenix create, deliver,
        and capture value. Use the TechTown pop-up as the current business case. Revenue-related
        blocks link to <NuxtLink to="/pricing" class="text-phoenix-700 hover:underline">Pricing</NuxtLink>
        and <NuxtLink to="/revenue" class="text-phoenix-700 hover:underline">Revenue</NuxtLink>.
      </p>
      <p v-if="!canEdit" class="mt-1 text-xs text-neutral-500">
        Read-only. Admin, Co-CEO, or Strategy and Growth can edit.
      </p>
    </header>

    <p v-if="loading" class="text-sm text-neutral-500">Loading canvas…</p>
    <p v-else-if="!blocks.length" class="text-sm text-neutral-500">
      No canvas blocks yet. Run <code>npm run seed:bmc</code> to load the 9 block prompts.
    </p>

    <ul v-else class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      <li
        v-for="key in BMC_BLOCK_KEYS"
        :key="key"
        class="card flex flex-col space-y-2"
      >
        <template v-if="byKey[key]">
          <header class="flex flex-wrap items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="text-xs uppercase tracking-wide text-neutral-500">
                {{ key.replace(/_/g, ' ') }}
              </p>
              <h2 class="font-medium text-neutral-900">{{ byKey[key]!.title }}</h2>
            </div>
            <span
              v-if="byKey[key]!.status"
              class="rounded-full border px-2 py-0.5 text-xs"
              :class="statusTone[byKey[key]!.status!] || statusTone.draft"
            >{{ byKey[key]!.status === 'reviewed' ? 'Reviewed' : 'Draft' }}</span>
          </header>

          <p class="text-xs text-neutral-600">{{ byKey[key]!.prompt }}</p>

          <textarea
            v-model="drafts[key]"
            :disabled="!canEdit"
            rows="5"
            class="w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            :placeholder="canEdit ? 'Fill in your team\'s answer…' : 'Read-only until admin / Co-CEO / Strategy and Growth edits.'"
            @input="markDirty(key)"
          />

          <div class="flex items-center justify-between">
            <p class="text-xs text-neutral-500">
              <span v-if="byKey[key]!.ownerDepartment">
                {{ byKey[key]!.ownerDepartment }}
              </span>
              <span
                v-if="byKey[key]!.updatedAt"
                :class="byKey[key]!.ownerDepartment ? 'ml-2' : ''"
              >
                Updated {{ fmtWhen(byKey[key]!.updatedAt) }}
                <span v-if="byKey[key]!.updatedByEmail">
                  · {{ byKey[key]!.updatedByEmail }}
                </span>
              </span>
            </p>
            <button
              v-if="canEdit"
              class="btn-primary text-xs"
              :disabled="savingId === key || !hasChanges(key)"
              @click="save(key)"
            >
              {{ savingId === key ? 'Saving…' : 'Save' }}
            </button>
          </div>

          <p v-if="rowError[key]" class="text-xs text-rose-600">
            {{ rowError[key] }}
          </p>
        </template>
        <template v-else>
          <p class="text-xs uppercase tracking-wide text-neutral-500">
            {{ key.replace(/_/g, ' ') }}
          </p>
          <p class="text-sm text-neutral-500">
            Not seeded. Run <code>npm run seed:bmc</code>.
          </p>
        </template>
      </li>
    </ul>
  </section>
</template>
