import * as Y from 'yjs'
import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as encoding from 'lib0/encoding'
import { persistUpdate, loadPersistedDoc, persistFullDoc } from './yjs-persistence'

export const MESSAGE_SYNC = 0
export const MESSAGE_AWARENESS = 1

export interface Peer {
  send: (data: Uint8Array) => void
  id: string
  awarenessClientIds: Set<number>
}

export interface Room {
  doc: Y.Doc
  awareness: awarenessProtocol.Awareness
  peers: Map<string, Peer>
  destroyTimer: ReturnType<typeof setTimeout> | null
  awarenessCheckInterval: ReturnType<typeof setInterval>
}

export const rooms = new Map<string, Room>()

function broadcastMessage(roomName: string, message: Uint8Array, excludeOrigin: unknown): void {
  const room = rooms.get(roomName)
  if (!room) return
  for (const [peerId, peer] of room.peers) {
    if (excludeOrigin !== peerId) {
      peer.send(message)
    }
  }
}

export function getOrCreateRoom(roomName: string): Room {
  let room = rooms.get(roomName)
  if (room) {
    // Cancel pending destroy if reconnecting
    if (room.destroyTimer) {
      clearTimeout(room.destroyTimer)
      room.destroyTimer = null
    }
    return room
  }

  const doc = new Y.Doc()
  loadPersistedDoc(roomName, doc)

  const awareness = new awarenessProtocol.Awareness(doc)
  awareness.setLocalState(null) // Server has no local state

  doc.on('update', (update: Uint8Array, origin: unknown) => {
    persistUpdate(roomName, update)

    // Broadcast to all peers except the origin
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MESSAGE_SYNC)
    syncProtocol.writeUpdate(encoder, update)
    const message = encoding.toUint8Array(encoder)
    broadcastMessage(roomName, message, origin)
  })

  awareness.on('update', ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }, origin: unknown) => {
    const changedClients = [...added, ...updated, ...removed]
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MESSAGE_AWARENESS)
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients),
    )
    const message = encoding.toUint8Array(encoder)

    // Track which awareness client IDs belong to which peer
    const currentRoom = rooms.get(roomName)
    if (typeof origin === 'string' && currentRoom) {
      const sourcePeer = currentRoom.peers.get(origin)
      if (sourcePeer) {
        for (const clientId of added) {
          sourcePeer.awarenessClientIds.add(clientId)
        }
      }
    }

    broadcastMessage(roomName, message, origin)
  })

  // Periodically remove stale awareness states (handles unclean disconnects / page refreshes)
  const AWARENESS_TIMEOUT = 30_000
  const awarenessCheckInterval = setInterval(() => {
    const now = Date.now()
    const clientsToRemove: number[] = []
    for (const [clientId] of awareness.getStates()) {
      const meta = awareness.meta.get(clientId)
      if (meta && now - meta.lastUpdated > AWARENESS_TIMEOUT) {
        clientsToRemove.push(clientId)
      }
    }
    if (clientsToRemove.length > 0) {
      awarenessProtocol.removeAwarenessStates(awareness, clientsToRemove, 'timeout')
    }
  }, AWARENESS_TIMEOUT / 2)

  room = { doc, awareness, peers: new Map(), destroyTimer: null, awarenessCheckInterval }
  rooms.set(roomName, room)
  return room
}

export function destroyRoom(roomName: string): void {
  const room = rooms.get(roomName)
  if (!room) return

  clearInterval(room.awarenessCheckInterval)
  persistFullDoc(roomName, room.doc)
  room.awareness.destroy()
  room.doc.destroy()
  rooms.delete(roomName)
}

export function parseRoomName(url: string): string {
  // URL format: /_ws/room-name
  const parts = url.split('/')
  return parts[parts.length - 1] || 'default'
}

export function persistAllRooms(): void {
  for (const [roomName, room] of rooms) {
    persistFullDoc(roomName, room.doc)
  }
}
