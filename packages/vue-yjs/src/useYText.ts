import { type ShallowRef } from "vue";
import * as Y from "yjs";
import { useYDoc } from "./useYDoc.js";
import { useY } from "./useY.js";

export interface UseYTextReturn {
  text: Readonly<ShallowRef<string>>;
  insert: (index: number, content: string) => void;
  delete: (index: number, length: number) => void;
  replace: (content: string) => void;
  yText: Y.Text;
}

export function useYText(name: string): UseYTextReturn {
  const doc = useYDoc();
  const yText = doc.getText(name);

  // Delegate reactive observation to useY
  const text = useY<string>(yText);

  return {
    text,
    insert: (index: number, content: string) => {
      yText.insert(index, content);
    },
    delete: (index: number, length: number) => {
      yText.delete(index, length);
    },
    replace: (content: string) => {
      // Atomic delete-all + insert using transact (single undo step)
      doc.transact(() => {
        yText.delete(0, yText.length);
        yText.insert(0, content);
      });
    },
    yText,
  };
}
