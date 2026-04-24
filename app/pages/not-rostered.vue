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
  <div class="w-full max-w-md card">
    <h1 class="text-xl font-semibold text-center">You're not on the roster yet</h1>
    <p class="mt-2 text-center text-sm text-neutral-600">
      The account
      <span class="font-medium">{{ auth.user?.email || 'you signed in with' }}</span>
      isn't on the Renaissance roster for Renni Command Center.
    </p>

    <div class="mt-5 space-y-3 text-left text-sm text-neutral-700">
      <p class="font-medium">Three things this can mean:</p>
      <ol class="list-decimal space-y-2 pl-5">
        <li>
          <span class="font-medium">Wrong Google account.</span>
          You may have both a school and a personal Google login. Use the
          one your instructor put on the roster.
        </li>
        <li>
          <span class="font-medium">Rostered but not provisioned yet.</span>
          If your email was just added, one more sign-in cycle usually
          finishes provisioning. Sign out and sign back in once.
        </li>
        <li>
          <span class="font-medium">Not on the roster.</span>
          If neither of the above fits, message your instructor and share
          the exact email shown above so they can add it.
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
