<template>
  <div class="page">
    <!-- Header -->
    <nav class="header">
      <IconButton icon="lucide:menu" @click="toggleMenu" />
      <span class="header-title">{{ store?.name ?? '...' }}</span>
      <div class="header-actions">
        <IconButton icon="lucide:search" @click="goToSearch" />
      </div>
    </nav>

    <!-- Content -->
    <main class="content-area" :style="hasCartItems ? 'padding-bottom: 168px' : ''">
      <!-- Categories -->
      <div v-if="categories.length > 1" class="categories">
        <button
          v-for="cat in categories"
          :key="cat"
          class="category-pill"
          :class="{ active: selectedCategory === cat }"
          @click="selectedCategory = cat"
        >
          {{ cat }}
        </button>
      </div>

      <!-- Product grid -->
      <div v-if="loading" class="loading-state">Loading...</div>
      <div v-else-if="filteredProducts.length === 0" class="empty-state">No products yet.</div>
      <div v-else class="product-list">
        <div
          v-for="product in filteredProducts"
          :key="product.id"
          class="product-item"
          @click="goToDetail(product)"
        >
          <div class="product-image-wrapper">
            <img
              v-if="product.imageUrl"
              class="product-image"
              :src="toCdnUrl(product.imageUrl)"
              :alt="product.name"
            />
          </div>
          <div class="product-details">
            <div class="product-title">{{ product.name }}</div>
            <div class="product-bottom">
              <div class="product-price">{{ formatPrice(product.price) }}</div>
              <button class="add-to-cart-btn" @click.stop="addToCart(product)">
                <iconify-icon icon="lucide:plus" style="font-size: 16px; color: var(--primary-foreground)" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="brand-footer">
        <RouterLink to="/" class="brand-footer-link">
          Powered by <span class="brand-footer-name">wardi</span>
        </RouterLink>
      </div>
    </main>

    <!-- Cart bottom sheet -->
    <div v-if="hasCartItems" class="cart-sheet">
      <div class="sheet-handle"></div>
      <div class="cart-sheet-row">
        <div class="cart-sheet-left">
          <div class="cart-sheet-label">Cart total</div>
          <div class="cart-sheet-total">{{ formatPrice(subtotal) }}</div>
          <div class="cart-sheet-meta">{{ itemCount }} {{ itemCount === 1 ? 'item' : 'items' }} ready to checkout</div>
        </div>
        <button class="cart-sheet-cta" @click="goToCart">
          <span>View cart</span>
          <div class="cart-sheet-count">{{ itemCount }}</div>
        </button>
      </div>
    </div>

    <!-- Seller menu overlay (owner only) -->
    <SellerMenu
      v-if="sellerMenuOpen && isOwner"
      @close="sellerMenuOpen = false"
      @dashboard="goToDashboard"
      @sign-out="handleSignOut"
    />

    <!-- Buyer drawer (non-owners) -->
    <BuyerDrawer
      v-if="!isOwner"
      :open="buyerDrawerOpen"
      @close="buyerDrawerOpen = false"
      @go-to-orders="openOrders"
      @contact-seller="contactSeller"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFirestoreListeners } from '../composables/useFirestoreListeners.js'
import { useRoute, useRouter } from 'vue-router'
import { doc, collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/index.js'
import { useCartStore } from '../stores/cart.js'
import { useAuthStore } from '../stores/auth.js'
import IconButton from '../components/IconButton.vue'
import SellerMenu from '../components/SellerMenu.vue'
import BuyerDrawer from '../components/BuyerDrawer.vue'
import { toCdnUrl } from '../utils/storage.js'
import { formatPrice } from '../utils/format.js'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()

const storeId = route.params.storeId

const store = ref(null)
const products = ref([])
const loading = ref(true)
const selectedCategory = ref('All')
const sellerMenuOpen = ref(false)
const buyerDrawerOpen = ref(false)

const { addListener } = useFirestoreListeners()

onMounted(() => {
  addListener(onSnapshot(doc(db, 'stores', storeId), (snap) => {
    if (snap.exists()) {
      store.value = { id: snap.id, ...snap.data() }
    }
  }))

  addListener(onSnapshot(collection(db, 'stores', storeId, 'products'), (snap) => {
    products.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    loading.value = false
  }))
})

const isOwner = computed(
  () => authStore.user && store.value && authStore.user.uid === store.value.ownerUid
)

const categories = computed(() => {
  const cats = new Set(visibleProducts.value.map((p) => p.category).filter(Boolean))
  return ['All', ...cats]
})

const visibleProducts = computed(() => products.value.filter((p) => p.visible !== false))

const filteredProducts = computed(() => {
  if (selectedCategory.value === 'All') return visibleProducts.value
  return visibleProducts.value.filter((p) => p.category === selectedCategory.value)
})

const items = cartStore.cartItems(storeId)
const itemCount = cartStore.cartCount(storeId)
const subtotal = cartStore.cartSubtotal(storeId)
const hasCartItems = computed(() => itemCount.value > 0)

function addToCart(product) {
  cartStore.addItem(storeId, product)
}

function goToDetail(product) {
  router.push({ name: 'product-detail', params: { storeId, productId: product.id } })
}

function goToSearch() {
  router.push({ name: 'search', params: { storeId } })
}

function goToCart() {
  router.push({ name: 'cart', params: { storeId } })
}

function openOrders() {
  buyerDrawerOpen.value = false
  router.push({ name: 'buyer-orders', params: { storeId } })
}

function contactSeller() {
  buyerDrawerOpen.value = false
  window.open('https://wa.me/', '_blank')
}

function toggleMenu() {
  if (isOwner.value) {
    sellerMenuOpen.value = !sellerMenuOpen.value
  } else {
    buyerDrawerOpen.value = !buyerDrawerOpen.value
  }
}

function goToDashboard() {
  sellerMenuOpen.value = false
  router.push({ name: 'seller-dashboard', params: { storeId } })
}

async function handleSignOut() {
  await authStore.logout()
  sellerMenuOpen.value = false
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

.header {
  padding: 22px 20px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--background);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--foreground);
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.content-area {
  flex: 1;
  padding: 20px 20px 24px;
  overflow-y: auto;
  background-color: var(--background);
}

/* Categories */
.categories {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: none;
}

.categories::-webkit-scrollbar {
  display: none;
}

.category-pill {
  padding: 10px 16px;
  border-radius: var(--radius-xl);
  background-color: var(--secondary);
  color: var(--secondary-foreground);
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
}

.category-pill.active {
  background-color: var(--foreground);
  color: var(--background);
}

/* Product grid */
.product-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 16px;
  padding-bottom: 8px;
}

.product-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  cursor: pointer;
}

.product-image-wrapper {
  width: 100%;
  aspect-ratio: 4 / 5;
  border-radius: 10px;
  background-color: var(--secondary);
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.product-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--foreground);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 38px;
}

.product-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  gap: 8px;
}

.product-price {
  font-size: 15px;
  font-weight: 600;
  color: var(--foreground);
  white-space: nowrap;
}

.add-to-cart-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
}

/* Brand footer */
.brand-footer {
  display: flex;
  justify-content: center;
  padding: 26px 0 8px;
}

.brand-footer-link {
  font-size: 13px;
  font-weight: 500;
  color: var(--muted-foreground);
  text-decoration: none;
  cursor: pointer;
}

.brand-footer-name {
  color: var(--foreground);
  font-weight: 600;
}

/* Cart bottom sheet */
.cart-sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--card);
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  box-shadow: 0 -8px 24px rgba(15, 23, 36, 0.06);
  padding: 12px 20px 18px;
  z-index: 20;
}

.sheet-handle {
  width: 36px;
  height: 4px;
  border-radius: 999px;
  background-color: #e5e7eb;
  margin: 0 auto 14px;
}

.cart-sheet-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.cart-sheet-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.cart-sheet-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--muted-foreground);
  white-space: nowrap;
}

.cart-sheet-total {
  font-size: 20px;
  font-weight: 600;
  color: var(--foreground);
  white-space: nowrap;
}

.cart-sheet-meta {
  font-size: 13px;
  font-weight: 500;
  color: var(--foreground);
  white-space: nowrap;
}

.cart-sheet-cta {
  min-width: 136px;
  height: 44px;
  padding: 0 18px;
  border-radius: var(--radius-xl);
  background-color: var(--primary);
  color: var(--primary-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: pointer;
}

.cart-sheet-count {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background-color: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--primary-foreground);
}

/* States */
.loading-state,
.empty-state {
  padding: 40px 0;
  text-align: center;
  font-size: 14px;
  color: var(--muted-foreground);
}

</style>
