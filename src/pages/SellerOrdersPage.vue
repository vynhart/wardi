<template>
  <div class="page">
    <!-- Header -->
    <header class="header">
      <span class="header-title">Orders</span>
      <button class="icon-button" @click="searchOpen = !searchOpen">
        <iconify-icon icon="lucide:search" style="font-size: 24px; color: var(--foreground)" />
      </button>
    </header>

    <!-- Search bar -->
    <div v-if="searchOpen" class="search-bar">
      <iconify-icon icon="lucide:search" style="font-size: 16px; color: var(--muted-foreground)" />
      <input
        v-model="searchQuery"
        class="search-input"
        placeholder="Search by buyer name…"
        autofocus
      />
      <button v-if="searchQuery" @click="searchQuery = ''">
        <iconify-icon icon="lucide:x" style="font-size: 16px; color: var(--muted-foreground)" />
      </button>
    </div>

    <main class="main-content">
      <!-- Filter tabs -->
      <div class="filter-tabs-container">
        <div class="filter-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            class="filter-tab"
            :class="{ active: activeTab === tab.value }"
            @click="activeTab = tab.value"
          >{{ tab.label }}</button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="empty-state">
        <iconify-icon icon="lucide:loader-circle" class="spin" style="font-size: 32px; color: var(--muted-foreground)" />
      </div>

      <!-- Empty -->
      <div v-else-if="filteredOrders.length === 0" class="empty-state">
        <iconify-icon icon="lucide:inbox" style="font-size: 40px; color: var(--muted-foreground)" />
        <p class="empty-title">No orders yet</p>
        <p class="empty-sub">Orders placed through your store will appear here.</p>
      </div>

      <!-- Orders list -->
      <div v-else class="orders-list">
        <div
          v-for="order in filteredOrders"
          :key="order.id"
          class="order-card"
          @click="selectedOrder = order"
        >
          <!-- Card header: ID + date | status -->
          <div class="order-header">
            <div class="order-id-date">
              <span class="order-id">#{{ order.orderNumber ?? order.id.slice(0, 5).toUpperCase() }}</span>
              <span class="order-date">{{ formatDate(order.createdAt) }}</span>
            </div>
            <span class="order-status" :class="order.status">{{ statusLabel(order.status) }}</span>
          </div>

          <!-- Card body: buyer | total -->
          <div class="order-body">
            <div class="customer-info">
              <div class="customer-avatar">{{ initials(order.buyerName) }}</div>
              <div class="customer-details">
                <span class="customer-name">{{ order.buyerName }}</span>
                <span class="order-items-count">{{ itemsSummary(order) }}</span>
              </div>
            </div>
            <div class="order-total">{{ formatPrice(order.total) }}</div>
          </div>
        </div>
      </div>
    </main>

    <!-- Order detail bottom sheet -->
    <OrderDetailSheet
      v-if="selectedOrder"
      :order="selectedOrder"
      :store-id="storeId"
      @close="selectedOrder = null"
    />

    <!-- Bottom nav -->
    <nav class="bottom-nav">
      <button class="nav-item" @click="goToDashboard">
        <iconify-icon icon="lucide:layout-grid" style="font-size: 24px; color: inherit" />
        <span class="nav-label">Dashboard</span>
      </button>
      <button class="nav-item active">
        <iconify-icon icon="lucide:inbox" style="font-size: 24px; color: inherit" />
        <span class="nav-label">Orders</span>
      </button>
      <button class="nav-item" @click="goToProducts">
        <iconify-icon icon="lucide:tag" style="font-size: 24px; color: inherit" />
        <span class="nav-label">Products</span>
      </button>
      <button class="nav-item" @click="goToProfile">
        <iconify-icon icon="lucide:user" style="font-size: 24px; color: inherit" />
        <span class="nav-label">Profile</span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFirestoreListeners } from '../composables/useFirestoreListeners.js'
import { useRoute, useRouter } from 'vue-router'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase/index.js'
import { formatPrice } from '../utils/format.js'
import OrderDetailSheet from '../components/OrderDetailSheet.vue'

const route = useRoute()
const router = useRouter()
const storeId = route.params.storeId

const orders = ref([])
const loading = ref(true)
const selectedOrder = ref(null)
const activeTab = ref('all')
const searchOpen = ref(false)
const searchQuery = ref('')

const tabs = [
  { label: 'All Orders', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

const filteredOrders = computed(() => {
  let list = orders.value
  if (activeTab.value !== 'all') list = list.filter((o) => o.status === activeTab.value)
  const q = searchQuery.value.trim().toLowerCase()
  if (q) list = list.filter((o) => o.buyerName?.toLowerCase().includes(q))
  return list
})

const { addListener } = useFirestoreListeners()

onMounted(() => {
  addListener(onSnapshot(
    query(collection(db, 'stores', storeId, 'orders'), orderBy('createdAt', 'desc')),
    (snap) => {
      orders.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      loading.value = false
    }
  ))
})

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const now = new Date()
  const diffDays = Math.floor((now - d) / 86400000)
  const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 0) return `Today, ${timeStr}`
  if (diffDays === 1) return `Yesterday, ${timeStr}`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + timeStr
}

function initials(name) {
  return (name ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

function itemsSummary(order) {
  const count = (order.items ?? []).reduce((s, e) => s + e.qty, 0)
  return `${count} ${count === 1 ? 'item' : 'items'}`
}

function statusLabel(status) {
  return { pending: 'Pending', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled' }[status] ?? status
}

function goToDashboard() { router.push({ name: 'seller-dashboard', params: { storeId } }) }
function goToProducts() { router.push({ name: 'manage-products', params: { storeId } }) }
function goToProfile() { router.push({ name: 'seller-profile', params: { storeId } }) }
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

/* Header */
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

/* Search */
.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  border-bottom: 1px solid var(--border);
  background-color: var(--background);
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 15px;
  color: var(--foreground);
  background: none;
  font-family: inherit;
}

.search-input::placeholder {
  color: var(--muted-foreground);
}

/* Main */
.main-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  scrollbar-width: none;
}

.main-content::-webkit-scrollbar { display: none; }

/* Filter tabs */
.filter-tabs-container {
  padding: 8px 0 16px;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background-color: var(--background);
  z-index: 5;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  padding: 0 20px;
  overflow-x: auto;
  scrollbar-width: none;
}

.filter-tabs::-webkit-scrollbar { display: none; }

.filter-tab {
  padding: 8px 16px;
  border-radius: var(--radius-xl);
  font-size: 13px;
  font-weight: 500;
  color: var(--muted-foreground);
  background-color: var(--muted);
  white-space: nowrap;
  cursor: pointer;
  border: none;
  font-family: inherit;
}

.filter-tab.active {
  background-color: var(--foreground);
  color: var(--background);
}

/* Empty / loading */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  text-align: center;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--foreground);
}

.empty-sub {
  font-size: 14px;
  color: var(--muted-foreground);
  max-width: 240px;
}

@keyframes spin { to { transform: rotate(360deg) } }
.spin { animation: spin 1s linear infinite; display: block; }

/* Orders list */
.orders-list {
  padding: 16px 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-card {
  background-color: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  cursor: pointer;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.order-id-date {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.order-id {
  font-size: 15px;
  font-weight: 600;
  color: var(--foreground);
}

.order-date {
  font-size: 12px;
  color: var(--muted-foreground);
}

.order-status {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
}

.order-status.pending {
  background-color: var(--warning);
  color: var(--warning-foreground);
}

.order-status.confirmed {
  background-color: var(--secondary);
  color: var(--secondary-foreground);
}

.order-status.completed {
  background-color: var(--success);
  color: var(--success-foreground);
}

.order-status.cancelled {
  background-color: var(--destructive);
  color: var(--destructive-foreground);
}

.order-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px dashed var(--border);
}

.customer-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.customer-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--muted);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--foreground);
  flex-shrink: 0;
}

.customer-avatar--lg {
  width: 44px;
  height: 44px;
  font-size: 15px;
}

.customer-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.customer-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--foreground);
}

.order-items-count {
  font-size: 12px;
  color: var(--muted-foreground);
}

.order-total {
  font-size: 16px;
  font-weight: 600;
  color: var(--foreground);
}

/* Bottom nav */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 12px 0 24px;
  background-color: var(--background);
  border-top: 1px solid var(--border);
  z-index: 30;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--muted-foreground);
  cursor: pointer;
  background: none;
  border: none;
  font-family: inherit;
  width: 64px;
}

.nav-item.active {
  color: var(--primary);
}

.nav-label {
  font-size: 11px;
  font-weight: 500;
}
</style>
