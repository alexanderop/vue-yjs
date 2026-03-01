import { shallowRef, onScopeDispose, readonly, type ShallowRef } from "vue";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";

/** Options for {@link useIndexedDB}. */
export interface UseIndexedDBOptions {
  /** Error callback (default: `console.error`). Handles private browsing, quota exceeded, DB corruption. */
  onError?: (error: unknown) => void;
  /** Callback fired once when persisted content is loaded into the doc. */
  onSynced?: (persistence: IndexeddbPersistence) => void;
}

/** Return type of {@link useIndexedDB}. */
export interface UseIndexedDBReturn {
  /** The underlying `IndexeddbPersistence` instance. */
  persistence: IndexeddbPersistence;
  /** Whether the local IndexedDB content has been loaded into the doc. */
  synced: Readonly<ShallowRef<boolean>>;
  /** Promise that resolves once persisted content is loaded into the doc. */
  whenSynced: Promise<IndexeddbPersistence>;
  /** Clear all persisted data from IndexedDB for this document. */
  clearData: () => Promise<void>;
  /** Destroy the persistence instance. Safe to call multiple times. */
  destroy: () => Promise<void>;
}

/**
 * Reactive wrapper around `y-indexeddb`'s `IndexeddbPersistence`.
 *
 * Persists the given `Y.Doc` to the browser's IndexedDB so that
 * document state survives page refreshes. Exposes a reactive `synced`
 * ref that becomes `true` once the stored content has been loaded.
 *
 * The persistence is destroyed when the enclosing effect scope is
 * disposed.
 *
 * @param docName - A unique name used as the IndexedDB database name.
 * @param doc - The `Y.Doc` to persist.
 * @param options - Optional configuration.
 * @returns A {@link UseIndexedDBReturn} with reactive state and controls.
 *
 * @example
 * ```ts
 * const doc = useProvideYDoc()
 * const { synced } = useIndexedDB('my-document', doc)
 * ```
 *
 * @example
 * ```ts
 * const { whenSynced } = useIndexedDB('my-document', doc, {
 *   onError: (err) => console.warn('[IndexedDB]', err),
 *   onSynced: (persistence) => console.log('Synced!', persistence),
 * })
 * await whenSynced
 * ```
 */
export function useIndexedDB(
  docName: string,
  doc: Y.Doc,
  options: UseIndexedDBOptions = {},
): UseIndexedDBReturn {
  const { onError = console.error, onSynced: onSyncedCb } = options;

  const persistence = new IndexeddbPersistence(docName, doc);

  const synced = shallowRef(false);

  const handleSynced = () => {
    synced.value = true;
    onSyncedCb?.(persistence);
  };

  persistence.on("synced", handleSynced);

  const whenSynced = persistence.whenSynced.catch((error) => {
    onError(error);
    throw error;
  });

  onScopeDispose(() => {
    persistence.off("synced", handleSynced);
    persistence.destroy();
  });

  return {
    persistence,
    synced: readonly(synced) as Readonly<ShallowRef<boolean>>,
    whenSynced,
    clearData: () =>
      persistence.clearData().catch((error) => {
        onError(error);
        throw error;
      }),
    destroy: () => persistence.destroy(),
  };
}
