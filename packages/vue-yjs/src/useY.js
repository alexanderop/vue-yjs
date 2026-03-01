import { shallowRef, onScopeDispose, readonly } from "vue";
import { equalityDeep } from "lib0/function";
/**
 * Reactive binding for any Y.js shared type.
 *
 * Returns a readonly shallow ref that stays in sync with the underlying
 * CRDT via `observeDeep`. The observer is cleaned up automatically when
 * the enclosing effect scope is disposed.
 *
 * @param yData - The Y.js shared type to observe.
 * @returns A readonly shallow ref containing the JSON snapshot.
 *
 * @example
 * ```ts
 * const yArray = doc.getArray<string>('items')
 * const items = useY(yArray) // Ref<string[]>
 * ```
 */
export function useY(yData) {
    const data = shallowRef(yData.toJSON());
    const handler = () => {
        const newData = yData.toJSON();
        if (!equalityDeep(data.value, newData)) {
            data.value = newData;
        }
    };
    yData.observeDeep(handler);
    onScopeDispose(() => {
        yData.unobserveDeep(handler);
    });
    return readonly(data);
}
