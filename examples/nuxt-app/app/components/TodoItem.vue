<script setup lang="ts">
const props = defineProps<{
  todo: Todo
}>()

const emit = defineEmits<{
  toggle: [id: string]
  delete: [id: string]
  edit: [id: string, text: string]
}>()

const isEditing = ref(false)
const editText = ref('')
const editInput = ref<HTMLInputElement>()

function startEdit() {
  editText.value = props.todo.text
  isEditing.value = true
  nextTick(() => editInput.value?.focus())
}

function commitEdit() {
  if (!isEditing.value) return
  const trimmed = editText.value.trim()
  if (trimmed && trimmed !== props.todo.text) {
    emit('edit', props.todo.id, trimmed)
  }
  isEditing.value = false
}

function cancelEdit() {
  isEditing.value = false
}
</script>

<template>
  <div class="todo-item" :class="{ done: todo.done }" data-testid="todo-item">
    <span class="drag-handle" title="Drag to reorder" data-testid="drag-handle">&#x2630;</span>

    <input
      type="checkbox"
      :checked="todo.done"
      class="todo-checkbox"
      data-testid="todo-checkbox"
      @change="emit('toggle', todo.id)"
    />

    <template v-if="isEditing">
      <input
        ref="editInput"
        v-model="editText"
        class="edit-input"
        data-testid="todo-edit-input"
        @keydown.enter="commitEdit"
        @keydown.escape="cancelEdit"
        @blur="commitEdit"
      />
    </template>
    <template v-else>
      <span class="todo-text" data-testid="todo-text" @dblclick="startEdit">
        {{ todo.text }}
      </span>
    </template>

    <button class="delete-btn" title="Delete" data-testid="delete-button" @click="emit('delete', todo.id)">
      &times;
    </button>
  </div>
</template>

<style scoped>
.todo-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.5rem;
  border-radius: 8px;
  transition: background 0.1s ease;
}

.todo-item:hover {
  background: rgba(var(--color-fill), 0.5);
}

.drag-handle {
  cursor: grab;
  color: rgba(var(--color-text-base), 0.3);
  font-size: 0.9rem;
  user-select: none;
  padding: 0 0.25rem;
}

.drag-handle:active {
  cursor: grabbing;
}

.todo-checkbox {
  width: 18px;
  height: 18px;
  accent-color: rgb(var(--color-accent));
  flex-shrink: 0;
  cursor: pointer;
}

.todo-text {
  flex: 1;
  font-size: 0.95rem;
  cursor: text;
  min-width: 0;
  word-break: break-word;
}

.done .todo-text {
  text-decoration: line-through;
  color: rgba(var(--color-text-base), 0.35);
}

.edit-input {
  flex: 1;
  font-size: 0.95rem;
  padding: 0.2rem 0.4rem;
  border: 1px solid rgb(var(--color-accent));
  border-radius: 4px;
  outline: none;
  background: rgb(var(--color-fill));
  color: rgb(var(--color-text-base));
}

.delete-btn {
  background: none;
  border: none;
  color: rgba(var(--color-text-base), 0.3);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0 0.25rem;
  line-height: 1;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
}

.todo-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: rgb(var(--color-accent));
}
</style>
