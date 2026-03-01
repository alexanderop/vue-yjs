<script setup lang="ts">
import type * as Y from 'yjs'

const props = defineProps<{
  doc: Y.Doc
}>()

const { tree } = useDocTree(props.doc)
</script>

<template>
  <div class="doc-tree-tab">
    <div v-if="tree.length === 0" class="empty">
      No shared types in document yet.
    </div>
    <ul v-else class="tree-root">
      <li v-for="node in tree" :key="node.path">
        <devtools-DocTreeNode :node="node" :depth="0" :default-open="true" />
      </li>
    </ul>
  </div>
</template>

<style scoped>
.doc-tree-tab {
  padding: 0.5rem;
}

.empty {
  text-align: center;
  color: rgba(var(--color-text-base), 0.4);
  padding: 2rem 0.5rem;
  font-size: 0.8rem;
}

.tree-root {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tree-root li {
  margin: 0;
}
</style>
