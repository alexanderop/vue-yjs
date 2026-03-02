<template>
  <div class="yjs-demo border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden my-6">
    <div class="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ title || 'Live Demo' }}</span>
      <button
        class="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        @click="reset"
      >
        Reset
      </button>
    </div>
    <div class="p-4">
      <ClientOnly>
        <div v-if="error" class="text-red-500 text-sm">
          Something went wrong: {{ error.message }}
        </div>
        <div v-else :key="instanceKey">
          <slot />
        </div>
        <template #fallback>
          <div class="text-gray-400 text-sm py-4 text-center">
            Loading demo...
          </div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

defineProps<{
  title?: string
}>()

const instanceKey = ref(0)
const error = ref<Error | null>(null)

function reset() {
  error.value = null
  instanceKey.value++
}

onErrorCaptured((err) => {
  error.value = err instanceof Error ? err : new Error(String(err))
  return false
})
</script>
