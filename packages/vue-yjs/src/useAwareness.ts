import { shallowRef, onScopeDispose, type ShallowRef } from "vue";
import type { Awareness } from "y-protocols/awareness";

/** Return type of {@link useAwareness}. */
export interface UseAwarenessReturn<T extends Record<string, unknown>> {
  /** Reactive map of all awareness states keyed by client ID. */
  states: Readonly<ShallowRef<Map<number, T>>>;
  /** The local client's ID in the awareness protocol. */
  localClientId: number;
  /** Replace the entire local awareness state, or pass `null` to clear it. */
  setLocalState: (state: Partial<T> | null) => void;
  /** Update a single field on the local awareness state. */
  setLocalStateField: <K extends keyof T>(field: K, value: T[K]) => void;
}

/**
 * Reactive binding for the Y.js awareness protocol.
 *
 * Tracks remote and local awareness states in a shallow ref that
 * updates on every `"change"` event. The listener is removed
 * automatically when the enclosing effect scope is disposed.
 *
 * @typeParam T - Shape of each client's awareness state.
 * @param awareness - The `Awareness` instance to observe.
 * @returns An {@link UseAwarenessReturn} with reactive states and
 *   mutation helpers.
 *
 * @example
 * ```ts
 * interface Cursor { x: number; y: number; name: string }
 * const { states, setLocalStateField } = useAwareness<Cursor>(awareness)
 * setLocalStateField('name', 'Alice')
 * ```
 */
export function useAwareness<T extends Record<string, unknown>>(
  awareness: Awareness
): UseAwarenessReturn<T> {
  const states = shallowRef<Map<number, T>>(
    new Map(awareness.getStates() as Map<number, T>)
  );

  const onChange = () => {
    states.value = new Map(awareness.getStates() as Map<number, T>);
  };

  awareness.on("change", onChange);

  onScopeDispose(() => {
    awareness.off("change", onChange);
  });

  return {
    states: states as Readonly<ShallowRef<Map<number, T>>>,
    localClientId: awareness.clientID,
    setLocalState: (state: Partial<T> | null) => {
      awareness.setLocalState(state);
    },
    setLocalStateField: <K extends keyof T>(field: K, value: T[K]) => {
      awareness.setLocalStateField(field as string, value);
    },
  };
}
