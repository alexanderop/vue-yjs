<script setup lang="ts">
import type { AwarenessState } from '~/composables/useCollaboration'

defineProps<{
  states: Map<number, AwarenessState>
  localClientId: number
  userName: string
  userColor: string
}>()

const emit = defineEmits<{
  updateName: [name: string]
}>()

const isEditingName = ref(false)
const editName = ref('')
const nameInput = ref<HTMLInputElement>()

function startEditName(currentName: string) {
  editName.value = currentName
  isEditingName.value = true
  nextTick(() => nameInput.value?.focus())
}

function commitName() {
  const trimmed = editName.value.trim()
  if (trimmed) {
    emit('updateName', trimmed)
  }
  isEditingName.value = false
}
</script>

<template>
  <div class="presence-bar">
    <template v-for="[clientId, state] in states" :key="clientId">
      <div
        v-if="state.name"
        class="presence-dot"
        :class="{ 'is-you': clientId === localClientId }"
        :title="clientId === localClientId ? `${state.name} (you)` : state.name"
      >
        <span class="dot" :style="{ background: state.color }" />
        <template v-if="clientId === localClientId && isEditingName">
          <input
            ref="nameInput"
            v-model="editName"
            class="name-edit"
            @keydown.enter="commitName"
            @keydown.escape="isEditingName = false"
            @blur="commitName"
          />
        </template>
        <template v-else>
          <span
            class="name"
            @dblclick="clientId === localClientId && startEditName(state.name)"
          >
            {{ state.name }}
            <span v-if="clientId === localClientId" class="you-label">(you)</span>
          </span>
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
.presence-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.presence-dot {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  color: rgba(var(--color-text-base), 0.7);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.name {
  white-space: nowrap;
}

.is-you .name {
  cursor: pointer;
}

.you-label {
  color: rgba(var(--color-text-base), 0.4);
  font-size: 0.75rem;
}

.name-edit {
  font-size: 0.8rem;
  padding: 0.1rem 0.3rem;
  border: 1px solid rgb(var(--color-accent));
  border-radius: 3px;
  outline: none;
  width: 100px;
  background: rgb(var(--color-fill));
  color: rgb(var(--color-text-base));
}
</style>
