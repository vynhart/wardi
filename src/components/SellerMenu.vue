<template>
  <div class="overlay" @click="$emit('close')">
    <div class="seller-menu" @click.stop>
      <p class="seller-menu-hint">Seller</p>
      <button class="seller-menu-btn" @click="$emit('dashboard')">
        <iconify-icon icon="lucide:layout-grid" style="font-size: 18px" />
        Seller Dashboard
      </button>
      <button class="seller-menu-btn seller-menu-btn--danger" @click="$emit('sign-out')">
        <iconify-icon icon="lucide:log-out" style="font-size: 18px" />
        Sign out
      </button>
    </div>
  </div>
</template>

<script setup>
defineEmits(['close', 'dashboard', 'sign-out'])
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 30;
  display: flex;
  align-items: flex-end;
}

.seller-menu {
  width: 100%;
  background-color: var(--background);
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 20px 20px 36px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.seller-menu-hint {
  font-size: 13px;
  color: var(--muted-foreground);
  margin-bottom: 4px;
}

.seller-menu-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  border-radius: var(--radius-lg);
  background-color: var(--secondary);
  color: var(--foreground);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

.seller-menu-btn--danger {
  background-color: transparent;
  color: var(--destructive);
}
</style>
