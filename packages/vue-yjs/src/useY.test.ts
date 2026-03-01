// @vitest-environment happy-dom
import { expect, test } from "vitest";
import * as Y from "yjs";
import { useY } from "./useY.js";
import { withSetup } from "./test-utils.js";

test("should return the initial empty Y.Array", () => {
  const yDoc = new Y.Doc();
  const yArray = yDoc.getArray("myList");
  const { result } = withSetup(() => useY(yArray));
  expect(result.value).toStrictEqual([]);
});

test("should return pre-populated Y.Array data", () => {
  const yDoc = new Y.Doc();
  const yArray = yDoc.getArray("myList");
  yArray.insert(0, ["Alice"]);
  const { result } = withSetup(() => useY(yArray));
  expect(result.value).toStrictEqual(["Alice"]);
});

test("should react to Y.Array changes", () => {
  const yDoc = new Y.Doc();
  const yArray = yDoc.getArray("myList");
  const { result } = withSetup(() => useY(yArray));

  yArray.insert(0, ["Bob"]);
  expect(result.value).toStrictEqual(["Bob"]);
});

test("should react to Y.Map changes", () => {
  const yDoc = new Y.Doc();
  const yMap = yDoc.getMap("myMap");
  const { result } = withSetup(() => useY(yMap));

  yMap.set("name", "Charlie");
  expect(result.value).toStrictEqual({ name: "Charlie" });
});

test("should react to Y.Text changes", () => {
  const yDoc = new Y.Doc();
  const yText = yDoc.getText("myText");
  const { result } = withSetup(() => useY(yText));

  yText.insert(0, "David");
  expect(result.value).toStrictEqual("David");
});

test("should react to Y.XmlElement changes", () => {
  const yDoc = new Y.Doc();
  const yXmlElement = yDoc.get("myElement", Y.XmlElement);
  const { result } = withSetup(() => useY(yXmlElement));

  yXmlElement.insert(0, [new Y.XmlText("Eve")]);
  expect(result.value).toStrictEqual("<undefined>Eve</undefined>");
});

test("should react to Y.XmlFragment changes", () => {
  const yDoc = new Y.Doc();
  const yXmlFragment = yDoc.get("myFragment", Y.XmlFragment);
  const { result } = withSetup(() => useY(yXmlFragment));

  yXmlFragment.insert(0, [new Y.XmlText("Frank")]);
  expect(result.value).toStrictEqual("Frank");
});

test("should cleanup observer on unmount", () => {
  const yDoc = new Y.Doc();
  const yArray = yDoc.getArray("myList");
  const { result, app } = withSetup(() => useY(yArray));

  app.unmount();

  const valueBefore = result.value;
  yArray.insert(0, ["should-not-appear"]);
  expect(result.value).toBe(valueBefore);
});

test("should maintain reference equality when data has not changed", () => {
  const yDoc = new Y.Doc();
  const yMap = yDoc.getMap("myMap");
  yMap.set("key", "value");
  const { result } = withSetup(() => useY(yMap));

  const ref1 = result.value;

  yDoc.transact(() => {
    yMap.set("key", "value");
  });

  expect(result.value).toBe(ref1);
});
