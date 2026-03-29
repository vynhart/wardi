<template>
  <div class="page">
    <header class="header">
      <span class="header-title">Dashboard</span>
      <button class="icon-button">
        <iconify-icon icon="lucide:bell" style="font-size: 24px; color: var(--foreground)" />
      </button>
    </header>

    <main class="main-content">
      <!-- Greeting -->
      <section class="greeting-section">
        <h1 class="greeting">Hello, {{ storeName }}!</h1>
        <p class="subtitle">Here's your store's overview for today.</p>
      </section>

      <!-- Metrics Grid -->
      <section class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">Total Revenue</span>
            <div class="metric-icon-wrapper">
              <iconify-icon icon="lucide:dollar-sign" style="font-size: 16px; color: var(--foreground)" />
            </div>
          </div>
          <div class="metric-value">$0.00</div>
        </div>
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">Total Orders</span>
            <div class="metric-icon-wrapper">
              <iconify-icon icon="lucide:shopping-bag" style="font-size: 16px; color: var(--foreground)" />
            </div>
          </div>
          <div class="metric-value">0</div>
        </div>
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">Store Views</span>
            <div class="metric-icon-wrapper">
              <iconify-icon icon="lucide:eye" style="font-size: 16px; color: var(--foreground)" />
            </div>
          </div>
          <div class="metric-value">0</div>
        </div>
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">Conversion</span>
            <div class="metric-icon-wrapper">
              <iconify-icon icon="lucide:trending-up" style="font-size: 16px; color: var(--foreground)" />
            </div>
          </div>
          <div class="metric-value">0%</div>
        </div>
      </section>

      <!-- Quick Actions -->
      <section>
        <h2 class="section-title">Quick Actions</h2>
        <div class="quick-actions">
          <button class="action-btn" @click="goToAddProduct">
            <div class="action-icon primary-bg">
              <iconify-icon icon="lucide:plus" style="font-size: 20px; color: var(--primary-foreground)" />
            </div>
            <span class="action-label">Add Product</span>
          </button>
          <button class="action-btn" @click="goToStore">
            <div class="action-icon">
              <iconify-icon icon="lucide:store" style="font-size: 20px; color: var(--foreground)" />
            </div>
            <span class="action-label">View Store</span>
          </button>
          <button class="action-btn" @click="shareStore">
            <div class="action-icon">
              <iconify-icon icon="lucide:share-2" style="font-size: 20px; color: var(--foreground)" />
            </div>
            <span class="action-label">Share Link</span>
          </button>
        </div>
      </section>

      <!-- Recent Orders -->
      <section>
        <div class="recent-orders-header">
          <h2 class="section-title">Recent Orders</h2>
          <button class="view-all" @click="goToOrders">View All</button>
        </div>
        <div class="empty-orders">
          <iconify-icon icon="lucide:inbox" style="font-size: 32px; color: var(--muted-foreground)" />
          <span class="empty-orders-text">No recent orders yet</span>
        </div>
      </section>
    </main>

    <!-- Bottom nav -->
    <nav class="bottom-nav">
      <button class="nav-item active">
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
      <button class="nav-item">
        <iconify-icon icon="lucide:user" style="font-size: 24px; color: inherit" />
        <span class="nav-label">Profile</span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/index.js'
import { useAuthStore } from '../stores/auth.js'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const storeId = route.params.storeId
const storeName = ref('Store Owner')

onMounted(async () => {
  if (!authStore.user) {
    router.replace({ name: 'home' })
    return
  }
  const storeSnap = await getDoc(doc(db, 'stores', storeId))
  if (!storeSnap.exists() || storeSnap.data().ownerUid !== authStore.user.uid) {
    router.replace({ name: 'store', params: { storeId } })
    return
  }
  if (storeSnap.data().name) {
    storeName.value = storeSnap.data().name
  }
})

function goToProducts() {
  router.push({ name: 'manage-products', params: { storeId } })
}

function goToAddProduct() {
  router.push({ name: 'product-add', params: { storeId } })
}

function goToStore() {
  router.push({ name: 'store', params: { storeId } })
}

function goToOrders() {
  // orders page not yet implemented
}

function shareStore() {
  const url = `${window.location.origin}/${storeId}`
  if (navigator.share) {
    navigator.share({ url })
  } else {
    navigator.clipboard.writeText(url)
  }
}
</script>

<style scoped>
.page {
  width: 100%;
  min-height: 100dvh;
  background-color: var(--background);
  display: flex;
  flex-direction: column;
}

.header {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--background);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--foreground);
}

.icon-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  cursor: pointer;
  margin-right: -8px;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px 100px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  scrollbar-width: none;
}

.main-content::-webkit-scrollbar {
  display: none;
}

.greeting-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.greeting {
  font-size: 24px;
  font-weight: 600;
  color: var(--foreground);
}

.subtitle {
  font-size: 15px;
  color: var(--muted-foreground);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.metric-card {
  background-color: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.metric-icon-wrapper {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background-color: var(--muted);
  display: flex;
  align-items: center;
  justify-content: center;
}

.metric-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--muted-foreground);
}

.metric-value {
  font-size: 22px;
  font-weight: 600;
  color: var(--foreground);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--foreground);
  margin-bottom: 12px;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background-color: var(--muted);
  border-radius: var(--radius-lg);
  padding: 16px 8px;
  text-align: center;
  cursor: pointer;
}

.action-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--background);
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon.primary-bg {
  background-color: var(--primary);
}

.action-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--foreground);
  white-space: nowrap;
}

.recent-orders-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.recent-orders-header .section-title {
  margin-bottom: 0;
}

.view-all {
  font-size: 13px;
  font-weight: 500;
  color: var(--primary);
  background: none;
  cursor: pointer;
}

.empty-orders {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  background-color: var(--muted);
  border-radius: var(--radius-lg);
  text-align: center;
  gap: 12px;
  border: 1px dashed var(--border);
}

.empty-orders-text {
  font-size: 14px;
  color: var(--muted-foreground);
  font-weight: 500;
}

.bottom-nav {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 12px 0 24px;
  background-color: var(--background);
  border-top: 1px solid var(--border);
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  z-index: 20;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--muted-foreground);
  width: 64px;
  background: none;
  cursor: pointer;
}

.nav-item.active {
  color: var(--primary);
}

.nav-label {
  font-size: 11px;
  font-weight: 500;
}
</style>