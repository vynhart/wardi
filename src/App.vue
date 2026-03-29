<template>
  <div class="app-shell">
    <RouterView />
  </div>
</template>

<style>
.app-shell {
  width: 100%;
  max-width: 430px;
  min-height: 100dvh;
  margin: 0 auto;
  position: relative;
  box-shadow: 0 0 0 1px var(--border);
}
</style>
