# Nuxt 4 Collaborative Todo Example

Real-time collaborative todo list built with Nuxt 4 and the `vue-yjs` composable library. Multiple users can add, edit, toggle, delete, and reorder todos simultaneously — all changes sync in real-time via WebSockets.

## Features

- **Real-time sync** — Changes propagate instantly to all connected clients via `y-protocols` over WebSocket
- **Persistence** — Todos survive page reloads and server restarts (SQLite via Drizzle ORM)
- **Presence** — See who else is connected with colored indicators
- **Drag-to-reorder** — Conflict-safe reordering using fractional indexing
- **Undo/redo** — Per-client undo history (Ctrl+Z / Cmd+Z)
- **SSR-safe** — Yjs initializes client-only via `<ClientOnly>`, no hydration mismatches

## Composables Used

All five `vue-yjs` composables in action:

| Composable | Purpose |
|---|---|
| `useProvideYDoc` / `useYDoc` | Create and inject the shared Y.Doc |
| `useWebSocketProvider` | Connect to the Nitro WebSocket handler |
| `useY` | Reactive Vue binding to Y.Array of Y.Maps |
| `useAwareness` | Track connected users (name, color) |
| `useUndoManager` | Per-client undo/redo |

## Running

From the monorepo root:

```bash
pnpm dev --filter vue-yjs-example-nuxt-app
```

Then open **two or more browser windows** at `http://localhost:3000` to test collaboration.

## Architecture

```
Browser (Client)                    Nitro Server
────────────────                    ────────────
app/pages/index.vue                 server/routes/_ws.ts
  <ClientOnly>                        WebSocket handler
    <TodoApp />                         y-protocols/sync
                                        y-protocols/awareness
app/composables/
  useCollaboration.ts               server/utils/
    useYDoc, useWebSocketProvider     yjs-persistence.ts
    useAwareness                        batched writes + compaction
  useTodoList.ts                    server/database/
    useY, useUndoManager              schema.ts (Drizzle)
    fractional indexing             server/utils/
                                      db.ts (better-sqlite3)
```

## Data Model

Todos are stored as `Y.Array<Y.Map>` in the Yjs document. Each map has:

- `id` — UUID for stable identity
- `text` — Todo content
- `done` — Boolean toggle
- `sortKey` — Lexicographic string from `fractional-indexing` for conflict-safe ordering
