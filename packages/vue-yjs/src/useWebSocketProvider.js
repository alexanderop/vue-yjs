import { shallowRef, onScopeDispose, readonly } from "vue";
import { WebsocketProvider } from "y-websocket";
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
export function useWebSocketProvider(serverUrl, roomName, doc, options) {
    const provider = new WebsocketProvider(serverUrl, roomName, doc, options);
    const status = shallowRef(provider.wsconnected ? "connected" : "connecting");
    const synced = shallowRef(provider.synced);
    const onStatus = ({ status: newStatus, }) => {
        status.value = newStatus;
    };
    const onSync = (isSynced) => {
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
        status: readonly(status),
        synced: readonly(synced),
        connect: () => provider.connect(),
        disconnect: () => provider.disconnect(),
    };
}
