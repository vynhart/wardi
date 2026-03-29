<template>
  <div class="page">
    <!-- Header -->
    <header class="header">
      <span class="header-title">Products</span>
      <IconButton icon="lucide:plus" @click="goToAdd" />
    </header>

    <!-- Top controls -->
    <div class="top-controls">
      <div class="search-bar">
        <iconify-icon icon="lucide:search" style="font-size: 20px; color: var(--muted-foreground); flex-shrink: 0" />
        <input
          class="search-input"
          v-model="query"
          placeholder="Search inventory..."
        />
        <button v-if="query" class="search-clear" @click="query = ''">
          <iconify-icon icon="lucide:x" style="font-size: 16px; color: var(--muted-foreground)" />
        </button>
      </div>

      <div class="categories-scroll">
        <button
          v-for="pill in filterPills"
          :key="pill.value"
          class="category-pill"
          :class="{ active: activeFilter === pill.value }"
          @click="activeFilter = pill.value"
        >
          {{ pill.label }}
        </button>
      </div>
    </div>

    <!-- Main content -->
    <main class="main-content">
      <div v-if="loading" class="loading-state">Loading...</div>

      <!-- Empty state -->
      <div v-else-if="filteredProducts.length === 0" class="empty-state">
        <div class="empty-icon-circle">
          <iconify-icon icon="lucide:package-open" style="font-size: 48px; color: var(--muted-foreground)" />
        </div>
        <h2 class="empty-title">
          {{ products.length === 0 ? 'No products yet' : 'No results' }}
        </h2>
        <p class="empty-desc">
          {{ products.length === 0
            ? 'Start building your catalog by adding your first product to the store.'
            : 'Try a different filter or search term.' }}
        </p>
        <button v-if="products.length === 0" class="btn-primary" @click="goToAdd">
          <iconify-icon icon="lucide:plus" style="font-size: 20px; color: var(--primary-foreground)" />
          Add First Product
        </button>
      </div>

      <!-- Product list -->
      <ul v-else class="product-list">
        <li
          v-for="product in filteredProducts"
          :key="product.id"
          class="product-row"
          @click="goToEdit(product)"
        >
          <div class="product-thumb">
            <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" />
            <iconify-icon v-else icon="lucide:image" style="font-size: 24px; color: var(--muted-foreground)" />
          </div>
          <div class="product-info">
            <span class="product-name">{{ product.name }}</span>
            <span class="product-meta">{{ formatPrice(product.price) }} · {{ product.stock ?? 0 }} in stock</span>
            <span class="product-badge" :class="product.visible !== false ? 'badge--published' : 'badge--draft'">
              {{ product.visible !== false ? 'Published' : 'Draft' }}
            </span>
          </div>
          <iconify-icon icon="lucide:chevron-right" style="font-size: 20px; color: var(--muted-foreground); flex-shrink: 0" />
        </li>
      </ul>
    </main>

    <!-- Bottom nav -->
    <nav class="bottom-nav">
      <button class="nav-item" @click="goToDashboard">
        <iconify-icon icon="lucide:layout-grid" style="font-size: 24px; color: inherit" />
        <span class="nav-label">Dashboard</span>
      </button>
      <button class="nav-item">
        <iconify-icon icon="lucide:inbox" style="font-size: 24px; color: inherit" />
        <span class="nav-label">Orders</span>
      </button>
      <button class="nav-item active">
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { doc, collection, onSnapshot, getDoc } from 'firebase/firestore'
import { db } from '../firebase/index.js'
import { useAuthStore } from '../stores/auth.js'
import IconButton from '../components/IconButton.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const storeId = route.params.storeId
const products = ref([])
const loading = ref(true)
const query = ref('')
const activeFilter = ref('all')

const filterPills = [
  { label: 'All Items', value: 'all' },
  { label: 'Published', value: 'published' },
  { label: 'Drafts', value: 'drafts' },
  { label: 'Out of Stock', value: 'out-of-stock' },
]

let unsubProducts = null

onMounted(async () => {
  // Guard: must be authenticated and own the store
  if (!authStore.user) {
    router.replace({ name: 'store', params: { storeId } })
    return
  }
  const storeSnap = await getDoc(doc(db, 'stores', storeId))
  if (!storeSnap.exists() || storeSnap.data().ownerUid !== authStore.user.uid) {
    router.replace({ name: 'store', params: { storeId } })
    return
  }

  unsubProducts = onSnapshot(collection(db, 'stores', storeId, 'products'), (snap) => {
    products.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    loading.value = false
  })
})

onUnmounted(() => {
  unsubProducts?.()
})

const filteredProducts = computed(() => {
  let list = products.value

  if (activeFilter.value === 'published') {
    list = list.filter((p) => p.visible !== false)
  } else if (activeFilter.value === 'drafts') {
    list = list.filter((p) => p.visible === false)
  } else if (activeFilter.value === 'out-of-stock') {
    list = list.filter((p) => !p.stock || p.stock === 0)
  }

  if (query.value.trim()) {
    const q = query.value.toLowerCase()
    list = list.filter((p) => p.name?.toLowerCase().includes(q))
  }

  return list
})

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price ?? 0)
}

function goToAdd() {
  router.push({ name: 'product-add', params: { storeId } })
}

function goToEdit(product) {
  router.push({ name: 'product-edit', params: { storeId, productId: product.id } })
}

function goToDashboard() {
  router.push({ name: 'seller-dashboard', params: { storeId } })
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

/* Top controls */
.top-controls {
  padding: 0 20px 16px;
  background-color: var(--background);
  border-bottom: 1px solid var(--border);
}

.search-bar {
  display: flex;
  align-items: center;
  background-color: var(--muted);
  padding: 12px 16px;
  border-radius: var(--radius-md);
  gap: 12px;
}

.search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-size: 15px;
  font-family: var(--font-family-body);
  color: var(--foreground);
  min-width: 0;
}

.search-input::placeholder {
  color: var(--muted-foreground);
}

.search-clear {
  display: flex;
  align-items: center;
  background: none;
  cursor: pointer;
  flex-shrink: 0;
}

.categories-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  margin-top: 16px;
  padding-bottom: 4px;
  scrollbar-width: none;
}

.categories-scroll::-webkit-scrollbar {
  display: none;
}

.category-pill {
  padding: 8px 16px;
  border-radius: var(--radius-xl);
  background-color: var(--muted);
  color: var(--foreground);
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  flex-shrink: 0;
}

.category-pill.active {
  background-color: var(--foreground);
  color: var(--background);
}

/* Main content */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding-bottom: 80px;
}

/* Empty state */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 32px;
  text-align: center;
}

.empty-icon-circle {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background-color: var(--muted);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--foreground);
  margin-bottom: 12px;
}

.empty-desc {
  font-size: 15px;
  color: var(--muted-foreground);
  margin-bottom: 32px;
  line-height: 1.5;
}

.btn-primary {
  background-color: var(--primary);
  color: var(--primary-foreground);
  padding: 14px 24px;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 15px;
  font-family: var(--font-family-body);
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

/* Product list */
.product-list {
  list-style: none;
}

.product-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background-color 0.1s;
}

.product-row:active {
  background-color: var(--muted);
}

.product-thumb {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  background-color: var(--muted);
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-meta {
  font-size: 13px;
  color: var(--muted-foreground);
}

.product-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 600;
  width: fit-content;
}

.badge--published {
  background-color: #dcfce7;
  color: #16a34a;
}

.badge--draft {
  background-color: var(--muted);
  color: var(--muted-foreground);
}

/* Loading */
.loading-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--muted-foreground);
}

/* Bottom nav */
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
