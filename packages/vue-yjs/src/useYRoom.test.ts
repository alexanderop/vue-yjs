import { describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import { useYRoom } from "./useYRoom.js";
import { useYDoc } from "./useYDoc.js";
import { withSetup } from "./test-utils.js";

// Mock y-websocket and y-indexeddb since they need browser APIs
vi.mock("y-websocket", () => {
  return {
    WebsocketProvider: vi.fn().mockImplementation(() => ({
      awareness: {
        clientID: 1,
        getStates: () => new Map(),
        on: vi.fn(),
        off: vi.fn(),
        setLocalState: vi.fn(),
        destroy: vi.fn(),
      },
      wsconnected: false,
      synced: false,
      on: vi.fn(),
      off: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      destroy: vi.fn(),
    })),
  };
});

vi.mock("y-indexeddb", () => {
  return {
    IndexeddbPersistence: vi.fn().mockImplementation(() => ({
      synced: false,
      on: vi.fn(),
      off: vi.fn(),
      destroy: vi.fn(),
      whenSynced: Promise.resolve(),
      clearData: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

describe("useYRoom", () => {
  test("creates and provides a Y.Doc", () => {
    const { result } = withSetup(() => {
      const room = useYRoom("test-room", {
        serverUrl: "wss://example.com",
      });
      // useYDoc should find the provided doc
      const doc = useYDoc();
      return { room, doc };
    });

    expect(result.room.doc).toBeInstanceOf(Y.Doc);
    expect(result.doc).toBe(result.room.doc);
  });

  test("returns status and synced refs", () => {
    const { result } = withSetup(() =>
      useYRoom("test-room", { serverUrl: "wss://example.com" }),
    );

    expect(result.status.value).toBeDefined();
    expect(result.synced.value).toBeDefined();
  });

  test("returns connect and disconnect functions", () => {
    const { result } = withSetup(() =>
      useYRoom("test-room", { serverUrl: "wss://example.com" }),
    );

    expect(typeof result.connect).toBe("function");
    expect(typeof result.disconnect).toBe("function");
  });

  test("returns awareness", () => {
    const { result } = withSetup(() =>
      useYRoom("test-room", { serverUrl: "wss://example.com" }),
    );

    expect(result.awareness).toBeDefined();
  });

  test("returns provider", () => {
    const { result } = withSetup(() =>
      useYRoom("test-room", { serverUrl: "wss://example.com" }),
    );

    expect(result.provider).toBeDefined();
  });

  test("creates IndexedDB persistence when persist is true", async () => {
    const { IndexeddbPersistence } = await import("y-indexeddb");

    withSetup(() =>
      useYRoom("test-room", {
        serverUrl: "wss://example.com",
        persist: true,
      }),
    );

    expect(IndexeddbPersistence).toHaveBeenCalledWith(
      "yjs-test-room",
      expect.any(Y.Doc),
    );
  });

  test("uses custom persist prefix", async () => {
    const { IndexeddbPersistence } = await import("y-indexeddb");
    vi.mocked(IndexeddbPersistence).mockClear();

    withSetup(() =>
      useYRoom("my-room", {
        serverUrl: "wss://example.com",
        persist: true,
        persistPrefix: "custom-",
      }),
    );

    expect(IndexeddbPersistence).toHaveBeenCalledWith(
      "custom-my-room",
      expect.any(Y.Doc),
    );
  });

  test("does not create IndexedDB persistence by default", async () => {
    const { IndexeddbPersistence } = await import("y-indexeddb");
    vi.mocked(IndexeddbPersistence).mockClear();

    withSetup(() =>
      useYRoom("test-room", {
        serverUrl: "wss://example.com",
      }),
    );

    expect(IndexeddbPersistence).not.toHaveBeenCalled();
  });
});
