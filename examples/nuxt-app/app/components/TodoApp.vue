<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import type { WebSocketProviderStatus } from 'vue-yjs'

const props = defineProps<{
  status: WebSocketProviderStatus
  synced: boolean
  awarenessStates: Map<number, AwarenessState>
  localClientId: number
  userName: string
  userColor: string
}>()

const emit = defineEmits<{
  'update-name': [name: string]
}>()

const {
  todos,
  addTodo,
  toggleTodo,
  deleteTodo,
  editTodo,
  moveTodo,
  undo,
  redo,
  canUndo,
  canRedo,
} = useTodoList()

function handleKeydown(e: KeyboardEvent) {
  const mod = e.metaKey || e.ctrlKey
  if (mod && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    undo()
  } else if (
    (mod && e.key === 'y') ||
    (mod && e.shiftKey && e.key === 'z')
  ) {
    e.preventDefault()
    redo()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onScopeDispose(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="todo-app">
    <div class="toolbar">
      <PresenceBar
        :states="props.awarenessStates"
        :local-client-id="props.localClientId"
        :user-name="props.userName"
        :user-color="props.userColor"
        @update-name="emit('update-name', $event)"
      />
      <ConnectionStatus :status="props.status" :synced="props.synced" />
    </div>

    <TodoInput @add="addTodo" />

    <div v-if="todos.length === 0" class="empty-state" data-testid="empty-state">
      No todos yet. Add one above!
    </div>

    <VueDraggable
      v-else
      v-model="todos"
      :animation="200"
      handle=".drag-handle"
      ghost-class="ghost"
      tag="ul"
      class="todo-list"
      data-testid="todo-list"
      @update="(e) => {
        if (e.oldIndex != null && e.newIndex != null) {
          moveTodo(e.oldIndex, e.newIndex)
        }
      }"
    >
      <li v-for="todo in todos" :key="todo.id">
        <TodoItem
          :todo="todo"
          @toggle="toggleTodo"
          @delete="deleteTodo"
          @edit="editTodo"
        />
      </li>
    </VueDraggable>

    <div class="undo-bar">
      <button :disabled="!canUndo" class="undo-btn" title="Undo (Ctrl+Z)" data-testid="undo-button" @click="undo">
        Undo
      </button>
      <button :disabled="!canRedo" class="undo-btn" title="Redo (Ctrl+Y)" data-testid="redo-button" @click="redo">
        Redo
      </button>
    </div>
  </div>
</template>

<style scoped>
.todo-app {
  background: rgb(var(--color-card));
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 1.5rem;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 0.5rem;
}

.todo-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.todo-list li {
  margin-bottom: 2px;
}

.empty-state {
  text-align: center;
  color: rgba(var(--color-text-base), 0.4);
  padding: 2rem 1rem;
  font-size: 0.9rem;
}

.undo-bar {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgb(var(--color-border));
}

.undo-btn {
  font-size: 0.8rem;
  padding: 0.3rem 0.75rem;
  border: 1px solid rgb(var(--color-border));
  border-radius: 6px;
  background: rgb(var(--color-fill));
  color: rgb(var(--color-text-base));
  cursor: pointer;
  transition: all 0.15s ease;
}

.undo-btn:hover:not(:disabled) {
  background: rgb(var(--color-card-muted));
  border-color: rgb(var(--color-accent));
}

.undo-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

:deep(.ghost) {
  opacity: 0.4;
  background: rgba(var(--color-card-muted), 0.3);
  border-radius: 8px;
}
</style>
