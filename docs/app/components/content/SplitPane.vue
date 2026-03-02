<template>
  <div class="split-pane grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="pane border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div class="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border-b border-gray-200 dark:border-gray-700">
        <span class="text-xs font-medium text-green-700 dark:text-green-400">Client A</span>
      </div>
      <div class="p-3">
        <slot name="a" />
      </div>
    </div>
    <div class="pane border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div class="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
        <span class="text-xs font-medium text-blue-700 dark:text-blue-400">Client B</span>
      </div>
      <div class="p-3">
        <slot name="b" />
      </div>
    </div>
  </div>
</template>
