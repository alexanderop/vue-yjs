import { shallowRef, computed, onScopeDispose, } from "vue";
import * as Y from "yjs";
/**
 * Reactive wrapper around `Y.UndoManager`.
 *
 * Creates an undo manager for the given scope and exposes reactive
 * `canUndo` / `canRedo` computed refs that update whenever the
 * stacks change. The undo manager is destroyed when the enclosing
 * effect scope is disposed.
 *
 * @param scope - One or more Y.js shared types to track.
 * @param options - Optional configuration.
 * @returns An {@link UseUndoManagerReturn} with undo/redo helpers.
 *
 * @example
 * ```ts
 * const yText = doc.getText('editor')
 * const { undo, redo, canUndo, canRedo } = useUndoManager(yText)
 * ```
 */
export function useUndoManager(scope, options) {
    const undoManager = new Y.UndoManager(scope, {
        captureTimeout: options?.captureTimeout ?? 500,
        trackedOrigins: options?.trackedOrigins,
    });
    const version = shallowRef(0);
    const onStackChange = () => {
        version.value++;
    };
    undoManager.on("stack-item-added", onStackChange);
    undoManager.on("stack-item-popped", onStackChange);
    undoManager.on("stack-cleared", onStackChange);
    const canUndo = computed(() => {
        void version.value;
        return undoManager.undoStack.length > 0;
    });
    const canRedo = computed(() => {
        void version.value;
        return undoManager.redoStack.length > 0;
    });
    onScopeDispose(() => {
        undoManager.off("stack-item-added", onStackChange);
        undoManager.off("stack-item-popped", onStackChange);
        undoManager.off("stack-cleared", onStackChange);
        undoManager.destroy();
    });
    return {
        undo: () => undoManager.undo(),
        redo: () => undoManager.redo(),
        canUndo,
        canRedo,
        stopCapturing: () => undoManager.stopCapturing(),
        clear: () => undoManager.clear(),
        undoManager,
    };
}
