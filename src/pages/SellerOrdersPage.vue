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
    <div v-if="selectedOrder" class="overlay" @click="selectedOrder = null">
      <div class="bottom-sheet" @click.stop>
        <div class="sheet-handle"></div>

        <div class="sheet-buyer-row">
          <div class="customer-avatar customer-avatar--lg">{{ initials(selectedOrder.buyerName) }}</div>
          <div>
            <div class="buyer-name">{{ selectedOrder.buyerName }}</div>
            <a :href="`tel:${selectedOrder.buyerPhone}`" class="buyer-phone-link">
              {{ selectedOrder.buyerPhone }}
            </a>
          </div>
        </div>

        <div class="sheet-items">
          <div v-for="(entry, i) in selectedOrder.items" :key="i" class="sheet-item">
            <span class="sheet-item-name">{{ entry.product.name }}</span>
            <span class="sheet-item-meta">×{{ entry.qty }} · {{ formatPrice(entry.product.price * entry.qty) }}</span>
          </div>
        </div>

        <div class="sheet-totals">
          <div class="sheet-total-row">
            <span>Subtotal</span><span>{{ formatPrice(selectedOrder.subtotal) }}</span>
          </div>
          <div class="sheet-total-row">
            <span>Shipping</span><span>{{ formatPrice(selectedOrder.shipping) }}</span>
          </div>
          <div class="sheet-total-row sheet-total-row--total">
            <span>Total</span><span>{{ formatPrice(selectedOrder.total) }}</span>
          </div>
        </div>

        <div class="sheet-actions">
          <a
            :href="`https://wa.me/${selectedOrder.buyerPhone.replace(/\D/g, '')}`"
            target="_blank"
            class="contact-btn"
          >
            <iconify-icon icon="lucide:message-circle" style="font-size: 18px" />
            Contact Buyer
          </a>
          <div v-if="nextStatuses(selectedOrder.status).length" class="status-actions">
            <button
              v-for="s in nextStatuses(selectedOrder.status)"
              :key="s.value"
              class="status-action-btn"
              :class="`status-action--${s.value}`"
              @click="updateStatus(selectedOrder, s.value)"
            >{{ s.label }}</button>
          </div>
        </div>
      </div>
    </div>

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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase/index.js'

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

let unsubscribe = null

onMounted(() => {
  unsubscribe = onSnapshot(
    query(collection(db, 'stores', storeId, 'orders'), orderBy('createdAt', 'desc')),
    (snap) => {
      orders.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      loading.value = false
    }
  )
})

onUnmounted(() => unsubscribe?.())

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price ?? 0)
}

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

function nextStatuses(status) {
  if (status === 'pending') return [{ value: 'confirmed', label: 'Confirm' }, { value: 'cancelled', label: 'Cancel' }]
  if (status === 'confirmed') return [{ value: 'completed', label: 'Mark Completed' }, { value: 'cancelled', label: 'Cancel' }]
  return []
}

async function updateStatus(order, status) {
  await updateDoc(doc(db, 'stores', storeId, 'orders', order.id), { status })
  order.status = status
  selectedOrder.value = null
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

/* Bottom sheet */
.overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 40;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bottom-sheet {
  width: 100%;
  max-width: 430px;
  background-color: var(--background);
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 12px 20px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sheet-handle {
  width: 36px;
  height: 4px;
  border-radius: 999px;
  background-color: var(--border);
  margin: 0 auto 4px;
}

.sheet-buyer-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.buyer-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--foreground);
}

.buyer-phone-link {
  font-size: 14px;
  color: var(--primary);
  text-decoration: none;
  margin-top: 2px;
  display: block;
}

.sheet-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sheet-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.sheet-item-name {
  color: var(--foreground);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sheet-item-meta {
  color: var(--muted-foreground);
  flex-shrink: 0;
}

.sheet-totals {
  background-color: var(--secondary);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sheet-total-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--muted-foreground);
}

.sheet-total-row--total {
  font-size: 15px;
  font-weight: 600;
  color: var(--foreground);
  padding-top: 10px;
  border-top: 1px solid var(--border);
  margin-top: 2px;
}

.sheet-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.contact-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  border-radius: var(--radius-xl);
  background-color: #25D366;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
}

.status-actions {
  display: flex;
  gap: 10px;
}

.status-action-btn {
  flex: 1;
  height: 44px;
  border-radius: var(--radius-xl);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-family: inherit;
}

.status-action--confirmed, .status-action--completed {
  background-color: var(--primary);
  color: var(--primary-foreground);
}

.status-action--cancelled {
  background-color: var(--muted);
  color: var(--muted-foreground);
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
