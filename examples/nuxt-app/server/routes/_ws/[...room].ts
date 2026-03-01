import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'

export default defineWebSocketHandler({
  open(peer) {
    const roomName = parseRoomName(peer.request?.url || '')
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
    const roomName = parseRoomName(peer.request?.url || '')
    const room = rooms.get(roomName)
    if (!room) return

    const data = message.uint8Array()
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
    const roomName = parseRoomName(peer.request?.url || '')
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
