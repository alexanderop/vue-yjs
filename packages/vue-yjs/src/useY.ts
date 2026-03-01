import { shallowRef, onScopeDispose, type ShallowRef, readonly } from "vue";
import { equalityDeep } from "lib0/function";
import * as Y from "yjs";

type YTypeToJson<YType> =
  YType extends Y.Array<infer Value>
    ? Array<YTypeToJson<Value>>
    : YType extends Y.Map<infer MapValue>
      ? { [key: string]: YTypeToJson<MapValue> }
      : YType extends Y.XmlFragment | Y.XmlText | Y.Text
        ? string
        : YType;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
