<template>
  <div class="qty-control">
    <button class="qty-btn" @click="$emit('decrease')">
      <iconify-icon icon="lucide:minus" style="font-size: 14px; color: var(--foreground)" />
    </button>
    <span class="qty-value">{{ qty }}</span>
    <button class="qty-btn" @click="$emit('increase')">
      <iconify-icon icon="lucide:plus" style="font-size: 14px; color: var(--foreground)" />
    </button>
  </div>
</template>

<script setup>
defineProps({
  qty: { type: Number, required: true },
})
defineEmits(['increase', 'decrease'])
</script>

<style scoped>
.qty-control {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: var(--secondary);
  border-radius: var(--radius-xl);
  padding: 4px 6px;
}

.qty-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: var(--background);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  flex-shrink: 0;
}

.qty-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--foreground);
  min-width: 16px;
  text-align: center;
}
</style>
