<script setup lang="ts">
import { collection, getDocs } from 'firebase/firestore'
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useRoster } from '~/composables/useRoster'
import type { EmailStatus, RosterEntry } from '~/types/models'

// Admin-only Access Manager (V1).
//
// Purpose: when a student missed signup or their LTU email is blocked at
// login, an instructor / admin uses this page to approve an alternate
// Google email so the student can still get into the Command Center.
//
// Posture (do not relax in V1):
//   - additive only; never gates submit / readiness / approval / pricing.
//   - never edits role, title, department, or admin status (use /team).
//   - never creates Firebase Auth users; never updates Auth email.
//   - relies on existing Firestore rules: admin-only writes on roster.
//   - audit fields are stamped by useRoster.update.
definePageMeta({ middleware: ['admin'] })

const auth = useAuthStore()
const roster = useRoster()
const { data: entries, loading } = roster.watchAll()

const STATUS_OPTIONS: Array<{ value: EmailStatus | ''; label: string }> = [
  { value: '', label: '— No status —' },
  { value: 'active', label: 'Active' },
  { value: 'pending-signup', label: 'Pending signup' },
  { value: 'email-issue', label: 'Email issue' },
  { value: 'needs-review', label: 'Needs review' }
]

const STATUS_LABEL: Record<EmailStatus | '', string> = {
  '': 'No status',
  active: 'Active',
  'pending-signup': 'Pending signup',
  'email-issue': 'Email issue',
  'needs-review': 'Needs review'
}

const STATUS_CHIP_CLASS: Record<EmailStatus | '', string> = {
  '': 'border-neutral-300 text-neutral-600',
  active: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  'pending-signup': 'border-sky-300 bg-sky-50 text-sky-800',
  'email-issue': 'border-rose-300 bg-rose-50 text-rose-800',
  'needs-review': 'border-amber-300 bg-amber-50 text-amber-800'
}

// Provisioned users — cached once at mount so signup-status badges render.
// /team uses the same one-shot pattern.
const provisionedEmails = ref<Set<string>>(new Set())
onMounted(async () => {
  try {
    const snap = await getDocs(collection(useNuxtApp().$firebase.db, 'users'))
    const s = new Set<string>()
    snap.forEach((d) => {
      const data = d.data() as { email?: string; rosterEmail?: string }
      if (data.email) s.add(data.email.toLowerCase())
      if (data.rosterEmail) s.add(data.rosterEmail.toLowerCase())
    })
    provisionedEmails.value = s
  } catch {
    // Non-fatal — the badge just won't render.
  }
})

function isProvisioned(e: RosterEntry): boolean {
  const primary = e.email.toLowerCase()
  const alt = (e.alternateEmail || '').toLowerCase()
  return provisionedEmails.value.has(primary) ||
    (alt.length > 0 && provisionedEmails.value.has(alt))
}

function signupBadgeLabel(e: RosterEntry): string {
  if (isProvisioned(e)) return 'Signed in'
  return 'Pending first sign-in'
}

function signupBadgeClass(e: RosterEntry): string {
  return isProvisioned(e)
    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
    : 'border-neutral-300 text-neutral-500'
}

// --- search / filter ---
const search = ref('')
const filtered = computed<RosterEntry[]>(() => {
  const q = search.value.trim().toLowerCase()
  const list = [...entries.value].sort((a, b) =>
    (a.displayName || '').localeCompare(b.displayName || '')
  )
  if (!q) return list
  return list.filter((e) => {
    return (
      (e.email || '').toLowerCase().includes(q) ||
      (e.alternateEmail || '').toLowerCase().includes(q) ||
      (e.displayName || '').toLowerCase().includes(q) ||
      (e.role || '').toLowerCase().includes(q) ||
      (e.department || '').toLowerCase().includes(q) ||
      (e.title || '').toLowerCase().includes(q)
    )
  })
})

// --- edit state ---
interface Draft {
  alternateEmail: string
  emailStatus: EmailStatus | ''
  accessNotes: string
}
const editingEmail = ref<string | null>(null)
const draft = ref<Draft>({ alternateEmail: '', emailStatus: '', accessNotes: '' })
const savingEmail = ref<string | null>(null)
const rowError = ref<Record<string, string>>({})

function startEdit(e: RosterEntry) {
  editingEmail.value = e.email
  draft.value = {
    alternateEmail: (e.alternateEmail || '').toLowerCase(),
    emailStatus: (e.emailStatus as EmailStatus | '' | undefined) ?? '',
    accessNotes: e.accessNotes || ''
  }
  rowError.value[e.email] = ''
}

function cancelEdit() {
  editingEmail.value = null
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateAlternate(
  candidate: string,
  rowEmail: string
): string | null {
  const value = candidate.trim().toLowerCase()
  if (!value) return null
  if (!EMAIL_RE.test(value)) {
    return 'Alternate email is not a valid email address.'
  }
  if (value === rowEmail.toLowerCase()) {
    return 'Alternate email cannot equal the primary email on this row.'
  }
  // Collision with another row's primary email: blocked because that
  // would make two roster rows match the same login.
  const collidesWithPrimary = entries.value.find(
    (other) =>
      other.email.toLowerCase() !== rowEmail.toLowerCase() &&
      other.email.toLowerCase() === value
  )
  if (collidesWithPrimary) {
    return `That address is already a primary roster email (${collidesWithPrimary.displayName}). Pick a different alternate.`
  }
  // Collision with another row's alternate email: same problem in reverse.
  const collidesWithAlt = entries.value.find(
    (other) =>
      other.email.toLowerCase() !== rowEmail.toLowerCase() &&
      (other.alternateEmail || '').toLowerCase() === value
  )
  if (collidesWithAlt) {
    return `That alternate email is already approved for ${collidesWithAlt.displayName}. Each alternate email can only belong to one roster row.`
  }
  return null
}

async function save(e: RosterEntry) {
  const altRaw = draft.value.alternateEmail.trim().toLowerCase()
  const validation = validateAlternate(altRaw, e.email)
  if (validation) {
    rowError.value[e.email] = validation
    return
  }
  savingEmail.value = e.email
  rowError.value[e.email] = ''
  try {
    await roster.update(e.email, {
      alternateEmail: altRaw,
      emailStatus: draft.value.emailStatus,
      accessNotes: draft.value.accessNotes.trim()
    })
    editingEmail.value = null
  } catch (err) {
    rowError.value[e.email] = err instanceof Error ? err.message : String(err)
  } finally {
    savingEmail.value = null
  }
}

async function clearAlternate(e: RosterEntry) {
  if (!e.alternateEmail) return
  savingEmail.value = e.email
  rowError.value[e.email] = ''
  try {
    await roster.update(e.email, { alternateEmail: '' })
  } catch (err) {
    rowError.value[e.email] = err instanceof Error ? err.message : String(err)
  } finally {
    savingEmail.value = null
  }
}

// Plain instructions an admin can paste into a message to a student
// whose LTU email is blocked.
const COPY_TEMPLATE = `Hi — I've added an alternate Google email for your Renni Command Center login.

Steps:
  1. Go to the Command Center and click "Continue with Google".
  2. Choose the Google account I approved (not your LTU email).
  3. If you see "We couldn't match this account yet", check that you picked the right Google account, then try again.

If you still can't get in, message me with the exact email shown on the screen.`

const copiedTemplate = ref(false)
async function copyTemplate() {
  try {
    await navigator.clipboard.writeText(COPY_TEMPLATE)
    copiedTemplate.value = true
    setTimeout(() => (copiedTemplate.value = false), 1500)
  } catch {
    /* ignore */
  }
}
</script>

<template>
  <section class="space-y-6">
    <header class="space-y-1">
      <p class="text-sm text-neutral-500">Admin</p>
      <h1 class="text-2xl font-semibold">User Access</h1>
      <p class="text-sm text-neutral-700">
        This page controls who can access Renni Command Center. Use it when a
        student missed signup or needs an alternate approved email because
        their LTU email is blocked.
      </p>
      <p v-if="!auth.isAdmin" class="mt-1 text-sm text-rose-600">
        Admin access required.
      </p>
    </header>

    <!-- Warnings -->
    <section class="card space-y-1 border-amber-200 bg-amber-50/40 text-sm text-neutral-800">
      <p class="font-semibold">Before you change anything</p>
      <ul class="ml-5 list-disc space-y-0.5">
        <li>
          Changing approved email does not change a student's Firebase Auth
          email unless the system explicitly supports Auth email updates.
          (V1 does not — students sign in with the alternate Google account.)
        </li>
        <li>Do not approve emails you cannot identify.</li>
        <li>
          Roles should only be changed by Instructor / Admin. Use
          <NuxtLink to="/team" class="text-phoenix-700 underline">Team &amp; Role Management</NuxtLink>
          for role / title / department.
        </li>
      </ul>
    </section>

    <!-- Login instructions -->
    <section class="card space-y-2 text-sm">
      <header class="flex flex-wrap items-baseline justify-between gap-2">
        <p class="font-semibold">Login instructions for students</p>
        <button
          type="button"
          class="rounded border border-phoenix-300 bg-white px-2 py-1 text-xs text-phoenix-800 hover:bg-phoenix-50"
          @click="copyTemplate"
        >{{ copiedTemplate ? 'Copied ✓' : 'Copy message' }}</button>
      </header>
      <p class="text-neutral-700">
        Use the email approved by your instructor. If your LTU email is blocked,
        ask the instructor to add an alternate approved email.
      </p>
    </section>

    <!-- Search -->
    <div class="flex flex-wrap items-center gap-2">
      <input
        v-model="search"
        type="search"
        placeholder="Search name, email, role, department…"
        class="w-full rounded border border-neutral-300 p-2 text-sm sm:max-w-xs"
      />
      <p class="text-xs text-neutral-500">
        {{ filtered.length }} of {{ entries.length }} roster {{ entries.length === 1 ? 'entry' : 'entries' }}
      </p>
    </div>

    <p v-if="loading" class="text-sm text-neutral-500">Loading roster…</p>

    <ul v-else class="space-y-2">
      <li
        v-for="e in filtered"
        :key="e.email"
        class="card space-y-2"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0 space-y-0.5">
            <p class="font-medium text-neutral-900">{{ e.displayName }}</p>
            <p class="text-xs text-neutral-500">
              <span class="font-medium text-neutral-700">{{ e.email }}</span>
              · {{ e.role }} · {{ e.department }} · {{ e.title }}
            </p>
            <p
              v-if="e.alternateEmail"
              class="text-xs text-neutral-700"
            >
              Alternate approved email:
              <span class="font-mono">{{ e.alternateEmail }}</span>
            </p>
            <p v-if="e.accessNotes" class="text-xs italic text-neutral-600">
              {{ e.accessNotes }}
            </p>
            <p v-if="e.updatedAt" class="text-[11px] text-neutral-500">
              Last access update {{ e.updatedAt.slice(0, 10) }}<span v-if="e.updatedByEmail">
                · by {{ e.updatedByEmail }}</span>
            </p>
          </div>
          <div class="flex shrink-0 flex-wrap items-center gap-2 text-xs">
            <span
              class="rounded-full border px-2 py-0.5 uppercase tracking-wide"
              :class="signupBadgeClass(e)"
            >{{ signupBadgeLabel(e) }}</span>
            <span
              v-if="e.emailStatus"
              class="rounded-full border px-2 py-0.5 uppercase tracking-wide"
              :class="STATUS_CHIP_CLASS[(e.emailStatus as EmailStatus | '')]"
            >{{ STATUS_LABEL[(e.emailStatus as EmailStatus | '')] }}</span>
            <button
              v-if="editingEmail !== e.email"
              type="button"
              class="text-xs text-phoenix-700 hover:underline"
              @click="startEdit(e)"
            >Edit access</button>
          </div>
        </div>

        <div
          v-if="editingEmail === e.email"
          class="grid gap-2 border-t border-neutral-200 pt-2 sm:grid-cols-3"
        >
          <label class="text-xs font-medium text-neutral-800 sm:col-span-2">
            Alternate approved email
            <input
              v-model="draft.alternateEmail"
              type="email"
              autocomplete="off"
              spellcheck="false"
              placeholder="student.personal@gmail.com"
              class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
            />
            <p class="mt-1 text-[11px] text-neutral-500">
              Lets the student sign in with this Google account if their
              LTU login is blocked. Leave blank to remove.
            </p>
          </label>
          <label class="text-xs font-medium text-neutral-800">
            Email status
            <select
              v-model="draft.emailStatus"
              class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
            >
              <option
                v-for="opt in STATUS_OPTIONS"
                :key="opt.value"
                :value="opt.value"
              >{{ opt.label }}</option>
            </select>
            <p class="mt-1 text-[11px] text-neutral-500">
              Display label only — does not change access.
            </p>
          </label>
          <label class="text-xs font-medium text-neutral-800 sm:col-span-3">
            Access notes
            <textarea
              v-model="draft.accessNotes"
              rows="2"
              class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
              placeholder="e.g. LTU email blocked 2026-04-26; using personal Gmail"
            />
          </label>
          <div class="sm:col-span-3 flex flex-wrap items-center justify-end gap-2">
            <button
              v-if="e.alternateEmail"
              type="button"
              class="btn-secondary"
              :disabled="savingEmail === e.email"
              @click="clearAlternate(e)"
            >Clear alternate</button>
            <button
              type="button"
              class="btn-secondary"
              :disabled="savingEmail === e.email"
              @click="cancelEdit"
            >Cancel</button>
            <button
              type="button"
              class="btn-primary"
              :disabled="savingEmail === e.email"
              @click="save(e)"
            >{{ savingEmail === e.email ? 'Saving…' : 'Save access' }}</button>
          </div>
        </div>

        <p v-if="rowError[e.email]" class="text-xs text-rose-600">
          {{ rowError[e.email] }}
        </p>
      </li>
    </ul>
  </section>
</template>
