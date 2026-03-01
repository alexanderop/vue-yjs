// @vitest-environment happy-dom
import { expect, test, vi, beforeEach } from "vitest";
import * as Y from "yjs";
import { withSetup } from "./test-utils.js";

// Use vi.hoisted to define the mock class before vi.mock runs
const { MockWebsocketProvider } = vi.hoisted(() => {
  // Minimal event emitter for the mock
  class MockWebsocketProvider {
    wsconnected = false;
    synced = false;
    shouldConnect: boolean;
    awareness = {
      clientID: 1,
      on: () => {},
      off: () => {},
      destroy: () => {},
    };

    private _listeners: Map<string, Set<Function>> = new Map();

    constructor(
      _serverUrl: string,
      _roomName: string,
      _doc: unknown,
      opts?: { connect?: boolean }
    ) {
      this.shouldConnect = opts?.connect !== false;
    }

    on(event: string, fn: Function) {
      if (!this._listeners.has(event)) {
        this._listeners.set(event, new Set());
      }
      this._listeners.get(event)!.add(fn);
    }

    off(event: string, fn: Function) {
      this._listeners.get(event)?.delete(fn);
    }

    emit(event: string, args: unknown[]) {
      this._listeners.get(event)?.forEach((fn) => fn(...args));
    }

    connect() {
      this.wsconnected = true;
      this.emit("status", [{ status: "connected" }]);
    }

    disconnect() {
      this.wsconnected = false;
      this.emit("status", [{ status: "disconnected" }]);
    }

    destroy() {
      this.disconnect();
    }
  }

  return { MockWebsocketProvider };
});

vi.mock("y-websocket", () => ({
  WebsocketProvider: MockWebsocketProvider,
}));

// Must import after mock setup
const { useWebSocketProvider } = await import("./useWebSocketProvider.js");

beforeEach(() => {
  vi.clearAllMocks();
});

test("should create a provider and return initial status", () => {
  const doc = new Y.Doc();
  const { result } = withSetup(() =>
    useWebSocketProvider("ws://localhost:1234", "test-room", doc, {
      connect: false,
    })
  );

  expect(result.provider).toBeDefined();
  expect(result.awareness).toBeDefined();
  expect(result.status.value).toBe("connecting");
  expect(result.synced.value).toBe(false);
});

test("status updates reactively on connect", () => {
  const doc = new Y.Doc();
  const { result } = withSetup(() =>
    useWebSocketProvider("ws://localhost:1234", "test-room", doc, {
      connect: false,
    })
  );

  result.connect();
  expect(result.status.value).toBe("connected");
});

test("status updates reactively on disconnect", () => {
  const doc = new Y.Doc();
  const { result } = withSetup(() =>
    useWebSocketProvider("ws://localhost:1234", "test-room", doc, {
      connect: false,
    })
  );

  result.connect();
  result.disconnect();
  expect(result.status.value).toBe("disconnected");
});

test("synced ref updates on sync event", () => {
  const doc = new Y.Doc();
  const { result } = withSetup(() =>
    useWebSocketProvider("ws://localhost:1234", "test-room", doc, {
      connect: false,
    })
  );

  // Manually emit sync event on the provider
  (result.provider as any).emit("sync", [true]);
  expect(result.synced.value).toBe(true);
});

test("exposes connect and disconnect functions", () => {
  const doc = new Y.Doc();
  const { result } = withSetup(() =>
    useWebSocketProvider("ws://localhost:1234", "test-room", doc, {
      connect: false,
    })
  );

  expect(typeof result.connect).toBe("function");
  expect(typeof result.disconnect).toBe("function");
});

test("cleans up on unmount", () => {
  const doc = new Y.Doc();
  const { result, app } = withSetup(() =>
    useWebSocketProvider("ws://localhost:1234", "test-room", doc, {
      connect: false,
    })
  );

  const spy = vi.spyOn(result.provider, "destroy");
  app.unmount();
  expect(spy).toHaveBeenCalledOnce();
});
