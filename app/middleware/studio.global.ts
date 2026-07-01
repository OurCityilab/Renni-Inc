// Our City Studio route gate.
//
// Scoped entirely to /studio and /admin/studio — every other route
// is a no-op here and continues to be governed solely by
// app/middleware/auth.global.ts (Renni Command Center). This keeps
// Studio enrollment (studioRoster/studentProfiles) fully independent
// of Renni roster/role status in both directions.
import { useStudioAuthStore } from '~/stores/studioAuth'

const STUDIO_PREFIXES = ['/studio', '/admin/studio']
const STUDIO_PUBLIC_PATHS = new Set(['/studio/not-enrolled'])

function isStudioPath(path: string): boolean {
  return STUDIO_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))
}

export default defineNuxtRouteMiddleware(async (to) => {
  if (!isStudioPath(to.path)) return
  // Firebase auth is client-only in V1; skip SSR passes (mirrors auth.global.ts).
  if (import.meta.server) return

  const studioAuth = useStudioAuthStore()
  await studioAuth.init()

  const isPublic = STUDIO_PUBLIC_PATHS.has(to.path)

  switch (studioAuth.status) {
    case 'ready':
      if (isPublic) return navigateTo('/studio/today')
      if (to.path.startsWith('/admin/studio') && !studioAuth.canAccessStudioAdmin) {
        return navigateTo('/studio/today')
      }
      return

    case 'not_enrolled':
      if (!isPublic) return navigateTo('/studio/not-enrolled')
      return

    case 'signed_out':
    case 'error':
      // Shared Firebase Auth login page — Renni and Studio sign in
      // through the same Google popup. Pass the original destination
      // so login.vue can bounce back here instead of routing through
      // Renni's roster-based redirect (a Studio student usually has
      // no Renni roster entry at all).
      if (!isPublic) return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
      return

    case 'loading':
      // init() is awaited above, so this is defensive only.
      return
  }
})
