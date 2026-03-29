import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from '../firebase/index.js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(true)

  const provider = new GoogleAuthProvider()

  let resolveReady
  const ready = new Promise((resolve) => { resolveReady = resolve })

  function init() {
    onAuthStateChanged(auth, (firebaseUser) => {
      user.value = firebaseUser
      loading.value = false
      resolveReady()
    })
  }

  async function signIn() {
    await signInWithPopup(auth, provider)
  }

  async function logout() {
    await signOut(auth)
  }

  return { user, loading, ready, init, signIn, logout }
})
