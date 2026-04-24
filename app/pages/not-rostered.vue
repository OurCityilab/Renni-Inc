<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'auth', public: true })

const auth = useAuthStore()
const switching = ref(false)

async function switchAccount() {
  switching.value = true
  // Sign out without redirecting, then re-open the Google picker so the student
  // can choose a different account without bouncing through the login page.
  await auth.signOut({ redirect: false })
  await auth.signInWithGoogle()
  switching.value = false

  if (auth.status === 'ready') {
    await navigateTo('/')
  }
  // If the new account is also not in the roster, the store sets status='not_rostered'
  // and we stay on this page. Errors surface via auth.error below.
}

async function signOutCompletely() {
  await auth.signOut()
}
</script>

<template>
  <div class="w-full max-w-md card text-center">
    <h1 class="text-xl font-semibold">You're not on the roster yet</h1>
    <p class="mt-2 text-sm text-neutral-600">
      The account
      <span class="font-medium">{{ auth.user?.email || 'you signed in with' }}</span>
      isn't in the seeded Renaissance roster.
    </p>
    <p class="mt-4 text-sm text-neutral-600">
      Ask your instructor to add you, or switch to the Google account that's on the roster.
    </p>

    <button
      class="btn-primary mt-6 w-full"
      :disabled="switching"
      @click="switchAccount"
    >
      {{ switching ? 'Opening Google…' : 'Use a different account' }}
    </button>
    <button
      class="btn-secondary mt-3 w-full"
      :disabled="switching"
      @click="signOutCompletely"
    >
      Sign out
    </button>
    <p v-if="auth.error" class="mt-3 text-sm text-rose-600">{{ auth.error }}</p>
  </div>
</template>
