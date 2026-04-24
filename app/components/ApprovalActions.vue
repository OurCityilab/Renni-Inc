<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useDeliverables } from '~/composables/useDeliverables'
import type { Deliverable, Role } from '~/types/models'

const props = defineProps<{ deliverable: Deliverable }>()

const auth = useAuthStore()
const deliverables = useDeliverables()

const submitting = ref(false)
const error = ref<string | null>(null)

const returnOpen = ref(false)
const returnReason = ref('')

const approveOpen = ref(false)
const approvalNotes = ref('')

const isOwner = computed(() => auth.user?.uid === props.deliverable.ownerUid)
const isApprover = computed(() => auth.user?.uid === props.deliverable.approverUid)
const isOverride = computed(() => auth.isAdmin || auth.isCoCEO)

const status = computed(() => props.deliverable.status)

async function runAction(fn: () => Promise<void>) {
  submitting.value = true
  error.value = null
  try {
    await fn()
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    submitting.value = false
  }
}

function currentActor() {
  // Lifecycle mutations stamp the activity feed with who acted; fall back to
  // the Firebase email if the profile hasn't hydrated yet.
  const email = auth.profile?.email || auth.user?.email || ''
  const role = auth.profile?.role as Role | undefined
  return { email, role }
}

async function submit() {
  const from = props.deliverable.status as 'draft' | 'needs_revision'
  if (from !== 'draft' && from !== 'needs_revision') return
  await runAction(() =>
    deliverables.submitForReview(props.deliverable.id, currentActor(), from)
  )
}

async function approve() {
  if (!auth.user) return
  const actor = { uid: auth.user.uid, ...currentActor() }
  await runAction(() =>
    deliverables.approve(
      props.deliverable.id,
      actor,
      approvalNotes.value.trim() || undefined
    )
  )
  approveOpen.value = false
  approvalNotes.value = ''
}

async function returnRevision() {
  if (!returnReason.value.trim()) {
    error.value = 'Please enter a reason so the owner knows what to fix.'
    return
  }
  await runAction(() =>
    deliverables.returnForRevision(
      props.deliverable.id,
      currentActor(),
      returnReason.value.trim()
    )
  )
  returnOpen.value = false
  returnReason.value = ''
}
</script>

<template>
  <section class="card space-y-3">
    <header class="flex items-center justify-between">
      <h2 class="text-sm font-semibold">Actions</h2>
      <StatusChip :status="deliverable.status" />
    </header>

    <!-- Owner path: submit for review -->
    <div v-if="isOwner && (status === 'draft' || status === 'needs_revision')" class="space-y-2">
      <p class="text-sm text-neutral-700">
        You own this deliverable. When it's complete and accurate against the rubric, submit it for review.
      </p>
      <button class="btn-primary" :disabled="submitting" @click="submit">
        Submit for review
      </button>
    </div>

    <div v-else-if="isOwner && status === 'in_review'" class="text-sm text-neutral-700">
      Submitted for review. Waiting on your approver.
    </div>

    <div v-else-if="isOwner && status === 'approved'" class="text-sm text-emerald-700">
      Approved. Great work.
    </div>

    <!-- Approver path: approve / return -->
    <div v-if="(isApprover || isOverride) && status === 'in_review'" class="space-y-3 border-t border-neutral-200 pt-3">
      <p class="text-sm text-neutral-700">
        Review against the rubric, then approve or return for revision with a clear reason.
      </p>
      <div class="flex flex-wrap gap-2">
        <button class="btn-primary" :disabled="submitting" @click="approveOpen = !approveOpen">
          Approve
        </button>
        <button class="btn-secondary" :disabled="submitting" @click="returnOpen = !returnOpen">
          Return for revision
        </button>
      </div>

      <div v-if="approveOpen" class="rounded-md border border-emerald-200 bg-emerald-50 p-3">
        <label class="block text-xs font-medium text-emerald-900">Approval notes (optional)</label>
        <textarea
          v-model="approvalNotes"
          rows="2"
          class="mt-1 w-full rounded border border-emerald-300 bg-white p-2 text-sm"
          placeholder="Optional note the next cohort will see"
        />
        <div class="mt-2 flex justify-end gap-2">
          <button class="btn-secondary" @click="approveOpen = false">Cancel</button>
          <button class="btn-primary" :disabled="submitting" @click="approve">
            Confirm approval
          </button>
        </div>
      </div>

      <div v-if="returnOpen" class="rounded-md border border-rose-200 bg-rose-50 p-3">
        <label class="block text-xs font-medium text-rose-900">Reason for return (required)</label>
        <textarea
          v-model="returnReason"
          rows="2"
          class="mt-1 w-full rounded border border-rose-300 bg-white p-2 text-sm"
          placeholder="What needs to change? The owner will see this."
        />
        <div class="mt-2 flex justify-end gap-2">
          <button class="btn-secondary" @click="returnOpen = false">Cancel</button>
          <button class="btn-primary" :disabled="submitting" @click="returnRevision">
            Send back
          </button>
        </div>
      </div>
    </div>

    <!-- Override view for admin / co-ceo when nothing else matches -->
    <div
      v-else-if="isOverride && !isApprover && status !== 'in_review'"
      class="text-sm text-neutral-700"
    >
      You have override permissions but there's nothing to decide right now.
    </div>

    <!-- Read-only viewers -->
    <div
      v-else-if="!isOwner && !isApprover && !isOverride"
      class="text-sm text-neutral-600"
    >
      You can see this deliverable but aren't the owner or approver.
    </div>

    <p v-if="error" class="text-sm text-rose-600">{{ error }}</p>
    <p
      v-if="deliverable.status === 'needs_revision' && deliverable.returnedReason"
      class="rounded-md border border-rose-200 bg-rose-50 p-2 text-sm text-rose-800"
    >
      Returned: {{ deliverable.returnedReason }}
    </p>
  </section>
</template>
