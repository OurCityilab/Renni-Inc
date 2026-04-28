<script setup lang="ts">
import { collection, getDocs } from 'firebase/firestore'
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { isChiefForRole, useRoster } from '~/composables/useRoster'
import {
  DEPARTMENTS,
  type Department,
  type Role,
  type RosterEntry
} from '~/types/models'

definePageMeta({ middleware: ['admin'] })

const auth = useAuthStore()
const roster = useRoster()
const { data: entries, loading } = roster.watchAll()

const ROLE_OPTIONS: Role[] = ['coceo', 'coo', 'cfo', 'cmo', 'csgo', 'member', 'admin']

// One-shot read of users/{uid} on mount so we can show a "Signed in" /
// "Pending first sign-in" indicator. Not reactive — the provisioning flow
// doesn't happen from this page, and admin can reload if they want the
// freshest view.
const provisionedEmails = ref<Set<string>>(new Set())
onMounted(async () => {
  try {
    const snap = await getDocs(collection(useNuxtApp().$firebase.db, 'users'))
    const s = new Set<string>()
    snap.forEach((d) => {
      const email = (d.data() as { email?: string }).email
      if (email) s.add(email.toLowerCase())
    })
    provisionedEmails.value = s
  } catch {
    // Non-fatal; the signed-in badge just won't render.
  }
})

function byDisplayName(a: RosterEntry, b: RosterEntry) {
  return (a.displayName || '').localeCompare(b.displayName || '')
}

// The stated C-Suite is every isChief entry whose role isn't 'admin'.
// Computing from role (rather than from the stored isChief flag) keeps us
// consistent even if a stale roster doc has drifted.
const cSuite = computed<RosterEntry[]>(() =>
  [...entries.value]
    .filter((e) => e.role !== 'admin' && isChiefForRole(e.role))
    .sort(byDisplayName)
)

const instructors = computed<RosterEntry[]>(() =>
  [...entries.value].filter((e) => e.role === 'admin').sort(byDisplayName)
)

// All non-admin entries grouped by department, in the order we want them
// displayed on the page.
const DEPT_ORDER: Department[] = [
  'executive',
  'strategy-growth',
  'operations',
  'finance',
  'marketing'
]

const byDepartment = computed(() => {
  const buckets = new Map<Department, RosterEntry[]>()
  for (const d of DEPT_ORDER) buckets.set(d, [])
  for (const e of entries.value) {
    if (e.role === 'admin') continue
    const arr = buckets.get(e.department) ?? []
    arr.push(e)
    buckets.set(e.department, arr)
  }
  const out: Array<{ department: Department; members: RosterEntry[] }> = []
  for (const d of DEPT_ORDER) {
    const members = (buckets.get(d) || []).sort(byDisplayName)
    if (members.length) out.push({ department: d, members })
  }
  return out
})

// --- edit state ---
const editingEmail = ref<string | null>(null)
const draftRole = ref<Role>('member')
const draftTitle = ref('')
const draftDepartment = ref<Department>('executive')
const savingEmail = ref<string | null>(null)
const rowError = ref<Record<string, string>>({})

function startEdit(e: RosterEntry) {
  editingEmail.value = e.email
  draftRole.value = e.role
  draftTitle.value = e.title
  draftDepartment.value = e.department
  rowError.value[e.email] = ''
}

function cancelEdit() {
  editingEmail.value = null
}

async function save(e: RosterEntry) {
  savingEmail.value = e.email
  rowError.value[e.email] = ''
  try {
    // isChief is derived from role so it can never drift from the role map.
    // Email is the doc id — renaming it would be a delete+create, out of
    // scope for this pass; intentionally not editable here.
    await roster.update(e.email, {
      role: draftRole.value,
      title: draftTitle.value.trim(),
      department: draftDepartment.value,
      isChief: isChiefForRole(draftRole.value)
    })
    // Section Task Assignment sprint: propagate the role / dept /
    // isChief change to the user's `users/{uid}` doc so an active
    // session (e.g. the former chief still logged in in another
    // tab) loses chief-level UI capabilities immediately via the
    // auth store's live profile subscription. Without this, the
    // change only lands the next time they sign in. Best-effort —
    // a sync failure does NOT block the roster save.
    try {
      await roster.syncUserFromRoster(e.email)
    } catch {
      // Non-fatal. The roster row is now correct; the user's
      // session will pick up the change on next sign-in.
    }
    editingEmail.value = null
  } catch (err) {
    rowError.value[e.email] = err instanceof Error ? err.message : String(err)
  } finally {
    savingEmail.value = null
  }
}

function isProvisioned(e: RosterEntry): boolean {
  return provisionedEmails.value.has(e.email.toLowerCase())
}
</script>

<template>
  <section class="space-y-6">
    <header>
      <p class="text-sm text-neutral-500">Admin</p>
      <h1 class="text-2xl font-semibold">Team &amp; Role Management</h1>
      <p class="text-sm text-neutral-600">
        Roster entries the app reads for permissions, dashboards, and chapter ownership.
        Edits apply immediately. A user must sign in once before their {{ '{' }}uid{{ '}' }} doc is provisioned.
      </p>
      <p v-if="!auth.isAdmin" class="mt-2 text-sm text-rose-600">
        Admin access required to edit.
      </p>
    </header>

    <p v-if="loading" class="text-sm text-neutral-500">Loading roster…</p>

    <template v-else>
      <!-- C-Suite -->
      <section class="space-y-2">
        <h2 class="text-sm font-semibold text-neutral-800">Executive Team / C-Suite</h2>
        <p class="text-xs text-neutral-500">
          Chiefs who oversee Renni Inc. departments. Admin / program-lead rows appear separately below.
        </p>
        <ul class="space-y-2">
          <li
            v-for="e in cSuite"
            :key="e.email"
            class="card space-y-2"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="font-medium text-neutral-900">{{ e.displayName }}</p>
                <p class="text-xs text-neutral-500">
                  {{ e.email }} · {{ e.title }} · {{ e.department }}
                </p>
              </div>
              <div class="flex shrink-0 items-center gap-2 text-xs">
                <span
                  class="rounded-full border px-2 py-0.5 uppercase tracking-wide"
                  :class="isProvisioned(e)
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-neutral-300 text-neutral-500'"
                >{{ isProvisioned(e) ? 'Signed in' : 'Pending first sign-in' }}</span>
                <span
                  class="rounded-full border border-phoenix-300 bg-phoenix-50 px-2 py-0.5 text-phoenix-800"
                >{{ e.role }}</span>
                <button
                  v-if="editingEmail !== e.email"
                  class="text-xs text-phoenix-700 hover:underline"
                  @click="startEdit(e)"
                >Edit</button>
              </div>
            </div>

            <div
              v-if="editingEmail === e.email"
              class="grid gap-2 border-t border-neutral-200 pt-2 sm:grid-cols-3"
            >
              <label class="text-xs font-medium text-neutral-800">
                Role
                <select
                  v-model="draftRole"
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                >
                  <option v-for="r in ROLE_OPTIONS" :key="r" :value="r">{{ r }}</option>
                </select>
              </label>
              <label class="text-xs font-medium text-neutral-800">
                Title
                <input
                  v-model="draftTitle"
                  type="text"
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                />
              </label>
              <label class="text-xs font-medium text-neutral-800">
                Department
                <select
                  v-model="draftDepartment"
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                >
                  <option v-for="d in DEPARTMENTS" :key="d" :value="d">{{ d }}</option>
                </select>
              </label>
              <div class="sm:col-span-3 flex justify-end gap-2">
                <button class="btn-secondary" @click="cancelEdit">Cancel</button>
                <button
                  class="btn-primary"
                  :disabled="savingEmail === e.email"
                  @click="save(e)"
                >{{ savingEmail === e.email ? 'Saving…' : 'Save' }}</button>
              </div>
            </div>
            <p v-if="rowError[e.email]" class="text-xs text-rose-600">
              {{ rowError[e.email] }}
            </p>
          </li>
        </ul>
      </section>

      <!-- Departments -->
      <section
        v-for="dept in byDepartment"
        :key="dept.department"
        class="space-y-2"
      >
        <h2 class="text-sm font-semibold text-neutral-800">
          {{ dept.department === 'strategy-growth' ? 'Strategy and Growth' : dept.department }}
        </h2>
        <ul class="space-y-2">
          <li
            v-for="e in dept.members"
            :key="e.email"
            class="card space-y-2"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="font-medium text-neutral-900">{{ e.displayName }}</p>
                <p class="text-xs text-neutral-500">
                  {{ e.email }} · {{ e.title }}
                </p>
              </div>
              <div class="flex shrink-0 items-center gap-2 text-xs">
                <span
                  class="rounded-full border px-2 py-0.5 uppercase tracking-wide"
                  :class="isProvisioned(e)
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-neutral-300 text-neutral-500'"
                >{{ isProvisioned(e) ? 'Signed in' : 'Pending first sign-in' }}</span>
                <span
                  v-if="e.isChief"
                  class="rounded-full border border-phoenix-300 bg-phoenix-50 px-2 py-0.5 text-phoenix-800"
                >chief</span>
                <span class="rounded-full border border-neutral-300 px-2 py-0.5 text-neutral-600">{{ e.role }}</span>
                <button
                  v-if="editingEmail !== e.email"
                  class="text-xs text-phoenix-700 hover:underline"
                  @click="startEdit(e)"
                >Edit</button>
              </div>
            </div>

            <div
              v-if="editingEmail === e.email"
              class="grid gap-2 border-t border-neutral-200 pt-2 sm:grid-cols-3"
            >
              <label class="text-xs font-medium text-neutral-800">
                Role
                <select
                  v-model="draftRole"
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                >
                  <option v-for="r in ROLE_OPTIONS" :key="r" :value="r">{{ r }}</option>
                </select>
              </label>
              <label class="text-xs font-medium text-neutral-800">
                Title
                <input
                  v-model="draftTitle"
                  type="text"
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                />
              </label>
              <label class="text-xs font-medium text-neutral-800">
                Department
                <select
                  v-model="draftDepartment"
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                >
                  <option v-for="d in DEPARTMENTS" :key="d" :value="d">{{ d }}</option>
                </select>
              </label>
              <div class="sm:col-span-3 flex justify-end gap-2">
                <button class="btn-secondary" @click="cancelEdit">Cancel</button>
                <button
                  class="btn-primary"
                  :disabled="savingEmail === e.email"
                  @click="save(e)"
                >{{ savingEmail === e.email ? 'Saving…' : 'Save' }}</button>
              </div>
            </div>
            <p v-if="rowError[e.email]" class="text-xs text-rose-600">
              {{ rowError[e.email] }}
            </p>
          </li>
        </ul>
      </section>

      <!-- Instructors -->
      <section class="space-y-2">
        <h2 class="text-sm font-semibold text-neutral-800">Instructors / Program Leads</h2>
        <ul class="space-y-2">
          <li
            v-for="e in instructors"
            :key="e.email"
            class="card"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="font-medium text-neutral-900">{{ e.displayName }}</p>
                <p class="text-xs text-neutral-500">
                  {{ e.email }} · {{ e.title }} · {{ e.department }}
                </p>
              </div>
              <div class="flex shrink-0 items-center gap-2 text-xs">
                <span
                  class="rounded-full border px-2 py-0.5 uppercase tracking-wide"
                  :class="isProvisioned(e)
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-neutral-300 text-neutral-500'"
                >{{ isProvisioned(e) ? 'Signed in' : 'Pending first sign-in' }}</span>
                <span
                  class="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-amber-800"
                >admin</span>
              </div>
            </div>
          </li>
        </ul>
      </section>
    </template>
  </section>
</template>
