import { shallowRef, onScopeDispose, readonly, type ShallowRef } from "vue";
import { WebsocketProvider } from "y-websocket";
import type { Awareness } from "y-protocols/awareness";
import * as Y from "yjs";

/** Connection status reported by the WebSocket provider. */
export type WebSocketProviderStatus = "connecting" | "connected" | "disconnected";

/** Options for {@link useWebSocketProvider}. */
export interface UseWebSocketProviderOptions {
  /** Existing awareness instance to use instead of creating one. */
  awareness?: Awareness;
  /**
   * Whether to connect immediately.
   *
   * @default true
   */
  connect?: boolean;
  /** Additional query parameters appended to the WebSocket URL. */
  params?: Record<string, string>;
  /** WebSocket constructor override (useful for non-browser environments). */
  WebSocketPolyfill?: typeof WebSocket;
  /**
   * Interval in milliseconds at which the provider re-syncs with the
   * server. Set to `-1` to disable.
   *
   * @default -1
   */
  resyncInterval?: number;
  /**
   * Maximum reconnection back-off time in milliseconds.
   *
   * @default 2500
   */
  maxBackoffTime?: number;
  /**
   * Disable broadcast-channel cross-tab sync.
   *
   * @default false
   */
  disableBc?: boolean;
}

/** Return type of {@link useWebSocketProvider}. */
export interface UseWebSocketProviderReturn {
  /** The underlying `WebsocketProvider` instance. */
  provider: WebsocketProvider;
  /** The awareness instance used by the provider. */
  awareness: Awareness;
  /** Reactive connection status. */
  status: Readonly<ShallowRef<WebSocketProviderStatus>>;
  /** Whether the initial sync with the server has completed. */
  synced: Readonly<ShallowRef<boolean>>;
  /** Open the WebSocket connection. */
  connect: () => void;
  /** Close the WebSocket connection. */
  disconnect: () => void;
}

/**
 * Reactive wrapper around `y-websocket`'s `WebsocketProvider`.
 *
 * Creates a provider that syncs the given `Y.Doc` over WebSocket and
 * exposes reactive `status` and `synced` refs. The provider is
 * destroyed when the enclosing effect scope is disposed.
 *
 * @param serverUrl - WebSocket server URL (e.g. `wss://example.com`).
 * @param roomName - Room / document identifier.
 * @param doc - The `Y.Doc` to synchronise.
 * @param options - Optional provider configuration.
 * @returns A {@link UseWebSocketProviderReturn} with reactive state
 *   and connection controls.
 *
 * @example
 * ```ts
 * const doc = useProvideYDoc()
 * const { status, synced, disconnect } = useWebSocketProvider(
 *   'wss://demos.yjs.dev/ws',
 *   'my-room',
 *   doc,
 * )
 * ```
 */
export function useWebSocketProvider(
  serverUrl: string,
  roomName: string,
  doc: Y.Doc,
  options?: UseWebSocketProviderOptions
): UseWebSocketProviderReturn {
  const provider = new WebsocketProvider(serverUrl, roomName, doc, options);

  const status = shallowRef<WebSocketProviderStatus>(
    provider.wsconnected ? "connected" : "connecting"
  );
  const synced = shallowRef(provider.synced);

  const onStatus = ({
    status: newStatus,
  }: {
    status: WebSocketProviderStatus;
  }) => {
    status.value = newStatus;
  };

  const onSync = (isSynced: boolean) => {
    synced.value = isSynced;
  };

  provider.on("status", onStatus);
  provider.on("sync", onSync);

  onScopeDispose(() => {
    provider.off("status", onStatus);
    provider.off("sync", onSync);
    provider.destroy();
  });

  return {
    provider,
    awareness: provider.awareness,
    status: readonly(status) as Readonly<ShallowRef<WebSocketProviderStatus>>,
    synced: readonly(synced) as Readonly<ShallowRef<boolean>>,
    connect: () => provider.connect(),
    disconnect: () => provider.disconnect(),
  };
}
