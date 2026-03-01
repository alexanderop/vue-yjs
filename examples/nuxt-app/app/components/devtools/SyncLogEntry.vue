<script setup lang="ts">
import type { LogEntry } from '~/composables/useMessageLog'

const props = defineProps<{
  entry: LogEntry
  formatTime: (ts: number) => string
  formatBytes: (b: number) => string
}>()

const typeLabel = computed(() => {
  if (props.entry.outerType === 'sync' && props.entry.syncSubType) {
    return props.entry.syncSubType
  }
  return props.entry.outerType
})

const typeClass = computed(() => {
  const classMap: Record<string, string> = {
    'sync': 'pill-sync',
    'awareness': 'pill-awareness',
    'auth': 'pill-auth',
    'queryAwareness': 'pill-query',
    'unknown': 'pill-unknown',
  }
  return classMap[props.entry.outerType] ?? 'pill-unknown'
})
</script>

<template>
  <div class="log-entry">
    <span class="timestamp">{{ props.formatTime(entry.timestamp) }}</span>
    <span :class="['type-pill', typeClass]">{{ typeLabel }}</span>
    <span :class="['direction', entry.direction === 'out' ? 'dir-out' : 'dir-in']">
      {{ entry.direction === 'out' ? '↑' : '↓' }}
    </span>
    <span class="bytes">{{ props.formatBytes(entry.bytes) }}</span>
  </div>
</template>

<style scoped>
.log-entry {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.2rem 0.75rem;
  font-family: 'SF Mono', Monaco, Menlo, monospace;
  font-size: 0.6875rem;
  border-bottom: 1px solid rgba(var(--color-border), 0.15);
}

.log-entry:hover {
  background: rgba(var(--color-text-base), 0.03);
}

.timestamp {
  color: rgba(var(--color-text-base), 0.35);
  flex-shrink: 0;
  font-size: 0.625rem;
}

.type-pill {
  font-size: 0.5625rem;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  flex-shrink: 0;
  min-width: 64px;
  text-align: center;
}

.pill-sync {
  background: rgba(59, 130, 246, 0.2);
  color: rgb(147, 197, 253);
}

.pill-awareness {
  background: rgba(168, 85, 247, 0.2);
  color: rgb(196, 148, 255);
}

.pill-auth {
  background: rgba(245, 158, 11, 0.2);
  color: rgb(252, 211, 77);
}

.pill-query {
  background: rgba(16, 185, 129, 0.2);
  color: rgb(110, 231, 183);
}

.pill-unknown {
  background: rgba(var(--color-text-base), 0.1);
  color: rgba(var(--color-text-base), 0.5);
}

.direction {
  font-size: 0.875rem;
  flex-shrink: 0;
  width: 16px;
  text-align: center;
}

.dir-out {
  color: rgb(96, 165, 250);
}

.dir-in {
  color: rgb(74, 222, 128);
}

.bytes {
  color: rgba(var(--color-text-base), 0.4);
  margin-left: auto;
  flex-shrink: 0;
}
</style>
