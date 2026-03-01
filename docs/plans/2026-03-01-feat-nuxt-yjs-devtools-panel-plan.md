---
title: "feat: Add Yjs DevTools Side Panel to Nuxt Example"
type: feat
status: completed
date: 2026-03-01
---

# feat: Add Yjs DevTools Side Panel to Nuxt Example

## Overview

Add an educational, collapsible side panel to the Nuxt collaborative todo example that visualizes what Yjs does under the hood. The panel has three tabs — **Document State**, **Sync & Network**, and **Awareness & Presence** — and serves as a learning tool for developers adopting vue-yjs.

No general-purpose, provider-agnostic Yjs dev tools exist today. The Liveblocks DevTools extension is the closest reference but is locked to their backend. This panel fills that gap as an in-app educational showcase.

## Problem Statement / Motivation

The Nuxt example app demonstrates collaborative todos, but the Yjs layer is invisible — developers can't see the Y.Doc structure, sync protocol messages, or awareness states. This makes it hard to understand *how* vue-yjs works. An educational dev tools panel turns the example into a teaching tool that shows the CRDT machinery in real time.

## Proposed Solution

A `<DevToolsPanel>` component rendered alongside `<TodoApp>` in `index.vue`, accessible via a floating toggle button. Three tabs expose different layers of the Yjs stack:

| Tab | What it shows | Data source |
|-----|---------------|-------------|
| Document State | Live tree of Y.Doc shared types with change highlighting | `doc.share` + `observeDeep` |
| Sync & Network | Scrollable message log (type, direction, bytes, timestamp) | WebSocket interception via `WebSocketPolyfill` |
| Awareness | Connected clients with state, client ID, local/remote label | `awareness.on('change')` |

Additionally, a small **Undo Stack** indicator and **IndexedDB/Connection status** bar provide context on persistence and undo/redo state.

## Architecture

### Component Hierarchy Change

Currently `useCollaboration()` is called inside `TodoApp.vue`, which means its provided Y.Doc is scoped to that component. A sibling `DevToolsPanel` cannot inject it. **Lift `useCollaboration()` to `index.vue`** and pass results down:

```
index.vue
├── useCollaboration('default')   ← lifted here
├── <TodoApp :collaboration="..." />
└── <DevToolsPanel :collaboration="..." />   ← new
```

### Library API Change: Expose `provider` from `useYRoom`

The `WebsocketProvider` instance is created inside `useYRoom` but not returned. The dev tools panel needs it to intercept WebSocket messages. **Add `provider` to `UseYRoomReturn`**.

File: `packages/vue-yjs/src/useYRoom.ts` (line ~97-104)

```typescript
// Current return (missing provider):
return { doc, status, synced, awareness, connect, disconnect }

// Updated return:
return { doc, provider, status, synced, awareness, connect, disconnect }
```

### WebSocket Message Interception Strategy

Use the `WebSocketPolyfill` option supported by `y-websocket`'s `WebsocketProvider`. Wrap the native `WebSocket` constructor with a proxy that captures `send()` and `onmessage` events, decodes the binary y-protocols envelope (first byte = message type), and pushes entries to a reactive ring buffer.

```
WebSocketPolyfill (wraps native WebSocket)
  ├── onmessage → decode → push to messageLog (direction: 'in')
  └── send()    → decode → push to messageLog (direction: 'out')
```

Message type decoding:
- Outer byte: `0` = Sync, `1` = Awareness, `2` = Auth, `3` = QueryAwareness
- For Sync messages, inner byte: `0` = SyncStep1, `1` = SyncStep2, `2` = Update

## New Files

### Composables (in `examples/nuxt-app/app/composables/`)

| File | Purpose |
|------|---------|
| `useDevTools.ts` | Orchestrator: manages panel state (open/closed, active tab), persists to localStorage |
| `useDocTree.ts` | Enumerates `doc.share`, observes changes via `observeDeep`, tracks changed paths for highlighting |
| `useMessageLog.ts` | Ring buffer (max 500 entries) of decoded WebSocket messages. Accumulates even when panel is closed |
| `useWebSocketProxy.ts` | Creates the `WebSocketPolyfill` wrapper that intercepts send/receive and feeds `useMessageLog` |

### Components (in `examples/nuxt-app/app/components/devtools/`)

| File | Purpose |
|------|---------|
| `DevToolsPanel.vue` | Main panel: slide-in container, tab bar, renders active tab content |
| `DevToolsToggle.vue` | Floating button (bottom-right) to open/close the panel |
| `DocTreeTab.vue` | Tab 1: recursive tree view of Y.Doc shared types |
| `DocTreeNode.vue` | Recursive node component: disclosure triangle, type badge, value display, change highlight |
| `SyncLogTab.vue` | Tab 2: message log table with type/direction filters and auto-scroll |
| `SyncLogEntry.vue` | Single log row: timestamp, type pill, direction arrow, byte size |
| `AwarenessTab.vue` | Tab 3: client list with state, color dot, "you" badge for local client |
| `StatusBar.vue` | Bottom bar: connection state, IndexedDB sync state, undo/redo stack depth |

## Technical Considerations

### Performance

- **Ring buffer for messages**: Capped at 500 entries. Oldest evicted on overflow. Prevents unbounded memory growth in long sessions.
- **Change highlighting**: Use `observeDeep` events (provides `path` and `changes`) rather than full JSON diffing. Highlight individual changed leaf properties with a 1.5s CSS fade-out transition.
- **Panel closed = still collecting**: Composables use `v-show` semantics — the data layer (message log, doc tree state) runs regardless of panel visibility. Only rendering is skipped. This means opening the panel shows accumulated history.
- **Tree rendering**: Top-level nodes expanded by default. Y.Map items inside Y.Array collapsed by default to manage visual noise with many todos. Only re-render changed subtrees using Vue's keyed `v-for`.

### Layout

- **Overlay positioning**: `position: fixed; right: 0; top: 0; height: 100vh; width: 400px; z-index: 50`. Does not push main content — overlays it with a subtle backdrop.
- **Slide animation**: `transform: translateX(100%)` → `translateX(0)` with 200ms ease. Respects `prefers-reduced-motion`.
- **Mobile (< 768px)**: Panel becomes full-width bottom sheet (`bottom: 0; height: 60vh`) instead of side panel.
- **Toggle button**: Fixed `bottom-right` corner, above the undo bar. Icon-only (wrench/gear), `40x40px`.

### Keyboard

- `Ctrl+Shift+D` / `Cmd+Shift+D`: Toggle panel open/close
- `Escape`: Close panel (when panel has focus)
- Arrow keys: Navigate tree nodes (Document State tab)
- ARIA tabs pattern for tab navigation

### Accessibility

- Panel: `<aside role="complementary" aria-label="Yjs DevTools">`
- Toggle button: `aria-expanded`, `aria-controls="devtools-panel"`
- Tabs: `role="tablist"` / `role="tab"` / `role="tabpanel"` with `aria-selected`
- Focus moves to panel on open, returns to toggle on close
- Change highlights use both color AND a brief text indicator ("updated") for colorblind users
- `prefers-reduced-motion`: skip slide and highlight animations

### Scope Boundaries

- **In scope**: Document tree, WebSocket message log, awareness panel, undo stack indicator, IndexedDB status, connection status
- **Out of scope (v1)**: BroadcastChannel cross-tab messages (add footnote), message payload deep-decode (show envelope only), editable Y.Doc from the panel, time-travel debugging

## Implementation Phases

### Phase 1: Foundation (composables + panel shell)

1. **Modify `useYRoom`** to return `provider` in its result object
2. **Update `useYRoom` types** (`UseYRoomReturn`) to include `provider: WebsocketProvider`
3. **Create `useWebSocketProxy.ts`** — WebSocketPolyfill factory that intercepts send/receive
4. **Create `useMessageLog.ts`** — ring buffer composable fed by the proxy
5. **Create `useDocTree.ts`** — enumerates `doc.share`, attaches `observeDeep`, tracks changed paths
6. **Create `useDevTools.ts`** — panel state management (open/closed, active tab, localStorage persistence)
7. **Refactor `index.vue`** — lift `useCollaboration()` out of `TodoApp`, pass as props to both `TodoApp` and `DevToolsPanel`
8. **Update `useCollaboration.ts`** — pass `WebSocketPolyfill` option to `useYRoom`, return `provider`
9. **Create `DevToolsPanel.vue`** — panel container with slide animation, tab bar
10. **Create `DevToolsToggle.vue`** — floating button with `Ctrl+Shift+D` shortcut
11. **Update tests** for `useYRoom` return type change

**Deliverable**: Panel opens/closes, tabs switch, no content yet.

### Phase 2: Document State Tab

1. **Create `DocTreeNode.vue`** — recursive tree node with disclosure triangle, type badge (`Y.Map`, `Y.Array`, `Y.Text`), value display
2. **Create `DocTreeTab.vue`** — renders tree from `useDocTree` output, auto-expands on change
3. **Add change highlighting** — 1.5s CSS transition on changed leaf nodes, driven by `observeDeep` event paths
4. **Add StatusBar.vue** — bottom bar showing connection state, IndexedDB sync, undo/redo stack depth

**Deliverable**: Live tree view updates when todos are added/edited/deleted/reordered.

### Phase 3: Sync & Network Tab

1. **Create `SyncLogEntry.vue`** — single row: relative timestamp, type pill (color-coded), direction arrow (↑ out / ↓ in), byte size
2. **Create `SyncLogTab.vue`** — scrollable log, auto-scroll to bottom, filter checkboxes (SyncStep1, SyncStep2, Update, Awareness), clear button
3. **Wire `useWebSocketProxy`** into `useCollaboration` via the `WebSocketPolyfill` option
4. **Add message count + total bytes** summary at the top of the tab

**Deliverable**: Real-time WebSocket message log showing the sync protocol handshake and ongoing updates.

### Phase 4: Awareness Tab

1. **Create `AwarenessTab.vue`** — client list with: color dot, name, client ID, "you" badge for local client, last-updated timestamp
2. **Show awareness metadata** — clock value, time since last update, stale indicator (>15s)
3. **Add join/leave event log** — small log below the client list showing "Client 1234 joined" / "Client 5678 left" with timestamps

**Deliverable**: Live presence panel showing connected clients and their state changes.

### Phase 5: Polish & Testing

1. **Mobile responsive layout** — bottom sheet below 768px
2. **Keyboard navigation** — arrow keys for tree, escape to close, `Ctrl+Shift+D` toggle
3. **ARIA attributes** — tabs pattern, complementary landmark, focus management
4. **`prefers-reduced-motion`** — disable animations
5. **Write tests** for composables (`useDocTree`, `useMessageLog`, `useDevTools`)
6. **E2E test** — open panel, verify tree updates when todo is added, verify message log shows entries

## Acceptance Criteria

### Functional

- [ ] Floating toggle button opens/closes the dev tools panel
- [ ] `Ctrl+Shift+D` / `Cmd+Shift+D` toggles the panel
- [ ] Panel has 3 tabs: Document State, Sync & Network, Awareness
- [ ] Document State tab shows a live tree of all Y.Doc shared types via `doc.share`
- [ ] Changed values highlight briefly (1.5s fade) when mutations occur
- [ ] Tree nodes are expandable/collapsible with disclosure triangles
- [ ] Sync & Network tab shows a scrollable log of WebSocket messages
- [ ] Each log entry shows: message type, direction (in/out), byte size, timestamp
- [ ] Message type filters allow hiding specific message types
- [ ] Awareness tab shows all connected clients with name, color, client ID
- [ ] Local client is labeled "you"
- [ ] Status bar shows: connection state, IndexedDB sync state, undo/redo stack depth
- [ ] Panel state (open/closed, active tab) persists across page refreshes via localStorage
- [ ] Message log accumulates up to 500 entries even when panel is closed

### Non-Functional

- [ ] Panel does not degrade app performance (message log capped, tree uses keyed v-for)
- [ ] Panel is accessible: ARIA tabs, focus management, keyboard navigation
- [ ] Panel respects `prefers-reduced-motion`
- [ ] Mobile layout switches to full-width bottom sheet below 768px
- [ ] `useYRoom` now returns `provider` in its public API

### Testing

- [ ] Unit tests for `useDocTree`, `useMessageLog`, `useDevTools` composables
- [ ] Updated tests for `useYRoom` return type
- [ ] E2E test: open panel → add todo → verify tree update + message log entry

## Dependencies & Risks

| Risk | Mitigation |
|------|------------|
| `WebSocketPolyfill` may not capture all message types | Validate against the actual y-websocket source; the polyfill wraps at the WebSocket level, below y-websocket |
| Lifting `useCollaboration` changes TodoApp's interface | Keep props minimal; pass a typed collaboration object |
| `useYRoom` API change is a breaking change | The library is pre-1.0; document the addition in changelog |
| `doc.share` is semi-internal to Yjs | It's a stable `Map<string, AbstractType>` used by yjs-inspector; safe to rely on |
| High-frequency `observeDeep` during typing | Highlight uses CSS transitions (no JS timers); tree only re-renders changed subtree |

## References & Research

### Internal References

- Nuxt example entry: `examples/nuxt-app/app/pages/index.vue`
- Current collaboration composable: `examples/nuxt-app/app/composables/useCollaboration.ts`
- Todo list composable: `examples/nuxt-app/app/composables/useTodoList.ts`
- useYRoom source: `packages/vue-yjs/src/useYRoom.ts` (lines 97-104 — return object)
- useWebSocketProvider: `packages/vue-yjs/src/useWebSocketProvider.ts`
- useUndoManager: `packages/vue-yjs/src/useUndoManager.ts`

### External References

- Yjs Inspector (official playground): https://github.com/yjs/yjs-inspector
- Liveblocks DevTools (reference for UI patterns): https://liveblocks.io/docs/tools/devtools
- y-protocols sync spec: https://github.com/yjs/y-protocols/blob/master/PROTOCOL.md
- Yjs Document Updates API (`Y.logUpdate`): https://docs.yjs.dev/api/document-updates
- Yjs Awareness API: https://docs.yjs.dev/api/about-awareness
- Vue DevTools Plugin API (v6): https://devtools-v6.vuejs.org/plugin/plugins-guide

### Design Decisions

- **In-app panel over Vue DevTools extension**: The goal is education — developers should see the panel *alongside* the app, not in a separate browser tab. Also avoids the Firefox SFC custom tab bug.
- **Overlay over push-aside layout**: Simpler implementation, no layout reflow, works better on narrow viewports.
- **Ring buffer over unlimited log**: Predictable memory usage; 500 entries covers ~30 min of active collaboration.
- **`doc.share` enumeration over hardcoded types**: Makes the panel generalizable; works for any Y.Doc structure, not just `todos`.
- **BroadcastChannel out of scope for v1**: Cross-tab sync is a secondary concern; footnote it in the UI to avoid confusion.
