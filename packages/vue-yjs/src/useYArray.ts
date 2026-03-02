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
  findIndex: <K extends keyof T & string>(key: K, value: T[K]) => number;
  updateBy: <K extends keyof T & string>(
    key: K,
    value: T[K],
    partial: Partial<T>,
  ) => boolean;
  deleteBy: <K extends keyof T & string>(key: K, value: T[K]) => boolean;
  yArray: Y.Array<unknown>;
}

export function useYArray<T>(name: string): UseYArrayReturn<T> {
  const doc = useYDoc();
  const yArray = doc.getArray<unknown>(name);

  // Delegate reactive observation to useY
  const items = useY<T[]>(yArray);

  function findYIndex<K extends keyof T & string>(
    key: K,
    value: T[K],
  ): number {
    for (let i = 0; i < yArray.length; i++) {
      const item = yArray.get(i);
      if (!(item instanceof Y.Map)) {
        throw new Error(
          "useYArray.findIndex() can only be used on arrays of objects (Y.Map items)",
        );
      }
      if (item.get(key) === value) return i;
    }
    return -1;
  }

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
          "useYArray.update() can only be used on arrays of objects (Y.Map items)",
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
    findIndex: findYIndex,
    updateBy: <K extends keyof T & string>(
      key: K,
      value: T[K],
      partial: Partial<T>,
    ): boolean => {
      const idx = findYIndex(key, value);
      if (idx === -1) return false;
      const target = yArray.get(idx) as Y.Map<unknown>;
      doc.transact(() => {
        for (const [k, v] of Object.entries(partial)) {
          target.set(k, toYType(v));
        }
      });
      return true;
    },
    deleteBy: <K extends keyof T & string>(
      key: K,
      value: T[K],
    ): boolean => {
      const idx = findYIndex(key, value);
      if (idx === -1) return false;
      yArray.delete(idx, 1);
      return true;
    },
    yArray,
  };
}
