<script setup lang="ts">
import type { DocTreeNode } from '~/composables/useDocTree'

const props = defineProps<{
  node: DocTreeNode
  depth: number
  defaultOpen?: boolean
}>()

const isExpanded = shallowRef(props.defaultOpen ?? false)

const hasChildren = computed(() => props.node.children.length > 0)
const isPrimitive = computed(() => props.node.type === 'primitive')

const typeBadgeClass = computed(() => {
  const typeMap: Record<string, string> = {
    'Y.Map': 'badge-map',
    'Y.Array': 'badge-array',
    'Y.Text': 'badge-text',
    'Y.XmlFragment': 'badge-xml',
    'Y.XmlElement': 'badge-xml',
    'Y.XmlText': 'badge-xml',
  }
  return typeMap[props.node.type] ?? ''
})

const displayValue = computed(() => {
  if (props.node.type === 'primitive') {
    const v = props.node.value
    if (typeof v === 'string') return `"${v}"`
    if (v === null) return 'null'
    if (v === undefined) return 'undefined'
    return String(v)
  }
  if (props.node.type === 'Y.Text') {
    return `"${props.node.value}"`
  }
  if (props.node.type === 'Y.Array') {
    return `(${props.node.children.length} items)`
  }
  if (props.node.type === 'Y.Map') {
    return `{${props.node.children.length} keys}`
  }
  return ''
})

function toggleExpand() {
  if (hasChildren.value) {
    isExpanded.value = !isExpanded.value
  }
}
</script>

<template>
  <div
    :class="['tree-node', { changed: node.changed }]"
    :style="{ paddingLeft: `${depth * 16 + 4}px` }"
  >
    <button
      v-if="hasChildren"
      class="toggle-btn"
      :aria-expanded="isExpanded"
      :aria-label="`${isExpanded ? 'Collapse' : 'Expand'} ${node.name}`"
      @click="toggleExpand"
    >
      <svg
        :class="['chevron', { expanded: isExpanded }]"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
    <span v-else class="toggle-spacer" />

    <span class="node-name">{{ node.name }}</span>

    <span v-if="!isPrimitive" :class="['type-badge', typeBadgeClass]">
      {{ node.type }}
    </span>

    <span class="node-value" :class="{ 'value-string': typeof node.value === 'string' || node.type === 'Y.Text' }">
      {{ displayValue }}
    </span>

    <span v-if="node.changed" class="change-indicator" aria-label="updated">
      updated
    </span>
  </div>

  <ul v-if="hasChildren && isExpanded" class="children">
    <li v-for="child in node.children" :key="child.path">
      <devtools-DocTreeNode
        :node="child"
        :depth="depth + 1"
        :default-open="depth < 1"
      />
    </li>
  </ul>
</template>

<style scoped>
.tree-node {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 4px;
  border-radius: 3px;
  min-height: 24px;
  transition: background-color 0.15s ease;
}

.tree-node:hover {
  background: rgba(var(--color-text-base), 0.05);
}

.tree-node.changed {
  background: rgba(var(--color-accent), 0.15);
  animation: highlight-fade 1.5s ease-out;
}

@keyframes highlight-fade {
  0% { background: rgba(var(--color-accent), 0.3); }
  100% { background: transparent; }
}

@media (prefers-reduced-motion: reduce) {
  .tree-node.changed {
    animation: none;
    background: rgba(var(--color-accent), 0.15);
  }
}

.toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: rgba(var(--color-text-base), 0.5);
  display: flex;
  align-items: center;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  justify-content: center;
}

.toggle-btn:hover {
  color: rgb(var(--color-text-base));
}

.chevron {
  transition: transform 0.15s ease;
}

.chevron.expanded {
  transform: rotate(90deg);
}

@media (prefers-reduced-motion: reduce) {
  .chevron {
    transition: none;
  }
}

.toggle-spacer {
  width: 16px;
  flex-shrink: 0;
}

.node-name {
  color: rgb(147, 197, 253);
  font-family: 'SF Mono', Monaco, Menlo, monospace;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.type-badge {
  font-size: 0.625rem;
  padding: 0 4px;
  border-radius: 3px;
  font-weight: 600;
  flex-shrink: 0;
  line-height: 1.5;
}

.badge-map {
  background: rgba(168, 85, 247, 0.2);
  color: rgb(196, 148, 255);
}

.badge-array {
  background: rgba(59, 130, 246, 0.2);
  color: rgb(147, 197, 253);
}

.badge-text {
  background: rgba(16, 185, 129, 0.2);
  color: rgb(110, 231, 183);
}

.badge-xml {
  background: rgba(245, 158, 11, 0.2);
  color: rgb(252, 211, 77);
}

.node-value {
  color: rgba(var(--color-text-base), 0.6);
  font-family: 'SF Mono', Monaco, Menlo, monospace;
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.value-string {
  color: rgb(110, 231, 183);
}

.change-indicator {
  font-size: 0.625rem;
  color: rgb(var(--color-accent));
  flex-shrink: 0;
  font-weight: 500;
}

.children {
  list-style: none;
  padding: 0;
  margin: 0;
}
</style>
