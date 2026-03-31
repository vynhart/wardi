<template>
  <div class="page">
    <header class="header">
      <span class="header-title">Profile</span>
    </header>

    <main class="main-content">
      <!-- Store card -->
      <div class="store-card">
        <div class="store-avatar">
          <iconify-icon icon="lucide:store" style="font-size: 28px; color: var(--secondary-foreground)" />
        </div>
        <div class="store-info">
          <div class="store-name">{{ storeName }}</div>
          <div class="store-url">{{ storeUrl }}</div>
        </div>
      </div>

      <!-- Settings list -->
      <div class="settings-section">
        <button class="settings-item" @click="goToStore">
          <div class="settings-item-left">
            <div class="settings-icon">
              <iconify-icon icon="lucide:store" style="font-size: 18px; color: var(--foreground)" />
            </div>
            <span class="settings-label">View Store</span>
          </div>
          <iconify-icon icon="lucide:chevron-right" style="font-size: 18px; color: var(--muted-foreground)" />
        </button>

        <button class="settings-item" @click="shareStore">
          <div class="settings-item-left">
            <div class="settings-icon">
              <iconify-icon icon="lucide:share-2" style="font-size: 18px; color: var(--foreground)" />
            </div>
            <span class="settings-label">Share Store Link</span>
          </div>
          <iconify-icon icon="lucide:chevron-right" style="font-size: 18px; color: var(--muted-foreground)" />
        </button>
      </div>

      <!-- Account section -->
      <div class="settings-section">
        <div class="settings-item settings-item--info">
          <div class="settings-item-left">
            <div class="settings-icon">
              <iconify-icon icon="lucide:mail" style="font-size: 18px; color: var(--muted-foreground)" />
            </div>
            <span class="settings-label settings-label--muted">{{ userEmail }}</span>
          </div>
        </div>

        <button class="settings-item settings-item--danger" @click="signOut">
          <div class="settings-item-left">
            <div class="settings-icon">
              <iconify-icon icon="lucide:log-out" style="font-size: 18px; color: var(--destructive)" />
            </div>
            <span class="settings-label settings-label--danger">Sign Out</span>
          </div>
        </button>
      </div>
    </main>

    <!-- Bottom nav -->
    <nav class="bottom-nav">
      <button class="nav-item" @click="goToDashboard">
        <iconify-icon icon="lucide:layout-grid" style="font-size: 24px; color: inherit" />
        <span class="nav-label">Dashboard</span>
      </button>
      <button class="nav-item" @click="goToOrders">
        <iconify-icon icon="lucide:inbox" style="font-size: 24px; color: inherit" />
        <span class="nav-label">Orders</span>
      </button>
      <button class="nav-item" @click="goToProducts">
        <iconify-icon icon="lucide:tag" style="font-size: 24px; color: inherit" />
        <span class="nav-label">Products</span>
      </button>
      <button class="nav-item active">
        <iconify-icon icon="lucide:user" style="font-size: 24px; color: inherit" />
        <span class="nav-label">Profile</span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/index.js'
import { useAuthStore } from '../stores/auth.js'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const storeId = route.params.storeId

const storeName = ref('')
const userEmail = computed(() => authStore.user?.email ?? '')
const storeUrl = computed(() => `${window.location.origin}/${storeId}`)

onMounted(async () => {
  if (!authStore.user) { router.replace({ name: 'home' }); return }
  const snap = await getDoc(doc(db, 'stores', storeId))
  if (!snap.exists() || snap.data().ownerUid !== authStore.user.uid) {
    router.replace({ name: 'store', params: { storeId } }); return
  }
  storeName.value = snap.data().name ?? ''
})

function goToDashboard() { router.push({ name: 'seller-dashboard', params: { storeId } }) }
function goToOrders() { router.push({ name: 'seller-orders', params: { storeId } }) }
function goToProducts() { router.push({ name: 'manage-products', params: { storeId } }) }

function goToStore() {
  router.push({ name: 'store', params: { storeId } })
}

function shareStore() {
  const url = storeUrl.value
  if (navigator.share) {
    navigator.share({ url })
  } else {
    navigator.clipboard.writeText(url)
  }
}

async function signOut() {
  await authStore.logout()
  router.replace({ name: 'home' })
}
</script>

<style scoped>
.page {
  width: 100%;
  min-height: 100dvh;
  background-color: var(--background);
  display: flex;
  flex-direction: column;
  padding-bottom: 72px;
}

.header {
  padding: 20px;
  display: flex;
  align-items: center;
  background-color: var(--background);
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid var(--border);
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--foreground);
}

.main-content {
  flex: 1;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Store card */
.store-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background-color: var(--secondary);
  border-radius: var(--radius-lg);
}

.store-avatar {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  background-color: var(--background);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.store-name {
  font-size: 17px;
  font-weight: 600;
  color: var(--foreground);
}

.store-url {
  font-size: 13px;
  color: var(--muted-foreground);
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Settings list */
.settings-section {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: none;
  font-family: inherit;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
  text-align: left;
  width: 100%;
}

.settings-item:last-child {
  border-bottom: none;
}

.settings-item--info {
  cursor: default;
}

.settings-item-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.settings-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background-color: var(--muted);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.settings-label {
  font-size: 15px;
  font-weight: 500;
  color: var(--foreground);
}

.settings-label--muted {
  color: var(--muted-foreground);
  font-weight: 400;
}

.settings-label--danger {
  color: var(--destructive);
}

/* Bottom nav */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  height: 72px;
  background-color: var(--background);
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  z-index: 30;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 0;
  color: var(--muted-foreground);
  cursor: pointer;
  background: none;
  border: none;
  font-family: inherit;
}

.nav-item.active {
  color: var(--primary);
}

.nav-label {
  font-size: 11px;
  font-weight: 500;
}
</style>
