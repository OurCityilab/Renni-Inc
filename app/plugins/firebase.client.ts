import { getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

export default defineNuxtPlugin({
  name: 'firebase',
  setup() {
    const {
      public: { firebase: cfg }
    } = useRuntimeConfig()

    const app = getApps().length ? getApps()[0]! : initializeApp(cfg)
    const auth = getAuth(app)
    const db = getFirestore(app)

    return {
      provide: {
        firebase: { app, auth, db }
      }
    }
  }
})
