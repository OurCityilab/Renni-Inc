<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useStudioAuthStore } from '~/stores/studioAuth'

definePageMeta({ layout: 'auth', public: true })

const auth = useAuthStore()
const studioAuth = useStudioAuthStore()
const switching = ref(false)

async function switchAccount() {
  switching.value = true
  // Sign out without redirecting, then re-open the Google picker so the
  // student can try a different account without bouncing through /login.
  await auth.signOut({ redirect: false })
  await auth.signInWithGoogle()
  switching.value = false
  // studioAuth watches auth.user and re-syncs on its own; if the new
  // account is enrolled, studio.global.ts sends them to /studio/today
  // on the next navigation.
}

async function signOutCompletely() {
  await studioAuth.signOut()
}
</script>

<template>
  <div class="w-full max-w-md card">
    <h1 class="text-xl font-semibold text-center">You're not enrolled in Our City Studio yet</h1>
    <p class="mt-2 text-center text-sm text-neutral-600">
      The account
      <span class="font-medium">{{ auth.user?.email || 'you signed in with' }}</span>
      isn't on the Our City Studio roster yet.
    </p>

    <div class="mt-5 space-y-3 text-left text-sm text-neutral-700">
      <p class="font-medium">A couple things this can mean:</p>
      <ol class="list-decimal space-y-2 pl-5">
        <li>
          <span class="font-medium">Wrong Google account.</span>
          Use the school account your coach has on file.
        </li>
        <li>
          <span class="font-medium">Not added yet.</span>
          If you just registered, message your coach and share the exact
          email shown above so they can add you.
        </li>
      </ol>
    </div>

    <button
      class="btn-primary mt-6 w-full"
      :disabled="switching"
      @click="switchAccount"
    >
      {{ switching ? 'Opening Google…' : 'Use a different Google account' }}
    </button>
    <button
      class="btn-secondary mt-3 w-full"
      :disabled="switching"
      @click="signOutCompletely"
    >
      Sign out
    </button>
    <p v-if="auth.error" class="mt-3 text-center text-sm text-rose-600">
      {{ auth.error }}
    </p>
  </div>
</template>
