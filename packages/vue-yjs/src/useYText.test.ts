import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { useYText } from "./useYText.js";
import { useProvideYDoc } from "./useYDoc.js";
import { withSetup } from "./test-utils.js";

function setupYText(name: string) {
  return withSetup(() => {
    const doc = useProvideYDoc();
    const result = useYText(name);
    return { doc, ...result };
  });
}

describe("useYText", () => {
  test("returns empty string for new text", () => {
    const { result } = setupYText("myText");
    expect(result.text.value).toBe("");
  });

  test("insert() adds text at index", () => {
    const { result } = setupYText("myText");
    result.insert(0, "Hello");
    expect(result.text.value).toBe("Hello");
  });

  test("insert() at specific position", () => {
    const { result } = setupYText("myText");
    result.insert(0, "Hello World");
    result.insert(5, ",");
    expect(result.text.value).toBe("Hello, World");
  });

  test("delete() removes characters", () => {
    const { result } = setupYText("myText");
    result.insert(0, "Hello World");
    result.delete(5, 6);
    expect(result.text.value).toBe("Hello");
  });

  test("replace() atomically replaces all content", () => {
    const { result } = setupYText("myText");
    result.insert(0, "old content");
    result.replace("new content");
    expect(result.text.value).toBe("new content");
  });

  test("replace() on empty text", () => {
    const { result } = setupYText("myText");
    result.replace("fresh");
    expect(result.text.value).toBe("fresh");
  });

  test("yText escape hatch provides raw Yjs type", () => {
    const { result } = setupYText("myText");
    expect(result.yText).toBeInstanceOf(Y.Text);
  });

  test("cleans up on unmount", () => {
    const { result, app } = setupYText("myText");
    result.insert(0, "Hello");
    expect(result.text.value).toBe("Hello");

    app.unmount();

    // Mutate after unmount — ref should NOT update
    result.yText.insert(5, " World");
    expect(result.text.value).toBe("Hello");
  });

  test("reactive to external mutations on yText", () => {
    const { result } = setupYText("myText");
    // Mutate directly via the escape hatch
    result.yText.insert(0, "direct");
    expect(result.text.value).toBe("direct");
  });
});
