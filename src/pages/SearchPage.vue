<template>
  <div class="page">
    <!-- Header -->
    <nav class="header">
      <IconButton icon="lucide:arrow-left" @click="router.back()" style="margin-left: -8px" />
      <div class="search-input-wrapper" @click="focusInput">
        <iconify-icon icon="lucide:search" style="font-size: 20px; color: var(--muted-foreground); flex-shrink: 0" />
        <input
          ref="inputRef"
          class="search-input"
          v-model="query"
          placeholder="Search..."
          autofocus
          @input="onInput"
        />
        <button v-if="query" class="clear-btn" @click.stop="clearQuery">
          <iconify-icon icon="lucide:x" style="font-size: 16px; color: var(--muted-foreground)" />
        </button>
      </div>
    </nav>

    <main class="content-area">
      <!-- Search results -->
      <template v-if="query.trim()">
        <div class="section-title">
          {{ results.length }} result{{ results.length !== 1 ? 's' : '' }}
        </div>
        <div v-if="results.length === 0" class="empty-state">
          No products match "{{ query }}"
        </div>
        <div v-else class="product-list">
          <div
            v-for="product in results"
            :key="product.id"
            class="product-item"
            @click="onProductClick(product)"
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
              <div class="product-price">{{ formatPrice(product.price) }}</div>
            </div>
            <iconify-icon icon="lucide:arrow-up-right" style="font-size: 20px; color: var(--muted-foreground); flex-shrink: 0" />
          </div>
        </div>
      </template>

      <!-- Default state: recent + trending -->
      <template v-else>
        <template v-if="recentSearches.length > 0">
          <div class="section-title">Recent Searches</div>
          <div class="search-tags">
            <button
              v-for="term in recentSearches"
              :key="term"
              class="search-tag"
              @click="query = term"
            >
              <iconify-icon icon="lucide:clock" style="font-size: 16px; color: var(--secondary-foreground)" />
              {{ term }}
            </button>
          </div>
        </template>

        <div class="section-title">Trending Now</div>
        <div class="product-list">
          <div
            v-for="product in trendingProducts"
            :key="product.id"
            class="product-item"
            @click="onProductClick(product)"
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
              <div class="product-price">{{ formatPrice(product.price) }}</div>
            </div>
            <iconify-icon icon="lucide:arrow-up-right" style="font-size: 20px; color: var(--muted-foreground); flex-shrink: 0" />
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/index.js'
import IconButton from '../components/IconButton.vue'
import { toCdnUrl } from '../utils/storage.js'

const route = useRoute()
const router = useRouter()
const storeId = route.params.storeId

const RECENT_KEY = `wardi_recent_${storeId}`
const MAX_RECENT = 8

const query = ref('')
const products = ref([])
const inputRef = ref(null)

const recentSearches = ref(loadRecent())

function loadRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveRecent(term) {
  const list = loadRecent().filter((t) => t !== term)
  list.unshift(term)
  const trimmed = list.slice(0, MAX_RECENT)
  localStorage.setItem(RECENT_KEY, JSON.stringify(trimmed))
  recentSearches.value = trimmed
}

onMounted(async () => {
  inputRef.value?.focus()
  const snap = await getDocs(collection(db, 'stores', storeId, 'products'))
  products.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
})

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return products.value.filter((p) => p.name.toLowerCase().includes(q))
})

const trendingProducts = computed(() => products.value.slice(0, 5))

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
}

function onInput() {
  // intentionally empty — v-model handles reactivity
}

function clearQuery() {
  query.value = ''
  inputRef.value?.focus()
}

function focusInput() {
  inputRef.value?.focus()
}

function onProductClick(product) {
  if (query.value.trim()) {
    saveRecent(query.value.trim())
  }
  // Navigate back to store — product highlight not in scope
  router.back()
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
  padding: 16px 20px;
  display: flex;
  align-items: center;
  background-color: var(--background);
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid var(--border);
  gap: 12px;
}

.search-input-wrapper {
  flex: 1;
  height: 44px;
  background-color: var(--secondary);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 15px;
  font-weight: 500;
  color: var(--foreground);
  font-family: var(--font-family-body);
  outline: none;
}

.search-input::placeholder {
  color: var(--muted-foreground);
}

.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.content-area {
  flex: 1;
  padding: 24px 20px;
  overflow-y: auto;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--foreground);
  margin-bottom: 16px;
}

/* Recent searches */
.search-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 32px;
}

.search-tag {
  padding: 8px 16px;
  border-radius: var(--radius-xl);
  background-color: var(--secondary);
  color: var(--secondary-foreground);
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

/* Product list */
.product-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.product-item {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 8px;
  margin: -8px;
  border-radius: var(--radius-lg);
  cursor: pointer;
}

.product-image-wrapper {
  width: 64px;
  flex-shrink: 0;
  aspect-ratio: 1 / 1;
  border-radius: var(--radius-md);
  background-color: var(--secondary);
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.product-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-price {
  font-size: 14px;
  font-weight: 600;
  color: var(--muted-foreground);
}

.empty-state {
  padding: 40px 0;
  text-align: center;
  font-size: 14px;
  color: var(--muted-foreground);
}
</style>
