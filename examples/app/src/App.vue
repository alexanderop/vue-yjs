<script setup lang="ts">
import { useProvideYDoc } from "vue-yjs";
import SettingsExample from "./components/SettingsExample.vue";
import TodosExample from "./components/TodosExample.vue";
import DeepStructureExample from "./components/DeepStructureExample.vue";

const yDoc = useProvideYDoc();
</script>

<template>
  <h2>Settings Example</h2>
  <SettingsExample />
  <hr />
  <h2>Todos Example</h2>
  <TodosExample />
  <hr />
  <h2>Deep Structure Example</h2>
  <DeepStructureExample />
</template>
