import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { useYArray } from "./useYArray.js";
import { useProvideYDoc } from "./useYDoc.js";
import { withSetup } from "./test-utils.js";

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

function setupYArray<T>(name: string) {
  return withSetup(() => {
    const doc = useProvideYDoc();
    const result = useYArray<T>(name);
    return { doc, ...result };
  });
}

describe("useYArray", () => {
  test("returns empty array for new array", () => {
    const { result } = setupYArray("items");
    expect(result.items.value).toEqual([]);
  });

  test("push() adds items", () => {
    const { result } = setupYArray<string>("items");
    result.push("a", "b");
    expect(result.items.value).toEqual(["a", "b"]);
  });

  test("push() auto-converts objects to Y.Map", () => {
    const { result } = setupYArray<Todo>("todos");
    result.push({ id: "1", text: "Buy milk", done: false });
    expect(result.items.value).toEqual([
      { id: "1", text: "Buy milk", done: false },
    ]);
    // Verify underlying type
    expect(result.yArray.get(0)).toBeInstanceOf(Y.Map);
  });

  test("insert() adds items at index", () => {
    const { result } = setupYArray<string>("items");
    result.push("a", "c");
    result.insert(1, "b");
    expect(result.items.value).toEqual(["a", "b", "c"]);
  });

  test("update() partially merges object at index", () => {
    const { result } = setupYArray<Todo>("todos");
    result.push(
      { id: "1", text: "Buy milk", done: false },
      { id: "2", text: "Walk dog", done: false },
    );
    result.update(0, { done: true });
    expect(result.items.value).toEqual([
      { id: "1", text: "Buy milk", done: true },
      { id: "2", text: "Walk dog", done: false },
    ]);
  });

  test("update() throws for primitive arrays", () => {
    const { result } = setupYArray<string>("items");
    result.push("hello");
    expect(() => result.update(0, {} as any)).toThrow(
      "useYArray.update() can only be used on arrays of objects"
    );
  });

  test("delete() removes items", () => {
    const { result } = setupYArray<string>("items");
    result.push("a", "b", "c");
    result.delete(1);
    expect(result.items.value).toEqual(["a", "c"]);
  });

  test("delete() removes multiple items", () => {
    const { result } = setupYArray<string>("items");
    result.push("a", "b", "c", "d");
    result.delete(1, 2);
    expect(result.items.value).toEqual(["a", "d"]);
  });

  test("yArray escape hatch provides raw Yjs type", () => {
    const { result } = setupYArray("test");
    expect(result.yArray).toBeInstanceOf(Y.Array);
  });

  test("cleans up on unmount", () => {
    const { result, app } = setupYArray<string>("test");
    result.push("a");
    expect(result.items.value).toEqual(["a"]);

    app.unmount();

    // Mutate after unmount — ref should NOT update
    result.yArray.push(["b"]);
    expect(result.items.value).toEqual(["a"]);
  });

  test("push() handles nested objects", () => {
    const { result } = setupYArray<{ user: { name: string } }>("data");
    result.push({ user: { name: "Alice" } });
    expect(result.items.value).toEqual([{ user: { name: "Alice" } }]);
  });

  test("reactive to external mutations on yArray", () => {
    const { result } = setupYArray<string>("items");
    result.yArray.push(["external"]);
    expect(result.items.value).toEqual(["external"]);
  });
});
