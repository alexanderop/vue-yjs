<script setup lang="ts">
const emit = defineEmits<{
  add: [text: string]
}>()

const text = ref('')

function submit() {
  if (!text.value.trim()) return
  emit('add', text.value)
  text.value = ''
}
</script>

<template>
  <form class="todo-input" @submit.prevent="submit">
    <input
      v-model="text"
      type="text"
      placeholder="What needs to be done?"
      class="input-field"
      data-testid="todo-input"
    />
    <button type="submit" class="add-btn" :disabled="!text.trim()" data-testid="add-button">
      Add
    </button>
  </form>
</template>

<style scoped>
.todo-input {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.input-field {
  flex: 1;
  padding: 0.6rem 0.75rem;
  border: 1px solid rgb(var(--color-border));
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
  background: rgb(var(--color-fill));
  color: rgb(var(--color-text-base));
}

.input-field:focus {
  border-color: rgb(var(--color-accent));
}

.add-btn {
  padding: 0.6rem 1.25rem;
  background: rgb(var(--color-accent));
  color: rgb(var(--color-fill));
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.add-btn:hover:not(:disabled) {
  background: rgb(var(--color-card-muted));
  color: rgb(var(--color-text-base));
}

.add-btn:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
