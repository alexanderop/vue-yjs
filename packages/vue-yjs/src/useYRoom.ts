import { type ShallowRef } from "vue";
import * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";
import type { Awareness } from "y-protocols/awareness";
import { useProvideYDoc } from "./useYDoc.js";
import {
  useWebSocketProvider,
  type UseWebSocketProviderOptions,
  type WebSocketProviderStatus,
} from "./useWebSocketProvider.js";
import { useIndexedDB } from "./useIndexedDB.js";

/** Options for {@link useYRoom}. */
export interface UseYRoomOptions {
  /** WebSocket server URL (e.g. `wss://example.com`). */
  serverUrl: string;
  /**
   * Whether to persist the document to IndexedDB.
   *
   * @default false
   */
  persist?: boolean;
  /**
   * Prefix for the IndexedDB database name. The full name is
   * `${persistPrefix}${roomName}`.
   *
   * @default "yjs-"
   */
  persistPrefix?: string;
  /** Additional options forwarded to `useWebSocketProvider`. */
  webSocket?: UseWebSocketProviderOptions;
  /** Error callback for IndexedDB failures (default: `console.error`). */
  onPersistError?: (error: unknown) => void;
}

/** Return type of {@link useYRoom}. */
export interface UseYRoomReturn {
  /** The created and provided `Y.Doc`. */
  doc: Y.Doc;
  /** The underlying `WebsocketProvider` instance. */
  provider: WebsocketProvider;
  /** Reactive WebSocket connection status. */
  status: Readonly<ShallowRef<WebSocketProviderStatus>>;
  /** Whether the initial sync with the server has completed. */
  synced: Readonly<ShallowRef<boolean>>;
  /** The awareness instance from the WebSocket provider. */
  awareness: Awareness;
  /** Open the WebSocket connection. */
  connect: () => void;
  /** Close the WebSocket connection. */
  disconnect: () => void;
}

/**
 * All-in-one room setup: creates a `Y.Doc`, optionally persists it
 * to IndexedDB, and connects via WebSocket.
 *
 * Combines {@link useProvideYDoc}, {@link useWebSocketProvider}, and
 * optionally {@link useIndexedDB} into a single composable. The doc
 * is provided to descendant components via Vue's dependency injection.
 *
 * @param roomName - Room / document identifier.
 * @param options - Room configuration.
 * @returns A {@link UseYRoomReturn} with the doc, reactive state,
 *   and connection controls.
 *
 * @example
 * ```ts
 * const { doc, status, synced, awareness } = useYRoom('my-room', {
 *   serverUrl: 'wss://example.com',
 *   persist: true,
 * })
 * ```
 */
export function useYRoom(
  roomName: string,
  options: UseYRoomOptions,
): UseYRoomReturn {
  const {
    serverUrl,
    persist = false,
    persistPrefix = "yjs-",
    webSocket: wsOptions,
    onPersistError,
  } = options;

  const doc = useProvideYDoc();

  // Optional IndexedDB persistence
  if (persist) {
    useIndexedDB(`${persistPrefix}${roomName}`, doc, {
      onError: onPersistError ?? console.error,
    });
  }

  // WebSocket provider
  const { provider, status, synced, awareness, connect, disconnect } =
    useWebSocketProvider(serverUrl, roomName, doc, wsOptions);

  return {
    doc,
    provider,
    status,
    synced,
    awareness,
    connect,
    disconnect,
  };
}
