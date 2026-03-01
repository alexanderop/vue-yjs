import {
  provide,
  inject,
  getCurrentInstance,
  type InjectionKey,
} from "vue";

type ProvideRecord = Record<string | symbol, unknown>;

const localMap = new WeakMap<object, ProvideRecord>();

/**
 * Like Vue's `provide()` but also stores the value on a `WeakMap` keyed by
 * the current component instance so that `injectLocal()` can retrieve it
 * within the **same** component's setup.
 */
export function provideLocal<T>(key: InjectionKey<T> | string, value: T): void {
  const instance = getCurrentInstance()?.proxy;
  if (instance) {
    let record = localMap.get(instance);
    if (!record) {
      record = {};
      localMap.set(instance, record);
    }
    record[key as string | symbol] = value;
  }
  provide(key, value);
}

/**
 * Like Vue's `inject()` but checks the local `WeakMap` first, allowing it to
 * find values from `provideLocal()` called in the **same** component's setup.
 */
export function injectLocal<T>(key: InjectionKey<T> | string): T | undefined;
export function injectLocal<T>(
  key: InjectionKey<T> | string,
  defaultValue: T,
): T;
export function injectLocal<T>(
  key: InjectionKey<T> | string,
  defaultValue?: T,
): T | undefined {
  const instance = getCurrentInstance()?.proxy;
  if (instance) {
    const record = localMap.get(instance);
    if (record && (key as string | symbol) in record) {
      return record[key as string | symbol] as T;
    }
  }
  return arguments.length > 1
    ? inject(key, defaultValue as T)
    : inject(key);
}
