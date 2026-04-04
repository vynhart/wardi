import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('useAuthStore', () => {
  describe('init', () => {
    it('sets user when onAuthStateChanged fires with a user', async () => {
      const mockUser = { uid: 'uid-123', displayName: 'Jane' }
      onAuthStateChanged.mockImplementation((auth, cb) => {
        cb(mockUser)
        return vi.fn()
      })

      const { useAuthStore } = await import('../../stores/auth.js')
      const store = useAuthStore()
      store.init()

      expect(store.user).toEqual(mockUser)
      expect(store.loading).toBe(false)
    })

    it('sets user to null when signed out', async () => {
      onAuthStateChanged.mockImplementation((auth, cb) => {
        cb(null)
        return vi.fn()
      })

      const { useAuthStore } = await import('../../stores/auth.js')
      const store = useAuthStore()
      store.init()

      expect(store.user).toBeNull()
      expect(store.loading).toBe(false)
    })
  })

  describe('signIn', () => {
    it('calls signInWithPopup', async () => {
      const { useAuthStore } = await import('../../stores/auth.js')
      const store = useAuthStore()
      await store.signIn()
      expect(signInWithPopup).toHaveBeenCalled()
    })
  })

  describe('logout', () => {
    it('calls signOut', async () => {
      const { useAuthStore } = await import('../../stores/auth.js')
      const store = useAuthStore()
      await store.logout()
      expect(signOut).toHaveBeenCalled()
    })
  })
})
