<script setup lang="ts">
defineProps<{
  status: string
  synced: boolean
}>()

const statusConfig = computed(() => {
  return {
    connected: { color: 'rgb(107, 237, 160)', label: 'Connected' },
    connecting: { color: 'rgb(237, 200, 107)', label: 'Connecting...' },
    disconnected: { color: 'rgb(237, 107, 120)', label: 'Disconnected' },
  }
})
</script>

<template>
  <div class="connection-status">
    <span
      class="status-dot"
      :style="{ background: statusConfig[status as keyof typeof statusConfig]?.color ?? 'rgba(234, 237, 243, 0.3)' }"
    />
    <span class="status-label">
      {{ synced && status === 'connected' ? 'Synced' : statusConfig[status as keyof typeof statusConfig]?.label ?? status }}
    </span>
  </div>
</template>

<style scoped>
.connection-status {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: rgba(var(--color-text-base), 0.5);
  flex-shrink: 0;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-label {
  white-space: nowrap;
}
</style>
