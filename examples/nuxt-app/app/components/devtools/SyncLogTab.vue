<script setup lang="ts">
import type { useMessageLog, OuterMessageType } from '~/composables/useMessageLog'
import { formatTimeMs, formatBytes } from '~/utils/format'

const props = defineProps<{
  messageLog: ReturnType<typeof useMessageLog>
}>()

const filters = shallowRef({
  sync: true,
  awareness: true,
  auth: true,
  queryAwareness: true,
  unknown: true,
})

const autoScroll = shallowRef(true)
const scrollContainer = shallowRef<HTMLElement | null>(null)

const filteredEntries = computed(() => {
  return props.messageLog.entries.value.filter(e => filters.value[e.outerType])
})

function toggleFilter(key: OuterMessageType) {
  filters.value = { ...filters.value, [key]: !filters.value[key] }
}

const filterOptions: { key: OuterMessageType; label: string }[] = [
  { key: 'sync', label: 'Sync' },
  { key: 'awareness', label: 'Awareness' },
  { key: 'auth', label: 'Auth' },
  { key: 'queryAwareness', label: 'Query' },
]

// Auto-scroll when new entries appear
watch(
  () => props.messageLog.entries.value.length,
  () => {
    if (autoScroll.value && scrollContainer.value) {
      nextTick(() => {
        scrollContainer.value!.scrollTop = scrollContainer.value!.scrollHeight
      })
    }
  },
)

function handleScroll() {
  if (!scrollContainer.value) return
  const { scrollTop, scrollHeight, clientHeight } = scrollContainer.value
  autoScroll.value = scrollHeight - scrollTop - clientHeight < 40
}
</script>

<template>
  <div class="sync-log-tab">
    <div class="log-header">
      <div class="stats">
        <span>{{ props.messageLog.entries.value.length }} messages</span>
        <span class="separator">&middot;</span>
        <span>{{ formatBytes(props.messageLog.totalBytes.value) }} total</span>
      </div>
      <button class="clear-btn" @click="props.messageLog.clear()">
        Clear
      </button>
    </div>

    <div class="filters">
      <label v-for="opt in filterOptions" :key="opt.key" class="filter-label">
        <input type="checkbox" :checked="filters[opt.key]" @change="toggleFilter(opt.key)">
        {{ opt.label }}
      </label>
    </div>

    <div
      ref="scrollContainer"
      class="log-list"
      @scroll="handleScroll"
    >
      <div v-if="filteredEntries.length === 0" class="empty">
        No messages yet.
      </div>
      <devtools-SyncLogEntry
        v-for="entry in filteredEntries"
        :key="entry.id"
        :entry="entry"
        :format-time="formatTimeMs"
        :format-bytes="formatBytes"
      />
    </div>
  </div>
</template>

<style scoped>
.sync-log-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid rgba(var(--color-border), 0.5);
  flex-shrink: 0;
}

.stats {
  font-size: 0.6875rem;
  color: rgba(var(--color-text-base), 0.5);
}

.separator {
  margin: 0 0.35rem;
}

.clear-btn {
  font-size: 0.6875rem;
  padding: 0.15rem 0.5rem;
  border: 1px solid rgba(var(--color-border), 0.5);
  border-radius: 4px;
  background: transparent;
  color: rgba(var(--color-text-base), 0.6);
  cursor: pointer;
}

.clear-btn:hover {
  background: rgba(var(--color-text-base), 0.08);
  color: rgb(var(--color-text-base));
}

.filters {
  display: flex;
  gap: 0.75rem;
  padding: 0.35rem 0.75rem;
  border-bottom: 1px solid rgba(var(--color-border), 0.3);
  flex-shrink: 0;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6875rem;
  color: rgba(var(--color-text-base), 0.6);
  cursor: pointer;
}

.filter-label input {
  accent-color: rgb(var(--color-accent));
}

.log-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.empty {
  text-align: center;
  color: rgba(var(--color-text-base), 0.4);
  padding: 2rem 0.5rem;
  font-size: 0.8rem;
}
</style>
