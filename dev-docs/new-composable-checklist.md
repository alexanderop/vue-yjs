# New Composable Checklist

Step-by-step guide for adding a new composable to `packages/vue-yjs/`.

## Files to Create

1. `packages/vue-yjs/src/useMyFeature.ts` — implementation
2. `packages/vue-yjs/src/useMyFeature.test.ts` — colocated tests

## Files to Modify

1. `packages/vue-yjs/src/index.ts` — add exports

## Implementation Template

```ts
import { shallowRef, readonly, onScopeDispose } from "vue";
import { injectLocal } from "./localProvide";
import { YDocKey } from "./useYDoc";

export interface UseMyFeatureOptions {
  // ...
}

export interface UseMyFeatureReturn {
  // Use Readonly<ShallowRef<T>> for reactive state
}

export function useMyFeature(options?: UseMyFeatureOptions): UseMyFeatureReturn {
  const doc = injectLocal(YDocKey);
  if (!doc) throw new Error("useMyFeature requires useProvideYDoc in an ancestor");

  // Reactive state — always shallowRef
  const state = shallowRef(initialValue);

  // Observation
  const handler = () => {
    state.value = computeNewValue();
  };
  resource.observe(handler);

  // Cleanup — always onScopeDispose
  onScopeDispose(() => {
    resource.unobserve(handler);
  });

  return {
    state: readonly(state),
  };
}
```

## Documentation

- [ ] Create API reference page in `docs/content/2.composables/` following the composable page template

## Convention Checklist

- [ ] **shallowRef** for all reactive state (never `ref` or `reactive`)
- [ ] **readonly()** wrapper on returned refs (consumers should not mutate directly)
- [ ] **onScopeDispose** for all cleanup (never `onUnmounted`)
- [ ] **equalityDeep** guard on `.value` assignments if the source can fire redundant updates
- [ ] **provideLocal/injectLocal** if the composable participates in provide/inject
- [ ] **Auto-created vs external resource** lifecycle: only destroy what you create
- [ ] Types exported separately with `export type { ... }`

## Export in index.ts

Use `.js` extension for NodeNext module resolution:

```ts
export { useMyFeature } from "./useMyFeature.js";
export type { UseMyFeatureOptions, UseMyFeatureReturn } from "./useMyFeature.js";
```

## Optional Peer Dependencies

If the composable depends on an external package (e.g., `y-indexeddb`):

1. Add it as an **optional peer dependency** in `packages/vue-yjs/package.json`:
   ```json
   "peerDependencies": {
     "y-indexeddb": "^9.0.0"
   },
   "peerDependenciesMeta": {
     "y-indexeddb": { "optional": true }
   }
   ```

2. Use dynamic `import()` or document the requirement clearly — the composable should throw a helpful error if the dependency is missing.
