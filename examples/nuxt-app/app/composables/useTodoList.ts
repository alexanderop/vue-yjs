import * as Y from 'yjs'
import { useYArray, useUndoManager } from 'vue-yjs'
import { sortKeyAppend, sortKeyForMove } from '~/utils/sortKey'

export function useTodoList() {
  const { items: rawTodos, push, update, delete: deleteItem, yArray } = useYArray<Todo>('todos')

  const todos = computed(() => {
    return [...rawTodos.value].toSorted((a, b) => {
      const cmp = a.sortKey.localeCompare(b.sortKey)
      return cmp !== 0 ? cmp : a.id.localeCompare(b.id)
    })
  })

  const { undo, redo, canUndo, canRedo } = useUndoManager(yArray)

  function findIndexById(id: string): number {
    for (let i = 0; i < yArray.length; i++) {
      const item = yArray.get(i)
      if (item instanceof Y.Map && item.get('id') === id) return i
    }
    return -1
  }

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
    const idx = findIndexById(id)
    if (idx === -1) return
    update(idx, { done: !rawTodos.value[idx]!.done })
  }

  function deleteTodo(id: string) {
    const idx = findIndexById(id)
    if (idx === -1) return
    deleteItem(idx)
  }

  function editTodo(id: string, text: string) {
    const idx = findIndexById(id)
    if (idx === -1) return
    update(idx, { text })
  }

  function moveTodo(fromIndex: number, toIndex: number) {
    const sorted = todos.value
    const newSortKey = sortKeyForMove(sorted, fromIndex, toIndex)
    if (newSortKey === null) return

    const movedItem = sorted[fromIndex]!
    const idx = findIndexById(movedItem.id)
    if (idx !== -1) {
      update(idx, { sortKey: newSortKey })
    }
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
