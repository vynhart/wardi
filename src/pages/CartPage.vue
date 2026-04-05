<template>
  <div class="page">
    <!-- Header -->
    <nav class="header">
      <IconButton icon="lucide:chevron-left" @click="router.back()" />
      <span class="header-title">Cart</span>
      <div style="width: 40px"></div>
    </nav>

    <main class="content-area">
      <!-- Empty state -->
      <div v-if="items.length === 0" class="empty-state">
        <iconify-icon icon="lucide:shopping-cart" style="font-size: 48px; color: var(--muted-foreground)" />
        <p>Your cart is empty</p>
      </div>

      <template v-else>
        <!-- Cart items -->
        <div class="cart-items-list">
          <div v-for="entry in items" :key="entry.product.id" class="cart-item">
            <div class="cart-image-wrapper">
              <img
                v-if="entry.product.imageUrl"
                class="cart-image"
                :src="toCdnUrl(entry.product.imageUrl)"
                :alt="entry.product.name"
              />
            </div>
            <div class="cart-item-details">
              <div class="cart-item-header">
                <div class="cart-item-title">{{ entry.product.name }}</div>
                <button class="cart-item-remove" @click="removeItem(entry.product.id)">
                  <iconify-icon icon="lucide:x" style="font-size: 14px; color: var(--muted-foreground)" />
                </button>
              </div>
              <div class="cart-item-price">{{ formatPrice(entry.product.price * entry.qty) }}</div>
              <div class="cart-item-bottom">
                <QtyControl
                  :qty="entry.qty"
                  @increase="changeQty(entry.product.id, entry.qty + 1)"
                  @decrease="changeQty(entry.product.id, entry.qty - 1)"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Order summary -->
        <div class="cart-summary">
          <div class="summary-row">
            <span>Subtotal</span>
            <span class="value">{{ formatPrice(subtotal) }}</span>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-row total">
            <span>Total</span>
            <span class="value">{{ formatPrice(total) }}</span>
          </div>
        </div>
      </template>
    </main>

    <!-- Checkout footer -->
    <div v-if="items.length > 0" class="checkout-footer">
      <button class="checkout-btn" @click="checkout">
        <span>Checkout</span>
        <span>{{ formatPrice(total) }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart.js'
import IconButton from '../components/IconButton.vue'
import QtyControl from '../components/QtyControl.vue'
import { toCdnUrl } from '../utils/storage.js'
import { formatPrice } from '../utils/format.js'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const storeId = route.params.storeId

const items = cartStore.cartItems(storeId)
const subtotal = cartStore.cartSubtotal(storeId)
const total = subtotal

function changeQty(productId, newQty) {
  cartStore.setQty(storeId, productId, newQty)
}

function removeItem(productId) {
  cartStore.removeItem(storeId, productId)
}

function checkout() {
  router.push({ name: 'checkout', params: { storeId } })
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
  padding: 24px 20px 104px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 40px 0;
  color: var(--muted-foreground);
  font-size: 14px;
}

/* Cart items */
.cart-items-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.cart-item {
  display: flex;
  gap: 16px;
  align-items: stretch;
}

.cart-image-wrapper {
  width: 88px;
  flex-shrink: 0;
  aspect-ratio: 4 / 5;
  border-radius: var(--radius-lg);
  background-color: var(--secondary);
  overflow: hidden;
}

.cart-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cart-item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 4px 0;
  min-width: 0;
}

.cart-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.cart-item-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--foreground);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cart-item-remove {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: var(--secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
}

.cart-item-price {
  font-size: 16px;
  font-weight: 600;
  color: var(--foreground);
  margin-top: 4px;
}

.cart-item-bottom {
  display: flex;
  align-items: center;
  margin-top: 12px;
}

/* Summary */
.cart-summary {
  background-color: var(--secondary);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  color: var(--muted-foreground);
}

.summary-row .value {
  color: var(--foreground);
  font-weight: 500;
}

.summary-divider {
  height: 1px;
  background-color: var(--border);
  opacity: 0.6;
}

.summary-row.total {
  font-size: 16px;
  font-weight: 600;
  color: var(--foreground);
}

.summary-row.total .value {
  font-size: 20px;
  font-weight: 600;
}

/* Checkout footer */
.checkout-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--background);
  padding: 16px 20px 24px;
  border-top: 1px solid var(--border);
  z-index: 20;
}

.checkout-btn {
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
</style>
