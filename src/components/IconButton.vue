<template>
  <button class="icon-button" v-bind="$attrs">
    <iconify-icon :icon="icon" :style="{ fontSize: size + 'px', color: color }" />
  </button>
</template>

<script setup>
defineProps({
  icon: { type: String, required: true },
  size: { type: Number, default: 24 },
  color: { type: String, default: 'var(--foreground)' },
})
</script>

<style scoped>
.icon-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  flex-shrink: 0;
  cursor: pointer;
}
</style>
