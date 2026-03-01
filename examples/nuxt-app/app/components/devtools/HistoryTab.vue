<script setup lang="ts">
import type { TransactionEntry, useTransactionLog } from '~/composables/useTransactionLog'
import type { useDocMetrics } from '~/composables/useDocMetrics'
import type { DeepReadonly } from 'vue'
import { formatTimeMs, formatBytes } from '~/utils/format'

type FilterMode = 'all' | 'local' | 'remote'

const props = defineProps<{
  transactionLog: ReturnType<typeof useTransactionLog>
  docMetrics: ReturnType<typeof useDocMetrics>
}>()

const filter = shallowRef<FilterMode>('all')
const expandedId = shallowRef<number | null>(null)
const autoScroll = shallowRef(true)
const scrollContainer = shallowRef<HTMLElement | null>(null)

const filteredEntries = computed(() => {
  if (filter.value === 'all') return props.transactionLog.entries.value
  const isLocal = filter.value === 'local'
  return props.transactionLog.entries.value.filter(e => e.local === isLocal)
})

function toggleExpand(id: number) {
  expandedId.value = expandedId.value === id ? null : id
}

function setFilter(mode: FilterMode) {
  filter.value = mode
}

// Auto-scroll when new entries appear
watch(
  () => props.transactionLog.entries.value,
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

function formatOps(entry: DeepReadonly<TransactionEntry>): string {
  const parts: string[] = []
  if (entry.opsCount > 0) parts.push(`+${entry.opsCount}`)
  if (entry.deleteCount > 0) parts.push(`-${entry.deleteCount}`)
  return parts.join(' ') || '0'
}

function typesSummary(entry: DeepReadonly<TransactionEntry>): string {
  return entry.changedTypes.map(t => t.typeName).join(', ') || '(none)'
}
</script>

<template>
  <div class="history-tab">
    <!-- Metrics bar -->
    <div class="metrics-bar">
      <div class="metric">
        <span class="metric-label">Size</span>
        <span class="metric-value">{{ formatBytes(props.docMetrics.metrics.value.docSizeBytes) }}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Live</span>
        <span class="metric-value">{{ props.docMetrics.metrics.value.liveItems }}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Deleted</span>
        <span class="metric-value metric-deleted">{{ props.docMetrics.metrics.value.deletedItems }}</span>
      </div>
      <div class="metric">
        <span class="metric-label">GC</span>
        <span class="metric-value">{{ props.docMetrics.metrics.value.gcItems }}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Clients</span>
        <span class="metric-value">{{ props.docMetrics.metrics.value.clientCount }}</span>
      </div>
    </div>

    <!-- Header with count, filters, and clear -->
    <div class="log-header">
      <div class="stats">
        <span>{{ filteredEntries.length }} transactions</span>
      </div>
      <div class="filter-group">
        <button
          :class="['filter-btn', { active: filter === 'all' }]"
          @click="setFilter('all')"
        >
          All
        </button>
        <button
          :class="['filter-btn', { active: filter === 'local' }]"
          @click="setFilter('local')"
        >
          Local
        </button>
        <button
          :class="['filter-btn', { active: filter === 'remote' }]"
          @click="setFilter('remote')"
        >
          Remote
        </button>
      </div>
      <button class="clear-btn" @click="props.transactionLog.clear()">
        Clear
      </button>
    </div>

    <!-- Entry list -->
    <div
      ref="scrollContainer"
      class="entry-list"
      @scroll="handleScroll"
    >
      <div v-if="filteredEntries.length === 0" class="empty">
        No transactions yet.
      </div>
      <div
        v-for="entry in filteredEntries"
        :key="entry.id"
        :class="['entry', { expanded: expandedId === entry.id }]"
      >
        <button class="entry-row" @click="toggleExpand(entry.id)">
          <span class="expand-icon">{{ expandedId === entry.id ? '▼' : '▶' }}</span>
          <span class="timestamp">{{ formatTimeMs(entry.timestamp) }}</span>
          <span :class="['origin-pill', entry.local ? 'pill-local' : 'pill-remote']">
            {{ entry.local ? 'local' : 'remote' }}
          </span>
          <span class="types-summary">{{ typesSummary(entry) }}</span>
          <span class="ops-count">{{ formatOps(entry) }}</span>
        </button>

        <!-- Expanded detail -->
        <div v-if="expandedId === entry.id" class="entry-detail">
          <div v-if="entry.changedTypes.length > 0" class="detail-section">
            <div class="detail-title">Changed Types</div>
            <div v-for="ct in entry.changedTypes" :key="ct.typeName" class="changed-type">
              <span class="type-name">{{ ct.typeName }}</span>
              <span v-if="ct.changedKeys.length > 0" class="changed-keys">{{ ct.changedKeys.join(', ') }}</span>
            </div>
          </div>
          <div class="detail-section">
            <div class="detail-title">Origin</div>
            <div class="detail-value">{{ entry.originLabel }}</div>
          </div>
          <div class="detail-section">
            <div class="detail-title">Ops: {{ entry.opsCount }} &middot; Deletes: {{ entry.deleteCount }}</div>
          </div>
          <div v-if="entry.stateVectorAfter.length > 0" class="detail-section">
            <div class="detail-title">State Vector</div>
            <div v-for="[clientId, clock] in entry.stateVectorAfter" :key="clientId" class="sv-row">
              <span class="sv-client">{{ clientId }}</span>
              <span class="sv-clock">{{ clock }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.metrics-bar {
  display: flex;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid rgba(var(--color-border), 0.5);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
}

.metric-label {
  font-size: 0.5625rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(var(--color-text-base), 0.4);
}

.metric-value {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(var(--color-text-base), 0.8);
  font-family: 'SF Mono', Monaco, Menlo, monospace;
}

.metric-deleted {
  color: rgb(248, 113, 113);
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid rgba(var(--color-border), 0.5);
  flex-shrink: 0;
  gap: 0.5rem;
}

.stats {
  font-size: 0.6875rem;
  color: rgba(var(--color-text-base), 0.5);
  flex-shrink: 0;
}

.filter-group {
  display: flex;
  gap: 2px;
  background: rgba(var(--color-text-base), 0.05);
  border-radius: 4px;
  padding: 2px;
}

.filter-btn {
  font-size: 0.625rem;
  padding: 0.15rem 0.5rem;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: rgba(var(--color-text-base), 0.5);
  cursor: pointer;
  font-weight: 500;
}

.filter-btn:hover {
  color: rgba(var(--color-text-base), 0.8);
}

.filter-btn.active {
  background: rgba(var(--color-accent), 0.2);
  color: rgb(var(--color-accent));
}

.clear-btn {
  font-size: 0.6875rem;
  padding: 0.15rem 0.5rem;
  border: 1px solid rgba(var(--color-border), 0.5);
  border-radius: 4px;
  background: transparent;
  color: rgba(var(--color-text-base), 0.6);
  cursor: pointer;
  flex-shrink: 0;
}

.clear-btn:hover {
  background: rgba(var(--color-text-base), 0.08);
  color: rgb(var(--color-text-base));
}

.entry-list {
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

.entry {
  border-bottom: 1px solid rgba(var(--color-border), 0.15);
}

.entry-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.75rem;
  width: 100%;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-family: 'SF Mono', Monaco, Menlo, monospace;
  font-size: 0.6875rem;
  text-align: left;
}

.entry-row:hover {
  background: rgba(var(--color-text-base), 0.03);
}

.expand-icon {
  font-size: 0.5rem;
  color: rgba(var(--color-text-base), 0.3);
  flex-shrink: 0;
  width: 10px;
}

.timestamp {
  color: rgba(var(--color-text-base), 0.35);
  flex-shrink: 0;
  font-size: 0.625rem;
}

.origin-pill {
  font-size: 0.5625rem;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  flex-shrink: 0;
  min-width: 50px;
  text-align: center;
}

.pill-local {
  background: rgba(59, 130, 246, 0.2);
  color: rgb(147, 197, 253);
}

.pill-remote {
  background: rgba(168, 85, 247, 0.2);
  color: rgb(196, 148, 255);
}

.types-summary {
  color: rgba(var(--color-text-base), 0.6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.ops-count {
  color: rgba(var(--color-text-base), 0.5);
  flex-shrink: 0;
  margin-left: auto;
  font-weight: 500;
}

.entry-detail {
  padding: 0.35rem 0.75rem 0.5rem 2rem;
  background: rgba(var(--color-text-base), 0.02);
  border-top: 1px solid rgba(var(--color-border), 0.1);
}

.detail-section {
  margin-bottom: 0.35rem;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-title {
  font-size: 0.625rem;
  color: rgba(var(--color-text-base), 0.4);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.15rem;
}

.detail-value {
  font-size: 0.6875rem;
  color: rgba(var(--color-text-base), 0.7);
  font-family: 'SF Mono', Monaco, Menlo, monospace;
}

.changed-type {
  display: flex;
  gap: 0.5rem;
  font-size: 0.6875rem;
  padding: 0.1rem 0;
}

.type-name {
  color: rgb(147, 197, 253);
  font-family: 'SF Mono', Monaco, Menlo, monospace;
  font-weight: 500;
}

.changed-keys {
  color: rgba(var(--color-text-base), 0.5);
  font-family: 'SF Mono', Monaco, Menlo, monospace;
}

.sv-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.6875rem;
  padding: 0.1rem 0;
  font-family: 'SF Mono', Monaco, Menlo, monospace;
}

.sv-client {
  color: rgba(var(--color-text-base), 0.5);
}

.sv-clock {
  color: rgba(var(--color-text-base), 0.7);
  font-weight: 500;
}
</style>
