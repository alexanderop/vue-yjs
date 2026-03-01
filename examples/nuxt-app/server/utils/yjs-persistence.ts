import * as Y from 'yjs'
import { eq, and, lte } from 'drizzle-orm'
import { db } from './db'
import { yjsUpdates, yjsSnapshots } from '../database/schema'

const COMPACTION_THRESHOLD = 100
const BATCH_INTERVAL_MS = 500

const pendingUpdates = new Map<string, { updates: Uint8Array[]; timer: ReturnType<typeof setTimeout> | null }>()

export function persistUpdate(roomName: string, update: Uint8Array): void {
  let entry = pendingUpdates.get(roomName)
  if (!entry) {
    entry = { updates: [], timer: null }
    pendingUpdates.set(roomName, entry)
  }

  entry.updates.push(update)

  if (entry.timer !== null) return

  entry.timer = setTimeout(() => {
    flushUpdates(roomName)
  }, BATCH_INTERVAL_MS)
}

function flushUpdates(roomName: string): void {
  const entry = pendingUpdates.get(roomName)
  if (!entry || entry.updates.length === 0) return

  const merged = Y.mergeUpdates(entry.updates)
  entry.updates = []
  entry.timer = null

  db.insert(yjsUpdates)
    .values({ roomName, update: Buffer.from(merged) })
    .run()

  maybeCompact(roomName)
}

function maybeCompact(roomName: string): void {
  // Check count with a lightweight IDs-only query to avoid loading blobs
  const ids = db
    .select({ id: yjsUpdates.id })
    .from(yjsUpdates)
    .where(eq(yjsUpdates.roomName, roomName))
    .all()

  if (ids.length < COMPACTION_THRESHOLD) return

  const maxId = ids[ids.length - 1]!.id

  const rows = db
    .select({ update: yjsUpdates.update })
    .from(yjsUpdates)
    .where(eq(yjsUpdates.roomName, roomName))
    .all()

  const existingSnapshot = db
    .select({ snapshot: yjsSnapshots.snapshot })
    .from(yjsSnapshots)
    .where(eq(yjsSnapshots.roomName, roomName))
    .get()

  const allUpdates: Uint8Array[] = []
  if (existingSnapshot) {
    allUpdates.push(new Uint8Array(existingSnapshot.snapshot as unknown as ArrayBufferLike))
  }
  for (const row of rows) {
    allUpdates.push(new Uint8Array(row.update as unknown as ArrayBufferLike))
  }

  const merged = Y.mergeUpdates(allUpdates)
  const snapshotBuffer = Buffer.from(merged)
  const now = new Date()

  db.transaction((tx) => {
    tx.insert(yjsSnapshots)
      .values({ roomName, snapshot: snapshotBuffer, updatedAt: now })
      .onConflictDoUpdate({
        target: yjsSnapshots.roomName,
        set: { snapshot: snapshotBuffer, updatedAt: now },
      })
      .run()

    tx.delete(yjsUpdates)
      .where(and(eq(yjsUpdates.roomName, roomName), lte(yjsUpdates.id, maxId)))
      .run()
  })
}

export function loadPersistedDoc(roomName: string, doc: Y.Doc): void {
  const snapshot = db
    .select({ snapshot: yjsSnapshots.snapshot })
    .from(yjsSnapshots)
    .where(eq(yjsSnapshots.roomName, roomName))
    .get()

  const updates = db
    .select({ update: yjsUpdates.update })
    .from(yjsUpdates)
    .where(eq(yjsUpdates.roomName, roomName))
    .orderBy(yjsUpdates.id)
    .all()

  if (snapshot) {
    Y.applyUpdate(doc, new Uint8Array(snapshot.snapshot as unknown as ArrayBufferLike))
  }

  for (const row of updates) {
    Y.applyUpdate(doc, new Uint8Array(row.update as unknown as ArrayBufferLike))
  }
}

export function persistFullDoc(roomName: string, doc: Y.Doc): void {
  // Clear pending buffer without flushing to DB — the full doc state already includes them
  const entry = pendingUpdates.get(roomName)
  if (entry) {
    if (entry.timer !== null) clearTimeout(entry.timer)
    pendingUpdates.delete(roomName)
  }

  const state = Y.encodeStateAsUpdate(doc)
  const snapshotBuffer = Buffer.from(state)
  const now = new Date()

  db.transaction((tx) => {
    tx.insert(yjsSnapshots)
      .values({ roomName, snapshot: snapshotBuffer, updatedAt: now })
      .onConflictDoUpdate({
        target: yjsSnapshots.roomName,
        set: { snapshot: snapshotBuffer, updatedAt: now },
      })
      .run()

    tx.delete(yjsUpdates)
      .where(eq(yjsUpdates.roomName, roomName))
      .run()
  })
}
