<template>
  <div class="skeleton-container">
    <div class="skeleton-toolbar">
      <div class="skeleton-pill" />
      <div class="skeleton-pill short" />
    </div>
    <div class="skeleton-input" />
    <div v-for="i in 3" :key="i" class="skeleton-item">
      <div class="skeleton-checkbox" />
      <div class="skeleton-text" :style="{ width: `${50 + i * 15}%` }" />
    </div>
  </div>
</template>

<style scoped>
.skeleton-container {
  background: rgb(var(--color-card));
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 1.5rem;
}

.skeleton-toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.skeleton-pill {
  width: 120px;
  height: 20px;
  background: rgba(var(--color-border), 0.3);
  border-radius: 10px;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-pill.short {
  width: 70px;
}

.skeleton-input {
  height: 40px;
  background: rgba(var(--color-fill), 0.5);
  border-radius: 8px;
  margin-bottom: 1rem;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.5rem;
}

.skeleton-checkbox {
  width: 18px;
  height: 18px;
  background: rgba(var(--color-border), 0.3);
  border-radius: 4px;
  flex-shrink: 0;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-text {
  height: 16px;
  background: rgba(var(--color-border), 0.3);
  border-radius: 4px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
