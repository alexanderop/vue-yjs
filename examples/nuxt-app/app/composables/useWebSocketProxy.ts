import type { MessageDirection } from './useMessageLog'

type MessageCallback = (direction: MessageDirection, data: ArrayBuffer) => void

/**
 * Creates a WebSocket constructor wrapper that intercepts send/receive
 * for the Yjs DevTools message log.
 *
 * Returns a class suitable for y-websocket's `WebSocketPolyfill` option.
 */
export function createWebSocketPolyfill(onMessage: MessageCallback): typeof WebSocket {
  return class ProxiedWebSocket extends WebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      super(url, protocols)
      this.binaryType = 'arraybuffer'

      this.addEventListener('message', (event: MessageEvent) => {
        if (event.data instanceof ArrayBuffer) {
          onMessage('in', event.data)
        }
      })
    }

    override send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
      if (data instanceof ArrayBuffer) {
        onMessage('out', data)
      }
      else if (ArrayBuffer.isView(data)) {
        onMessage('out', data.buffer as ArrayBuffer)
      }

      super.send(data)
    }
  } as unknown as typeof WebSocket
}
