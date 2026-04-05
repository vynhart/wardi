<template>
  <div class="page">
    <nav class="header">
      <IconButton icon="lucide:chevron-left" @click="router.back()" />
      <span class="header-title">My Orders</span>
      <div style="width: 40px"></div>
    </nav>

    <main class="content-area">
      <div v-if="loading" class="empty-state">
        <iconify-icon icon="lucide:loader-circle" class="spin" style="font-size: 32px; color: var(--muted-foreground)" />
      </div>

      <div v-else-if="orders.length === 0" class="empty-state">
        <iconify-icon icon="lucide:package" style="font-size: 40px; color: var(--muted-foreground)" />
        <p class="empty-title">No orders yet</p>
        <p class="empty-sub">Your orders from this store will appear here.</p>
      </div>

      <div v-else class="orders-list">
        <div v-for="order in orders" :key="order.id" class="order-card">
          <div class="order-header">
            <div class="order-id-group">
              <span class="order-id">Order #{{ order.orderNumber }}</span>
              <span class="order-date">{{ formatOrderDate(order.createdAt) }}</span>
            </div>
            <div class="order-status" :class="statusClass(order.status)">
              {{ statusLabel(order.status) }}
            </div>
          </div>

          <div class="order-items-summary">
            <div class="item-thumbnail-stack" :style="order.items.length > 1 ? 'width: 60px' : 'width: 48px'">
              <img
                v-for="(entry, i) in order.items.slice(0, 2)"
                :key="i"
                class="item-thumbnail"
                :src="entry.product.imageUrl || ''"
                :alt="entry.product.name"
              />
            </div>
            <div class="item-details">
              <span class="item-title-summary">{{ order.items[0].product.name }}</span>
              <span class="item-count">{{ itemCountLabel(order) }}</span>
            </div>
          </div>

          <div class="order-footer">
            <div>
              <div class="order-total-label">Total</div>
              <div class="order-total-value">{{ formatPrice(order.total) }}</div>
            </div>
            <button class="btn-outline" @click="selectedOrder = order">View Details</button>
          </div>
        </div>
      </div>
    </main>

    <!-- Order detail bottom sheet -->
    <Transition name="sheet">
      <div v-if="selectedOrder" class="sheet-backdrop" @click.self="selectedOrder = null">
        <div class="sheet-panel">
          <div class="sheet-handle-bar"></div>
          <div class="sheet-header">
            <span class="sheet-title">Order #{{ selectedOrder.orderNumber }}</span>
            <button class="sheet-close" @click="selectedOrder = null">
              <iconify-icon icon="lucide:x" style="font-size: 20px; color: var(--foreground)" />
            </button>
          </div>
          <div class="sheet-meta-row">
            <div class="order-status" :class="statusClass(selectedOrder.status)">
              {{ statusLabel(selectedOrder.status) }}
            </div>
            <span class="order-date">{{ formatOrderDate(selectedOrder.createdAt) }}</span>
          </div>
          <div class="sheet-items">
            <div v-for="(entry, i) in selectedOrder.items" :key="i" class="sheet-item">
              <img
                class="sheet-item-img"
                :src="entry.product.imageUrl || ''"
                :alt="entry.product.name"
              />
              <div class="sheet-item-info">
                <span class="sheet-item-name">{{ entry.product.name }}</span>
                <span class="sheet-item-qty">×{{ entry.qty }}</span>
              </div>
              <span class="sheet-item-price">{{ formatPrice(entry.product.price * entry.qty) }}</span>
            </div>
          </div>
          <div class="sheet-divider"></div>
          <div class="sheet-total-row">
            <span class="sheet-total-label">Total</span>
            <span class="sheet-total-value">{{ formatPrice(selectedOrder.total) }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/index.js'
import { getOrderIds } from '../utils/buyerOrders.js'
import { formatPrice } from '../utils/format.js'
import IconButton from '../components/IconButton.vue'

const route = useRoute()
const router = useRouter()
const storeId = route.params.storeId

const orders = ref([])
const loading = ref(true)
const selectedOrder = ref(null)

onMounted(async () => {
  const ids = getOrderIds(storeId)
  const fetched = await Promise.all(
    ids.map(async (id) => {
      const snap = await getDoc(doc(db, 'stores', storeId, 'orders', id))
      if (!snap.exists()) return null
      return { id: snap.id, ...snap.data() }
    })
  )
  orders.value = fetched
    .filter(Boolean)
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() ?? 0
      const bTime = b.createdAt?.toMillis?.() ?? 0
      return bTime - aTime
    })
  loading.value = false
})

function statusLabel(status) {
  const labels = { pending: 'Pending', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled' }
  return labels[status] ?? status
}

function statusClass(status) {
  if (status === 'pending' || status === 'confirmed') return 'status-active'
  if (status === 'completed') return 'status-completed'
  return 'status-cancelled'
}

function itemCountLabel(order) {
  const total = order.items.reduce((sum, e) => sum + e.qty, 0)
  if (order.items.length === 1) return `${total} ${total === 1 ? 'item' : 'items'}`
  return `+ ${order.items.length - 1} more ${order.items.length === 2 ? 'item' : 'items'}`
}

function formatOrderDate(ts) {
  if (!ts) return ''
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (isToday) return `Today, ${time}`
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ', ' + time
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
  padding: 20px;
  display: flex;
  justify-content: space-between;
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

.content-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Empty / loading states */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: var(--muted-foreground);
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--foreground);
}

.empty-sub {
  font-size: 14px;
  text-align: center;
  line-height: 1.5;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
.spin {
  animation: spin 1s linear infinite;
}

/* Order list */
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-card {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px;
  background-color: var(--background);
  display: flex;
  flex-direction: column;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.order-id-group {
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
  font-size: 13px;
  color: var(--muted-foreground);
}

.order-status {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
}

.status-active {
  background-color: var(--primary);
  color: var(--primary-foreground);
}

.status-completed {
  background-color: var(--secondary);
  color: var(--secondary-foreground);
}

.status-cancelled {
  background-color: var(--muted);
  color: var(--muted-foreground);
}

.order-items-summary {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 0;
  border-top: 1px dashed var(--border);
  border-bottom: 1px dashed var(--border);
}

.item-thumbnail-stack {
  display: flex;
  position: relative;
  height: 48px;
  flex-shrink: 0;
}

.item-thumbnail {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  object-fit: cover;
  border: 2px solid var(--background);
  background-color: var(--secondary);
  position: absolute;
}

.item-thumbnail:nth-child(1) {
  left: 0;
  z-index: 2;
}

.item-thumbnail:nth-child(2) {
  left: 12px;
  z-index: 1;
  opacity: 0.8;
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.item-title-summary {
  font-size: 14px;
  font-weight: 500;
  color: var(--foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-count {
  font-size: 13px;
  color: var(--muted-foreground);
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.order-total-label {
  font-size: 13px;
  color: var(--muted-foreground);
}

.order-total-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--foreground);
}

.btn-outline {
  border: 1px solid var(--border);
  background-color: transparent;
  color: var(--foreground);
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

/* Bottom sheet */
.sheet-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 36, 0.45);
  backdrop-filter: blur(2px);
  z-index: 50;
  display: flex;
  align-items: flex-end;
}

.sheet-panel {
  width: 100%;
  background-color: var(--background);
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  padding: 12px 20px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 80dvh;
  overflow-y: auto;
}

.sheet-handle-bar {
  width: 40px;
  height: 4px;
  background-color: var(--border);
  border-radius: 2px;
  align-self: center;
  margin-bottom: 4px;
}

.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sheet-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--foreground);
}

.sheet-close {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.sheet-meta-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sheet-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sheet-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sheet-item-img {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  object-fit: cover;
  background-color: var(--secondary);
  flex-shrink: 0;
}

.sheet-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sheet-item-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sheet-item-qty {
  font-size: 13px;
  color: var(--muted-foreground);
}

.sheet-item-price {
  font-size: 14px;
  font-weight: 600;
  color: var(--foreground);
  flex-shrink: 0;
}

.sheet-divider {
  height: 1px;
  background-color: var(--border);
}

.sheet-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sheet-total-label {
  font-size: 15px;
  font-weight: 500;
  color: var(--muted-foreground);
}

.sheet-total-value {
  font-size: 17px;
  font-weight: 700;
  color: var(--foreground);
}

/* Sheet transition */
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.2s ease;
}
.sheet-enter-active .sheet-panel,
.sheet-leave-active .sheet-panel {
  transition: transform 0.25s ease;
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
.sheet-enter-from .sheet-panel,
.sheet-leave-to .sheet-panel {
  transform: translateY(100%);
}
</style>
