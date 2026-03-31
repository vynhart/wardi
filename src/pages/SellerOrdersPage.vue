<template>
  <div class="page">
    <header class="header">
      <span class="header-title">Orders</span>
    </header>

    <main class="main-content">
      <div v-if="loading" class="empty-state">
        <iconify-icon icon="lucide:loader-circle" class="spin" style="font-size: 32px; color: var(--muted-foreground)" />
      </div>

      <div v-else-if="orders.length === 0" class="empty-state">
        <iconify-icon icon="lucide:inbox" style="font-size: 48px; color: var(--muted-foreground)" />
        <p class="empty-title">No orders yet</p>
        <p class="empty-sub">Orders placed through your store will appear here.</p>
      </div>

      <div v-else class="orders-list">
        <div
          v-for="order in orders"
          :key="order.id"
          class="order-card"
          @click="selectedOrder = order"
        >
          <div class="order-top">
            <div class="order-buyer">
              <div class="buyer-avatar">{{ initials(order.buyerName) }}</div>
              <div class="buyer-info">
                <div class="buyer-name">{{ order.buyerName }}</div>
                <div class="buyer-phone">{{ order.buyerPhone }}</div>
              </div>
            </div>
            <span class="status-badge" :class="`status--${order.status}`">
              {{ statusLabel(order.status) }}
            </span>
          </div>

          <div class="order-meta">
            <span class="order-items-count">{{ itemsSummary(order) }}</span>
            <span class="order-total">{{ formatPrice(order.total) }}</span>
          </div>

          <div class="order-date">{{ formatDate(order.createdAt) }}</div>
        </div>
      </div>
    </main>

    <!-- Order detail bottom sheet -->
    <div v-if="selectedOrder" class="overlay" @click="selectedOrder = null">
      <div class="bottom-sheet" @click.stop>
        <div class="sheet-handle"></div>

        <div class="sheet-buyer-row">
          <div class="buyer-avatar buyer-avatar--lg">{{ initials(selectedOrder.buyerName) }}</div>
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
            <span>Subtotal</span>
            <span>{{ formatPrice(selectedOrder.subtotal) }}</span>
          </div>
          <div class="sheet-total-row">
            <span>Shipping</span>
            <span>{{ formatPrice(selectedOrder.shipping) }}</span>
          </div>
          <div class="sheet-total-row sheet-total-row--total">
            <span>Total</span>
            <span>{{ formatPrice(selectedOrder.total) }}</span>
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
          <div class="status-actions">
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase/index.js'

const route = useRoute()
const router = useRouter()
const storeId = route.params.storeId

const orders = ref([])
const loading = ref(true)
const selectedOrder = ref(null)

let unsubscribe = null

onMounted(() => {
  const q = query(
    collection(db, 'stores', storeId, 'orders'),
    orderBy('createdAt', 'desc')
  )
  unsubscribe = onSnapshot(q, (snap) => {
    orders.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    loading.value = false
  })
})

onUnmounted(() => unsubscribe?.())

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price ?? 0)
}

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d)
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
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 0;
  color: var(--muted-foreground);
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

.orders-list {
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
  gap: 12px;
  cursor: pointer;
}

.order-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.order-buyer {
  display: flex;
  align-items: center;
  gap: 12px;
}

.buyer-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--secondary);
  color: var(--secondary-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.buyer-avatar--lg {
  width: 44px;
  height: 44px;
  font-size: 15px;
}

.buyer-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--foreground);
}

.buyer-phone {
  font-size: 13px;
  color: var(--muted-foreground);
  margin-top: 2px;
}

.status-badge {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.status--pending { background-color: #fef9c3; color: #854d0e; }
.status--confirmed { background-color: #dbeafe; color: #1e40af; }
.status--completed { background-color: #dcfce7; color: #166534; }
.status--cancelled { background-color: var(--muted); color: var(--muted-foreground); }

.order-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-items-count {
  font-size: 14px;
  color: var(--muted-foreground);
}

.order-total {
  font-size: 15px;
  font-weight: 600;
  color: var(--foreground);
}

.order-date {
  font-size: 12px;
  color: var(--muted-foreground);
}

/* Bottom sheet */
.overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 40;
  display: flex;
  align-items: flex-end;
}

.bottom-sheet {
  width: 100%;
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
  left: 0;
  right: 0;
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
