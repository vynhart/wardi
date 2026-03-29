<template>
  <div class="page">
    <div class="hero">
      <h1 class="brand">wardi</h1>
      <p class="tagline">Your store, on WhatsApp.</p>
    </div>
  </div>
</template>

<style scoped>
.page {
  width: 100%;
  min-height: 100dvh;
  background-color: var(--background);
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero {
  text-align: center;
  padding: 40px 24px;
}

.brand {
  font-size: 48px;
  font-weight: 700;
  color: var(--foreground);
  margin: 0 0 12px;
}

.tagline {
  font-size: 18px;
  color: var(--muted-foreground);
  margin: 0;
}
</style>
