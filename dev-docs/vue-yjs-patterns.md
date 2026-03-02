# vue-yjs Composable Patterns

Reference for developing composables in `packages/vue-yjs/`.

## Why shallowRef (not ref/reactive/customRef)

Yjs shared types are mutable objects that mutate in-place when remote updates arrive. Vue's `ref()` / `reactive()` wraps values in deep proxies, which:
- Breaks Yjs internal identity checks (Yjs compares by reference)
- Triggers unnecessary deep tracking on large nested structures
- Creates proxy wrappers around Y.Map/Y.Array that interfere with Yjs methods

`shallowRef` stores the `.toJSON()` snapshot without deep-proxying it. When an update arrives, we replace the entire value — Vue detects the reference change and re-renders.

## equalityDeep Change Detection

To avoid unnecessary re-renders when an `observeDeep` callback fires but the JSON hasn't actually changed, use `equalityDeep` from `lib0/function`:

```ts
import { equalityDeep } from "lib0/function";

const handler = () => {
  const newData = yData.toJSON();
  if (!equalityDeep(data.value, newData)) {
    data.value = newData;
  }
};
```

This is the pattern used in `useY`. Always guard `.value =` assignments with this check.

## onScopeDispose Cleanup

All composables use `onScopeDispose` (not `onUnmounted`) for cleanup. This ensures cleanup runs correctly in both component and non-component scope contexts (e.g., `effectScope()`).

```ts
const unobserve = () => yData.unobserveDeep(handler);
onScopeDispose(unobserve);
```

Every `observe`/`on` must have a corresponding `unobserve`/`off` in `onScopeDispose`.

## provideLocal / injectLocal

Vue's native `provide`/`inject` only works across parent-child component boundaries — a component cannot `inject` something it `provide`d itself. The `provideLocal`/`injectLocal` helpers solve this by maintaining a `WeakMap` keyed on the component instance:

```ts
// In useProvideYDoc — provides AND stores locally
provideLocal(YDocKey, ydoc);

// In useYDoc — checks local store first, then falls back to inject
const doc = injectLocal(YDocKey);
```

This allows `useProvideYDoc()` and `useYDoc()` to be called in the **same component** — essential for the root component pattern where one composable creates the doc and siblings consume it.

## Auto-created vs External Y.Doc Lifecycle

```ts
export function useProvideYDoc(doc?: Y.Doc): Y.Doc {
  const ydoc = doc ?? new Y.Doc();
  provideLocal(YDocKey, ydoc);

  // Only auto-created docs are destroyed on scope dispose
  if (!doc) {
    onScopeDispose(() => ydoc.destroy());
  }

  return ydoc;
}
```

- **No argument**: composable creates and owns the Y.Doc → destroyed on scope dispose
- **Argument provided**: caller owns the Y.Doc → composable does NOT destroy it

This convention applies to all composables that optionally accept external resources.

## YTypeToJson Recursive Type

Maps Yjs shared types to their `.toJSON()` output types:

```ts
type YTypeToJson<YType> =
  YType extends Y.Array<infer V> ? Array<YTypeToJson<V>>
  : YType extends Y.Map<infer V> ? { [key: string]: YTypeToJson<V> }
  : YType extends Y.XmlFragment | Y.XmlText | Y.Text ? string
  : YType;
```

Used by `useY<T extends Y.AbstractType<any>>(yData: T): Readonly<ShallowRef<YTypeToJson<T>>>` to give callers correctly typed JSON snapshots.
