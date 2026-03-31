<template>
  <div class="page">
    <nav class="header">
      <IconButton icon="lucide:chevron-left" @click="router.back()" />
      <span class="header-title">Contact Info</span>
      <div style="width: 40px"></div>
    </nav>

    <main class="content-area">
      <p class="section-hint">The seller will use this to confirm your order.</p>

      <div class="form-section">
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input
            v-model="name"
            class="form-input"
            placeholder="e.g. Jane Smith"
            autocomplete="name"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Phone Number</label>
          <input
            v-model="phone"
            class="form-input"
            type="tel"
            placeholder="e.g. +1 555 000 1234"
            autocomplete="tel"
          />
        </div>

        <p v-if="error" class="form-error">{{ error }}</p>
      </div>

      <!-- Order summary -->
      <div class="order-summary">
        <div class="summary-title">Order summary</div>
        <div v-for="entry in items" :key="entry.product.id" class="summary-line">
          <span class="summary-name">{{ entry.product.name }} <span class="summary-qty">×{{ entry.qty }}</span></span>
          <span class="summary-price">{{ formatPrice(entry.product.price * entry.qty) }}</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-line summary-line--total">
          <span>Total</span>
          <span>{{ formatPrice(total) }}</span>
        </div>
      </div>
    </main>

    <div class="footer">
      <button class="place-order-btn" :disabled="submitting" @click="placeOrder">
        <span>{{ submitting ? 'Opening WhatsApp…' : 'Place Order' }}</span>
        <span>{{ formatPrice(total) }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/index.js'
import { useCartStore } from '../stores/cart.js'
import IconButton from '../components/IconButton.vue'

const SHIPPING = 10

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const storeId = route.params.storeId

const items = cartStore.cartItems(storeId)
const subtotal = cartStore.cartSubtotal(storeId)
const total = computed(() => subtotal.value + SHIPPING)

const name = ref('')
const phone = ref('')
const error = ref('')
const submitting = ref(false)

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price ?? 0)
}

async function placeOrder() {
  error.value = ''
  if (!name.value.trim()) { error.value = 'Please enter your name.'; return }
  if (!phone.value.trim()) { error.value = 'Please enter your phone number.'; return }

  submitting.value = true

  const orderNumber = 10000 + Math.floor(Date.now() % 90000)

  try {
    await addDoc(collection(db, 'stores', storeId, 'orders'), {
      buyerName: name.value.trim(),
      buyerPhone: phone.value.trim(),
      items: items.value.map((e) => ({ product: e.product, qty: e.qty })),
      subtotal: subtotal.value,
      shipping: SHIPPING,
      total: total.value,
      status: 'pending',
      orderNumber,
      createdAt: serverTimestamp(),
    })
  } catch {
    // order save failing should not block the success flow
  }

  cartStore.clearCart(storeId)
  router.replace({
    name: 'order-success',
    params: { storeId },
    state: {
      order: {
        buyerName: name.value.trim(),
        buyerPhone: phone.value.trim(),
        orderNumber,
        items: items.value.map((e) => ({ product: e.product, qty: e.qty })),
        subtotal: subtotal.value,
        shipping: SHIPPING,
        total: total.value,
      },
    },
  })
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
  padding: 24px 20px 120px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  overflow-y: auto;
}

.section-hint {
  font-size: 14px;
  color: var(--muted-foreground);
  line-height: 1.5;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--foreground);
}

.form-input {
  height: 48px;
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--border);
  background-color: var(--input);
  color: var(--foreground);
  padding: 0 14px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.15s;
}

.form-input:focus {
  border-color: var(--primary);
}

.form-error {
  font-size: 13px;
  color: var(--destructive);
}

/* Order summary */
.order-summary {
  background-color: var(--secondary);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--foreground);
  margin-bottom: 4px;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  font-size: 14px;
  color: var(--muted-foreground);
}

.summary-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-qty {
  color: var(--muted-foreground);
  font-size: 13px;
}

.summary-price {
  flex-shrink: 0;
  color: var(--foreground);
  font-weight: 500;
}

.summary-divider {
  height: 1px;
  background-color: var(--border);
}

.summary-line--total {
  font-size: 15px;
  font-weight: 600;
  color: var(--foreground);
}

/* Footer */
.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16px 20px 24px;
  background-color: var(--background);
  border-top: 1px solid var(--border);
  z-index: 20;
}

.place-order-btn {
  width: 100%;
  height: 56px;
  border-radius: var(--radius-xl);
  background-color: var(--primary);
  color: var(--primary-foreground);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.place-order-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
