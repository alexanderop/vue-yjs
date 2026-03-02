import { useYArray, useUndoManager } from 'vue-yjs'
import { sortKeyAppend, sortKeyForMove } from '~/utils/sortKey'

export function useTodoList() {
  const { items: rawTodos, push, update, findIndex, updateBy, deleteBy, yArray } = useYArray<Todo>('todos')

  const todos = computed(() => {
    return [...rawTodos.value].toSorted((a, b) => {
      const cmp = a.sortKey.localeCompare(b.sortKey)
      return cmp !== 0 ? cmp : a.id.localeCompare(b.id)
    })
  })

  const { undo, redo, canUndo, canRedo } = useUndoManager(yArray)

  function addTodo(text: string) {
    if (!text.trim()) return

    push({
      id: crypto.randomUUID(),
      text: text.trim(),
      done: false,
      sortKey: sortKeyAppend(todos.value),
    })
  }

  function toggleTodo(id: string) {
    const idx = findIndex('id', id)
    if (idx === -1) return
    update(idx, { done: !rawTodos.value[idx]!.done })
  }

  function deleteTodo(id: string) {
    deleteBy('id', id)
  }

  function editTodo(id: string, text: string) {
    updateBy('id', id, { text })
  }

  function moveTodo(fromIndex: number, toIndex: number) {
    const sorted = todos.value
    const newSortKey = sortKeyForMove(sorted, fromIndex, toIndex)
    if (newSortKey === null) return

    const movedItem = sorted[fromIndex]!
    updateBy('id', movedItem.id, { sortKey: newSortKey })
  }

  return {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    moveTodo,
    undo,
    redo,
    canUndo,
    canRedo,
  }
}
