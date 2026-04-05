<template>
  <div class="page">
    <!-- Header -->
    <nav class="header">
      <IconButton icon="lucide:x" @click="router.back()" />
      <span class="header-title">{{ isEdit ? 'Edit Product' : 'Add Product' }}</span>
      <button class="header-save-btn" :disabled="saving" @click="submit">
        {{ saving ? 'Saving...' : 'Save' }}
      </button>
    </nav>

    <main class="content-area">
      <div v-if="loadingProduct" class="loading-state">Loading...</div>
      <div v-else class="form-body">

        <!-- Product Images -->
        <h2 class="section-title">Product Images</h2>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          style="display: none"
          @change="onFileSelected"
        />
        <div class="image-gallery">
          <div
            v-for="(url, i) in form.imageUrls"
            :key="url"
            class="uploaded-image-card"
            :class="{ dragging: draggingIndex === i }"
          >
            <img :src="toCdnUrl(url)" alt="Product" />
            <button class="remove-image-btn" @click="removeImage(i)">
              <iconify-icon icon="lucide:x" style="font-size: 14px; color: #fff" />
            </button>
            <div class="image-card-overlay">
              <span class="image-chip">{{ i === 0 ? 'Cover' : i + 1 }}</span>
              <button
                class="reorder-handle"
                @pointerdown="onHandlePointerDown($event, i)"
              >
                <iconify-icon icon="lucide:grip-vertical" style="font-size: 16px; color: var(--foreground)" />
              </button>
            </div>
          </div>
          <div v-if="uploading" class="image-upload-card uploading-card">
            <iconify-icon icon="lucide:loader" class="spin-icon" style="font-size: 24px; color: var(--muted-foreground)" />
            <span class="add-photo-label">Uploading...</span>
          </div>
          <button
            v-else-if="form.imageUrls.length < 5"
            class="image-upload-card"
            @click="fileInputRef.click()"
          >
            <iconify-icon icon="lucide:image-plus" style="font-size: 24px; color: var(--muted-foreground)" />
            <span class="add-photo-label">Add Photo</span>
          </button>
        </div>
        <span class="helper-text">Drag images to reorder. First image will be the cover. Up to 5 photos.</span>

        <!-- Product Details -->
        <h2 class="section-title">Product Details</h2>

        <span class="input-label">Product Name</span>
        <input
          class="form-input"
          v-model="form.name"
          placeholder="e.g. Minimalist Ceramic Vase"
          required
        />

        <div class="row-group">
          <div class="col">
            <span class="input-label">Price</span>
            <div class="price-wrapper">
              <span class="price-prefix">$</span>
              <input
                class="form-input price-input"
                v-model.number="form.price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>
          <div class="col">
            <span class="input-label">Stock</span>
            <input
              class="form-input"
              v-model.number="form.stock"
              type="number"
              min="0"
              placeholder="0"
            />
          </div>
        </div>

        <span class="input-label">Description</span>
        <textarea
          class="form-input form-textarea"
          v-model="form.description"
          placeholder="Describe your product..."
          rows="4"
        ></textarea>

        <!-- Category -->
        <h2 class="section-title">Category</h2>
        <div class="settings-list">
          <button class="settings-item" @click="openCategory">
            <div class="settings-item-content">
              <span class="settings-item-label">Category</span>
              <span class="settings-item-value">{{ form.category || 'Not set' }}</span>
            </div>
            <iconify-icon icon="lucide:chevron-right" style="font-size: 20px; color: var(--muted-foreground)" />
          </button>
        </div>

        <!-- Visibility -->
        <h2 class="section-title">Visibility</h2>
        <div class="toggle-row">
          <div class="toggle-info">
            <span class="toggle-title">Publish Product</span>
            <span class="toggle-desc">Make this product visible in your catalog</span>
          </div>
          <button class="toggle-switch" :class="{ active: form.visible }" @click="form.visible = !form.visible">
            <div class="toggle-knob"></div>
          </button>
        </div>

        <p v-if="error" class="form-error">{{ error }}</p>
      </div>
    </main>

    <!-- Category bottom sheet -->
    <div v-if="editingCategory" class="overlay" @click="closeCategory">
      <div class="bottom-sheet" @click.stop>
        <div class="sheet-handle"></div>
        <p class="sheet-title">Category</p>
        <input
          ref="categoryInputRef"
          class="form-input"
          v-model="categoryDraft"
          placeholder="Search or create new..."
        />
        <div v-if="filteredCategories.length" class="category-chips">
          <button
            v-for="cat in filteredCategories"
            :key="cat"
            class="category-chip"
            :class="{ selected: categoryDraft === cat }"
            @click="selectCategory(cat)"
          >{{ cat }}</button>
        </div>
        <button
          v-if="categoryDraft.trim() && !exactCategoryMatch"
          class="create-category-btn"
          @click="selectCategory(categoryDraft.trim())"
        >
          <iconify-icon icon="lucide:plus" style="font-size: 16px" />
          Create "{{ categoryDraft.trim() }}"
        </button>
        <button class="sheet-done-btn" @click="closeCategory">Done</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore'
import { ref as storageRef, uploadBytes } from 'firebase/storage'
import { toCdnUrl } from '../utils/storage.js'
import { compressImage } from '../composables/useImageCompression.js'
import { db, storage } from '../firebase/index.js'
import { useAuthStore } from '../stores/auth.js'
import IconButton from '../components/IconButton.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const storeId = route.params.storeId
const productId = route.params.productId
const isEdit = computed(() => !!productId)

const form = ref({
  name: '',
  price: '',
  stock: '',
  description: '',
  category: '',
  imageUrls: [],
  visible: true,
})

const saving = ref(false)
const error = ref('')
const loadingProduct = ref(isEdit.value)
const uploading = ref(false)
const fileInputRef = ref(null)
const editingCategory = ref(false)
const categoryDraft = ref('')
const categoryInputRef = ref(null)
const existingCategories = ref([])

const draggingIndex = ref(null)
const dragStartX = ref(0)
const DRAG_THRESHOLD = 60

function onHandlePointerDown(event, index) {
  event.preventDefault()
  draggingIndex.value = index
  dragStartX.value = event.clientX
  window.addEventListener('pointermove', onDragPointerMove, { passive: false })
  window.addEventListener('pointerup', onDragPointerUp)
  window.addEventListener('pointercancel', onDragPointerUp)
}

function onDragPointerMove(event) {
  event.preventDefault()
  if (draggingIndex.value === null) return
  const delta = event.clientX - dragStartX.value
  if (Math.abs(delta) < DRAG_THRESHOLD) return
  const direction = delta > 0 ? 1 : -1
  const from = draggingIndex.value
  const to = from + direction
  if (to < 0 || to >= form.value.imageUrls.length) return
  const arr = [...form.value.imageUrls]
  const [item] = arr.splice(from, 1)
  arr.splice(to, 0, item)
  form.value.imageUrls = arr
  draggingIndex.value = to
  dragStartX.value = event.clientX
}

function onDragPointerUp() {
  draggingIndex.value = null
  window.removeEventListener('pointermove', onDragPointerMove)
  window.removeEventListener('pointerup', onDragPointerUp)
  window.removeEventListener('pointercancel', onDragPointerUp)
}

onUnmounted(() => {
  window.removeEventListener('pointermove', onDragPointerMove)
  window.removeEventListener('pointerup', onDragPointerUp)
  window.removeEventListener('pointercancel', onDragPointerUp)
})

onMounted(async () => {
  if (!authStore.user) {
    router.replace({ name: 'store', params: { storeId } })
    return
  }

  const storeSnap = await getDoc(doc(db, 'stores', storeId))
  if (!storeSnap.exists() || storeSnap.data().ownerUid !== authStore.user.uid) {
    router.replace({ name: 'store', params: { storeId } })
    return
  }

  const productsSnap = await getDocs(collection(db, 'stores', storeId, 'products'))
  const cats = new Set()
  productsSnap.forEach((d) => { if (d.data().category) cats.add(d.data().category) })
  existingCategories.value = [...cats].sort()

  if (isEdit.value) {
    const productSnap = await getDoc(doc(db, 'stores', storeId, 'products', productId))
    if (productSnap.exists()) {
      const data = productSnap.data()
      form.value = {
        name: data.name ?? '',
        price: data.price ?? '',
        stock: data.stock ?? '',
        description: data.description ?? '',
        category: data.category ?? '',
        imageUrls: data.imageUrls ?? (data.imageUrl ? [data.imageUrl] : []),
        visible: data.visible !== false,
      }
    }
    loadingProduct.value = false
  }
})

const filteredCategories = computed(() => {
  const q = categoryDraft.value.trim().toLowerCase()
  if (!q) return existingCategories.value
  return existingCategories.value.filter((c) => c.toLowerCase().includes(q))
})

const exactCategoryMatch = computed(() =>
  existingCategories.value.some(
    (c) => c.toLowerCase() === categoryDraft.value.trim().toLowerCase()
  )
)

function openCategory() {
  categoryDraft.value = form.value.category
  editingCategory.value = true
  nextTick(() => categoryInputRef.value?.focus())
}

function closeCategory() {
  editingCategory.value = false
}

function selectCategory(cat) {
  form.value.category = cat
  categoryDraft.value = cat
  editingCategory.value = false
}

function removeImage(index) {
  form.value.imageUrls.splice(index, 1)
}

async function onFileSelected(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (form.value.imageUrls.length >= 5) return
  uploading.value = true
  error.value = ''
  try {
    const compressed = await compressImage(file)
    const path = `stores/${storeId}/products/${Date.now()}.jpg`
    await uploadBytes(storageRef(storage, path), compressed)
    form.value.imageUrls.push(
      `https://storage.googleapis.com/${import.meta.env.VITE_FIREBASE_STORAGE_BUCKET}/${path}`
    )
  } catch (e) {
    error.value = 'Image upload failed. Please try again.'
  } finally {
    uploading.value = false
    event.target.value = ''
  }
}

async function submit() {
  if (!form.value.name.trim()) {
    error.value = 'Product name is required.'
    return
  }
  error.value = ''
  saving.value = true
  try {
    const payload = {
      name: form.value.name.trim(),
      price: Number(form.value.price) || 0,
      stock: Number(form.value.stock) || 0,
      description: form.value.description.trim(),
      category: form.value.category.trim(),
      imageUrls: form.value.imageUrls,
      imageUrl: form.value.imageUrls[0] ?? '',
      visible: form.value.visible,
      updatedAt: serverTimestamp(),
    }

    if (isEdit.value) {
      await setDoc(doc(db, 'stores', storeId, 'products', productId), payload, { merge: true })
    } else {
      payload.createdAt = serverTimestamp()
      await addDoc(collection(db, 'stores', storeId, 'products'), payload)
    }

    router.replace({ name: 'manage-products', params: { storeId } })
  } catch (e) {
    error.value = e.message ?? 'Something went wrong. Please try again.'
  } finally {
    saving.value = false
  }
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
  justify-content: space-between;
  align-items: center;
  background-color: var(--background);
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid var(--border);
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--foreground);
}

.header-save-btn {
  font-size: 15px;
  font-weight: 600;
  color: var(--primary);
  padding: 8px 4px;
  background: none;
  cursor: pointer;
}

.header-save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.content-area {
  flex: 1;
  padding: 24px 20px 48px;
  overflow-y: auto;
  background-color: var(--background);
  display: flex;
  flex-direction: column;
}

.form-body {
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--foreground);
  margin-bottom: 16px;
  margin-top: 28px;
}

.section-title:first-child {
  margin-top: 0;
}

/* Images */
.image-gallery {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: none;
}

.image-gallery::-webkit-scrollbar {
  display: none;
}

.uploaded-image-card {
  min-width: 120px;
  width: 120px;
  height: 120px;
  border-radius: var(--radius-md);
  background-color: var(--muted);
  border: 1px solid var(--border);
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  transition: opacity 0.15s, transform 0.15s;
}

.uploaded-image-card.dragging {
  opacity: 0.7;
  transform: scale(0.96);
}

.image-card-overlay {
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.image-chip {
  background-color: var(--background);
  color: var(--foreground);
  border-radius: 999px;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.reorder-handle {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background-color: var(--background);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: grab;
  touch-action: none;
}

.reorder-handle:active {
  cursor: grabbing;
}

.uploaded-image-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.image-upload-card {
  min-width: 120px;
  width: 120px;
  height: 120px;
  border: 2px dashed var(--border);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background-color: transparent;
  flex-shrink: 0;
  cursor: pointer;
}

.add-photo-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--muted-foreground);
}

.uploading-card {
  cursor: default;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spin-icon {
  animation: spin 1s linear infinite;
}

.helper-text {
  font-size: 12px;
  color: var(--muted-foreground);
  margin-top: 8px;
  margin-bottom: 0;
}

/* Form inputs */
.input-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--foreground);
  margin-bottom: 8px;
  display: block;
  margin-top: 16px;
}

.form-input {
  width: 100%;
  min-height: 48px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  font-size: 15px;
  font-family: var(--font-family-body);
  color: var(--foreground);
  background-color: var(--background);
  outline: none;
  transition: border-color 0.15s;
}

.form-input:focus {
  border-color: var(--primary);
}

.form-input::placeholder {
  color: var(--muted-foreground);
}

.form-textarea {
  min-height: 100px;
  resize: none;
  line-height: 1.5;
  padding-top: 12px;
}

.row-group {
  display: flex;
  gap: 16px;
}

.col {
  flex: 1;
  min-width: 0;
}

.price-wrapper {
  position: relative;
}

.price-prefix {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 15px;
  color: var(--muted-foreground);
  pointer-events: none;
}

.price-input {
  padding-left: 28px;
}

/* Category settings list */
.settings-list {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background-color: var(--background);
}

.settings-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  width: 100%;
  background: none;
  cursor: pointer;
}

.settings-item-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
}

.settings-item-label {
  font-size: 15px;
  font-weight: 500;
  color: var(--foreground);
}

.settings-item-value {
  font-size: 14px;
  color: var(--muted-foreground);
}

/* Visibility toggle */
.toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background-color: var(--background);
}

.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.toggle-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--foreground);
}

.toggle-desc {
  font-size: 13px;
  color: var(--muted-foreground);
}

.toggle-switch {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background-color: var(--muted);
  position: relative;
  flex-shrink: 0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.toggle-switch.active {
  background-color: var(--primary);
}

.toggle-knob {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #fff;
  position: absolute;
  top: 2px;
  left: 2px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;
}

.toggle-switch.active .toggle-knob {
  transform: translateX(20px);
}

.form-error {
  font-size: 14px;
  color: var(--destructive);
  margin-top: 16px;
}

/* Category bottom sheet */
.overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 30;
  display: flex;
  align-items: flex-end;
}

.bottom-sheet {
  width: 100%;
  background-color: var(--background);
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 20px 20px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sheet-handle {
  width: 36px;
  height: 4px;
  border-radius: 999px;
  background-color: var(--border);
  margin: 0 auto -4px;
}

.sheet-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--foreground);
}

.category-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-chip {
  padding: 8px 16px;
  border-radius: var(--radius-xl);
  background-color: var(--muted);
  color: var(--foreground);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background-color 0.1s;
}

.category-chip.selected {
  background-color: var(--secondary);
  color: var(--secondary-foreground);
  border-color: var(--primary);
}

.create-category-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  background-color: var(--muted);
  color: var(--foreground);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
}

.sheet-done-btn {
  height: 52px;
  border-radius: var(--radius-xl);
  background-color: var(--primary);
  color: var(--primary-foreground);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

/* States */
.loading-state {
  padding: 40px 0;
  text-align: center;
  font-size: 14px;
  color: var(--muted-foreground);
}
</style>
