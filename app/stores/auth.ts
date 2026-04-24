import { defineStore } from 'pinia'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import type { AppUser } from '~/types/models'

export type AuthStatus =
  | 'loading'
  | 'signed_out'
  | 'not_rostered'
  | 'ready'
  | 'error'

interface AuthState {
  user: FirebaseUser | null
  profile: AppUser | null
  status: AuthStatus
  error: string | null
  _initPromise: Promise<void> | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    profile: null,
    status: 'loading',
    error: null,
    _initPromise: null
  }),
  getters: {
    isSignedIn: (s) => !!s.user,
    isRostered: (s) => !!s.profile,
    isChief: (s) => !!s.profile?.isChief,
    isAdmin: (s) => s.profile?.role === 'admin',
    isCoCEO: (s) => s.profile?.role === 'coceo',
    department: (s) => s.profile?.department ?? null
  },
  actions: {
    // Subscribe to Firebase auth changes exactly once per app load.
    // Resolves after the first state callback, so a global middleware can
    // trust this.status to be non-'loading' on first navigation.
    init() {
      if (this._initPromise) return this._initPromise
      const { $firebase } = useNuxtApp()

      this._initPromise = new Promise<void>((resolve) => {
        let resolved = false
        onAuthStateChanged($firebase.auth, async (user) => {
          this.user = user
          if (!user) {
            this.profile = null
            this.status = 'signed_out'
          } else if (!this.profile || this.profile.uid !== user.uid) {
            await this.loadOrProvisionProfile()
          }
          if (!resolved) {
            resolved = true
            resolve()
          }
        })
      })
      return this._initPromise
    },

    async loadOrProvisionProfile() {
      if (!this.user) return
      this.status = 'loading'
      const { $firebase } = useNuxtApp()

      try {
        const ref = doc($firebase.db, 'users', this.user.uid)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          this.profile = { uid: this.user.uid, ...(snap.data() as Omit<AppUser, 'uid'>) }
          this.status = 'ready'
          return
        }
        // No user doc yet — ask the server to verify the token, check the roster,
        // and upsert users/{uid} via the admin SDK.
        const idToken = await this.user.getIdToken()
        const res = await $fetch<{ rostered: boolean; profile: AppUser | null }>(
          '/api/auth/provision',
          { method: 'POST', body: { idToken } }
        )
        if (res.rostered && res.profile) {
          this.profile = res.profile
          this.status = 'ready'
        } else {
          this.profile = null
          this.status = 'not_rostered'
        }
      } catch (e) {
        this.error = e instanceof Error ? e.message : String(e)
        this.status = 'error'
      }
    },

    async signInWithGoogle() {
      const { $firebase } = useNuxtApp()
      this.status = 'loading'
      this.error = null
      const provider = new GoogleAuthProvider()
      try {
        const cred = await signInWithPopup($firebase.auth, provider)
        this.user = cred.user
        await this.loadOrProvisionProfile()
      } catch (e) {
        // User-closed popups are a normal outcome, not an error the UI should shout about.
        const code = (e as { code?: string }).code
        this.user = null
        this.profile = null
        if (
          code === 'auth/popup-closed-by-user' ||
          code === 'auth/cancelled-popup-request' ||
          code === 'auth/user-cancelled'
        ) {
          this.status = 'signed_out'
          this.error = null
        } else {
          this.status = 'error'
          this.error = e instanceof Error ? e.message : String(e)
        }
      }
    },

    async signOut(options: { redirect?: boolean } = {}) {
      const redirect = options.redirect ?? true
      const { $firebase } = useNuxtApp()
      await firebaseSignOut($firebase.auth)
      this.user = null
      this.profile = null
      this.status = 'signed_out'
      this.error = null
      if (redirect) await navigateTo('/login')
    }
  }
})
