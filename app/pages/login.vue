<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'auth', public: true })

const auth = useAuthStore()
const route = useRoute()
const submitting = ref(false)

function studioRedirectTarget(): string | null {
  const redirect = route.query.redirect
  const path = typeof redirect === 'string' ? redirect : null
  if (path && (path.startsWith('/studio') || path.startsWith('/admin/studio'))) {
    return path
  }
  return null
}

// Same sign-in mechanics serve both products, but the copy must not
// say "Command Center" to someone on their way into Our City Studio.
const isStudioVisitor = computed(() => !!studioRedirectTarget())

async function handleSignIn() {
  submitting.value = true
  await auth.signInWithGoogle()
  submitting.value = false

  // A Studio destination is gated by its own middleware
  // (studio.global.ts) against studioRoster/studentProfiles, not
  // Renni's roster. Bounce straight back and let that middleware
  // decide — a Studio student is very often not Renni-rostered at
  // all, so branching on `auth.status` here would wrongly send
  // them to /not-rostered.
  const studioRedirect = studioRedirectTarget()
  if (studioRedirect) {
    await navigateTo(studioRedirect)
    return
  }

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
    <div
      class="mx-auto flex h-12 w-12 items-center justify-center rounded-md text-lg font-bold text-white"
      :class="isStudioVisitor ? 'bg-studio-600' : 'bg-phoenix-600'"
    >
      {{ isStudioVisitor ? 'OC' : 'R' }}
    </div>
    <h1 class="mt-4 text-xl font-semibold">
      {{ isStudioVisitor ? 'Our City Studio' : 'Renni Command Center' }}
    </h1>
    <p class="mt-1 text-sm text-neutral-600">
      {{
        isStudioVisitor
          ? 'Sign in with your school Google account to continue.'
          : 'Sign in with the Google account on your Renaissance roster.'
      }}
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
      {{
        isStudioVisitor
          ? 'Access is limited to students enrolled in Our City Studio.'
          : 'Access is limited to rostered Renaissance students and staff.'
      }}
    </p>
  </div>
</template>
