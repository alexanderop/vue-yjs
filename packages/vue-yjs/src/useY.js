import { shallowRef, onScopeDispose, readonly } from "vue";
import { equalityDeep } from "lib0/function";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
