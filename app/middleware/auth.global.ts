import { useAuthStore } from '~/stores/auth'

const PUBLIC_PATHS = new Set(['/login', '/not-rostered'])

// Our City Studio routes are gated by their own middleware
// (app/middleware/studio.global.ts) against a separate
// studioRoster/studentProfiles system — a Studio student need not
// be a Renni Command Center roster member. Exempt those paths here
// so this middleware never redirects them to /not-rostered.
const STUDIO_PREFIXES = ['/studio', '/admin/studio']
function isStudioPath(path: string): boolean {
  return STUDIO_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))
}

export default defineNuxtRouteMiddleware((to) => {
  if (isStudioPath(to.path)) return

  // Firebase auth is client-only in V1; skip SSR passes.
  if (import.meta.server) return

  const auth = useAuthStore()
  const isPublic = PUBLIC_PATHS.has(to.path)

  switch (auth.status) {
    case 'ready':
      // Signed-in and rostered users skip login / not-rostered screens.
      if (isPublic) return navigateTo('/')
      return

    case 'not_rostered':
      if (to.path !== '/not-rostered') return navigateTo('/not-rostered')
      return

    case 'signed_out':
    case 'error':
      if (!isPublic) return navigateTo('/login')
      return

    case 'loading':
      // auth.client.ts awaits init before middleware runs, so this is rare.
      // Let the router render; the store will settle and the next navigation will gate.
      return
  }
})
