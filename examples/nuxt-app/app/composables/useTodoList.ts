import * as Y from 'yjs'
import { generateKeyBetween } from 'fractional-indexing'
import { useYDoc, useY, useUndoManager } from 'vue-yjs'

export function useTodoList() {
  const resolvedDoc = useYDoc()
  const yTodos = resolvedDoc.getArray<Y.Map<unknown>>('todos')
  const rawTodos = useY(yTodos)

  const todos = computed(() => {
    const items = rawTodos.value as unknown as Todo[]
    return [...items].toSorted((a, b) => {
      const cmp = a.sortKey.localeCompare(b.sortKey)
      return cmp !== 0 ? cmp : a.id.localeCompare(b.id)
    })
  })

  const { undo, redo, canUndo, canRedo } = useUndoManager(yTodos)

  function findIndexById(id: string): number {
    for (let i = 0; i < yTodos.length; i++) {
      if (yTodos.get(i).get('id') === id) return i
    }
    return -1
  }

  function addTodo(text: string) {
    if (!text.trim()) return

    const sorted = todos.value
    const lastSortKey = sorted.length > 0 ? sorted[sorted.length - 1]!.sortKey : null
    const sortKey = generateKeyBetween(lastSortKey, null)

    const item = new Y.Map<unknown>()
    item.set('id', crypto.randomUUID())
    item.set('text', text.trim())
    item.set('done', false)
    item.set('sortKey', sortKey)
    yTodos.push([item])
  }

  function toggleTodo(id: string) {
    const idx = findIndexById(id)
    if (idx === -1) return
    const item = yTodos.get(idx)
    item.set('done', !item.get('done'))
  }

  function deleteTodo(id: string) {
    const idx = findIndexById(id)
    if (idx === -1) return
    yTodos.delete(idx, 1)
  }

  function editTodo(id: string, text: string) {
    const idx = findIndexById(id)
    if (idx === -1) return
    yTodos.get(idx).set('text', text)
  }

  function moveTodo(fromIndex: number, toIndex: number) {
    const sorted = todos.value
    if (fromIndex === toIndex) return
    if (fromIndex < 0 || fromIndex >= sorted.length) return
    if (toIndex < 0 || toIndex >= sorted.length) return

    const movedItem = sorted[fromIndex]
    if (!movedItem) return

    // Calculate new sort key based on neighbors at the target position
    let prevKey: string | null = null
    let nextKey: string | null = null

    if (fromIndex < toIndex) {
      // Moving down
      prevKey = sorted[toIndex]!.sortKey
      nextKey = toIndex + 1 < sorted.length ? sorted[toIndex + 1]!.sortKey : null
    } else {
      // Moving up
      prevKey = toIndex - 1 >= 0 ? sorted[toIndex - 1]!.sortKey : null
      nextKey = sorted[toIndex]!.sortKey
    }

    const newSortKey = generateKeyBetween(prevKey, nextKey)

    const idx = findIndexById(movedItem.id)
    if (idx !== -1) {
      yTodos.get(idx).set('sortKey', newSortKey)
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
