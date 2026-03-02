# Nuxt Example Guide

Reference for working on `examples/nuxt-app/` — a Nuxt 4 collaborative todo app.

## SSR Boundary

vue-yjs composables require browser APIs (WebSocket, IndexedDB). Wrap collaborative UI in `<ClientOnly>`:

```vue
<ClientOnly>
  <TodoApp />
</ClientOnly>
```

The `useCollaboration` composable guards client-only code with `import.meta.client` checks internally, but the components using reactive Yjs state must still be client-only.

## WebSocket Binary Protocol

The server (`server/routes/_ws.ts`) speaks the standard Yjs binary sync protocol. Messages are prefixed with a type byte:

| Byte | Constant          | Purpose                     |
|------|-------------------|-----------------------------|
| 0    | `MESSAGE_SYNC`      | y-protocols/sync messages   |
| 1    | `MESSAGE_AWARENESS`  | y-protocols/awareness updates |

The server handles:
- **open**: sends SyncStep1 + current awareness states to the new peer
- **message**: decodes type byte, dispatches to sync or awareness handlers
- **close**: removes peer, cleans up awareness, starts 30s room destroy timer

## Server File Locations

```
server/
  routes/_ws.ts              # WebSocket handler (defineWebSocketHandler)
  utils/yjs-rooms.ts         # Room management (getOrCreateRoom, destroyRoom)
  utils/yjs-persistence.ts   # Batched persistence to SQLite
  utils/db.ts                # Drizzle ORM database instance
  database/schema.ts         # SQLite table definitions
  plugins/shutdown.ts        # Nitro close hook — persists all rooms on shutdown
```

## Persistence Strategy

Two-table SQLite schema via Drizzle ORM:
- `yjs_updates` — incremental binary update rows (id, roomName, update, createdAt)
- `yjs_snapshots` — one merged snapshot per room (roomName PK, snapshot, updatedAt)

Flow:
1. **Batched writes**: updates buffered in memory per room, flushed every 500ms
2. **Compaction**: after 100 update rows, merges all updates + snapshot into a new snapshot via `Y.mergeUpdates`, then deletes consumed rows in a transaction
3. **Load**: applies snapshot first, then replays ordered update rows
4. **Shutdown**: `persistFullDoc` encodes full state, replaces snapshot, clears updates

## Collaborative Data Patterns

### Fractional Indexing

Todos use `sortKey` (string) for CRDT-compatible ordering via the `fractional-indexing` package:

```ts
import { generateKeyBetween } from "fractional-indexing";

// Append: new key after the last item
const sortKey = generateKeyBetween(lastSortKey, null);

// Reorder: new key between neighbors at target position
const sortKey = generateKeyBetween(prevKey, nextKey);
```

This avoids index-based reordering conflicts in concurrent editing.

### ID-based Deletion

Todos are stored as `Y.Array<Y.Map<unknown>>`. Deletion finds items by `id` field, not array index, to avoid deleting the wrong item during concurrent edits:

```ts
const idx = yTodos.toArray().findIndex(item => item.get("id") === id);
if (idx !== -1) yTodos.delete(idx, 1);
```

### Data Structure

Each todo is a `Y.Map` with keys: `id` (string), `text` (string), `done` (boolean), `sortKey` (string).

## Nuxt Auto-imports and oxlint

Nuxt auto-imports Vue APIs and composables. oxlint may flag auto-imported identifiers as undefined — the Nuxt example's oxlint config handles this. Server utils in `server/utils/` are also auto-imported within the server context.

## Shared Types

Shared type definitions live in `shared/types/`:
- `collaboration.ts` — `AwarenessState` interface
- `todo.ts` — `Todo` interface (with `sortKey` for fractional indexing)

These are importable from both client and server code via Nuxt's shared directory convention.
