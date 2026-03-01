# Testing Guide

Reference for writing and running tests in `packages/vue-yjs/`.

## Setup

Tests use **vitest** with **happy-dom** environment. Test files are colocated with source: `useY.ts` → `useY.test.ts`.

Run tests:
```sh
pnpm test           # All tests (parallel)
pnpm test -- useY   # Filter by name
```

## withSetup Helper

Composables must run inside a Vue component's `setup()` context. The `withSetup` helper (from `test-utils.ts`) creates a minimal app, runs the composable, and returns the result:

```ts
import { withSetup } from "./test-utils";

it("returns reactive state", () => {
  const { result, app } = withSetup(() => useMyComposable());

  expect(result.someValue.value).toBe(initialValue);

  // Cleanup: app.unmount() is called automatically in afterEach
});
```

`withSetup` auto-tracks all created apps and unmounts them in `afterEach` — no manual cleanup needed.

## withProvideSetup for Injection Testing

When a composable depends on `inject()` (e.g., `useYDoc` needs a provided Y.Doc), use `withProvideSetup`:

```ts
import { withProvideSetup } from "./test-utils";
import { YDocKey } from "./useYDoc";

it("injects the provided doc", () => {
  const doc = new Y.Doc();
  const { result } = withProvideSetup(
    () => useYDoc(),
    [[YDocKey, doc]]
  );

  expect(result).toBe(doc);
  doc.destroy();
});
```

The second argument is an array of `[InjectionKey | string, value]` tuples that simulate ancestor `provide()` calls.

## Yjs Synchronous Observation

Yjs `observeDeep` callbacks fire **synchronously** during mutations. This means reactive state updates immediately — no `await nextTick()` needed:

```ts
it("updates reactively on mutation", () => {
  const doc = new Y.Doc();
  const yMap = doc.getMap("test");
  const { result } = withSetup(() => useY(yMap));

  yMap.set("key", "value");

  // State is already updated — no nextTick needed
  expect(result.value).toEqual({ key: "value" });
});
```

Do NOT add unnecessary `await nextTick()` in Yjs tests — it's misleading.

## Cleanup Verification

Test that composables properly clean up observers when the scope is disposed:

```ts
it("cleans up on unmount", () => {
  const doc = new Y.Doc();
  const yArray = doc.getArray("test");
  const { result, app } = withSetup(() => useY(yArray));

  yArray.push(["a"]);
  expect(result.value).toEqual(["a"]);

  app.unmount();

  // Mutate after unmount — ref should NOT update
  yArray.push(["b"]);
  expect(result.value).toEqual(["a"]);
});
```

This pattern verifies that `onScopeDispose` properly calls `unobserveDeep`.

## Reference Equality

When testing that `shallowRef` values don't update unnecessarily, capture the reference before a no-op mutation and verify it's the same object after:

```ts
it("does not update when data is unchanged", () => {
  const { result } = withSetup(() => useY(yMap));

  const before = result.value;
  yMap.set("key", yMap.get("key")); // no-op
  expect(result.value).toBe(before); // same reference
});
```

This confirms the `equalityDeep` guard is working.
