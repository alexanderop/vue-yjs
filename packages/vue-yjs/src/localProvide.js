import { provide, inject, getCurrentInstance } from "vue";
const localMap = new WeakMap();
/**
 * Like Vue's `provide()` but also stores the value on a `WeakMap` keyed by
 * the current component instance so that `injectLocal()` can retrieve it
 * within the **same** component's setup.
 */
export function provideLocal(key, value) {
    const instance = getCurrentInstance()?.proxy;
    if (instance) {
        let record = localMap.get(instance);
        if (!record) {
            record = {};
            localMap.set(instance, record);
        }
        record[key] = value;
    }
    provide(key, value);
}
/**
 * Like Vue's `inject()` but checks the local `WeakMap` first, allowing it to
 * find values from `provideLocal()` called in the **same** component's setup.
 */
export function injectLocal(key, defaultValue) {
    const instance = getCurrentInstance()?.proxy;
    if (instance) {
        const record = localMap.get(instance);
        if (record && key in record) {
            return record[key];
        }
    }
    return arguments.length > 1
        ? inject(key, defaultValue)
        : inject(key);
}
