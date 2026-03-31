<template>
  <div class="page">
    <!-- Hero image + back button -->
    <div class="image-hero">
      <img v-if="product?.imageUrl" class="hero-img" :src="toCdnUrl(product.imageUrl)" :alt="product?.name" />
      <div v-else class="hero-placeholder">
        <iconify-icon icon="lucide:image" style="font-size: 48px; color: var(--muted-foreground)" />
      </div>
      <button class="back-btn" @click="router.back()">
        <iconify-icon icon="lucide:chevron-left" style="font-size: 22px; color: var(--foreground)" />
      </button>
    </div>

    <!-- Content -->
    <main class="content-area" :style="{ paddingBottom: qtyInCart > 0 ? '168px' : '100px' }">
      <div v-if="loading" class="loading-state">Loading...</div>
      <div v-else-if="!product" class="loading-state">Product not found.</div>
      <template v-else>
        <!-- Name + category -->
        <div class="product-header">
          <h1 class="product-name">{{ product.name }}</h1>
          <span v-if="product.category" class="category-chip">{{ product.category }}</span>
        </div>

        <!-- Price + stock -->
        <div class="price-row">
          <span class="product-price">{{ formatPrice(product.price) }}</span>
          <span class="stock-badge" :class="product.stock > 0 ? 'stock--in' : 'stock--out'">
            {{ product.stock > 0 ? `${product.stock} in stock` : 'Out of stock' }}
          </span>
        </div>

        <!-- Description -->
        <template v-if="product.description">
          <h2 class="section-label">Description</h2>
          <p class="description">{{ product.description }}</p>
        </template>
      </template>
    </main>

    <!-- Sticky bottom bar -->
    <div v-if="product && !loading" class="bottom-bar">
      <template v-if="qtyInCart === 0">
        <button
          class="add-btn"
          :disabled="!product.stock || product.stock === 0"
          @click="addToCart"
        >
          <iconify-icon icon="lucide:shopping-cart" style="font-size: 20px; color: var(--primary-foreground)" />
          {{ product.stock > 0 ? 'Add to Cart' : 'Out of Stock' }}
        </button>
      </template>
      <template v-else>
        <QtyControl :qty="qtyInCart" @increase="increaseQty" @decrease="decreaseQty" />
        <button class="view-cart-btn" @click="goToCart">
          View Cart
          <div class="cart-count">{{ itemCount }}</div>
        </button>
      </template>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/index.js'
import { toCdnUrl } from '../utils/storage.js'
import { useCartStore } from '../stores/cart.js'
import QtyControl from '../components/QtyControl.vue'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

const storeId = route.params.storeId
const productId = route.params.productId

const product = ref(null)
const loading = ref(true)

onMounted(async () => {
  const snap = await getDoc(doc(db, 'stores', storeId, 'products', productId))
  if (snap.exists()) {
    product.value = { id: snap.id, ...snap.data() }
  }
  loading.value = false
})

const items = cartStore.cartItems(storeId)
const itemCount = cartStore.cartCount(storeId)

const qtyInCart = computed(
  () => items.value.find((e) => e.product.id === productId)?.qty ?? 0
)

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price ?? 0)
}

function addToCart() {
  cartStore.addItem(storeId, product.value)
}

function increaseQty() {
  cartStore.addItem(storeId, product.value)
}

function decreaseQty() {
  cartStore.setQty(storeId, productId, qtyInCart.value - 1)
}

function goToCart() {
  router.push({ name: 'cart', params: { storeId } })
}
</script>

<style scoped>
.page {
  width: 100%;
  min-height: 100dvh;
  background-color: var(--background);
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Hero */
.image-hero {
  width: 100%;
  aspect-ratio: 4 / 5;
  background-color: var(--secondary);
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
}

.hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

/* Content */
.content-area {
  flex: 1;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.product-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.product-name {
  font-size: 22px;
  font-weight: 700;
  color: var(--foreground);
  line-height: 1.3;
}

.category-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: var(--radius-xl);
  background-color: var(--secondary);
  color: var(--secondary-foreground);
  font-size: 13px;
  font-weight: 500;
  width: fit-content;
}

.price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 24px;
}

.product-price {
  font-size: 24px;
  font-weight: 700;
  color: var(--foreground);
}

.stock-badge {
  font-size: 13px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
}

.stock--in {
  background-color: #dcfce7;
  color: #16a34a;
}

.stock--out {
  background-color: var(--muted);
  color: var(--muted-foreground);
}

.section-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--foreground);
  margin-bottom: 8px;
}

.description {
  font-size: 15px;
  color: var(--muted-foreground);
  line-height: 1.6;
}

/* Sticky bottom bar */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 20px 28px;
  background-color: var(--background);
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 20;
}

.add-btn {
  flex: 1;
  height: 52px;
  border-radius: var(--radius-xl);
  background-color: var(--primary);
  color: var(--primary-foreground);
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
}

.add-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.view-cart-btn {
  flex: 1;
  height: 52px;
  border-radius: var(--radius-xl);
  background-color: var(--primary);
  color: var(--primary-foreground);
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}

.cart-count {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
}

.loading-state {
  padding: 40px 0;
  text-align: center;
  font-size: 14px;
  color: var(--muted-foreground);
}
</style>
