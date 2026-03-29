<template>
  <div class="page">
    <!-- Header -->
    <nav class="header">
      <IconButton icon="lucide:arrow-left" @click="router.back()" />
      <span class="header-title">{{ isEdit ? 'Edit product' : 'Add product' }}</span>
      <div style="width: 40px"></div>
    </nav>

    <main class="content-area">
      <div v-if="loadingProduct" class="loading-state">Loading...</div>
      <form v-else @submit.prevent="submit" class="form">
        <!-- Image preview -->
        <div class="image-preview-wrapper">
          <img v-if="form.imageUrl" class="image-preview" :src="form.imageUrl" alt="Product" />
          <div v-else class="image-placeholder">
            <iconify-icon icon="lucide:image" style="font-size: 32px; color: var(--muted-foreground)" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Product name</label>
          <input
            class="form-input"
            v-model="form.name"
            placeholder="e.g. Ceramic Vase"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">Price (USD)</label>
          <input
            class="form-input"
            v-model.number="form.price"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">Category</label>
          <input
            class="form-input"
            v-model="form.category"
            placeholder="e.g. Decor"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Stock</label>
          <input
            class="form-input"
            v-model.number="form.stock"
            type="number"
            min="0"
            placeholder="0"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Image URL</label>
          <input
            class="form-input"
            v-model="form.imageUrl"
            type="url"
            placeholder="https://..."
          />
        </div>

        <p v-if="error" class="form-error">{{ error }}</p>

        <button type="submit" class="submit-btn" :disabled="saving">
          {{ saving ? 'Saving...' : isEdit ? 'Save changes' : 'Add product' }}
        </button>
      </form>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  doc,
  getDoc,
  addDoc,
  setDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/index.js'
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
  category: '',
  stock: '',
  imageUrl: '',
})

const saving = ref(false)
const error = ref('')
const loadingProduct = ref(isEdit.value)

onMounted(async () => {
  // Guard: must be authenticated
  if (!authStore.user) {
    router.replace({ name: 'store', params: { storeId } })
    return
  }

  // Guard: must own the store
  const storeSnap = await getDoc(doc(db, 'stores', storeId))
  if (!storeSnap.exists() || storeSnap.data().ownerUid !== authStore.user.uid) {
    router.replace({ name: 'store', params: { storeId } })
    return
  }

  if (isEdit.value) {
    const productSnap = await getDoc(doc(db, 'stores', storeId, 'products', productId))
    if (productSnap.exists()) {
      const data = productSnap.data()
      form.value = {
        name: data.name ?? '',
        price: data.price ?? '',
        category: data.category ?? '',
        stock: data.stock ?? '',
        imageUrl: data.imageUrl ?? '',
      }
    }
    loadingProduct.value = false
  }
})

async function submit() {
  error.value = ''
  saving.value = true
  try {
    const payload = {
      name: form.value.name.trim(),
      price: Number(form.value.price),
      category: form.value.category.trim(),
      stock: Number(form.value.stock),
      imageUrl: form.value.imageUrl.trim(),
      updatedAt: serverTimestamp(),
    }

    if (isEdit.value) {
      await setDoc(doc(db, 'stores', storeId, 'products', productId), payload, { merge: true })
    } else {
      payload.createdAt = serverTimestamp()
      await addDoc(collection(db, 'stores', storeId, 'products'), payload)
    }

    router.replace({ name: 'store', params: { storeId } })
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
  padding: 24px 20px 40px;
  overflow-y: auto;
}

/* Image preview */
.image-preview-wrapper {
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-lg);
  background-color: var(--secondary);
  overflow: hidden;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Form */
.form {
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
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--border);
  background-color: var(--input);
  font-size: 15px;
  font-family: var(--font-family-body);
  color: var(--foreground);
  outline: none;
  transition: border-color 0.15s;
}

.form-input:focus {
  border-color: var(--primary);
}

.form-input::placeholder {
  color: var(--muted-foreground);
}

.form-error {
  font-size: 14px;
  color: var(--destructive);
}

.submit-btn {
  height: 56px;
  border-radius: var(--radius-xl);
  background-color: var(--primary);
  color: var(--primary-foreground);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 4px;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-state {
  padding: 40px 0;
  text-align: center;
  font-size: 14px;
  color: var(--muted-foreground);
}
</style>
