import { useAuthStore } from '~/stores/auth'

// Admin / program-lead gate. Used by /team. The global auth middleware has
// already resolved sign-in status before this runs, so auth.profile is
// populated for rostered users by the time we check the role.
export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return
  const auth = useAuthStore()
  if (!auth.isAdmin) {
    return navigateTo('/')
  }
})
