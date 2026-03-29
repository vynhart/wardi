<template>
  <div class="page">
    <nav class="header">
      <span class="header-title">Setup</span>
    </nav>

    <main class="content-area">
      <div class="illustration-container">
        <iconify-icon icon="lucide:store" style="font-size: 64px; color: var(--secondary-foreground)" />
      </div>

      <div class="welcome-section">
        <h1 class="welcome-title">Create your store</h1>
        <p class="welcome-subtitle">Give your store a name and a short description to get started.</p>
      </div>

      <div class="form-group">
        <label class="form-label">Store Name</label>
        <input
          class="form-input"
          v-model="form.name"
          placeholder="e.g. My Awesome Boutique"
          @input="onNameInput"
        />
        <div class="slug-preview" :class="{ 'slug-preview--error': slugError }">
          <span class="slug-host">{{ host }}/</span>
          <input
            class="slug-input"
            v-model="form.slug"
            placeholder="my-store"
            @input="onSlugInput"
            @blur="normalizeSlug"
          />
          <span v-if="slugChecking" class="slug-status">
            <iconify-icon icon="lucide:loader-circle" style="font-size: 14px; color: var(--muted-foreground); animation: spin 1s linear infinite" />
          </span>
          <span v-else-if="slugError" class="slug-status">
            <iconify-icon icon="lucide:x-circle" style="font-size: 14px; color: var(--destructive)" />
          </span>
          <span v-else-if="slugEdited && form.slug" class="slug-status">
            <iconify-icon icon="lucide:check-circle" style="font-size: 14px; color: var(--success)" />
          </span>
        </div>
        <p v-if="slugError" class="slug-error">{{ slugError }}</p>
      </div>

      <div class="form-group">
        <label class="form-label">
          Description
          <span class="optional-label">(Optional)</span>
        </label>
        <textarea
          class="form-textarea"
          v-model="form.description"
          placeholder="Tell your customers what you sell..."
          rows="4"
        ></textarea>
      </div>

      <p v-if="error" class="form-error">{{ error }}</p>

      <div class="bottom-actions">
        <button class="primary-cta" :disabled="saving" @click="createStore">
          {{ saving ? 'Creating...' : 'Create Store' }}
        </button>

        <div class="brand-footer">
          <span class="brand-footer-text">Powered by <span class="brand-name">wardi</span></span>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase/index.js'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()

const host = window.location.host
const form = ref({ name: '', slug: '', description: '' })
const slugEdited = ref(false)
const slugChecking = ref(false)
const slugError = ref('')
const saving = ref(false)
const error = ref('')

let slugCheckTimer = null

function toSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function onNameInput() {
  if (!slugEdited.value) {
    form.value.slug = toSlug(form.value.name)
  }
}

function normalizeSlug() {
  form.value.slug = toSlug(form.value.slug)
}

function onSlugInput() {
  slugEdited.value = true
  slugError.value = ''
  slugChecking.value = false
  clearTimeout(slugCheckTimer)

  const slug = toSlug(form.value.slug)
  if (!slug) return

  slugChecking.value = true
  slugCheckTimer = setTimeout(async () => {
    try {
      const snap = await getDoc(doc(db, 'stores', slug))
      if (snap.exists()) {
        slugError.value = 'This URL is already taken.'
      }
    } finally {
      slugChecking.value = false
    }
  }, 600)
}

async function findAvailableSlug(base) {
  const snap = await getDoc(doc(db, 'stores', base))
  if (!snap.exists()) return base
  for (let i = 2; i <= 99; i++) {
    const candidate = `${base}-${i}`
    const s = await getDoc(doc(db, 'stores', candidate))
    if (!s.exists()) return candidate
  }
  return null
}

async function createStore() {
  const name = form.value.name.trim()
  const baseSlug = toSlug(form.value.slug)

  if (!name) {
    error.value = 'Store name is required.'
    return
  }
  if (!baseSlug) {
    error.value = 'Store URL is required.'
    return
  }
  if (slugError.value) return

  error.value = ''
  saving.value = true
  try {
    let slug
    if (slugEdited.value) {
      // User chose a specific slug — check once and error if taken
      const snap = await getDoc(doc(db, 'stores', baseSlug))
      if (snap.exists()) {
        slugError.value = 'This URL is already taken.'
        return
      }
      slug = baseSlug
    } else {
      // Auto-generated — silently find the next available slug
      slug = await findAvailableSlug(baseSlug)
      if (!slug) {
        error.value = 'Could not generate a unique URL. Please enter one manually.'
        return
      }
      form.value.slug = slug
    }

    await setDoc(doc(db, 'stores', slug), {
      name,
      slug,
      description: form.value.description.trim(),
      ownerUid: authStore.user.uid,
    })

    router.replace({ name: 'store', params: { storeId: slug } })
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
  padding: 22px 20px 18px;
  display: flex;
  justify-content: center;
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

.content-area {
  flex: 1;
  padding: 24px 20px 40px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.illustration-container {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-lg);
  background-color: var(--secondary);
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-section {
  margin-bottom: 32px;
  text-align: center;
}

.welcome-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--foreground);
  margin-bottom: 8px;
}

.welcome-subtitle {
  font-size: 15px;
  color: var(--muted-foreground);
  line-height: 1.5;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--foreground);
}

.optional-label {
  font-weight: 400;
  color: var(--muted-foreground);
}

.form-input {
  height: 48px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0 16px;
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

/* Slug preview row */
.slug-preview {
  display: flex;
  align-items: center;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--background);
  transition: border-color 0.15s;
}

.slug-preview:focus-within {
  border-color: var(--primary);
}

.slug-preview--error {
  border-color: var(--destructive);
}

.slug-status {
  padding-right: 10px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.slug-error {
  font-size: 12px;
  color: var(--destructive);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.slug-host {
  padding: 0 0 0 12px;
  font-size: 13px;
  color: var(--muted-foreground);
  white-space: nowrap;
  flex-shrink: 0;
  line-height: 40px;
}

.slug-input {
  flex: 1;
  height: 100%;
  border: none;
  outline: none;
  font-size: 13px;
  font-family: var(--font-family-body);
  color: var(--foreground);
  background: transparent;
  padding: 0 12px 0 0;
  min-width: 0;
}

.slug-input::placeholder {
  color: var(--muted-foreground);
}

.form-textarea {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  font-size: 15px;
  font-family: var(--font-family-body);
  color: var(--foreground);
  background-color: var(--background);
  outline: none;
  resize: none;
  line-height: 1.5;
  transition: border-color 0.15s;
}

.form-textarea:focus {
  border-color: var(--primary);
}

.form-textarea::placeholder {
  color: var(--muted-foreground);
}

.form-error {
  font-size: 14px;
  color: var(--destructive);
  margin-bottom: 8px;
}

.bottom-actions {
  margin-top: auto;
  padding-top: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.primary-cta {
  height: 52px;
  border-radius: var(--radius-xl);
  background-color: var(--primary);
  color: var(--primary-foreground);
  font-size: 16px;
  font-weight: 600;
  font-family: var(--font-family-body);
  cursor: pointer;
  width: 100%;
  transition: opacity 0.15s;
}

.primary-cta:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.brand-footer {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}

.brand-footer-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--muted-foreground);
}

.brand-name {
  color: var(--foreground);
  font-weight: 600;
}
</style>
