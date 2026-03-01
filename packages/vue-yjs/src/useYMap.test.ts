import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { useYMap } from "./useYMap.js";
import { useProvideYDoc } from "./useYDoc.js";
import { withSetup } from "./test-utils.js";

// Helper: creates doc, provides it, then calls useYMap
function setupYMap<T extends Record<string, unknown>>(
  name: string,
  options?: { defaults?: Partial<T> },
) {
  return withSetup(() => {
    const doc = useProvideYDoc();
    const result = useYMap<T>(name, options);
    return { doc, ...result };
  });
}

describe("useYMap", () => {
  test("returns empty data for new map", () => {
    const { result } = setupYMap("settings");
    expect(result.data.value).toEqual({});
  });

  test("applies defaults when map is empty", () => {
    const { result } = setupYMap<{ theme: string; volume: number }>(
      "settings",
      {
        defaults: { theme: "dark", volume: 80 },
      },
    );
    expect(result.data.value).toEqual({ theme: "dark", volume: 80 });
  });

  test("does not overwrite existing data with defaults", () => {
    const { result } = withSetup(() => {
      const doc = useProvideYDoc();
      // Pre-populate the map
      doc.getMap("settings").set("theme", "light");
      return useYMap<{ theme: string; volume: number }>("settings", {
        defaults: { theme: "dark", volume: 80 },
      });
    });
    // Should keep "light", not overwrite with "dark"
    expect(result.data.value).toEqual({ theme: "light" });
  });

  test("set() updates data reactively", () => {
    const { result } = setupYMap<{ name: string }>("profile");
    result.set("name", "Alice");
    expect(result.data.value).toEqual({ name: "Alice" });
  });

  test("set() auto-converts nested objects to Y.Map", () => {
    const { result } = setupYMap<{ user: { name: string; age: number } }>(
      "data",
    );
    result.set("user", { name: "Bob", age: 30 });
    expect(result.data.value).toEqual({ user: { name: "Bob", age: 30 } });
    // Verify it's a Y.Map underneath
    expect(result.yMap.get("user")).toBeInstanceOf(Y.Map);
  });

  test("delete() removes key reactively", () => {
    const { result } = setupYMap<{ a: number; b: number }>("data", {
      defaults: { a: 1, b: 2 },
    });
    result.delete("a");
    expect(result.data.value).toEqual({ b: 2 });
  });

  test("yMap escape hatch provides raw Yjs type", () => {
    const { result } = setupYMap("test");
    expect(result.yMap).toBeInstanceOf(Y.Map);
  });

  test("cleans up on unmount", () => {
    const { result, app } = setupYMap<{ x: number }>("test");
    result.set("x", 1);
    expect(result.data.value).toEqual({ x: 1 });

    app.unmount();

    // Mutate after unmount — ref should NOT update
    result.yMap.set("x", 999);
    expect(result.data.value).toEqual({ x: 1 });
  });
});
