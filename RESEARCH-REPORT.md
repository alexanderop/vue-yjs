# vue-yjs Library Evaluation Report

> **Research Date:** March 2026
> **Compared Against:** BlockSuite/AFFiNE, Hocuspocus (TipTap), Liveblocks, y-sweet, y-mongodb, y-indexeddb, TipTap Vue 3, VueUse

---

## Verdict: vue-yjs is solid and well-designed

The core design decisions (shallowRef, onScopeDispose, provide/inject, persistence strategy) are correct and sometimes better than established projects. The library fills a real gap — no existing Vue library provides general-purpose reactive Yjs composables.

---

## Table of Contents

1. [Reactive Binding Patterns](#1-reactive-binding-patterns)
2. [Awareness / Presence](#2-awareness--presence)
3. [Undo / Redo](#3-undo--redo)
4. [Provider & Lifecycle Management](#4-provider--lifecycle-management)
5. [Persistence Strategies](#5-persistence-strategies)
6. [Server Architecture](#6-server-architecture)
7. [Vue Ecosystem Conventions](#7-vue-ecosystem-conventions)
8. [Feature Comparison Matrix](#8-feature-comparison-matrix)
9. [Gaps & Recommendations](#9-gaps--recommendations)

---

## 1. Reactive Binding Patterns

### vue-yjs (your approach)

```ts
// useY.ts — shallowRef + observeDeep + equalityDeep
export function useY<T extends Y.AbstractType<any>>(yData: T): Readonly<ShallowRef<YTypeToJson<T>>> {
  const data = shallowRef(yData.toJSON())

  const observer = () => {
    const newValue = yData.toJSON()
    if (!equalityDeep(data.value, newValue)) {
      data.value = newValue
    }
  }

  yData.observeDeep(observer)
  onScopeDispose(() => yData.unobserveDeep(observer))

  return data as Readonly<ShallowRef<YTypeToJson<T>>>
}
```

**Why this is good:**
- `shallowRef` avoids deep-proxying large Yjs JSON snapshots
- `equalityDeep` prevents spurious re-renders (goes beyond what VueUse does)
- `observeDeep` catches nested changes in Y.Map/Y.Array hierarchies
- `onScopeDispose` works in components AND standalone effectScopes

### BlockSuite/AFFiNE (Proxy + Preact Signals — 3 access patterns)

**GitHub:** https://github.com/toeverything/blocksuite (BlockSuite), https://github.com/toeverything/AFFiNE (AFFiNE)

```ts
// BlockSuite provides THREE ways to access the same data:

// 1. Direct Yjs access
model.yBlock.get('prop:title')

// 2. JavaScript Proxy (reactive mutations)
model.props.title = 'New Title'  // triggers Y.Map.set() under the hood

// 3. Preact Signal (reactive reads)
model.props.title$  // Signal<string> — auto-updates on Yjs changes

// The proxy system wraps Y.Map and Y.Array:
function createYProxy(yAbstract: Y.Map<unknown> | Y.Array<unknown>) {
  if (yAbstract instanceof Y.Array) {
    return new ReactiveYArray(yAbstract).proxy
  }
  if (yAbstract instanceof Y.Map) {
    return new ReactiveYMap(yAbstract).proxy
  }
}

// Proxy traps translate JS operations to Yjs operations:
class ReactiveYMap {
  proxy = new Proxy({}, {
    set: (_, key, value) => {
      this._transact(doc, () => {
        this._yMap.set(key, native2Y(value))
      })
      return true
    },
    get: (_, key) => {
      return y2Native(this._yMap.get(key))
    }
  })
}

// Bidirectional sync via SyncController:
// Proxy set → Yjs update AND Yjs observe → Signal/Proxy update
// Mutex protection prevents infinite loops
```

**Takeaway:** BlockSuite's approach is far more complex (Proxies + Signals + direct access). vue-yjs's single `useY()` composable is simpler and more Vue-idiomatic.

### y-sweet React Hooks

**GitHub:** https://github.com/jamsocket/y-sweet

```tsx
// y-sweet provides type-specific hooks that re-render on changes:
import { useMap, useArray, useText } from '@y-sweet/react'

function TodoApp() {
  const items = useArray('todos')    // Y.Array — re-renders on any change
  const settings = useMap('settings') // Y.Map — re-renders on any change
  const title = useText('title')      // Y.Text — re-renders on any change

  return (
    <ul>
      {items?.toArray().map(item => <li key={item}>{item}</li>)}
    </ul>
  )
}

// Provider wraps the app:
<YDocProvider docId={id} authEndpoint="/api/auth">
  <TodoApp />
</YDocProvider>
```

**Takeaway:** y-sweet has separate hooks per type. vue-yjs's single generic `useY(yType)` handles all types — more flexible.

### Liveblocks React Hooks (selector-based)

**GitHub:** https://github.com/liveblocks/liveblocks

```tsx
// Liveblocks uses selector functions to minimize re-renders:
import { useSelf, useOthers } from '@liveblocks/react'

function Cursors() {
  // Only re-renders when cursor changes, not all presence
  const cursor = useSelf((me) => me.presence.cursor)

  // Selector + equality function for fine-grained control
  const others = useOthers(
    (others) => others.filter(o => o.presence.isTyping),
    shallow  // equality comparator
  )

  return <div>{others.length} people typing</div>
}
```

**Takeaway:** Vue's reactivity system handles this more naturally via `computed` — no need for explicit selectors. vue-yjs's approach is cleaner.

### TipTap Vue 3 (minimal — no reactive Yjs binding)

**GitHub:** https://github.com/ueberdosis/tiptap

```ts
// TipTap's useEditor is ~15 lines with no reactive Yjs integration:
export const useEditor = (options: Partial<EditorOptions> = {}) => {
  const editor = shallowRef<Editor>()

  onMounted(() => {
    editor.value = new Editor(options)
  })

  onBeforeUnmount(() => {
    editor.value?.destroy()
  })

  return editor
}

// No reactive options support — manual watchers required:
const editor = useEditor({ /* static options only */ })
watch(editable, val => editor.value?.setEditable(val)) // manual!

// No general useY() equivalent — Yjs is hidden inside ProseMirror plugins
```

**Takeaway:** TipTap's Vue integration is surprisingly weak. vue-yjs provides significantly better Vue-native Yjs bindings.

---

## 2. Awareness / Presence

### vue-yjs

```ts
// useAwareness.ts — reactive states Map + local state setters
const { states, localClientId, setLocalState, setLocalStateField } = useAwareness<{
  name: string
  color: string
  cursor?: { x: number; y: number }
}>(provider.awareness)

// states is Readonly<ShallowRef<Map<number, T>>>
// Automatically updates on awareness 'change' event
// Cleanup via onScopeDispose
```

### Liveblocks (separate hooks for self vs others)

**GitHub:** https://github.com/liveblocks/liveblocks

```tsx
// Liveblocks splits presence into multiple specialized hooks:

// Current user's presence (tuple return)
const [myPresence, updateMyPresence] = useMyPresence()
updateMyPresence({ cursor: { x: 100, y: 200 } })

// Other users (with selector for perf)
const others = useOthers()
const othersWithCursor = useOthers(
  (others) => others.filter(o => o.presence.cursor !== null),
  shallow
)

// Mapped access pattern
const othersCursors = useOthersMapped((other) => ({
  cursor: other.presence.cursor,
  name: other.info?.name
}))

// Connection-level events
useOthersListener(({ type, user, others }) => {
  if (type === 'enter') console.log(`${user.info.name} joined`)
  if (type === 'leave') console.log(`${user.info.name} left`)
})

// Setter-only hook (fewer re-renders)
const updatePresence = useUpdateMyPresence()
```

### BlockSuite AFFiNE (AwarenessEngine with pluggable sources)

**GitHub:** https://github.com/toeverything/blocksuite (BlockSuite), https://github.com/toeverything/AFFiNE (AFFiNE)

```ts
// BlockSuite abstracts awareness into an engine with multiple sources:
interface AwarenessSource {
  connect(awareness: Awareness): void
  disconnect(): void
}

class AwarenessEngine {
  constructor(
    private awareness: Awareness,
    private sources: AwarenessSource[]
  ) {}

  connect() {
    this.sources.forEach(s => s.connect(this.awareness))
  }

  disconnect() {
    this.sources.forEach(s => s.disconnect())
  }
}

// AwarenessStore wraps y-protocols/awareness with Preact signals:
class AwarenessStore {
  getFlag(key: string): Signal<boolean>   // reactive feature flags
  setFlag(key: string, value: boolean): void
  destroy(): void                          // cleanup
}
```

### TipTap (imperative, no reactive wrapper)

**GitHub:** https://github.com/ueberdosis/tiptap

```ts
// TipTap wraps awareness inside CollaborationCursor extension:
const editor = new Editor({
  extensions: [
    CollaborationCursor.configure({
      provider: hocuspocusProvider,
      user: { name: 'John', color: '#ff0000' }
    })
  ]
})

// Update via editor command (imperative, not reactive):
editor.commands.updateUser({ name: 'Jane', color: '#00ff00' })

// Or via provider directly:
provider.setAwarenessField('user', { name: 'Jane' })

// Reading other users requires event listeners (no reactive state):
provider.on('awarenessChange', ({ states }) => {
  // manually handle state changes
})
```

**Takeaway:** vue-yjs's `useAwareness` is cleaner than all alternatives for Vue developers. Liveblocks has more granular hooks but no Vue support. TipTap has no reactive awareness at all.

---

## 3. Undo / Redo

### vue-yjs

```ts
// useUndoManager.ts — reactive wrapper around Y.UndoManager
const { undo, redo, canUndo, canRedo, stopCapturing, clear } = useUndoManager(yArray, {
  captureTimeout: 500,     // merge edits within 500ms
  trackedOrigins: new Set() // filter by origin
})

// canUndo/canRedo are reactive computed refs
// Listens to 'stack-item-added', 'stack-item-popped', 'stack-cleared'
// Cleanup via onScopeDispose
```

### BlockSuite/AFFiNE

**GitHub:** https://github.com/toeverything/blocksuite (BlockSuite), https://github.com/toeverything/AFFiNE (AFFiNE)

```ts
// Y.UndoManager scoped to clientID, integrated into BlockCollection:
class BlockCollection {
  private _undoManager: Y.UndoManager

  transact(fn: () => void) {
    this.yBlock.doc?.transact(() => fn(), this.doc.clientID)
  }

  // Reactive via Preact signals:
  _canUndo$: Signal<boolean>
  _canRedo$: Signal<boolean>

  // Stash/pop mechanism for batch updates during undo/redo:
  stashProp(key: string): void   // temporarily disable Yjs sync
  popProp(key: string): void     // re-enable and apply
}
```

### TipTap (ProseMirror plugin, no reactive state)

**GitHub:** https://github.com/ueberdosis/tiptap

```ts
// Undo/redo is a ProseMirror plugin, not a composable:
const editor = new Editor({
  extensions: [
    // MUST disable default history:
    StarterKit.configure({ history: false }),
    Collaboration.configure({ document: ydoc }),
  ]
})

// Imperative commands only — no canUndo/canRedo refs:
editor.commands.undo()
editor.commands.redo()

// Check capability imperatively:
editor.can().undo()  // returns boolean, NOT reactive
editor.can().redo()
```

**Takeaway:** vue-yjs's reactive `canUndo`/`canRedo` refs are a clear advantage over TipTap's imperative approach.

---

## 4. Provider & Lifecycle Management

### vue-yjs

```ts
// useWebSocketProvider.ts — reactive provider with auto-lifecycle
const { provider, awareness, status, synced, connect, disconnect } = useWebSocketProvider(
  'ws://localhost:3000',
  'my-room',
  doc,
  { connect: true } // auto-connect, lazy option available
)

// status: Readonly<ShallowRef<'connecting' | 'connected' | 'disconnected'>>
// synced: Readonly<ShallowRef<boolean>>
// Auto-disconnects on scope disposal
```

### Hocuspocus Provider (imperative, event-based)

**GitHub:** https://github.com/ueberdosis/hocuspocus

```ts
// HocuspocusProvider — manual lifecycle, event listeners for status:
const provider = new HocuspocusProvider({
  url: 'ws://localhost:1234',
  name: 'my-document',
  document: ydoc,
  token: 'my-auth-token',

  // Status via callbacks (not reactive refs):
  onConnect: () => console.log('connected'),
  onDisconnect: () => console.log('disconnected'),
  onSynced: ({ state }) => console.log('synced:', state),
  onStatus: ({ status }) => console.log('status:', status),
  onAuthenticationFailed: ({ reason }) => console.error(reason),
  onClose: ({ event }) => console.log('closed'),

  // Reconnection config:
  WebSocketPolyfill: WebSocket,
  forceSyncInterval: false,
  messageReconnectTimeout: 30000,
})

// Manual lifecycle control:
provider.connect()
provider.disconnect()
provider.destroy()  // must call manually!
```

### Liveblocks (managed, factory-based)

**GitHub:** https://github.com/liveblocks/liveblocks

```ts
// Liveblocks — factory function prevents duplicate providers:
import { getYjsProviderForRoom } from '@liveblocks/yjs'

const room = client.enterRoom('my-room', {
  initialPresence: { cursor: null }
})

// Singleton provider per room — automatically cleaned up with room:
const yProvider = getYjsProviderForRoom(room, {
  autoloadSubdocs: false,
  offlineSupport_experimental: true
})

// connect() and disconnect() are NO-OPS — Liveblocks manages connections:
yProvider.connect()     // does nothing
yProvider.disconnect()  // does nothing

// Connection status via room subscription:
const status = room.getStatus()  // 'initial' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected'
room.subscribe('status', (status) => { /* ... */ })
```

### y-sweet React (provider component pattern)

**GitHub:** https://github.com/jamsocket/y-sweet

```tsx
// y-sweet — React context provider with auth endpoint:
import { YDocProvider } from '@y-sweet/react'

function App() {
  return (
    <YDocProvider
      docId="my-doc-id"
      authEndpoint="/api/auth"  // server-side token generation
    >
      <CollaborativeEditor />
    </YDocProvider>
  )
}

// Connection hooks inside provider:
function CollaborativeEditor() {
  const status = useConnectionStatus()
  // "offline" | "connecting" | "error" | "handshaking" | "connected"

  const hasLocalChanges = useHasLocalChanges()
  // boolean — true when unsynced changes exist

  const provider = useYjsProvider()
  // raw provider for escape-hatch access
}
```

**Takeaway:** vue-yjs's approach is the most Vue-idiomatic. Others are either imperative (Hocuspocus/TipTap), React-specific (y-sweet), or vendor-locked (Liveblocks).

---

## 5. Persistence Strategies

### vue-yjs Nuxt Server (2-tier: incremental + snapshots)

```ts
// yjs-persistence.ts — batched incremental updates + compaction
const COMPACTION_THRESHOLD = 100
const BATCH_INTERVAL = 500

export function persistUpdate(roomName: string, update: Uint8Array) {
  // Batch updates in memory
  pendingUpdates.get(roomName)?.push(update)

  // Flush to DB every 500ms
  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      const merged = Y.mergeUpdates(pendingUpdates.get(roomName)!)
      db.insert(yjsUpdates).values({ roomName, update: merged })
      maybeCompact(roomName)
    }, BATCH_INTERVAL)
  }
}

function maybeCompact(roomName: string) {
  const count = db.select({ count: count() })
    .from(yjsUpdates)
    .where(eq(yjsUpdates.roomName, roomName))

  if (count >= COMPACTION_THRESHOLD) {
    // Create full snapshot, delete old incremental updates
    const doc = new Y.Doc()
    // Apply snapshot + all updates...
    const snapshot = Y.encodeStateAsUpdate(doc)
    db.insert(yjsSnapshots).values({ roomName, snapshot })
      .onConflictDoUpdate(/* upsert */)
    db.delete(yjsUpdates).where(eq(yjsUpdates.roomName, roomName))
  }
}
```

### Hocuspocus (full document store — simpler but less efficient)

**GitHub:** https://github.com/ueberdosis/hocuspocus

```ts
// @hocuspocus/extension-database — stores FULL state every time:
const server = new Hocuspocus({
  debounce: 2000,      // wait 2s after last change
  maxDebounce: 10000,  // max wait 10s

  extensions: [
    new Database({
      // Fetch full document state:
      fetch: async ({ documentName }) => {
        const row = await db.findOne({ name: documentName })
        return row?.data || null  // Uint8Array
      },

      // Store FULL document state (not incremental!):
      store: async ({ documentName, state }) => {
        // state = Y.encodeStateAsUpdate(doc) — entire document
        await db.upsert({ name: documentName, data: state })
      }
    })
  ]
})

// Production deployments (e.g., Lunch Box) add extra layers:
// Journaling → Redis (1s debounce) → Database (400 updates threshold) → Periodic saves (3min)
```

### y-mongodb-provider (incremental with configurable compaction)

**GitHub:** https://github.com/yjs/y-mongodb-provider

```ts
// y-mongodb-provider — incremental updates with flushSize compaction:
const persistence = new MongodbPersistence(connectionString, {
  collectionName: 'yjs-writings',
  flushSize: 400,            // compact after 400 updates
  multipleCollections: false  // true = one collection per doc
})

// Standard API (same as y-leveldb):
await persistence.storeUpdate(docName, update)   // append incremental
await persistence.getYDoc(docName)                // reconstruct from updates
await persistence.getStateVector(docName)         // fast — no doc reconstruction
await persistence.getDiff(docName, stateVector)   // fast — no doc reconstruction
await persistence.flushDocument(docName)          // force compaction
await persistence.clearDocument(docName)          // delete everything
```

### BlockSuite/AFFiNE Server (3-tier PostgreSQL + Rust CRDT engine)

**GitHub:** https://github.com/toeverything/blocksuite (BlockSuite), https://github.com/toeverything/AFFiNE (AFFiNE)

```ts
// AFFiNE uses three PostgreSQL tables:

// 1. Updates table — every push creates a row:
await db.insert(updates).values({
  workspaceId,
  docId,
  blob: crdtUpdate,        // binary CRDT update
  createdAt: new Date()
})

// 2. Snapshots table — periodically merged state:
await DocModel.createSnapshot({
  workspaceId,
  docId,
  blob: Y.encodeStateAsUpdate(mergedDoc)
})

// 3. Snapshot histories — point-in-time backups with TTL:
await db.insert(snapshotHistories).values({
  workspaceId,
  docId,
  blob: snapshot,
  expiredAt: addDays(new Date(), 30)
})

// Uses y-octo (Rust via NAPI-RS) for efficient binary operations:
import { Doc } from '@affine/server-native'
const doc = new Doc()
doc.apply_update(binaryUpdate)
const state = doc.encode_state_as_update()
const merged = Doc.merge_updates([update1, update2])
```

### y-sweet (binary blob with dirty-flag)

**GitHub:** https://github.com/jamsocket/y-sweet

```rust
// y-sweet (Rust) — stores documents as binary files on S3/filesystem:
// Path: {key}/data.ysweet

// Dirty tracking with AtomicBool — only persists when changed:
pub struct SyncKv {
    dirty: AtomicBool,
    data: BTreeMap<Vec<u8>, Vec<u8>>,
    store: Option<Box<dyn Store>>,
}

impl SyncKv {
    pub fn push_update(&self, update: &[u8]) {
        self.data.insert(key, update.to_vec());
        self.dirty.store(true, Ordering::SeqCst);
    }

    pub async fn flush_doc_with(&self) {
        if self.dirty.load(Ordering::SeqCst) {
            let encoded = bincode::serialize(&self.data)?;
            self.store.set(&self.path, encoded).await?;
            self.dirty.store(false, Ordering::SeqCst);
        }
    }
}
```

### Comparison Table

| Implementation | Strategy | Compaction Threshold | Batching | Efficiency |
|---|---|---|---|---|
| **vue-yjs nuxt** | Incremental + snapshots | 100 updates | 500ms timer | Good |
| Hocuspocus (default) | Full document store | None | 2s debounce | Poor for write-heavy |
| y-mongodb-provider | Incremental updates | 400 (flushSize) | Per-update | Good |
| y-indexeddb | Incremental updates | 500 | 1000ms debounce | Good |
| y-sweet | Full binary blob | None (dirty-flag) | Lazy persist | Moderate |
| AFFiNE | 3-tier (updates+snapshots+history) | Periodic jobs | Per-update | Best |

**Takeaway:** vue-yjs's persistence strategy is more sophisticated than Hocuspocus and y-sweet defaults. The incremental + compaction approach matches the pattern used by production systems.

---

## 6. Server Architecture

### vue-yjs Nuxt Server

```ts
// server/routes/_ws.ts — Nitro WebSocket handler
defineWebSocketHandler({
  open(peer) {
    const room = getOrCreateRoom(roomName)
    room.peers.add(peer)
    // Send SyncStep1 to new peer
    const sv = Y.encodeStateVector(room.doc)
    peer.send(encoding.toUint8Array(/* syncStep1 + sv */))
    // Send existing awareness states
  },

  message(peer, message) {
    // Decode message type
    if (messageType === MESSAGE_SYNC) {
      readSyncMessage(decoder, encoder, room.doc, null)
      // Broadcast to other peers in room
    } else if (messageType === MESSAGE_AWARENESS) {
      applyAwarenessUpdate(room.awareness, update, peer)
      // Broadcast awareness to others
    }
  },

  close(peer) {
    room.peers.delete(peer)
    removeAwarenessStates(room.awareness, [peer.clientId], null)
    // 30s grace period before room destruction
    if (room.peers.size === 0) {
      room.destroyTimer = setTimeout(() => destroyRoom(roomName), 30_000)
    }
  }
})
```

### Hocuspocus (extension-based, 20+ lifecycle hooks)

**GitHub:** https://github.com/ueberdosis/hocuspocus

```ts
// Hocuspocus server — full lifecycle hooks:
const server = new Hocuspocus({
  port: 1234,
  debounce: 2000,
  maxDebounce: 10000,
  timeout: 30000,  // health check interval

  // Authentication:
  async onAuthenticate({ token, documentName, connection }) {
    const user = await validateToken(token)
    if (!user) throw new Error('Unauthorized')
    connection.readOnly = !user.canEdit  // read-only mode
    return { userId: user.id, name: user.name }  // context for other hooks
  },

  // Document lifecycle:
  async onLoadDocument({ document, documentName, context }) {
    const data = await db.findOne({ name: documentName })
    if (data) Y.applyUpdate(document, data.state)
    return document
  },

  async onStoreDocument({ document, documentName, context }) {
    const state = Y.encodeStateAsUpdate(document)
    await db.upsert({ name: documentName, state })
  },

  async onChange({ document, documentName, context, update }) {
    // Fires on every change (not debounced)
    await publishToWebhook(documentName, update)
  },

  async onDisconnect({ documentName, context }) {
    await logUserDisconnect(context.userId, documentName)
  },

  // Extensions for composability:
  extensions: [
    new SQLite({ database: 'db.sqlite' }),
    new Redis({ host: 'localhost', port: 6379 }),  // horizontal scaling
    new Logger(),
    new Throttle({ throttle: 15, banTime: 5 }),
  ]
})
```

### AFFiNE (NestJS + Socket.IO + Redis)

**GitHub:** https://github.com/toeverything/AFFiNE

```ts
// AFFiNE SpaceSyncGateway — NestJS WebSocket gateway:
@WebSocketGateway({ namespace: '/sync' })
class SpaceSyncGateway {
  @SubscribeMessage('space:join')
  async onJoin(client: Socket, { spaceId, spaceType }) {
    await this.assertPermission(client, spaceId)
    client.join(`${spaceType}:${spaceId}:sync-026`)
  }

  @SubscribeMessage('space:push-doc-update')
  async onPushUpdate(client: Socket, { spaceId, docId, update }) {
    // Validate permission
    await this.adapter.push(spaceId, docId, Buffer.from(update))
    // Broadcast to room via Socket.IO (Redis-backed for horizontal scaling)
    client.to(roomName).emit('space:broadcast-doc-update', { docId, update })
  }

  @SubscribeMessage('space:load-doc')
  async onLoadDoc(client: Socket, { spaceId, docId, stateVector }) {
    const { missing, state } = await this.adapter.pull(spaceId, docId, stateVector)
    return { data: missing, stateVector: state }
  }
}

// Redis adapter for multi-instance scaling:
const io = new Server({ adapter: createAdapter(pubClient, subClient) })
```

**Takeaway:** vue-yjs's server is simpler than Hocuspocus/AFFiNE but covers the essentials. The main gap is authentication.

---

## 7. Vue Ecosystem Conventions

### Cleanup Pattern Comparison

```ts
// VueUse uses tryOnScopeDispose (safe for edge cases):
import { tryOnScopeDispose } from '@vueuse/shared'

export function useWebSocket(url) {
  const ws = new WebSocket(url)
  tryOnScopeDispose(() => ws.close())  // no-op if called outside scope
  return { /* ... */ }
}

// vue-yjs uses onScopeDispose directly (works but less defensive):
export function useWebSocketProvider(url, room, doc) {
  const provider = new WebsocketProvider(url, room, doc)
  onScopeDispose(() => provider.destroy())  // throws if no active scope
  return { /* ... */ }
}
```

### Error Handling Patterns

```ts
// VueUse useAsyncState — error ref + callback + throw option:
const { state, error, isLoading } = useAsyncState(
  fetchData(),
  initialValue,
  {
    onError: (err) => console.error(err),
    throwError: false,  // or true to let errors propagate
  }
)
// error is Ref<unknown> — reactive, usable in templates

// VueUse useWebSocket — callback-only (event-driven):
const { status, data } = useWebSocket(url, {
  onConnected: (ws) => console.log('connected'),
  onDisconnected: (ws, event) => console.log('disconnected'),
  onError: (ws, event) => console.error('error'),
  onMessage: (ws, event) => console.log('message'),
})

// vue-yjs useWebSocketProvider — NO error handling:
const { status, synced } = useWebSocketProvider(url, room, doc)
// Missing: error ref, onError callback, onDisconnected callback
```

### Return Value Conventions

```ts
// VueUse convention — object of individual refs:
const { x, y, sourceType } = useMouse()       // object return
const isActive = useActive()                     // single ref for simple cases

// VueUse "dynamic return" pattern — single ref by default, object with controls:
const timestamp = useTimestamp()                  // just the value
const { timestamp, pause, resume } = useTimestamp({ controls: true })

// vue-yjs follows the object pattern correctly:
const { provider, awareness, status, synced, connect, disconnect } = useWebSocketProvider(...)
const { undo, redo, canUndo, canRedo, stopCapturing, clear } = useUndoManager(...)
const data = useY(yArray)  // single ref — appropriate for simple case
```

### provide/inject Comparison

```ts
// VueUse provideLocal / injectLocal:
import { provideLocal, injectLocal } from '@vueuse/shared'
// Stores in WeakMap keyed by component instance
// Allows provide + inject in SAME component

// vue-yjs reimplements the same pattern (good — avoids VueUse dependency):
// localProvide.ts — nearly identical WeakMap implementation
const localProvidedStateMap = new WeakMap<ComponentInternalInstance, Record<string | symbol, unknown>>()

export function provideLocal<T>(key: InjectionKey<T> | string, value: T): void {
  const instance = getCurrentInstance()!
  if (!localProvidedStateMap.has(instance)) {
    localProvidedStateMap.set(instance, {})
  }
  localProvidedStateMap.get(instance)![key as string] = value
  provide(key, value)
}

export function injectLocal<T>(key: InjectionKey<T> | string, fallback?: T): T {
  const instance = getCurrentInstance()!
  const local = localProvidedStateMap.get(instance)?.[key as string]
  if (local !== undefined) return local as T
  return inject(key, fallback)
}
```

---

## 8. Feature Comparison Matrix

| Feature | vue-yjs | BlockSuite | Hocuspocus | Liveblocks | y-sweet | TipTap Vue |
|---|---|---|---|---|---|---|
| Reactive Yjs binding | `shallowRef` + `observeDeep` | Proxy + Signals | N/A (server) | React selectors | React hooks | None |
| Generic (any Y type) | Yes | Yes (via proxy) | N/A | No (presence only) | Per-type hooks | No |
| Awareness composable | `useAwareness` | AwarenessEngine | Hooks | `useOthers`/`useSelf` | `usePresence` | Imperative only |
| Undo/redo | Reactive refs | Reactive signals | N/A | N/A | N/A | Imperative only |
| Provider lifecycle | Auto (scope) | Manual | N/A (is server) | Managed | Auto (provider) | Manual |
| IndexedDB persistence | `useIndexedDB` | nbstore | N/A | Experimental | N/A | Raw y-indexeddb |
| Error handling | Minimal | Slots/events | Full hooks | Full hooks | Status refs | None |
| SSR safety | None | N/A | N/A | N/A | React-based | None |
| Auth | None | Permission adapters | `onAuthenticate` | Built-in | HMAC tokens | Via Hocuspocus |
| Horizontal scaling | No | Redis pub/sub | Redis extension | Managed | Session backend | Via Hocuspocus |
| Subdocuments | No | Core feature | Yes | Yes | No | No |
| Update compaction | 100 updates | Periodic jobs | None (full state) | Managed | Dirty-flag | N/A |
| Grace period on disconnect | 30s timer | `canGracefulStop()` | None (immediate) | Managed | Managed | N/A |
| Vue-native API | Yes | No (Preact signals) | No | No (React only) | No (React only) | Minimal |

---

## 9. Gaps & Recommendations

### Must-Have (before v1.0)

#### 1. Error handling for `useWebSocketProvider`

```ts
// Current: no error handling
const { status, synced } = useWebSocketProvider(url, room, doc)

// Recommended:
const { status, synced, error, onError, onDisconnected } = useWebSocketProvider(url, room, doc, {
  onError: (event) => console.error('WebSocket error:', event),
  onDisconnected: (event) => console.warn('Disconnected:', event),
})
// error: Readonly<ShallowRef<Event | null>>
```

#### 2. SSR safety guards

```ts
// Add to all composables that use browser APIs:
import { getCurrentInstance } from 'vue'

export function useWebSocketProvider(url, room, doc, options) {
  if (typeof window === 'undefined') {
    // Return inert refs for SSR
    return {
      provider: shallowRef(null),
      status: shallowRef('disconnected'),
      synced: shallowRef(false),
      // ...
    }
  }
  // ... normal implementation
}
```

#### 3. Authentication in the Nuxt example

```ts
// server/routes/_ws.ts — add token validation:
defineWebSocketHandler({
  open(peer) {
    const url = new URL(peer.request.url, 'http://localhost')
    const token = url.searchParams.get('token')
    if (!validateToken(token)) {
      peer.close(4001, 'Unauthorized')
      return
    }
    // ... existing room setup
  }
})
```

### Should-Have

#### 4. Convenience boolean refs

```ts
// Add to useWebSocketProvider return:
const isConnected = computed(() => status.value === 'connected')
const isSynced = computed(() => synced.value === true)
```

#### 5. Configurable compaction threshold

```ts
// Make server persistence tunable:
export function createPersistence(options: {
  compactionThreshold?: number  // default: 100
  batchInterval?: number        // default: 500
  database: DrizzleInstance
}) { /* ... */ }
```

#### 6. `tryOnScopeDispose` for defensive cleanup

```ts
// Replace onScopeDispose with tryOnScopeDispose pattern:
function tryOnScopeDispose(fn: () => void) {
  if (getCurrentScope()) {
    onScopeDispose(fn)
    return true
  }
  return false
}
```

### Nice-to-Have

#### 7. `MaybeRefOrGetter` for reactive inputs

```ts
// Enable reactive room switching:
import { toValue, type MaybeRefOrGetter } from 'vue'

export function useWebSocketProvider(
  serverUrl: MaybeRefOrGetter<string>,
  roomName: MaybeRefOrGetter<string>,
  doc: Y.Doc
) {
  watch(
    () => [toValue(serverUrl), toValue(roomName)],
    ([url, room]) => {
      provider.value?.destroy()
      provider.value = new WebsocketProvider(url, room, doc)
    }
  )
}
```

#### 8. `useHasLocalChanges` composable

```ts
// Useful for "saving..." indicators:
export function useHasLocalChanges(doc: Y.Doc, provider: WebsocketProvider) {
  const hasLocalChanges = shallowRef(false)

  doc.on('update', (update, origin) => {
    if (origin !== provider) hasLocalChanges.value = true
  })

  provider.on('synced', () => {
    hasLocalChanges.value = false
  })

  return readonly(hasLocalChanges)
}
```

#### 9. Subdocument support

```ts
// Enable lazy loading of large collaborative workspaces:
export function useSubDoc(parentDoc: Y.Doc, subdocId: string) {
  const subdoc = parentDoc.getSubdocs().get(subdocId) ?? new Y.Doc({ guid: subdocId })
  // ... provide/inject pattern for subdoc
}
```

---

## Summary

| Dimension | Rating | Notes |
|---|---|---|
| Reactive binding design | **Excellent** | Best Vue-native approach in the ecosystem |
| API conventions | **Excellent** | Follows VueUse/Vue ecosystem patterns closely |
| Composable completeness | **Good** | Covers core use cases, missing error handling |
| Server persistence | **Very Good** | More sophisticated than Hocuspocus defaults |
| Server architecture | **Good** | Functional but lacks auth and extension points |
| SSR compatibility | **Poor** | No guards — will crash in Nuxt SSR |
| Documentation | **Good** | JSDoc + README, could add more examples |
| Test coverage | **Good** | Comprehensive unit tests with happy-dom |
| Production readiness | **Good** | Solid foundation, needs error handling + SSR for v1.0 |

**Bottom line:** vue-yjs is a well-designed library that fills a genuine gap. The core reactive binding pattern (`useY` with `shallowRef` + `equalityDeep`) is arguably the cleanest in the Yjs ecosystem. Fix error handling and SSR, and it's ready for production use.
