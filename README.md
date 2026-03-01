# vue-yjs

Vue 3 composables for [Yjs](https://yjs.dev) — a reactive bridge between Yjs data structures and Vue's reactivity system.

## The Problem

Yjs data structures (`Y.Array`, `Y.Map`, etc.) live outside Vue's reactivity system. Vue has no way to know when they change, so your UI won't update automatically.

Without `useY`, you end up writing boilerplate like this in every component:

```vue
<script setup lang="ts">
import { shallowRef, onUnmounted } from "vue";
import * as Y from "yjs";

const yDoc = new Y.Doc();
const yNames = yDoc.getArray<string>("names");

// Manually create a ref and keep it in sync
const names = shallowRef(yNames.toJSON());

const handler = () => {
  names.value = yNames.toJSON();
};

// Manually subscribe to deep changes
yNames.observeDeep(handler);

// Manually clean up to avoid memory leaks
onUnmounted(() => {
  yNames.unobserveDeep(handler);
});
</script>

<template>
  <div v-for="name in names" :key="name">{{ name }}</div>
</template>
```

This gets worse with every Yjs type you use. Each one needs its own ref, observer, and cleanup.

## The Solution

`vue-yjs` provides composables that handle observation, cleanup, equality checks, and use `shallowRef` for optimal performance — all behind simple APIs.

```vue
<script setup lang="ts">
import { useY } from "vue-yjs";
import * as Y from "yjs";

const yDoc = new Y.Doc();
const yNames = yDoc.getArray<string>("names");

const names = useY(yNames);
</script>

<template>
  <div v-for="name in names" :key="name">{{ name }}</div>
</template>
```

## Install

```bash
npm install vue-yjs yjs
```

Peer dependencies: `vue >= 3.3`, `yjs >= 13.6`. Optional: `y-websocket`, `y-protocols`.

## Composables

### `useY`

Reactive binding for any Yjs shared type. Returns a readonly shallow ref that stays in sync via `observeDeep`.

```ts
import { useY } from "vue-yjs";

const yArray = doc.getArray<string>("items");
const items = useY(yArray); // Ref<string[]>
```

Works with `Y.Array`, `Y.Map`, `Y.Text`, `Y.XmlFragment`, and nested structures.

### `useProvideYDoc` / `useYDoc`

Provide/inject pattern for sharing a `Y.Doc` across the component tree. Works in the same component or any child — no manual doc threading needed.

```ts
// Parent component — provide the doc
import { useProvideYDoc } from "vue-yjs";

const doc = useProvideYDoc(); // creates a new Y.Doc, destroyed on unmount
// or: useProvideYDoc(existingDoc) — provide an externally managed doc
```

```ts
// Any component (same or child) — inject the doc
import { useYDoc } from "vue-yjs";

const doc = useYDoc();
const yMap = doc.getMap("settings");
```

This is especially useful in Nuxt/composable patterns where `useProvideYDoc()` and `useYDoc()` are called in the same component via different composables:

```ts
// composables/useCollaboration.ts — provides the doc
export function useCollaboration() {
  const doc = useProvideYDoc();
  // ...
}

// composables/useTodoList.ts — injects the doc (same component!)
export function useTodoList() {
  const doc = useYDoc(); // works even in the same component
  // ...
}
```

### `useAwareness`

Reactive binding for the Yjs awareness protocol. Tracks remote and local awareness states. Requires `y-protocols`.

```ts
import { useAwareness } from "vue-yjs";

interface Cursor {
  x: number;
  y: number;
  name: string;
}

const { states, setLocalStateField } = useAwareness<Cursor>(awareness);

// Update local state
setLocalStateField("name", "Alice");

// Read all connected clients
// states.value is Map<number, Cursor>
```

Returns `{ states, localClientId, setLocalState, setLocalStateField }`.

### `useUndoManager`

Reactive wrapper around `Y.UndoManager` with `canUndo` / `canRedo` computed refs.

```ts
import { useUndoManager } from "vue-yjs";

const yText = doc.getText("editor");
const { undo, redo, canUndo, canRedo } = useUndoManager(yText);
```

```vue
<template>
  <button :disabled="!canUndo" @click="undo">Undo</button>
  <button :disabled="!canRedo" @click="redo">Redo</button>
</template>
```

Options: `captureTimeout` (default `500`ms), `trackedOrigins`.

### `useWebSocketProvider`

Reactive wrapper around `y-websocket`'s `WebsocketProvider`. Requires `y-websocket`.

```ts
import { useProvideYDoc, useWebSocketProvider } from "vue-yjs";

const doc = useProvideYDoc();
const { status, synced, awareness, connect, disconnect } =
  useWebSocketProvider("wss://demos.yjs.dev/ws", "my-room", doc);
```

`status` is a reactive ref (`"connecting"` | `"connected"` | `"disconnected"`). `synced` indicates whether the initial sync has completed. The provider is destroyed on scope disposal.

## Examples

### Nested Yjs data structures

```vue
<script setup lang="ts">
import { useY } from "vue-yjs";
import * as Y from "yjs";

const yDoc = new Y.Doc();
const yTodos = yDoc.getArray<Y.Map<string | boolean>>("todos");

// Any change (e.g. toggling checked) triggers an update
const todos = useY(yTodos);
</script>
```

```ts
// Add a todo
const todo = new Y.Map<string | boolean>();
todo.set("checked", false);
todo.set("text", "Buy groceries");
yTodos.push([todo]);

// Toggle the first todo
yTodos.get(0).set("checked", true);
```

See [examples/app/src/components/TodosExample.vue](./examples/app/src/components/TodosExample.vue).

### Subset of a Yjs data structure

```ts
// Listen only to changes on the tags of the first post
const yTags = yPosts.get(0).get("tags") as Y.Array<string>;
const tags = useY(yTags);
```

See [examples/app/src/components/DeepStructureExample.vue](./examples/app/src/components/DeepStructureExample.vue).

### Full collaborative app

See the [Nuxt example app](./examples/nuxt-app/) for a complete collaborative todo app with WebSocket sync and awareness.

## Architecture Decisions

### Why `shallowRef`?

- `ref` — Would deep-proxy the Yjs JSON output unnecessarily. We replace `.value` on every change, so deep reactivity is wasted overhead.
- `reactive` — Can't reassign the whole object; we'd need `Object.assign` patterns.
- `customRef` — Calls `toJSON()` on every `.value` access (no caching). With `shallowRef`, we cache and only update when Yjs fires `observeDeep`.
- `shallowRef` — Perfect fit. Vue docs explicitly recommend it for "performance optimization of large data structures" and "integration with external state management systems."

### Change Detection

Uses `equalityDeep` from `lib0` (Yjs's utility library) to avoid unnecessary reactivity triggers when the data hasn't actually changed.

### Cleanup

Uses `onScopeDispose` which works in components, `effectScope`, and `watchEffect` — making all composables usable outside of components too.

## Inspired by

[react-yjs](https://github.com/nikgraf/react-yjs) by Nikolaus Graf.

## License

The project is [MIT licensed](./LICENSE).
