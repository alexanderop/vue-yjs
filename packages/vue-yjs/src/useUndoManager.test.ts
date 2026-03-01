import { describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import { useUndoManager } from "./useUndoManager.js";
import { withSetup } from "./test-utils.js";

describe("initial state", () => {
  test("should return canUndo false and canRedo false initially", () => {
    const doc = new Y.Doc();
    const yArray = doc.getArray("list");
    const { result } = withSetup(() => useUndoManager(yArray));
    expect(result.canUndo.value).toBe(false);
    expect(result.canRedo.value).toBe(false);
  });

  test("exposes the raw undoManager", () => {
    const doc = new Y.Doc();
    const yArray = doc.getArray("list");
    const { result } = withSetup(() => useUndoManager(yArray));
    expect(result.undoManager).toBeInstanceOf(Y.UndoManager);
  });
});

describe("undo/redo", () => {
  test("canUndo becomes true after a tracked change", () => {
    const doc = new Y.Doc();
    const yArray = doc.getArray("list");
    const { result } = withSetup(() => useUndoManager(yArray));

    yArray.insert(0, ["item"]);
    expect(result.canUndo.value).toBe(true);
    expect(result.canRedo.value).toBe(false);
  });

  test("undo reverses the change", () => {
    const doc = new Y.Doc();
    const yArray = doc.getArray("list");
    const { result } = withSetup(() => useUndoManager(yArray));

    yArray.insert(0, ["item"]);
    result.undo();
    expect(yArray.toJSON()).toStrictEqual([]);
    expect(result.canUndo.value).toBe(false);
    expect(result.canRedo.value).toBe(true);
  });

  test("redo reapplies the change", () => {
    const doc = new Y.Doc();
    const yArray = doc.getArray("list");
    const { result } = withSetup(() => useUndoManager(yArray));

    yArray.insert(0, ["item"]);
    result.undo();
    result.redo();
    expect(yArray.toJSON()).toStrictEqual(["item"]);
    expect(result.canUndo.value).toBe(true);
    expect(result.canRedo.value).toBe(false);
  });

  test("accepts array of scopes", () => {
    const doc = new Y.Doc();
    const yArray = doc.getArray<string>("list");
    const yMap = doc.getMap("map");
    const { result } = withSetup(() => useUndoManager([yArray, yMap]));

    yArray.insert(0, ["item"]);
    result.stopCapturing();
    yMap.set("key", "value");

    expect(result.canUndo.value).toBe(true);

    result.undo(); // undo yMap.set
    expect(yMap.toJSON()).toStrictEqual({});
    expect(yArray.toJSON()).toStrictEqual(["item"]);

    result.undo(); // undo yArray.insert
    expect(yArray.toJSON()).toStrictEqual([]);
  });

  test("respects trackedOrigins option", () => {
    const doc = new Y.Doc();
    const yArray = doc.getArray<string>("list");
    const origin = "tracked";
    const { result } = withSetup(() =>
      useUndoManager(yArray, { trackedOrigins: new Set([origin]) }),
    );

    // Change with untracked origin (null) — should NOT be undoable
    yArray.insert(0, ["untracked"]);
    expect(result.canUndo.value).toBe(false);

    // Change with tracked origin — should be undoable
    doc.transact(() => {
      yArray.insert(1, ["tracked"]);
    }, origin);
    expect(result.canUndo.value).toBe(true);

    // Undo should only remove the tracked change
    result.undo();
    expect(yArray.toJSON()).toStrictEqual(["untracked"]);
  });

  test("multiple undo/redo cycles produce correct state", () => {
    const doc = new Y.Doc();
    const yArray = doc.getArray<string>("list");
    const { result } = withSetup(() =>
      useUndoManager(yArray, { captureTimeout: 0 }),
    );

    yArray.insert(0, ["a"]);
    result.stopCapturing();
    yArray.insert(1, ["b"]);
    result.stopCapturing();
    yArray.insert(2, ["c"]);

    result.undo(); // removes "c"
    expect(yArray.toJSON()).toStrictEqual(["a", "b"]);
    result.undo(); // removes "b"
    expect(yArray.toJSON()).toStrictEqual(["a"]);
    result.undo(); // removes "a"
    expect(yArray.toJSON()).toStrictEqual([]);

    result.redo(); // re-adds "a"
    result.redo(); // re-adds "b"
    result.redo(); // re-adds "c"
    expect(yArray.toJSON()).toStrictEqual(["a", "b", "c"]);
  });
});

describe("capture control", () => {
  test("stopCapturing forces a new capture group", () => {
    const doc = new Y.Doc();
    const yArray = doc.getArray<string>("list");
    const { result } = withSetup(() =>
      useUndoManager(yArray, { captureTimeout: 10000 }),
    );

    yArray.insert(0, ["a"]);
    result.stopCapturing();
    yArray.insert(1, ["b"]);

    // Undo should only remove "b" since we stopped capturing
    result.undo();
    expect(yArray.toJSON()).toStrictEqual(["a"]);
    expect(result.canUndo.value).toBe(true);
  });

  test("clear resets both stacks", () => {
    const doc = new Y.Doc();
    const yArray = doc.getArray("list");
    const { result } = withSetup(() => useUndoManager(yArray));

    yArray.insert(0, ["item"]);
    result.clear();
    expect(result.canUndo.value).toBe(false);
    expect(result.canRedo.value).toBe(false);
  });
});

describe("cleanup", () => {
  test("cleans up on unmount", () => {
    const doc = new Y.Doc();
    const yArray = doc.getArray("list");
    const { result, app } = withSetup(() => useUndoManager(yArray));
    const spy = vi.spyOn(result.undoManager, "destroy");
    app.unmount();
    expect(spy).toHaveBeenCalledOnce();
  });
});
