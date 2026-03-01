<script setup lang="ts">
import { ref } from "vue";
import { useYArray, useUndoManager } from "vue-yjs";

interface Todo {
  checked: boolean;
  text: string;
}

const { items: todos, push, update, yArray } = useYArray<Todo>("todos");
const { undo, redo, canUndo, canRedo } = useUndoManager(yArray);
const newTodo = ref("");

function addTodo(event: Event) {
  event.preventDefault();
  push({ checked: false, text: newTodo.value });
  newTodo.value = "";
}

function toggleTodo(index: number, event: Event) {
  update(index, { checked: (event.target as HTMLInputElement).checked });
}

function updateTodoText(index: number, event: Event) {
  update(index, { text: (event.target as HTMLInputElement).value });
}
</script>

<template>
  <div>
    <button :disabled="!canUndo" @click="undo">Undo</button>
    <button :disabled="!canRedo" @click="redo">Redo</button>
  </div>
  <form @submit="addTodo">
    <label>
      <input type="text" v-model="newTodo" />
    </label>
    <button>Add</button>
  </form>
  <ul>
    <li v-for="(todo, index) in todos" :key="index">
      <label>
        <input
          type="checkbox"
          :checked="todo.checked"
          @change="toggleTodo(index, $event)"
        />
        <input
          type="text"
          :value="todo.text"
          @input="updateTodoText(index, $event)"
        />
      </label>
    </li>
  </ul>
  <div>Result: {{ JSON.stringify(todos, null, 2) }}</div>
</template>
