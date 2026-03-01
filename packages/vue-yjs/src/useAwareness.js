import { shallowRef, onScopeDispose } from "vue";
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
export function useAwareness(awareness) {
    const states = shallowRef(new Map(awareness.getStates()));
    const onChange = () => {
        states.value = new Map(awareness.getStates());
    };
    awareness.on("change", onChange);
    onScopeDispose(() => {
        awareness.off("change", onChange);
    });
    return {
        states: states,
        localClientId: awareness.clientID,
        setLocalState: (state) => {
            awareness.setLocalState(state);
        },
        setLocalStateField: (field, value) => {
            awareness.setLocalStateField(field, value);
        },
    };
}
