import { onScopeDispose, type InjectionKey } from "vue";
import * as Y from "yjs";
import { provideLocal, injectLocal } from "./localProvide.js";

/** Vue injection key used to provide/inject a shared `Y.Doc`. */
export const YDocKey: InjectionKey<Y.Doc> = Symbol("YDoc");

/**
 * Provides a `Y.Doc` instance to the current and all descendant components
 * via Vue's dependency injection.
 *
 * If no document is passed, a new one is created and automatically
 * destroyed when the effect scope is disposed.
 *
 * @param doc - An existing `Y.Doc` to provide. When omitted a new
 *   document is created and owned by this scope.
 * @returns The provided (or newly created) `Y.Doc`.
 *
 * @example
 * ```ts
 * // Create and provide a new doc (auto-destroyed on unmount)
 * const doc = useProvideYDoc()
 *
 * // useYDoc() works in the same component or any child
 * const resolved = useYDoc()
 * ```
 */
export function useProvideYDoc(doc?: Y.Doc): Y.Doc {
  const ydoc = doc ?? new Y.Doc();

  provideLocal(YDocKey, ydoc);

  if (!doc) {
    onScopeDispose(() => {
      ydoc.destroy();
    });
  }

  return ydoc;
}

/**
 * Returns a `Y.Doc` — either one passed directly or one injected from
 * the current or an ancestor component.
 *
 * Works transparently in the **same** component as `useProvideYDoc`
 * (useful in Nuxt composable patterns) and across parent→child
 * boundaries.
 *
 * @param doc - (Deprecated) Optional `Y.Doc` to use directly. Passing
 *   `doc` is no longer needed — `useYDoc()` now finds docs provided in
 *   the same component automatically.
 * @returns The resolved `Y.Doc`.
 * @throws If no `doc` was passed **and** no ancestor or same-component
 *   call to {@link useProvideYDoc} exists.
 *
 * @example
 * ```ts
 * // In any component (same or child)
 * const doc = useYDoc()
 *
 * // Same-component composable pattern (Nuxt)
 * const doc = useProvideYDoc()
 * const resolved = useYDoc() // finds it automatically
 * ```
 */
export function useYDoc(doc?: Y.Doc): Y.Doc {
  if (doc) return doc;

  const injected = injectLocal(YDocKey);
  if (!injected) {
    throw new Error(
      "useYDoc() could not find a Y.Doc. Call useProvideYDoc() in " +
        "the same component or an ancestor."
    );
  }
  return injected;
}
