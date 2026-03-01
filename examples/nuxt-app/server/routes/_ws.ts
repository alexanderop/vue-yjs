import { defineWebSocketHandler } from 'h3'
import * as Y from 'yjs'
import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import { persistUpdate, loadPersistedDoc, persistFullDoc } from '../utils/yjs-persistence'

const MESSAGE_SYNC = 0
const MESSAGE_AWARENESS = 1

interface Peer {
  send: (data: Uint8Array) => void
  id: string
  awarenessClientIds: Set<number>
}

interface Room {
  doc: Y.Doc
  awareness: awarenessProtocol.Awareness
  peers: Map<string, Peer>
  destroyTimer: ReturnType<typeof setTimeout> | null
}

const rooms = new Map<string, Room>()

function getOrCreateRoom(roomName: string): Room {
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

    const currentRoom = rooms.get(roomName)
    if (!currentRoom) return
    for (const [peerId, peer] of currentRoom.peers) {
      if (origin !== peerId) {
        peer.send(message)
      }
    }
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

    const currentRoom = rooms.get(roomName)
    if (!currentRoom) return

    // Track which awareness client IDs belong to which peer
    if (typeof origin === 'string') {
      const sourcePeer = currentRoom.peers.get(origin)
      if (sourcePeer) {
        for (const clientId of added) {
          sourcePeer.awarenessClientIds.add(clientId)
        }
      }
    }

    for (const [peerId, peer] of currentRoom.peers) {
      if (origin !== peerId) {
        peer.send(message)
      }
    }
  })

  room = { doc, awareness, peers: new Map(), destroyTimer: null }
  rooms.set(roomName, room)
  return room
}

function destroyRoom(roomName: string): void {
  const room = rooms.get(roomName)
  if (!room) return

  persistFullDoc(roomName, room.doc)
  room.awareness.destroy()
  room.doc.destroy()
  rooms.delete(roomName)
}

function parseRoomName(url: string): string {
  // URL format: /_ws/room-name
  const parts = url.split('/')
  return parts[parts.length - 1] || 'default'
}

export default defineWebSocketHandler({
  open(peer) {
    const roomName = parseRoomName(peer.url || '')
    const room = getOrCreateRoom(roomName)

    const wrappedPeer: Peer = {
      id: peer.id,
      send: (data: Uint8Array) => {
        peer.send(data)
      },
      awarenessClientIds: new Set(),
    }
    room.peers.set(peer.id, wrappedPeer)

    // Send SyncStep1 to the new peer
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MESSAGE_SYNC)
    syncProtocol.writeSyncStep1(encoder, room.doc)
    peer.send(encoding.toUint8Array(encoder))

    // Send current awareness states to the new peer
    const awarenessStates = room.awareness.getStates()
    if (awarenessStates.size > 0) {
      const awarenessEncoder = encoding.createEncoder()
      encoding.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS)
      encoding.writeVarUint8Array(
        awarenessEncoder,
        awarenessProtocol.encodeAwarenessUpdate(
          room.awareness,
          Array.from(awarenessStates.keys()),
        ),
      )
      peer.send(encoding.toUint8Array(awarenessEncoder))
    }
  },

  message(peer, message) {
    const roomName = parseRoomName(peer.url || '')
    const room = rooms.get(roomName)
    if (!room) return

    const data = new Uint8Array(
      message.rawData instanceof ArrayBuffer
        ? message.rawData
        : typeof message.rawData === 'function'
          ? (message as unknown as { rawData: () => ArrayBuffer }).rawData()
          : new TextEncoder().encode(message.text()),
    )

    const decoder = decoding.createDecoder(data)
    const messageType = decoding.readVarUint(decoder)

    switch (messageType) {
      case MESSAGE_SYNC: {
        const encoder = encoding.createEncoder()
        encoding.writeVarUint(encoder, MESSAGE_SYNC)
        syncProtocol.readSyncMessage(decoder, encoder, room.doc, peer.id)
        if (encoding.length(encoder) > 1) {
          peer.send(encoding.toUint8Array(encoder))
        }
        break
      }
      case MESSAGE_AWARENESS: {
        const update = decoding.readVarUint8Array(decoder)
        awarenessProtocol.applyAwarenessUpdate(room.awareness, update, peer.id)
        break
      }
    }
  },

  close(peer) {
    const roomName = parseRoomName(peer.url || '')
    const room = rooms.get(roomName)
    if (!room) return

    const disconnectedPeer = room.peers.get(peer.id)
    room.peers.delete(peer.id)

    // Remove this peer's awareness state
    if (disconnectedPeer && disconnectedPeer.awarenessClientIds.size > 0) {
      awarenessProtocol.removeAwarenessStates(
        room.awareness,
        Array.from(disconnectedPeer.awarenessClientIds),
        'peer disconnected',
      )
    }

    if (room.peers.size === 0) {
      // Grace period before destroying the room
      room.destroyTimer = setTimeout(() => {
        destroyRoom(roomName)
      }, 30_000)
    }
  },
})
