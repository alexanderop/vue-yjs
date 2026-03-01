<script setup lang="ts">
const { isOpen, toggle } = useDevTools()

function handleKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'D') {
    e.preventDefault()
    toggle()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onScopeDispose(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <button
    class="devtools-toggle"
    :aria-expanded="isOpen"
    aria-controls="devtools-panel"
    title="Toggle Yjs DevTools (Ctrl+Shift+D)"
    @click="toggle"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  </button>
</template>

<style scoped>
.devtools-toggle {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 51;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid rgb(var(--color-border));
  background: rgb(var(--color-card));
  color: rgb(var(--color-text-base));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.devtools-toggle:hover {
  background: rgb(var(--color-card-muted));
  border-color: rgb(var(--color-accent));
  transform: scale(1.05);
}

.devtools-toggle[aria-expanded="true"] {
  background: rgb(var(--color-card-muted));
  border-color: rgb(var(--color-accent));
}
</style>
