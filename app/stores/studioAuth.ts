// Our City Studio auth/enrollment store.
//
// Deliberately separate from app/stores/auth.ts (the Renni Command
// Center auth store). Shares the same underlying Firebase Auth
// user (one sign-in, one Firebase project), but enrollment is
// checked against `studentProfiles`/`studioRoster`, never against
// Renni's `users`/`roster`. A person can be signed in and have a
// Renni profile, a Studio profile, both, or neither.
import { defineStore } from 'pinia'
import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { watch } from 'vue'
import type { StudentProfile } from '~/types/studio/models'
import { useAuthStore } from '~/stores/auth'

export type StudioAuthStatus =
  | 'loading'
  | 'signed_out'
  | 'not_enrolled'
  | 'ready'
  | 'error'

interface StudioAuthState {
  profile: StudentProfile | null
  status: StudioAuthStatus
  error: string | null
  _initPromise: Promise<void> | null
  _syncedUid: string | null
  _profileUnsub: Unsubscribe | null
  _watchStarted: boolean
}

export const useStudioAuthStore = defineStore('studioAuth', {
  state: (): StudioAuthState => ({
    profile: null,
    status: 'loading',
    error: null,
    _initPromise: null,
    _syncedUid: null,
    _profileUnsub: null,
    _watchStarted: false
  }),
  getters: {
    isEnrolled: (s) => !!s.profile,
    studioRole: (s) => s.profile?.studioRole ?? null,
    isStudent: (s) => s.profile?.studioRole === 'student',
    isCoach: (s) => s.profile?.studioRole === 'coach',
    isStudioAdmin: (s) => s.profile?.studioRole === 'admin',
    canAccessStudioAdmin: (s) =>
      s.profile?.studioRole === 'coach' || s.profile?.studioRole === 'admin'
  },
  actions: {
    // Waits on the Renni auth store's Firebase listener (shared
    // sign-in) to settle, then runs Studio-specific enrollment.
    // Safe to call from multiple components/middleware; only re-runs
    // the enrollment sync when the signed-in uid has changed since the
    // last sync, so repeat calls for the same user are cheap.
    //
    // That uid check matters for the post-sign-in flow specifically:
    // a Studio visitor who first hits studio.global.ts while signed
    // out gets a cached, resolved `_initPromise` from that signed-out
    // sync. After they complete the Google popup on /login and get
    // bounced back into /studio/..., a naive `if (this._initPromise)
    // return this._initPromise` would hand back that stale promise —
    // so the middleware's `switch (studioAuth.status)` would still see
    // 'signed_out' and redirect back to /login, even though Renni's
    // auth store already has the new user. Comparing against
    // `_syncedUid` forces a fresh sync whenever the uid moves on.
    init() {
      const authStore = useAuthStore()
      return authStore.init().then(() => {
        this._watchAuthUser()
        const uid = authStore.user?.uid ?? null
        if (this._initPromise && this._syncedUid === uid) return this._initPromise
        this._initPromise = this._syncFromAuthUser()
        return this._initPromise
      })
    },

    _watchAuthUser() {
      if (this._watchStarted) return
      this._watchStarted = true
      const authStore = useAuthStore()
      watch(
        () => authStore.user?.uid ?? null,
        () => {
          void this._syncFromAuthUser()
        }
      )
    },

    async _syncFromAuthUser() {
      const authStore = useAuthStore()
      const user = authStore.user
      this._syncedUid = user?.uid ?? null
      if (!user) {
        this._stopProfileSubscription()
        this.profile = null
        this.status = 'signed_out'
        return
      }
      this.status = 'loading'
      try {
        const idToken = await user.getIdToken()
        const res = await $fetch<{
          studioEnrolled: boolean
          profile: StudentProfile | null
        }>('/api/studio/auth/provision', { method: 'POST', body: { idToken } })
        if (res.studioEnrolled && res.profile) {
          this.profile = res.profile
          this.status = 'ready'
          this._startProfileSubscription(user.uid)
        } else {
          this.profile = null
          this.status = 'not_enrolled'
        }
      } catch (e) {
        this.error = e instanceof Error ? e.message : String(e)
        this.status = 'error'
      }
    },

    // Live subscription so a coach editing a student's cohort
    // assignment (or a profile-status change) reaches the open
    // session without a re-login, mirroring the Renni auth store.
    _startProfileSubscription(uid: string) {
      if (this._profileUnsub) return
      const { $firebase } = useNuxtApp()
      const ref = doc($firebase.db, 'studentProfiles', uid)
      this._profileUnsub = onSnapshot(
        ref,
        (snap) => {
          if (!snap.exists()) {
            this.profile = null
            this.status = 'not_enrolled'
            return
          }
          this.profile = {
            uid: snap.id,
            ...(snap.data() as Omit<StudentProfile, 'uid'>)
          }
          if (this.status !== 'ready') this.status = 'ready'
        },
        () => {
          // Transient network error — keep the last known profile
          // rather than nuking it on a blip.
        }
      )
    },

    _stopProfileSubscription() {
      if (this._profileUnsub) {
        this._profileUnsub()
        this._profileUnsub = null
      }
    },

    async signOut() {
      this._stopProfileSubscription()
      this.profile = null
      this.status = 'signed_out'
      await useAuthStore().signOut({ redirect: false })
    }
  }
})
