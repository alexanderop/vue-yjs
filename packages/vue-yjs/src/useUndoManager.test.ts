// @vitest-environment happy-dom
import { expect, test, vi } from "vitest";
import * as Y from "yjs";
import { useUndoManager } from "./useUndoManager.js";
import { withSetup } from "./test-utils.js";

test("should return canUndo false and canRedo false initially", () => {
  const doc = new Y.Doc();
  const yArray = doc.getArray("list");
  const { result } = withSetup(() => useUndoManager(yArray));
  expect(result.canUndo.value).toBe(false);
  expect(result.canRedo.value).toBe(false);
});

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

test("clear resets both stacks", () => {
  const doc = new Y.Doc();
  const yArray = doc.getArray("list");
  const { result } = withSetup(() => useUndoManager(yArray));

  yArray.insert(0, ["item"]);
  result.clear();
  expect(result.canUndo.value).toBe(false);
  expect(result.canRedo.value).toBe(false);
});

test("stopCapturing forces a new capture group", () => {
  const doc = new Y.Doc();
  const yArray = doc.getArray<string>("list");
  const { result } = withSetup(() =>
    useUndoManager(yArray, { captureTimeout: 10000 })
  );

  yArray.insert(0, ["a"]);
  result.stopCapturing();
  yArray.insert(1, ["b"]);

  // Undo should only remove "b" since we stopped capturing
  result.undo();
  expect(yArray.toJSON()).toStrictEqual(["a"]);
  expect(result.canUndo.value).toBe(true);
});

test("exposes the raw undoManager", () => {
  const doc = new Y.Doc();
  const yArray = doc.getArray("list");
  const { result } = withSetup(() => useUndoManager(yArray));
  expect(result.undoManager).toBeInstanceOf(Y.UndoManager);
});

test("cleans up on unmount", () => {
  const doc = new Y.Doc();
  const yArray = doc.getArray("list");
  const { result, app } = withSetup(() => useUndoManager(yArray));
  const spy = vi.spyOn(result.undoManager, "destroy");
  app.unmount();
  expect(spy).toHaveBeenCalledOnce();
});
