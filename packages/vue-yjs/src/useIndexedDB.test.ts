import { describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import { withSetup } from "./test-utils.js";

// Use vi.hoisted to define the mock class before vi.mock runs
const { MockIndexeddbPersistence } = vi.hoisted(() => {
  class MockIndexeddbPersistence {
    name: string;
    doc: unknown;
    synced = false;
    whenSynced: Promise<any>;
    _resolveSynced!: (v: any) => void;
    _rejectSynced!: (e: any) => void;

    private _listeners = new Map<string, Set<Function>>();

    constructor(docName: string, doc: unknown) {
      this.name = docName;
      this.doc = doc;
      this.whenSynced = new Promise((resolve, reject) => {
        this._resolveSynced = resolve;
        this._rejectSynced = reject;
      });
    }

    on(event: string, fn: Function) {
      if (!this._listeners.has(event)) this._listeners.set(event, new Set());
      this._listeners.get(event)!.add(fn);
    }

    off(event: string, fn: Function) {
      this._listeners.get(event)?.delete(fn);
    }

    emit(event: string, ...args: unknown[]) {
      this._listeners.get(event)?.forEach((fn) => fn(...args));
    }

    destroy() {
      return Promise.resolve();
    }

    clearData() {
      return Promise.resolve();
    }
  }

  return { MockIndexeddbPersistence };
});

vi.mock("y-indexeddb", () => ({
  IndexeddbPersistence: MockIndexeddbPersistence,
}));

// Must import after mock setup
const { useIndexedDB } = await import("./useIndexedDB.js");

describe("initialization", () => {
  test("creates persistence with correct docName and doc", () => {
    const doc = new Y.Doc();
    const { result } = withSetup(() => useIndexedDB("test-db", doc));
    expect(result.persistence).toBeInstanceOf(MockIndexeddbPersistence);
    expect((result.persistence as any).name).toBe("test-db");
    expect((result.persistence as any).doc).toBe(doc);
  });

  test("synced is false initially", () => {
    const doc = new Y.Doc();
    const { result } = withSetup(() => useIndexedDB("test-db", doc));
    expect(result.synced.value).toBe(false);
  });

});

describe("sync lifecycle", () => {
  test("synced ref becomes true on 'synced' event", () => {
    const doc = new Y.Doc();
    const { result } = withSetup(() => useIndexedDB("test-db", doc));
    (result.persistence as any).emit("synced");
    expect(result.synced.value).toBe(true);
  });

  test("whenSynced resolves on sync", async () => {
    const doc = new Y.Doc();
    const { result } = withSetup(() => useIndexedDB("test-db", doc));
    (result.persistence as any)._resolveSynced(result.persistence);
    await expect(result.whenSynced).resolves.toBeDefined();
  });

  test("onSynced callback fires with persistence instance", () => {
    const doc = new Y.Doc();
    const onSynced = vi.fn();
    const { result } = withSetup(() =>
      useIndexedDB("test-db", doc, { onSynced }),
    );
    (result.persistence as any).emit("synced");
    expect(onSynced).toHaveBeenCalledWith(result.persistence);
  });
});

describe("error handling", () => {
  test("onError called when whenSynced rejects", async () => {
    const doc = new Y.Doc();
    const onError = vi.fn();
    const { result } = withSetup(() =>
      useIndexedDB("test-db", doc, { onError }),
    );
    const error = new Error("sync failed");
    (result.persistence as any)._rejectSynced(error);
    await expect(result.whenSynced).rejects.toThrow("sync failed");
    expect(onError).toHaveBeenCalledWith(error);
  });

  test("default onError calls console.error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const doc = new Y.Doc();
    const { result } = withSetup(() => useIndexedDB("test-db", doc));
    const error = new Error("sync failed");
    (result.persistence as any)._rejectSynced(error);
    await expect(result.whenSynced).rejects.toThrow("sync failed");
    expect(spy).toHaveBeenCalledWith(error);
    spy.mockRestore();
  });

  test("clearData calls onError and rethrows on failure", async () => {
    const doc = new Y.Doc();
    const onError = vi.fn();
    const { result } = withSetup(() =>
      useIndexedDB("test-db", doc, { onError }),
    );
    const error = new Error("clear failed");
    vi.spyOn(result.persistence, "clearData").mockRejectedValueOnce(error);
    await expect(result.clearData()).rejects.toThrow("clear failed");
    expect(onError).toHaveBeenCalledWith(error);
  });
});

describe("manual controls", () => {
  test("clearData delegates to persistence.clearData()", async () => {
    const doc = new Y.Doc();
    const { result } = withSetup(() => useIndexedDB("test-db", doc));
    const spy = vi.spyOn(result.persistence, "clearData");
    await result.clearData();
    expect(spy).toHaveBeenCalledOnce();
  });

  test("destroy delegates to persistence.destroy()", async () => {
    const doc = new Y.Doc();
    const { result } = withSetup(() => useIndexedDB("test-db", doc));
    const spy = vi.spyOn(result.persistence, "destroy");
    await result.destroy();
    expect(spy).toHaveBeenCalledOnce();
  });
});

describe("cleanup", () => {
  test("removes listener and destroys persistence on unmount", () => {
    const doc = new Y.Doc();
    const { result, app } = withSetup(() => useIndexedDB("test-db", doc));
    const spy = vi.spyOn(result.persistence, "destroy");
    app.unmount();

    // Verify destroy was called
    expect(spy).toHaveBeenCalledOnce();

    // Verify listener was removed (emitting 'synced' should NOT update the ref)
    const syncedBefore = result.synced.value;
    (result.persistence as any).emit("synced");
    expect(result.synced.value).toBe(syncedBefore);
  });
});
