<script setup lang="ts">
import type { WebSocketProviderStatus } from 'vue-yjs'
import type * as Y from 'yjs'

const props = defineProps<{
  status: WebSocketProviderStatus
  synced: boolean
  doc: Y.Doc
}>()

const statusColor = computed(() => {
  switch (props.status) {
    case 'connected': return 'var(--status-connected)'
    case 'connecting': return 'var(--status-connecting)'
    case 'disconnected': return 'var(--status-disconnected)'
    default: return 'var(--status-disconnected)'
  }
})

const statusLabel = computed(() => {
  switch (props.status) {
    case 'connected': return props.synced ? 'Connected & Synced' : 'Connected'
    case 'connecting': return 'Connecting...'
    case 'disconnected': return 'Disconnected'
    default: return 'Unknown'
  }
})
</script>

<template>
  <div class="status-bar">
    <div class="status-item">
      <span class="status-dot" :style="{ background: statusColor }" />
      <span>{{ statusLabel }}</span>
    </div>
    <div class="status-item">
      <span class="label">Client:</span>
      <span class="mono">{{ props.doc.clientID }}</span>
    </div>
  </div>
</template>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 1rem;
  border-top: 1px solid rgb(var(--color-border));
  font-size: 0.6875rem;
  color: rgba(var(--color-text-base), 0.6);
  flex-shrink: 0;
  flex-wrap: wrap;

  --status-connected: rgb(34, 197, 94);
  --status-connecting: rgb(250, 204, 21);
  --status-disconnected: rgb(239, 68, 68);
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.label {
  color: rgba(var(--color-text-base), 0.4);
}

.mono {
  font-family: 'SF Mono', Monaco, Menlo, monospace;
}
</style>
