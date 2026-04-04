<template>
  <Transition name="drawer-overlay-fade">
    <div v-if="open" class="drawer-overlay" @click="$emit('close')" />
  </Transition>
  <Transition name="drawer-slide">
    <div v-if="open" class="drawer-panel">
      <div class="drawer-header">
        <span class="drawer-title">Menu</span>
        <button class="drawer-close" @click="$emit('close')">
          <iconify-icon icon="lucide:x" style="font-size: 20px; color: var(--secondary-foreground)" />
        </button>
      </div>
      <nav class="drawer-nav">
        <button class="drawer-nav-item" @click="$emit('close')">
          <div class="drawer-nav-item-left">
            <iconify-icon icon="lucide:store" style="font-size: 20px; color: var(--muted-foreground)" />
            <span class="drawer-nav-label">Catalog</span>
          </div>
        </button>
        <button class="drawer-nav-item" @click="$emit('go-to-cart')">
          <div class="drawer-nav-item-left">
            <iconify-icon icon="lucide:package" style="font-size: 20px; color: var(--muted-foreground)" />
            <span class="drawer-nav-label">My Orders</span>
          </div>
          <span v-if="hasCartItems" class="drawer-nav-badge">{{ itemCount }} Active</span>
        </button>
        <button class="drawer-nav-item" @click="$emit('contact-seller')">
          <div class="drawer-nav-item-left">
            <iconify-icon icon="lucide:message-circle" style="font-size: 20px; color: var(--muted-foreground)" />
            <span class="drawer-nav-label">Contact Seller</span>
          </div>
        </button>
      </nav>
      <div class="drawer-footer">
        <RouterLink to="/" class="drawer-footer-link" @click="$emit('close')">
          Powered by <span class="drawer-footer-bold">wardi</span>
        </RouterLink>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  open: { type: Boolean, required: true },
  itemCount: { type: Number, default: 0 },
  hasCartItems: { type: Boolean, default: false },
})

defineEmits(['close', 'go-to-cart', 'contact-seller'])
</script>

<style scoped>
.drawer-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 36, 0.45);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  z-index: 40;
}

.drawer-panel {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 290px;
  background-color: var(--background);
  z-index: 41;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 32px rgba(0, 0, 0, 0.12);
  border-top-right-radius: 20px;
  border-bottom-right-radius: 20px;
}

.drawer-header {
  padding: 28px 24px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.drawer-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--foreground);
}

.drawer-close {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: var(--secondary);
  cursor: pointer;
}

.drawer-nav {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.drawer-nav-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  background: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
}

.drawer-nav-item:hover {
  background-color: var(--secondary);
}

.drawer-nav-item-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.drawer-nav-label {
  font-size: 16px;
  font-weight: 500;
  color: var(--foreground);
}

.drawer-nav-badge {
  background-color: var(--primary);
  color: var(--primary-foreground);
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
}

.drawer-footer {
  padding: 24px;
  border-top: 1px solid var(--border);
}

.drawer-footer-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 500;
  color: var(--muted-foreground);
  text-decoration: none;
}

.drawer-footer-bold {
  color: var(--foreground);
  font-weight: 600;
}

/* Drawer transitions */
.drawer-overlay-fade-enter-active,
.drawer-overlay-fade-leave-active {
  transition: opacity 0.25s ease;
}
.drawer-overlay-fade-enter-from,
.drawer-overlay-fade-leave-to {
  opacity: 0;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.25s ease;
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(-100%);
}
</style>
