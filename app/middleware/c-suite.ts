import { useAuthStore } from '~/stores/auth'

// Hard gate: only chiefs (including Co-CEOs via isChief=true in the role map)
// and admin may view /c-suite. The global auth middleware has already resolved
// status before this runs, so auth.profile is populated for rostered users.
export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return
  const auth = useAuthStore()
  if (!auth.isChief && !auth.isAdmin) {
    return navigateTo('/')
  }
})
