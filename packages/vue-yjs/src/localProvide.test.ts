import { describe, expect, test } from "vitest";
import type { InjectionKey } from "vue";
import { provideLocal, injectLocal } from "./localProvide.js";
import { withSetup, withProvideSetup } from "./test-utils.js";

const TestKey: InjectionKey<string> = Symbol("TestKey");

describe("same-component", () => {
  test("injectLocal finds value from provideLocal in same setup", () => {
    const { result } = withSetup(() => {
      provideLocal(TestKey, "hello");
      return injectLocal(TestKey);
    });
    expect(result).toBe("hello");
  });

  test("string key works correctly", () => {
    const { result } = withSetup(() => {
      provideLocal("myStringKey", "hello");
      return injectLocal("myStringKey");
    });
    expect(result).toBe("hello");
  });

  test("local value takes precedence over ancestor value for the same key", () => {
    const Key: InjectionKey<string> = Symbol("PrecedenceKey");
    const { result } = withProvideSetup(
      () => {
        provideLocal(Key, "local");
        return injectLocal(Key);
      },
      [[Key, "ancestor"]],
    );
    expect(result).toBe("local");
  });
});

describe("ancestor", () => {
  test("injectLocal falls back to ancestor provide when no local value", () => {
    const AncestorKey: InjectionKey<number> = Symbol("AncestorKey");
    const { result } = withProvideSetup(
      () => injectLocal(AncestorKey),
      [[AncestorKey, 42]],
    );
    expect(result).toBe(42);
  });
});

describe("missing injection", () => {
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
});
