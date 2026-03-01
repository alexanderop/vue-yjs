<script setup lang="ts">
import type { WebsocketProvider } from 'y-websocket'
import type { WebSocketProviderStatus } from 'vue-yjs'
import type * as Y from 'yjs'
import type { useMessageLog } from '~/composables/useMessageLog'

const props = defineProps<{
  doc: Y.Doc
  provider: WebsocketProvider
  awarenessStates: Map<number, AwarenessState>
  localClientId: number
  status: WebSocketProviderStatus
  synced: boolean
  messageLog: ReturnType<typeof useMessageLog>
}>()

const { isOpen, activeTab, close, setTab } = useDevTools()
const panelRef = ref<HTMLElement | null>(null)
const previousFocusRef = ref<HTMLElement | null>(null)

const tabs = [
  { id: 'doc' as const, label: 'Document State' },
  { id: 'sync' as const, label: 'Sync & Network' },
  { id: 'awareness' as const, label: 'Awareness' },
]

watch(isOpen, (open) => {
  if (open) {
    previousFocusRef.value = document.activeElement as HTMLElement
    nextTick(() => {
      panelRef.value?.focus()
    })
  }
  else {
    previousFocusRef.value?.focus()
    previousFocusRef.value = null
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="devtools-slide">
      <aside
        v-show="isOpen"
        id="devtools-panel"
        ref="panelRef"
        role="complementary"
        aria-label="Yjs DevTools"
        class="devtools-panel"
        tabindex="-1"
      >
        <div class="panel-header">
          <h2 class="panel-title">Yjs DevTools</h2>
          <button class="close-btn" aria-label="Close DevTools" @click="close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div role="tablist" class="tab-bar" aria-label="DevTools tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            role="tab"
            :aria-selected="activeTab === tab.id"
            :class="['tab-btn', { active: activeTab === tab.id }]"
            @click="setTab(tab.id)"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="tab-content">
          <div
            v-show="activeTab === 'doc'"
            role="tabpanel"
            aria-label="Document State"
          >
            <devtools-DocTreeTab :doc="props.doc" />
          </div>
          <div
            v-show="activeTab === 'sync'"
            role="tabpanel"
            aria-label="Sync & Network"
          >
            <devtools-SyncLogTab :message-log="props.messageLog" />
          </div>
          <div
            v-show="activeTab === 'awareness'"
            role="tabpanel"
            aria-label="Awareness & Presence"
          >
            <devtools-AwarenessTab
              :awareness-states="props.awarenessStates"
              :local-client-id="props.localClientId"
            />
          </div>
        </div>

        <devtools-StatusBar
          :status="props.status"
          :synced="props.synced"
          :doc="props.doc"
        />
      </aside>
    </Transition>

    <div
      v-if="isOpen"
      class="devtools-backdrop"
    />
  </Teleport>
</template>

<style scoped>
.devtools-panel {
  position: fixed;
  right: 0;
  top: 0;
  height: 100vh;
  width: 400px;
  z-index: 50;
  background: rgb(25, 30, 42);
  border-left: 1px solid rgb(var(--color-border));
  display: flex;
  flex-direction: column;
  font-size: 0.8125rem;
  outline: none;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.4);
}

.devtools-backdrop {
  position: fixed;
  inset: 0;
  z-index: 49;
  background: rgba(0, 0, 0, 0.2);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgb(var(--color-border));
  flex-shrink: 0;
}

.panel-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(var(--color-text-base));
}

.close-btn {
  background: none;
  border: none;
  color: rgba(var(--color-text-base), 0.5);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.close-btn:hover {
  color: rgb(var(--color-text-base));
  background: rgba(var(--color-text-base), 0.1);
}

.tab-bar {
  display: flex;
  border-bottom: 1px solid rgb(var(--color-border));
  flex-shrink: 0;
}

.tab-btn {
  flex: 1;
  padding: 0.5rem 0.25rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: rgba(var(--color-text-base), 0.5);
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.tab-btn:hover {
  color: rgba(var(--color-text-base), 0.8);
  background: rgba(var(--color-text-base), 0.05);
}

.tab-btn.active {
  color: rgb(var(--color-accent));
  border-bottom-color: rgb(var(--color-accent));
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Slide animation */
.devtools-slide-enter-active,
.devtools-slide-leave-active {
  transition: transform 0.2s ease;
}

.devtools-slide-enter-from,
.devtools-slide-leave-to {
  transform: translateX(100%);
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .devtools-slide-enter-active,
  .devtools-slide-leave-active {
    transition: none;
  }
}

/* Mobile: bottom sheet */
@media (max-width: 767px) {
  .devtools-panel {
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 60vh;
    border-left: none;
    border-top: 1px solid rgb(var(--color-border));
    border-radius: 12px 12px 0 0;
  }

  .devtools-slide-enter-from,
  .devtools-slide-leave-to {
    transform: translateY(100%);
  }
}
</style>
