<template>
  <div class="page">
    <div class="hero">
      <h1 class="brand">wardi</h1>
      <p class="tagline">Your store, on WhatsApp.</p>

      <button class="signin-btn" :disabled="loading" @click="handleSignIn">
        <svg class="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {{ loading ? 'Signing in...' : 'Sign in with Google' }}
      </button>

      <p v-if="error" class="error-text">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase/index.js'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const error = ref('')

async function handleSignIn() {
  loading.value = true
  error.value = ''
  try {
    await authStore.signIn()
    const snap = await getDocs(
      query(collection(db, 'stores'), where('ownerUid', '==', authStore.user.uid))
    )
    if (!snap.empty) {
      router.replace({ name: 'seller-dashboard', params: { storeId: snap.docs[0].id } })
    } else {
      router.replace({ name: 'create-store' })
    }
  } catch (e) {
    if (e.code !== 'auth/popup-closed-by-user') {
      error.value = 'Sign-in failed. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page {
  width: 100%;
  min-height: 100dvh;
  background-color: var(--background);
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero {
  text-align: center;
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.brand {
  font-size: 48px;
  font-weight: 700;
  color: var(--foreground);
  margin: 0;
}

.tagline {
  font-size: 18px;
  color: var(--muted-foreground);
  margin: 0 0 8px;
}

.signin-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 24px;
  height: 52px;
  border-radius: var(--radius-xl);
  border: 1.5px solid var(--border);
  background-color: var(--background);
  color: var(--foreground);
  font-size: 15px;
  font-weight: 500;
  font-family: var(--font-family-body);
  cursor: pointer;
  transition: background-color 0.15s;
}

.signin-btn:hover {
  background-color: var(--secondary);
}

.signin-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.google-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.error-text {
  font-size: 14px;
  color: var(--destructive);
  margin: 0;
}
</style>
