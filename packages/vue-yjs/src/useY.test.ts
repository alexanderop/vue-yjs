import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { useY } from "./useY.js";
import { withSetup } from "./test-utils.js";

describe("initial value", () => {
  test("should return the initial empty Y.Array", () => {
    const doc = new Y.Doc();
    const yArray = doc.getArray("myList");
    const { result } = withSetup(() => useY(yArray));
    expect(result.value).toStrictEqual([]);
  });

  test("should return pre-populated Y.Array data", () => {
    const doc = new Y.Doc();
    const yArray = doc.getArray("myList");
    yArray.insert(0, ["Alice"]);
    const { result } = withSetup(() => useY(yArray));
    expect(result.value).toStrictEqual(["Alice"]);
  });
});

describe("reactivity", () => {
  test("should react to Y.Array changes", () => {
    const doc = new Y.Doc();
    const yArray = doc.getArray("myList");
    const { result } = withSetup(() => useY(yArray));

    yArray.insert(0, ["Bob"]);
    expect(result.value).toStrictEqual(["Bob"]);
  });

  test("should react to Y.Map changes", () => {
    const doc = new Y.Doc();
    const yMap = doc.getMap("myMap");
    const { result } = withSetup(() => useY(yMap));

    yMap.set("name", "Charlie");
    expect(result.value).toStrictEqual({ name: "Charlie" });
  });

  test("should react to Y.Text changes", () => {
    const doc = new Y.Doc();
    const yText = doc.getText("myText");
    const { result } = withSetup(() => useY(yText));

    yText.insert(0, "David");
    expect(result.value).toStrictEqual("David");
  });

  test("should react to Y.XmlElement changes", () => {
    const doc = new Y.Doc();
    const yXmlElement = doc.get("myElement", Y.XmlElement);
    const { result } = withSetup(() => useY(yXmlElement));

    yXmlElement.insert(0, [new Y.XmlText("Eve")]);
    expect(result.value).toStrictEqual("<undefined>Eve</undefined>");
  });

  test("should react to Y.XmlFragment changes", () => {
    const doc = new Y.Doc();
    const yXmlFragment = doc.get("myFragment", Y.XmlFragment);
    const { result } = withSetup(() => useY(yXmlFragment));

    yXmlFragment.insert(0, [new Y.XmlText("Frank")]);
    expect(result.value).toStrictEqual("Frank");
  });

  test("nested Y.Map inside Y.Array reacts to deep changes", () => {
    const doc = new Y.Doc();
    const yArray = doc.getArray("nested");
    const innerMap = new Y.Map();
    yArray.insert(0, [innerMap]);

    const { result } = withSetup(() => useY(yArray));

    innerMap.set("key", "value");
    expect(result.value).toStrictEqual([{ key: "value" }]);
  });

  test("multiple mutations in a single transaction produce correct result", () => {
    const doc = new Y.Doc();
    const yMap = doc.getMap("myMap");
    const { result } = withSetup(() => useY(yMap));

    doc.transact(() => {
      yMap.set("a", 1);
      yMap.set("b", 2);
      yMap.set("c", 3);
    });

    expect(result.value).toStrictEqual({ a: 1, b: 2, c: 3 });
  });

  test("Y.Map delete operations reflected in reactive data", () => {
    const doc = new Y.Doc();
    const yMap = doc.getMap("myMap");
    yMap.set("a", 1);
    yMap.set("b", 2);

    const { result } = withSetup(() => useY(yMap));

    yMap.delete("a");
    expect(result.value).toStrictEqual({ b: 2 });
  });
});

describe("reference equality", () => {
  test("should maintain reference equality when data has not changed", () => {
    const doc = new Y.Doc();
    const yMap = doc.getMap("myMap");
    yMap.set("key", "value");
    const { result } = withSetup(() => useY(yMap));

    const ref1 = result.value;

    doc.transact(() => {
      yMap.set("key", "value");
    });

    expect(result.value).toBe(ref1);
  });
});

describe("cleanup", () => {
  test("should cleanup observer on unmount", () => {
    const doc = new Y.Doc();
    const yArray = doc.getArray("myList");
    const { result, app } = withSetup(() => useY(yArray));

    app.unmount();

    const valueBefore = result.value;
    yArray.insert(0, ["should-not-appear"]);
    expect(result.value).toBe(valueBefore);
  });
});
