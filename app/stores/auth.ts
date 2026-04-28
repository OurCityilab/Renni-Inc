import { defineStore } from 'pinia'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser
} from 'firebase/auth'
import { doc, getDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import type { AppUser } from '~/types/models'
import { isChief as profileIsChief } from '~/utils/permissions'

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
  // Live `users/{uid}` subscription so role / department / isChief
  // changes propagate to the active session without requiring a
  // re-login. Without this, an admin who moves Chase from cfo →
  // member sees the change on /team but Chase's still-open browser
  // continues to call him a chief until he signs out and signs in
  // again. See the Section Task Assignment sprint brief.
  _profileUnsub: Unsubscribe | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    profile: null,
    status: 'loading',
    error: null,
    _initPromise: null,
    _profileUnsub: null
  }),
  getters: {
    isSignedIn: (s) => !!s.user,
    isRostered: (s) => !!s.profile,
    // CURRENT-ROLE-WINS: derive isChief from the live `role` field
    // via the centralized permission helper. The stored
    // `profile.isChief` boolean is treated as display metadata
    // only — if it has drifted from the role (admin changed role
    // but the field hasn't synced yet), the role wins. This
    // guarantees that a former chief immediately loses chief-
    // level capabilities when their role is changed, even before
    // the `isChief` field itself is rewritten.
    isChief: (s) => profileIsChief(s.profile),
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
            this._stopProfileSubscription()
            this.profile = null
            this.status = 'signed_out'
          } else if (!this.profile || this.profile.uid !== user.uid) {
            await this.loadOrProvisionProfile()
            this._startProfileSubscription()
          } else {
            // Same user, but make sure the live subscription is
            // active in case a hot-reload tore it down.
            this._startProfileSubscription()
          }
          if (!resolved) {
            resolved = true
            resolve()
          }
        })
      })
      return this._initPromise
    },

    // Live subscription on the user's profile doc. When an admin
    // changes role / isChief / department / title via /team, the
    // subscription delivers the patched profile to the active
    // session immediately; the next computed-property read by any
    // permission gate sees the new role. Without this, a former
    // chief retains chief-level UX until they sign out and back in.
    //
    // Idempotent: starting twice is a no-op; the existing
    // unsubscribe is preserved so we don't leak listeners.
    _startProfileSubscription() {
      if (this._profileUnsub) return
      if (!this.user) return
      const { $firebase } = useNuxtApp()
      const ref = doc($firebase.db, 'users', this.user.uid)
      this._profileUnsub = onSnapshot(
        ref,
        (snap) => {
          if (!snap.exists()) {
            // Doc deleted — the user effectively lost access. Drop
            // the profile so the UI re-routes through the
            // not-rostered / signed-out flow on next nav.
            this.profile = null
            return
          }
          const next = {
            uid: snap.id,
            ...(snap.data() as Omit<AppUser, 'uid'>)
          }
          this.profile = next
          if (this.status !== 'ready') this.status = 'ready'
        },
        () => {
          // Snapshot error (e.g. transient network). Leave the
          // existing profile intact rather than nuking it on a
          // blip.
        }
      )
    },

    _stopProfileSubscription() {
      if (this._profileUnsub) {
        this._profileUnsub()
        this._profileUnsub = null
      }
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
      this._stopProfileSubscription()
      await firebaseSignOut($firebase.auth)
      this.user = null
      this.profile = null
      this.status = 'signed_out'
      this.error = null
      if (redirect) await navigateTo('/login')
    }
  }
})
