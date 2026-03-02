---
title: "feat: Vue Yjs Composable Library"
type: feat
status: completed
date: 2026-03-01
---

# Vue Yjs Composable Library

## Overview

Build `vue-yjs` — a Vue 3 composable library that wraps Yjs shared data types with Vue's reactivity system. This is a direct port of [react-yjs](https://github.com/nikgraf/react-yjs) adapted to Vue idioms. The library provides a single `useY` composable that subscribes to Yjs data structures via `observeDeep`, converts them to JSON, and exposes them as reactive Vue refs.

The project uses a pnpm monorepo with space for docs and examples, following the same proven structure as the reference `react-yjs` project.

## Problem Statement / Motivation

- **No lightweight Vue 3 wrapper for Yjs exists** — most Yjs integrations are tied to specific editors (TipTap, ProseMirror). Developers building custom collaborative UIs in Vue need a generic reactive binding.
- **react-yjs proves the pattern works** — a single `useY` hook covering Y.Map, Y.Array, Y.Text, Y.XmlFragment, and Y.XmlElement with deep observation is elegant and sufficient.
- **Vue's reactivity system is a natural fit** — Vue's `shallowRef` is explicitly designed for "integration with external state management systems" (Vue docs), making this cleaner than the React equivalent.

## Proposed Solution

A single composable `useY(yData)` that:

1. Takes any Yjs `AbstractType` (Y.Map, Y.Array, Y.Text, etc.)
2. Subscribes to changes via `observeDeep`
3. Returns a readonly `ShallowRef` containing the `.toJSON()` snapshot
4. Uses `equalityDeep` from `lib0` to avoid unnecessary reactivity triggers
5. Auto-cleans up the observer via `onScopeDispose`

## Technical Approach

### Architecture

#### Core Composable: `useY`

The Vue equivalent replaces React's `useSyncExternalStore` with Vue's `shallowRef` + `onScopeDispose`:

```ts
// packages/vue-yjs/src/useY.ts
import { shallowRef, onScopeDispose, type ShallowRef, type Readonly } from "vue";
import { equalityDeep } from "lib0/function";
import * as Y from "yjs";

type YTypeToJson<YType> =
  YType extends Y.Array<infer Value>
    ? Array<YTypeToJson<Value>>
    : YType extends Y.Map<infer MapValue>
      ? { [key: string]: YTypeToJson<MapValue> }
      : YType extends Y.XmlFragment | Y.XmlText | Y.Text
        ? string
        : YType;

export function useY<YType extends Y.AbstractType<any>>(
  yData: YType
): Readonly<ShallowRef<YTypeToJson<YType>>> {
  const data = shallowRef(yData.toJSON()) as ShallowRef<YTypeToJson<YType>>;

  const handler = () => {
    const newData = yData.toJSON();
    if (!equalityDeep(data.value, newData)) {
      data.value = newData;
    }
  };

  yData.observeDeep(handler);

  onScopeDispose(() => {
    yData.unobserveDeep(handler);
  });

  return data;
}
```

**Key design decisions:**

| Aspect | React (react-yjs) | Vue (vue-yjs) |
|---|---|---|
| State container | `useSyncExternalStore` + `useRef` | `shallowRef` |
| Change detection | `equalityDeep` from lib0 | Same — `equalityDeep` from lib0 |
| Subscription | `observeDeep` in subscribe callback | `observeDeep` + `onScopeDispose` |
| Return type | Plain JSON value | `Readonly<ShallowRef<T>>` (accessed via `.value`) |
| Tearing prevention | `useSyncExternalStore` handles it | Not needed — Vue batches updates, no concurrent mode |
| Cleanup | Return unsubscribe from subscribe | `onScopeDispose` (works in components, `effectScope`, `watchEffect`) |

**Why `shallowRef` over alternatives:**
- `ref` — Would deep-proxy the Yjs JSON output unnecessarily. We replace `.value` on every change, so deep reactivity is wasted overhead.
- `reactive` — Can't reassign the whole object; we'd need `Object.assign` patterns.
- `customRef` — More complex API for no benefit here. `track()`/`trigger()` are useful for debouncing, not external subscriptions.
- `shallowRef` — Perfect fit. Vue docs explicitly recommend it for "performance optimization of large data structures" and "integration with external state management systems."

### Monorepo Structure

```
├── packages/
│   └── vue-yjs/
│       ├── src/
│       │   ├── index.ts              # Re-exports
│       │   ├── types.ts              # YJsonPrimitive, YJsonValue types
│       │   ├── useY.ts               # Core composable
│       │   ├── useY.test.ts          # Composable tests
│       │   └── equalityDeep.test.ts  # lib0 equality tests
│       ├── tsconfig.json
│       ├── tsup.config.ts
│       ├── CHANGELOG.md
│       └── package.json
├── examples/
│   └── app/
│       ├── src/
│       │   ├── main.ts
│       │   ├── App.vue
│       │   ├── style.css
│       │   └── components/
│       │       ├── SettingsExample.vue
│       │       ├── TodosExample.vue
│       │       └── DeepStructureExample.vue
│       ├── index.html
│       ├── vite.config.ts
│       ├── tsconfig.json
│       ├── env.d.ts
│       └── package.json
├── docs/                            # Reserved for future documentation site
├── vitest.workspace.ts
├── pnpm-workspace.yaml
├── .github/
│   └── workflows/
│       ├── test-and-checks.yml
│       └── deploy-example.yml
├── .npmrc
├── .gitignore
├── .changeset/
│   ├── config.json
│   └── README.md
├── tsconfig.json
├── package.json
├── LICENSE
└── README.md
```

### Implementation Phases

#### Phase 1: Monorepo Scaffold

Set up the pnpm workspace, root configs, and package structure.

**Files to create/modify:**

- `pnpm-workspace.yaml` — workspace definition
- `package.json` — root scripts (build, test, lint, release)
- `tsconfig.json` — root TypeScript config (ESNext, NodeNext)
- `.npmrc` — pnpm settings
- `.gitignore` — standard ignores
- `vitest.workspace.ts` — vitest workspace config
- `.changeset/config.json` — changeset configuration
- `.changeset/README.md` — changeset readme

**Root `package.json` scripts:**
```json
{
  "private": true,
  "scripts": {
    "build": "pnpm build:vue-yjs && pnpm --filter 'app' exec -- pnpm build",
    "build:vue-yjs": "pnpm --filter 'vue-yjs' exec -- pnpm build",
    "lint:check": "eslint packages examples --ext .ts,.vue --max-warnings=0",
    "test": "CI=true pnpm --parallel run test",
    "release": "cp README.md packages/vue-yjs/README.md && pnpm run build && pnpm --filter 'vue-yjs' exec -- pnpm publish --no-git-checks && rm packages/vue-yjs/README.md"
  }
}
```

**Success criteria:**
- [x] `pnpm install` succeeds
- [x] Workspace packages are linked

#### Phase 2: Core Library (`packages/vue-yjs`)

Implement the `useY` composable and types.

**Files:**

- `packages/vue-yjs/package.json`

```json
{
  "name": "vue-yjs",
  "version": "0.1.0",
  "sideEffects": false,
  "type": "module",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    },
    "./package.json": "./package.json"
  },
  "types": "./dist/index.d.ts",
  "scripts": {
    "test": "vitest",
    "build": "tsup",
    "dev": "tsup --watch"
  },
  "dependencies": {
    "lib0": "^0.2.94"
  },
  "peerDependencies": {
    "vue": "^3.3.0",
    "yjs": "^13.6.16"
  },
  "devDependencies": {
    "@vue/test-utils": "^2.4.0",
    "happy-dom": "^14.0.0",
    "vite": "^5.2.13",
    "vitest": "^1.6.0",
    "vue": "^3.4.0",
    "yjs": "^13.6.16"
  }
}
```

- `packages/vue-yjs/src/types.ts` — Same as react-yjs
- `packages/vue-yjs/src/useY.ts` — Core composable (see Architecture section above)
- `packages/vue-yjs/src/index.ts` — `export * from "./useY.js"`
- `packages/vue-yjs/tsup.config.ts` — Same as react-yjs (entry, dts, sourcemap, cjs+esm)
- `packages/vue-yjs/tsconfig.json` — Extends root

**Success criteria:**
- [x] `pnpm build:vue-yjs` produces `dist/` with `.js`, `.cjs`, `.d.ts`, `.d.cts`
- [x] TypeScript infers correct return types: `Y.Array<string>` → `string[]`, `Y.Map<T>` → `Record<string, T>`, `Y.Text` → `string`

#### Phase 3: Tests

Port the react-yjs test suite to Vue composable testing patterns.

**Testing approach:**

Since `useY` uses `onScopeDispose` (a lifecycle-dependent API), we need the `withSetup` helper pattern from Vue's official testing docs:

```ts
// packages/vue-yjs/src/test-utils.ts
import { createApp, type App } from "vue";

export function withSetup<T>(composable: () => T): { result: T; app: App } {
  let result!: T;
  const app = createApp({
    setup() {
      result = composable();
      return () => {};
    },
  });
  app.mount(document.createElement("div"));
  return { result, app };
}
```

**Test files:**

- `packages/vue-yjs/src/equalityDeep.test.ts` — Direct port (no Vue dependency, tests lib0 directly)

```ts
// packages/vue-yjs/src/equalityDeep.test.ts
import { equalityDeep } from "lib0/function";
import { expect, test } from "vitest";

test("should return true for the same number", () => {
  expect(equalityDeep(1, 1)).toBe(true);
});
// ... same tests as react-yjs
```

- `packages/vue-yjs/src/useY.test.ts` — Vue composable tests

```ts
// packages/vue-yjs/src/useY.test.ts
// @vitest-environment happy-dom
import { describe, expect, test, afterEach } from "vitest";
import { nextTick } from "vue";
import * as Y from "yjs";
import { useY } from "./useY.js";
import { withSetup } from "./test-utils.js";

test("should return the initial empty Y.Array", () => {
  const yDoc = new Y.Doc();
  const yArray = yDoc.getArray("myList");
  const { result } = withSetup(() => useY(yArray));
  expect(result.value).toStrictEqual([]);
});

test("should return pre-populated Y.Array data", () => {
  const yDoc = new Y.Doc();
  const yArray = yDoc.getArray("myList");
  yArray.insert(0, ["Alice"]);
  const { result } = withSetup(() => useY(yArray));
  expect(result.value).toStrictEqual(["Alice"]);
});

test("should react to Y.Array changes", async () => {
  const yDoc = new Y.Doc();
  const yArray = yDoc.getArray("myList");
  const { result } = withSetup(() => useY(yArray));

  yArray.insert(0, ["Bob"]);
  // Yjs observer fires synchronously, shallowRef update is immediate
  expect(result.value).toStrictEqual(["Bob"]);
});

test("should react to Y.Map changes", async () => {
  const yDoc = new Y.Doc();
  const yMap = yDoc.getMap("myMap");
  const { result } = withSetup(() => useY(yMap));

  yMap.set("name", "Charlie");
  expect(result.value).toStrictEqual({ name: "Charlie" });
});

test("should react to Y.Text changes", () => {
  const yDoc = new Y.Doc();
  const yText = yDoc.getText("myText");
  const { result } = withSetup(() => useY(yText));

  yText.insert(0, "David");
  expect(result.value).toStrictEqual("David");
});

test("should react to Y.XmlElement changes", () => {
  const yDoc = new Y.Doc();
  const yXmlElement = yDoc.get("myElement", Y.XmlElement);
  const { result } = withSetup(() => useY(yXmlElement));

  yXmlElement.insert(0, [new Y.XmlText("Eve")]);
  expect(result.value).toStrictEqual("<undefined>Eve</undefined>");
});

test("should react to Y.XmlFragment changes", () => {
  const yDoc = new Y.Doc();
  const yXmlFragment = yDoc.get("myFragment", Y.XmlFragment);
  const { result } = withSetup(() => useY(yXmlFragment));

  yXmlFragment.insert(0, [new Y.XmlText("Frank")]);
  expect(result.value).toStrictEqual("Frank");
});

test("should cleanup observer on unmount", () => {
  const yDoc = new Y.Doc();
  const yArray = yDoc.getArray("myList");
  const { result, app } = withSetup(() => useY(yArray));

  app.unmount();

  // After unmount, changes should NOT update the ref
  // (observer should be removed)
  const valueBefore = result.value;
  yArray.insert(0, ["should-not-appear"]);
  expect(result.value).toBe(valueBefore);
});

test("should maintain reference equality when data has not changed", () => {
  const yDoc = new Y.Doc();
  const yMap = yDoc.getMap("myMap");
  yMap.set("key", "value");
  const { result } = withSetup(() => useY(yMap));

  const ref1 = result.value;

  // Trigger a no-op transaction (observeDeep fires but data is same)
  yDoc.transact(() => {
    yMap.set("key", "value");
  });

  expect(result.value).toBe(ref1); // Same reference
});
```

**Success criteria:**
- [x] `pnpm test` passes all tests
- [x] Tests cover: Y.Array, Y.Map, Y.Text, Y.XmlElement, Y.XmlFragment
- [x] Tests verify cleanup on unmount
- [x] Tests verify reference equality (equalityDeep optimization)

#### Phase 4: Example App

A Vue 3 example app demonstrating all use cases, mirroring the react-yjs examples.

**Files:**

- `examples/app/package.json` — Vue 3 + Vite app depending on `vue-yjs: workspace:*`
- `examples/app/vite.config.ts` — `@vitejs/plugin-vue`
- `examples/app/index.html` — Entry HTML
- `examples/app/src/main.ts` — Vue app bootstrap
- `examples/app/src/App.vue` — Root component showing all examples
- `examples/app/src/components/SettingsExample.vue` — Y.Map checkbox example
- `examples/app/src/components/TodosExample.vue` — Y.Array of Y.Map CRUD example
- `examples/app/src/components/DeepStructureExample.vue` — Nested structure with selective listening

Example component (`SettingsExample.vue`):

```vue
<script setup lang="ts">
import { useY } from "vue-yjs";
import * as Y from "yjs";

const yDoc = new Y.Doc();
const ySettings = yDoc.getMap<boolean>("settings");
ySettings.set("weeklyReminderEmail", true);

const settings = useY(ySettings);
</script>

<template>
  <label>
    <input
      type="checkbox"
      :checked="settings.weeklyReminderEmail"
      @change="ySettings.set('weeklyReminderEmail', ($event.target as HTMLInputElement).checked)"
    />
    Weekly Reminder Email
  </label>
  <div>Result: {{ JSON.stringify(settings, null, 2) }}</div>
</template>
```

**Success criteria:**
- [x] `pnpm dev` (in examples/app) starts the dev server
- [x] All three examples work: Settings, Todos, DeepStructure
- [x] Modifying Yjs data immediately reflects in the UI

#### Phase 5: CI/CD & Publishing Setup

- `.github/workflows/test-and-checks.yml` — Lint + test + build on push
- `.github/workflows/deploy-example.yml` — Deploy example to Vercel on main push
- `.changeset/config.json` — Changeset config for versioning
- `LICENSE` — MIT license
- `README.md` — Library documentation

**Success criteria:**
- [x] CI pipeline passes: lint, test, build
- [x] Changeset versioning works

## Acceptance Criteria

### Functional Requirements

- [x] `useY(yMap)` returns a reactive ref that updates when the Y.Map changes
- [x] `useY(yArray)` returns a reactive ref that updates when the Y.Array changes
- [x] `useY(yText)` returns a reactive ref (string) that updates when Y.Text changes
- [x] `useY(yXmlFragment)` returns a reactive ref (string) that updates on changes
- [x] `useY(yXmlElement)` returns a reactive ref (string) that updates on changes
- [x] Deep nested changes trigger updates (via `observeDeep`)
- [x] Selective listening works (pass a subset like `yPosts.get(0).get("tags")`)
- [x] Observer cleanup on component unmount (no memory leaks)
- [x] Reference equality maintained when data hasn't changed (equalityDeep)
- [x] TypeScript infers correct return types from Yjs input types

### Non-Functional Requirements

- [x] Tree-shakeable ESM + CJS dual output
- [x] Zero runtime dependencies beyond `lib0` (peer deps: `vue`, `yjs`)
- [x] Bundle size under 1KB minified
- [x] Works with Vue 3.3+

### Quality Gates

- [x] All vitest tests pass
- [x] TypeScript strict mode, no `any` leaks in public API
- [x] ESLint passes with zero warnings

## Dependencies & Prerequisites

- **pnpm 9+** — Workspace manager
- **Vue 3.3+** — Peer dependency (needs `onScopeDispose`)
- **Yjs 13.6+** — Peer dependency
- **lib0** — Runtime dependency for `equalityDeep`
- **tsup** — Build tool
- **vitest** — Test framework
- **happy-dom** — Test environment (lighter than jsdom)
- **@vue/test-utils** — Vue testing utilities

## Alternative Approaches Considered

### 1. `customRef` instead of `shallowRef`

```ts
export function useY(yData) {
  return customRef((track, trigger) => ({
    get() { track(); return yData.toJSON(); },
    set() { /* read-only */ }
  }));
}
```

**Rejected because:** `customRef` calls `toJSON()` on every `.value` access (no caching). With `shallowRef`, we cache and only update when Yjs fires `observeDeep`. Also, cleanup with `onScopeDispose` is less natural inside `customRef`.

### 2. `reactive()` wrapper

**Rejected because:** Can't replace the whole object reactively — would need `Object.assign` or per-key updates. More complex, same result.

### 3. `computed` wrapping a `ref`

**Rejected because:** Adds an unnecessary layer. `shallowRef` is sufficient since we replace `.value` atomically.

### 4. VueUse-style `useEventListener` pattern

**Rejected because:** VueUse patterns are designed for DOM events, not external state subscriptions with snapshot semantics. Our pattern is simpler and more direct.

## References & Research

### Internal References

- Reference implementation: `packages/react-yjs/src/useY.ts` — React equivalent using `useSyncExternalStore`
- Reference tests: `packages/react-yjs/src/useY.test.ts` — Test patterns to port
- Reference types: `packages/react-yjs/src/types.ts` — Shared type definitions

### External References

- Vue docs — shallowRef for external state: https://vuejs.org/api/reactivity-advanced.html#shallowref
- Vue docs — onScopeDispose: https://vuejs.org/api/reactivity-advanced.html#onscopedispose
- Vue docs — testing composables: https://vuejs.org/guide/scaling-up/testing.html#testing-composables
- Yjs docs — observeDeep: https://docs.yjs.dev/
- react-yjs source: https://github.com/nikgraf/react-yjs
