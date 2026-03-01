<script setup lang="ts">
import { ref } from "vue";
import { useY, useYDoc, useUndoManager } from "vue-yjs";
import * as Y from "yjs";

const yDoc = useYDoc();
const yTodos = yDoc.getArray<Y.Map<string | boolean>>("todos");

const todos = useY(yTodos);
const { undo, redo, canUndo, canRedo } = useUndoManager(yTodos);
const newTodo = ref("");

function addTodo(event: Event) {
  event.preventDefault();
  const todo = new Y.Map<string | boolean>();
  todo.set("checked", false);
  todo.set("text", newTodo.value);
  yTodos.push([todo]);
  newTodo.value = "";
}

function toggleTodo(index: number, event: Event) {
  yTodos.get(index).set("checked", (event.target as HTMLInputElement).checked);
}

function updateTodoText(index: number, event: Event) {
  yTodos.get(index).set("text", (event.target as HTMLInputElement).value);
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
          :checked="todo.checked as boolean"
          @change="toggleTodo(index, $event)"
        />
        <input
          type="text"
          :value="todo.text as string"
          @input="updateTodoText(index, $event)"
        />
      </label>
    </li>
  </ul>
  <div>Result: {{ JSON.stringify(todos, null, 2) }}</div>
</template>
