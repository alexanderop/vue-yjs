// @vitest-environment happy-dom
import { expect, test, vi } from "vitest";
import * as Y from "yjs";
import { useProvideYDoc, useYDoc, YDocKey } from "./useYDoc.js";
import { withSetup, withProvideSetup } from "./test-utils.js";

test("useProvideYDoc creates a new Y.Doc when none provided", () => {
  const { result } = withSetup(() => useProvideYDoc());
  expect(result).toBeInstanceOf(Y.Doc);
});

test("useProvideYDoc uses the provided Y.Doc", () => {
  const doc = new Y.Doc();
  const { result } = withSetup(() => useProvideYDoc(doc));
  expect(result).toBe(doc);
});

test("useProvideYDoc destroys auto-created doc on unmount", () => {
  const { result, app } = withSetup(() => useProvideYDoc());
  const spy = vi.spyOn(result, "destroy");
  app.unmount();
  expect(spy).toHaveBeenCalledOnce();
});

test("useProvideYDoc does not destroy externally provided doc on unmount", () => {
  const doc = new Y.Doc();
  const spy = vi.spyOn(doc, "destroy");
  const { app } = withSetup(() => useProvideYDoc(doc));
  app.unmount();
  expect(spy).not.toHaveBeenCalled();
});

test("useYDoc injects the provided doc", () => {
  const doc = new Y.Doc();
  const { result } = withProvideSetup(() => useYDoc(), [[YDocKey, doc]]);
  expect(result).toBe(doc);
});

test("useYDoc returns the doc passed directly (same-component pattern)", () => {
  const doc = new Y.Doc();
  const { result } = withSetup(() => useYDoc(doc));
  expect(result).toBe(doc);
});

test("useYDoc throws when no doc is provided and no ancestor provides one", () => {
  expect(() => withSetup(() => useYDoc())).toThrow(
    "useYDoc() could not find a Y.Doc"
  );
});

test("useProvideYDoc then useYDoc in same setup returns the same Y.Doc", () => {
  const { result } = withSetup(() => {
    const provided = useProvideYDoc();
    const resolved = useYDoc();
    return { provided, resolved };
  });
  expect(result.resolved).toBe(result.provided);
  expect(result.resolved).toBeInstanceOf(Y.Doc);
});

test("composable chaining: useYDoc works inside a composable called after useProvideYDoc", () => {
  // Mirrors the Nuxt pattern: useCollaboration() provides, useTodoList() injects
  function useInner() {
    return useYDoc();
  }
  const { result } = withSetup(() => {
    const doc = useProvideYDoc();
    const innerDoc = useInner();
    return { doc, innerDoc };
  });
  expect(result.innerDoc).toBe(result.doc);
});
