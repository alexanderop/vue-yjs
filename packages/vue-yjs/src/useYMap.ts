import type { ShallowRef } from "vue";
import * as Y from "yjs";
import { useYDoc } from "./useYDoc.js";
import { useY } from "./useY.js";
import { toYType } from "./toYType.js";

export interface UseYMapReturn<T extends { [K in keyof T]: unknown }> {
  data: Readonly<ShallowRef<T>>;
  set: <K extends keyof T & string>(key: K, value: T[K]) => void;
  delete: (key: keyof T & string) => void;
  yMap: Y.Map<unknown>;
}

export function useYMap<T extends { [K in keyof T]: unknown }>(
  name: string,
  options?: { defaults?: Partial<T> },
): UseYMapReturn<T> {
  const doc = useYDoc();
  const yMap = doc.getMap<unknown>(name);

  // Apply defaults only when map is empty (won't overwrite persistence/sync data)
  if (options?.defaults && yMap.size === 0) {
    doc.transact(() => {
      for (const [key, value] of Object.entries(options.defaults!)) {
        yMap.set(key, toYType(value));
      }
    });
  }

  // Delegate reactive observation to useY — no duplicated logic
  const data = useY<T>(yMap);

  return {
    data,
    set: <K extends keyof T & string>(key: K, value: T[K]) => {
      yMap.set(key, toYType(value));
    },
    delete: (key: keyof T & string) => {
      yMap.delete(key);
    },
    yMap,
  };
}
