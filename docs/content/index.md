---
title: vue-yjs
description: Vue 3 composables for Yjs real-time collaboration
navigation: false
---

:::u-page-hero
---
title: Vue 3 composables for Yjs
description: A reactive bridge between Yjs data structures and Vue's reactivity system. Real-time collaboration, type-safe, zero boilerplate.
links:
  - label: Get Started
    to: /getting-started/installation
    icon: i-lucide-arrow-right
    size: lg
  - label: View on GitHub
    to: https://github.com/AO-AO/vue-yjs
    icon: i-simple-icons-github
    variant: outline
    size: lg
    target: _blank
---
:::

:::u-page-section
#title
Features

#description
Everything you need for real-time collaborative Vue applications.

#default
::::card-group
:::card
---
title: Real-time Sync
icon: i-lucide-refresh-cw
---
Automatic reactive updates via `observeDeep`. Changes to Yjs shared types are instantly reflected in your Vue components.
:::

:::card
---
title: Type-safe
icon: i-lucide-shield-check
---
Full TypeScript support with inferred types. Every composable is fully typed for a seamless developer experience.
:::

:::card
---
title: Offline Support
icon: i-lucide-wifi-off
---
IndexedDB persistence with `useIndexedDB`. Your users' data survives page reloads and works offline.
:::

:::card
---
title: Awareness
icon: i-lucide-users
---
Presence and cursor tracking with `useAwareness`. See who's online and what they're doing in real time.
:::

:::card
---
title: Undo/Redo
icon: i-lucide-undo-2
---
Built-in undo manager with `useUndoManager`. Give users the power to undo and redo their changes effortlessly.
:::

:::card
---
title: Zero Config
icon: i-lucide-zap
---
All-in-one room setup with `useYRoom`. Connect to a provider, set up persistence, and start collaborating in one call.
:::
::::
:::

:::u-page-section
#title
Write less, do more

#description
Replace verbose Yjs boilerplate with a single composable call.

#default
::::code-group
```vue [Before — raw Yjs]
<script setup lang="ts">
import { shallowRef, onUnmounted } from "vue";
import * as Y from "yjs";

const yDoc = new Y.Doc();
const yNames = yDoc.getArray<string>("names");
const names = shallowRef(yNames.toJSON());

const handler = () => {
  names.value = yNames.toJSON();
};
yNames.observeDeep(handler);

onUnmounted(() => {
  yNames.unobserveDeep(handler);
});
</script>
```

```vue [After — vue-yjs]
<script setup lang="ts">
import { useY } from "vue-yjs";
import * as Y from "yjs";

const yDoc = new Y.Doc();
const yNames = yDoc.getArray<string>("names");
const names = useY(yNames);
</script>
```
::::
:::

:::u-page-section
#title
Quick Install

#description
Get started in seconds with your favorite package manager.

#default
```bash
pnpm add vue-yjs yjs
```
:::
