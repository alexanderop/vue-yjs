<script setup lang="ts">
useHead({
  title: 'Collaborative Todos',
})
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>Collaborative Todos</h1>
      <p class="subtitle">Real-time collaboration powered by Yjs + vue-yjs</p>
    </header>
    <main>
      <ClientOnly>
        <CollaborationProvider />
        <template #fallback>
          <TodoSkeleton />
        </template>
      </ClientOnly>
    </main>
  </div>
</template>

<style>
:root {
  --color-fill: 33, 39, 55;
  --color-text-base: 234, 237, 243;
  --color-accent: 255, 107, 237;
  --color-card: 52, 63, 96;
  --color-card-muted: 138, 51, 123;
  --color-border: 171, 75, 153;
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, sans-serif;
  background: rgb(var(--color-fill));
  color: rgb(var(--color-text-base));
  min-height: 100vh;
}

.app-container {
  max-width: 640px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.app-header {
  text-align: center;
  margin-bottom: 2rem;
}

.app-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
}

.subtitle {
  font-size: 0.875rem;
  color: rgba(var(--color-text-base), 0.5);
  margin-top: 0.25rem;
}
</style>
