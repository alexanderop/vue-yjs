import { describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import { useProvideYDoc, useYDoc, YDocKey } from "./useYDoc.js";
import { withSetup, withProvideSetup } from "./test-utils.js";

describe("useProvideYDoc", () => {
  describe("creation", () => {
    test("creates a new Y.Doc when none provided", () => {
      const { result } = withSetup(() => useProvideYDoc());
      expect(result).toBeInstanceOf(Y.Doc);
    });

    test("uses the provided Y.Doc", () => {
      const doc = new Y.Doc();
      const { result } = withSetup(() => useProvideYDoc(doc));
      expect(result).toBe(doc);
    });
  });

  describe("cleanup", () => {
    test("destroys auto-created doc on unmount", () => {
      const { result, app } = withSetup(() => useProvideYDoc());
      const spy = vi.spyOn(result, "destroy");
      app.unmount();
      expect(spy).toHaveBeenCalledOnce();
    });

    test("does not destroy externally provided doc on unmount", () => {
      const doc = new Y.Doc();
      const spy = vi.spyOn(doc, "destroy");
      const { app } = withSetup(() => useProvideYDoc(doc));
      app.unmount();
      expect(spy).not.toHaveBeenCalled();
    });

    test("external doc's destroy is never called across multiple provide/inject cycles", () => {
      const doc = new Y.Doc();
      const spy = vi.spyOn(doc, "destroy");

      const { app: app1 } = withSetup(() => {
        useProvideYDoc(doc);
        return useYDoc();
      });
      app1.unmount();

      const { app: app2 } = withSetup(() => {
        useProvideYDoc(doc);
        return useYDoc();
      });
      app2.unmount();

      expect(spy).not.toHaveBeenCalled();
    });
  });
});

describe("useYDoc", () => {
  describe("injection", () => {
    test("injects the provided doc", () => {
      const doc = new Y.Doc();
      const { result } = withProvideSetup(() => useYDoc(), [[YDocKey, doc]]);
      expect(result).toBe(doc);
    });

    test("returns the doc passed directly (same-component pattern)", () => {
      const doc = new Y.Doc();
      const { result } = withSetup(() => useYDoc(doc));
      expect(result).toBe(doc);
    });
  });

  describe("error handling", () => {
    test("throws when no doc is provided and no ancestor provides one", () => {
      expect(() => withSetup(() => useYDoc())).toThrow(
        "useYDoc() could not find a Y.Doc",
      );
    });
  });

  describe("chaining", () => {
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
  });
});
