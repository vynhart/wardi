<template>
  <div class="page">
    <nav class="header">
      <div style="width: 40px"></div>
      <span class="header-title">Order Placed</span>
      <button class="icon-button" @click="goToStore">
        <iconify-icon icon="lucide:x" style="font-size: 24px; color: var(--foreground)" />
      </button>
    </nav>

    <main class="content-area">
      <div class="success-hero">
        <div class="success-icon-wrapper">
          <iconify-icon icon="lucide:check" style="font-size: 40px; color: var(--success-foreground, #fff)" />
        </div>
        <h1 class="success-title">Order Confirmed!</h1>
        <p class="success-subtitle">
          Thank you, {{ order.buyerName }}. Your order has been placed and is waiting for review.
        </p>
      </div>

      <div class="order-card">
        <div class="order-row">
          <span class="order-label">Order Number</span>
          <span class="order-value">#{{ order.orderNumber }}</span>
        </div>
        <div class="order-row">
          <span class="order-label">Date</span>
          <span class="order-value">{{ formattedDate }}</span>
        </div>
        <div class="order-row">
          <span class="order-label">Status</span>
          <div class="order-status-badge">
            <div class="status-dot"></div>
            Pending
          </div>
        </div>
        <div class="order-row">
          <span class="order-label">Contact</span>
          <span class="order-value">{{ order.buyerPhone }}</span>
        </div>
      </div>

      <div class="next-steps">
        <iconify-icon icon="lucide:info" style="font-size: 20px; color: var(--muted-foreground); flex-shrink: 0; margin-top: 2px" />
        <div class="next-steps-text">
          <h4>What happens next?</h4>
          <p>We will contact you shortly at the provided phone number to confirm the details of your request.</p>
        </div>
      </div>
    </main>

    <div class="footer">
      <button class="primary-btn" @click="goToStore">Back to Store</button>
      <button class="contact-btn" @click="contactSeller">
        <iconify-icon icon="lucide:message-circle" style="font-size: 18px" />
        Contact Seller
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatPrice } from '../utils/format.js'

const route = useRoute()
const router = useRouter()
const storeId = route.params.storeId

// Order data passed via history state from CheckoutContactPage
const order = window.history.state?.order ?? {
  buyerName: '',
  buyerPhone: '',
  orderNumber: '',
  items: [],
  subtotal: 0,
  shipping: 0,
  total: 0,
}

const formattedDate = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', year: 'numeric',
}).format(new Date())

function goToStore() {
  router.replace({ name: 'store', params: { storeId } })
}

function contactSeller() {
  const lines = order.items.map(
    (e) => `• ${e.product.name} ×${e.qty} — ${formatPrice(e.product.price * e.qty)}`
  )
  const message = [
    `Hi! I'd like to place an order:`,
    ...lines,
    '',
    `Subtotal: ${formatPrice(order.subtotal)}`,
    `Shipping: ${formatPrice(order.shipping)}`,
    `Total: ${formatPrice(order.total)}`,
    '',
    `Name: ${order.buyerName}`,
    `Phone: ${order.buyerPhone}`,
  ].join('\n')

  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
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

.icon-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  cursor: pointer;
}

.content-area {
  flex: 1;
  padding: 24px 20px 172px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.success-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 32px 0 12px;
}

.success-icon-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: var(--success, #22c55e);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  box-shadow: 0 8px 16px rgba(34, 197, 94, 0.25);
}

.success-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--foreground);
  margin-bottom: 12px;
}

.success-subtitle {
  font-size: 15px;
  color: var(--muted-foreground);
  line-height: 1.5;
  max-width: 280px;
}

.order-card {
  background-color: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 4px 16px;
}

.order-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--border);
}

.order-row:last-child {
  border-bottom: none;
}

.order-label {
  font-size: 14px;
  color: var(--muted-foreground);
}

.order-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--foreground);
}

.order-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: var(--radius-xl);
  background-color: var(--muted);
  font-size: 12px;
  font-weight: 600;
  color: var(--foreground);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--warning, #f59e0b);
}

.next-steps {
  background-color: var(--muted);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.next-steps-text h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--foreground);
  margin-bottom: 4px;
}

.next-steps-text p {
  font-size: 13px;
  color: var(--muted-foreground);
  line-height: 1.5;
}

.footer {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 0;
  width: 100%;
  max-width: 430px;
  padding: 16px 20px 24px;
  background-color: var(--background);
  border-top: 1px solid var(--border);
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.primary-btn {
  width: 100%;
  height: 56px;
  border-radius: var(--radius-xl);
  background-color: var(--primary);
  color: var(--primary-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.contact-btn {
  width: 100%;
  height: 48px;
  border-radius: var(--radius-xl);
  background-color: #25D366;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
</style>
