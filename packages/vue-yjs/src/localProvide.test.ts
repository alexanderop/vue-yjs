// @vitest-environment happy-dom
import { expect, test } from "vitest";
import type { InjectionKey } from "vue";
import { provideLocal, injectLocal } from "./localProvide.js";
import { withSetup, withProvideSetup } from "./test-utils.js";

const TestKey: InjectionKey<string> = Symbol("TestKey");

test("injectLocal finds value from provideLocal in same setup", () => {
  const { result } = withSetup(() => {
    provideLocal(TestKey, "hello");
    return injectLocal(TestKey);
  });
  expect(result).toBe("hello");
});

test("injectLocal falls back to ancestor provide when no local value", () => {
  const AncestorKey: InjectionKey<number> = Symbol("AncestorKey");
  const { result } = withProvideSetup(
    () => injectLocal(AncestorKey),
    [[AncestorKey, 42]],
  );
  expect(result).toBe(42);
});

test("injectLocal returns undefined when nothing is provided", () => {
  const MissingKey: InjectionKey<string> = Symbol("MissingKey");
  const { result } = withSetup(() => injectLocal(MissingKey));
  expect(result).toBeUndefined();
});

test("injectLocal returns default value when nothing is provided", () => {
  const MissingKey: InjectionKey<string> = Symbol("MissingKey");
  const { result } = withSetup(() => injectLocal(MissingKey, "fallback"));
  expect(result).toBe("fallback");
});
