import { useAuthStore } from '~/stores/auth'

// Depends on the Firebase plugin (registered name: "firebase") so $firebase
// is provided before auth tries to subscribe to onAuthStateChanged.
export default defineNuxtPlugin({
  name: 'auth',
  dependsOn: ['firebase'],
  async setup() {
    const auth = useAuthStore()
    await auth.init()
  }
})
