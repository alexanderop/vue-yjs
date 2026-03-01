import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { toYType } from "./toYType.js";

describe("toYType", () => {
  test("passes through primitives", () => {
    expect(toYType("hello")).toBe("hello");
    expect(toYType(42)).toBe(42);
    expect(toYType(true)).toBe(true);
    expect(toYType(null)).toBe(null);
  });

  test("passes through Uint8Array", () => {
    const bytes = new Uint8Array([1, 2, 3]);
    expect(toYType(bytes)).toBe(bytes);
  });

  test("passes through existing Yjs types", () => {
    const yMap = new Y.Map();
    expect(toYType(yMap)).toBe(yMap);
    const yArray = new Y.Array();
    expect(toYType(yArray)).toBe(yArray);
  });

  test("converts plain object to Y.Map", () => {
    const result = toYType({ name: "Alice", age: 30 });
    expect(result).toBeInstanceOf(Y.Map);
    // To get JSON, integrate into doc
    const doc = new Y.Doc();
    const root = doc.getArray("test");
    root.push([result]);
    expect((root.get(0) as Y.Map<unknown>).toJSON()).toEqual({
      name: "Alice",
      age: 30,
    });
  });

  test("converts array to Y.Array", () => {
    const result = toYType(["a", "b", "c"]);
    expect(result).toBeInstanceOf(Y.Array);
    const doc = new Y.Doc();
    const root = doc.getArray("test");
    root.push([result]);
    expect((root.get(0) as Y.Array<unknown>).toJSON()).toEqual(["a", "b", "c"]);
  });

  test("converts nested objects recursively", () => {
    const result = toYType({ user: { name: "Bob", tags: ["admin", "user"] } });
    expect(result).toBeInstanceOf(Y.Map);
    const doc = new Y.Doc();
    const root = doc.getArray("test");
    root.push([result]);
    expect((root.get(0) as Y.Map<unknown>).toJSON()).toEqual({
      user: { name: "Bob", tags: ["admin", "user"] },
    });
  });
});
