import { shallowRef, onScopeDispose, type ShallowRef, readonly } from "vue";
import { equalityDeep } from "lib0/function";
import * as Y from "yjs";

/**
 * Recursively maps a Y.js shared type to its JSON representation.
 *
 * - `Y.Array<V>` → `Array<YTypeToJson<V>>`
 * - `Y.Map<V>` → `{ [key: string]: YTypeToJson<V> }`
 * - `Y.Text | Y.XmlText | Y.XmlFragment` → `string`
 * - Primitives pass through unchanged.
 */
export type YTypeToJson<YType> =
  YType extends Y.Array<infer Value>
    ? Array<YTypeToJson<Value>>
    : YType extends Y.Map<infer MapValue>
      ? { [key: string]: YTypeToJson<MapValue> }
      : YType extends Y.XmlFragment | Y.XmlText | Y.Text
        ? string
        : YType;

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
export function useY<YType extends Y.AbstractType<any>>(
  yData: YType
): Readonly<ShallowRef<YTypeToJson<YType>>> {
  const data = shallowRef(yData.toJSON()) as ShallowRef<YTypeToJson<YType>>;

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

  return readonly(data) as Readonly<ShallowRef<YTypeToJson<YType>>>;
}
