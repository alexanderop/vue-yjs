<script setup lang="ts">
import { formatTime } from '~/utils/format'

const props = defineProps<{
  awarenessStates: Map<number, AwarenessState>
  localClientId: number
}>()

interface AwarenessEvent {
  id: number
  type: 'joined' | 'left'
  clientId: number
  timestamp: number
}

const events = shallowRef<AwarenessEvent[]>([])
let nextEventId = 0
let previousClientIds = new Set<number>()

// Track join/leave events
watch(
  () => props.awarenessStates,
  (states) => {
    const currentIds = new Set(states.keys())
    const newEvents: AwarenessEvent[] = []
    const now = Date.now()

    for (const id of currentIds) {
      if (!previousClientIds.has(id)) {
        newEvents.push({ id: nextEventId++, type: 'joined', clientId: id, timestamp: now })
      }
    }

    for (const id of previousClientIds) {
      if (!currentIds.has(id)) {
        newEvents.push({ id: nextEventId++, type: 'left', clientId: id, timestamp: now })
      }
    }

    if (newEvents.length > 0) {
      const updated = [...events.value, ...newEvents]
      events.value = updated.slice(-50) // keep last 50 events
    }

    previousClientIds = currentIds
  },
  { deep: false },
)

const clients = computed(() => {
  const result: Array<{
    clientId: number
    name: string
    color: string
    isLocal: boolean
  }> = []

  for (const [clientId, state] of props.awarenessStates) {
    result.push({
      clientId,
      name: state.name || `Client ${clientId}`,
      color: state.color || 'rgb(160, 160, 160)',
      isLocal: clientId === props.localClientId,
    })
  }

  // Sort: local client first, then by clientId
  return result.toSorted((a, b) => {
    if (a.isLocal) return -1
    if (b.isLocal) return 1
    return a.clientId - b.clientId
  })
})

</script>

<template>
  <div class="awareness-tab">
    <div class="section-header">
      Connected Clients ({{ clients.length }})
    </div>

    <div v-if="clients.length === 0" class="empty">
      No clients connected.
    </div>

    <div v-else class="client-list">
      <div
        v-for="client in clients"
        :key="client.clientId"
        class="client-row"
      >
        <span
          class="color-dot"
          :style="{ background: client.color }"
        />
        <span class="client-name">{{ client.name }}</span>
        <span v-if="client.isLocal" class="you-badge">you</span>
        <span class="client-id">{{ client.clientId }}</span>
      </div>
    </div>

    <div class="section-header event-header">
      Activity Log
    </div>

    <div v-if="events.length === 0" class="empty">
      No join/leave events yet.
    </div>

    <div v-else class="event-list">
      <div
        v-for="event in [...events].reverse()"
        :key="event.id"
        :class="['event-row', event.type]"
      >
        <span class="event-time">{{ formatTime(event.timestamp) }}</span>
        <span :class="['event-type', event.type]">
          {{ event.type === 'joined' ? '→' : '←' }}
        </span>
        <span>Client {{ event.clientId }} {{ event.type }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.awareness-tab {
  padding: 0.5rem 0;
}

.section-header {
  padding: 0.35rem 0.75rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: rgba(var(--color-text-base), 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.event-header {
  margin-top: 0.75rem;
  border-top: 1px solid rgba(var(--color-border), 0.3);
  padding-top: 0.75rem;
}

.empty {
  text-align: center;
  color: rgba(var(--color-text-base), 0.3);
  padding: 1rem 0.5rem;
  font-size: 0.75rem;
}

.client-list {
  padding: 0 0.5rem;
}

.client-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  border-radius: 4px;
}

.client-row:hover {
  background: rgba(var(--color-text-base), 0.05);
}

.color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.client-name {
  font-size: 0.8rem;
  color: rgb(var(--color-text-base));
}

.you-badge {
  font-size: 0.5625rem;
  padding: 0 5px;
  border-radius: 3px;
  background: rgba(var(--color-accent), 0.2);
  color: rgb(var(--color-accent));
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.client-id {
  font-size: 0.6875rem;
  color: rgba(var(--color-text-base), 0.3);
  font-family: 'SF Mono', Monaco, Menlo, monospace;
  margin-left: auto;
}

.event-list {
  padding: 0 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}

.event-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.2rem 0.5rem;
  font-size: 0.6875rem;
  color: rgba(var(--color-text-base), 0.5);
}

.event-time {
  color: rgba(var(--color-text-base), 0.3);
  font-family: 'SF Mono', Monaco, Menlo, monospace;
  font-size: 0.625rem;
}

.event-type.joined {
  color: rgb(74, 222, 128);
}

.event-type.left {
  color: rgb(248, 113, 113);
}
</style>
