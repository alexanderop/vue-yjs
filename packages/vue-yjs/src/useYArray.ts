import { type ShallowRef } from "vue";
import * as Y from "yjs";
import { useYDoc } from "./useYDoc.js";
import { useY } from "./useY.js";
import { toYType } from "./toYType.js";

export interface UseYArrayReturn<T> {
  items: Readonly<ShallowRef<T[]>>;
  push: (...items: T[]) => void;
  insert: (index: number, ...items: T[]) => void;
  update: (index: number, partial: Partial<T>) => void;
  delete: (index: number, count?: number) => void;
  yArray: Y.Array<unknown>;
}

export function useYArray<T>(name: string): UseYArrayReturn<T> {
  const doc = useYDoc();
  const yArray = doc.getArray<unknown>(name);

  // Delegate reactive observation to useY
  const items = useY<T[]>(yArray);

  return {
    items,
    push: (...newItems: T[]) => {
      yArray.push(newItems.map(toYType));
    },
    insert: (index: number, ...newItems: T[]) => {
      yArray.insert(index, newItems.map(toYType));
    },
    update: (index: number, partial: Partial<T>) => {
      const target = yArray.get(index);
      if (!(target instanceof Y.Map)) {
        throw new Error(
          "useYArray.update() can only be used on arrays of objects (Y.Map items)"
        );
      }
      doc.transact(() => {
        for (const [key, value] of Object.entries(partial)) {
          target.set(key, toYType(value));
        }
      });
    },
    delete: (index: number, count = 1) => {
      yArray.delete(index, count);
    },
    yArray,
  };
}
