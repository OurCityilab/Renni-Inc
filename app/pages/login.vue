<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'auth', public: true })

const auth = useAuthStore()
const submitting = ref(false)

async function handleSignIn() {
  submitting.value = true
  await auth.signInWithGoogle()
  submitting.value = false

  if (auth.status === 'ready') {
    await navigateTo('/')
  } else if (auth.status === 'not_rostered') {
    await navigateTo('/not-rostered')
  }
  // status === 'signed_out' (closed popup) or 'error' — stay on this page; store.error shows below.
}
</script>

<template>
  <div class="w-full max-w-sm card text-center">
    <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-phoenix-600 text-lg font-bold text-white">
      R
    </div>
    <h1 class="mt-4 text-xl font-semibold">Renni Command Center</h1>
    <p class="mt-1 text-sm text-neutral-600">
      Sign in with the Google account on your Renaissance roster.
    </p>
    <button
      class="btn-primary mt-6 w-full"
      :disabled="submitting"
      @click="handleSignIn"
    >
      {{ submitting ? 'Signing in…' : 'Continue with Google' }}
    </button>
    <p v-if="auth.error" class="mt-3 text-sm text-rose-600">{{ auth.error }}</p>
    <p class="mt-6 text-xs text-neutral-500">
      Access is limited to rostered Renaissance students and staff.
    </p>
  </div>
</template>
