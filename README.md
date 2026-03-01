# vue-yjs

Vue 3 composable for Yjs.

The composable automatically subscribes to changes in the Yjs data-structure and updates a reactive ref when the data changes. It returns a readonly `ShallowRef` containing the `.toJSON()` snapshot of the Yjs data-structure.

```bash
npm install vue-yjs
```

```vue
<script setup lang="ts">
import { useY } from "vue-yjs";

const names = useY(yArray);
</script>

<template>
  <div v-for="name in names" :key="name">{{ name }}</div>
</template>
```

## Simple Usage

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

## More Examples

### Listening to a nested Yjs data-structure

```vue
<script setup lang="ts">
import { useY } from "vue-yjs";
import * as Y from "yjs";

const yDoc = new Y.Doc();
const yTodos = yDoc.getArray<Y.Map<string | boolean>>("todos");

// Any change of the todos (e.g. change checked) will trigger an update
const todos = useY(yTodos);
</script>
```

Change Todos:

```ts
// add a Todo
const todo = new Y.Map<string | boolean>();
todo.set("checked", false);
todo.set("text", newTodo);
yTodos.push([todo]);

// update the first Todo
yTodos.get(0).set("checked", true);
```

See the working example code at [examples/app/src/components/TodosExample.vue](./examples/app/src/components/TodosExample.vue).

### Listening to a subset of a Yjs data-structure

```vue
<script setup lang="ts">
import { useY } from "vue-yjs";
import * as Y from "yjs";

const yDoc = new Y.Doc();
const yPosts = yDoc.getArray<Y.Map<string | Y.Array<string>>>("posts");
const yPost = new Y.Map<string | Y.Array<string>>();
yPosts.push([yPost]);
yPost.set("title", "Notes");
const yTags = new Y.Array<string>();
yTags.push(["cooking", "vegetables"]);
yPost.set("tags", yTags);

// Makes sure to listen only to changes of the tags of the first post
const yTagsOfFirstPost = yPosts.get(0).get("tags") as Y.Array<string>;
const tagsOfFirstPost = useY(yTagsOfFirstPost);
</script>
```

Remove a tag on the first post:

```ts
const tags = yPosts.get(0).get("tags") as Y.Array<string>;
tags.delete(index);
```

See the working example code at [examples/app/src/components/DeepStructureExample.vue](./examples/app/src/components/DeepStructureExample.vue).

## Architecture Decisions

### Why `shallowRef`?

- `ref` — Would deep-proxy the Yjs JSON output unnecessarily. We replace `.value` on every change, so deep reactivity is wasted overhead.
- `reactive` — Can't reassign the whole object; we'd need `Object.assign` patterns.
- `customRef` — Calls `toJSON()` on every `.value` access (no caching). With `shallowRef`, we cache and only update when Yjs fires `observeDeep`.
- `shallowRef` — Perfect fit. Vue docs explicitly recommend it for "performance optimization of large data structures" and "integration with external state management systems."

### Change Detection

Uses `equalityDeep` from `lib0` (Yjs's utility library) to avoid unnecessary reactivity triggers when the data hasn't actually changed.

### Cleanup

Uses `onScopeDispose` which works in components, `effectScope`, and `watchEffect` — making the composable usable outside of components too.

## Inspired by

[react-yjs](https://github.com/nikgraf/react-yjs) by Nikolaus Graf.

## License

The project is [MIT licensed](./LICENSE).
