import { describe, it, expect, afterEach } from 'vitest'
import { effectScope } from 'vue'
import * as Y from 'yjs'
import { useTransactionLog } from './useTransactionLog'

describe('useTransactionLog', () => {
  let scope: ReturnType<typeof effectScope>
  let doc: Y.Doc

  afterEach(() => {
    scope?.stop()
    doc?.destroy()
  })

  function setup() {
    doc = new Y.Doc()
    scope = effectScope()
    return scope.run(() => useTransactionLog(doc))!
  }

  it('starts with empty entries', () => {
    const { entries } = setup()
    expect(entries.value).toEqual([])
  })

  it('records local transaction when Y.Map key is set', () => {
    const { entries } = setup()
    const map = doc.getMap('todos')
    map.set('key1', 'value1')

    expect(entries.value).toHaveLength(1)
    expect(entries.value[0]!.local).toBe(true)
    expect(entries.value[0]!.changedTypes[0]!.typeName).toBe('todos')
  })

  it('records correct opsCount (> 0) and local = true', () => {
    const { entries } = setup()
    const map = doc.getMap('test')
    map.set('a', 'b')

    expect(entries.value[0]!.opsCount).toBeGreaterThan(0)
    expect(entries.value[0]!.local).toBe(true)
  })

  it('records deleteCount when items are deleted', () => {
    const { entries } = setup()
    const map = doc.getMap('test')
    map.set('a', 'b')

    const countBefore = entries.value.length
    map.delete('a')

    const deleteEntry = entries.value[countBefore]!
    expect(deleteEntry.deleteCount).toBeGreaterThan(0)
  })

  it('records changed keys for map operations', () => {
    const { entries } = setup()
    const map = doc.getMap('test')
    map.set('myKey', 'val')

    const entry = entries.value[0]!
    expect(entry.changedTypes[0]!.changedKeys).toContain('myKey')
  })

  it('records (array) for array operations', () => {
    const { entries } = setup()
    const arr = doc.getArray('items')
    arr.push(['hello'])

    const entry = entries.value[0]!
    expect(entry.changedTypes[0]!.changedKeys).toContain('(array)')
  })

  it('evicts oldest entries at MAX_ENTRIES (200)', () => {
    const { entries } = setup()
    const map = doc.getMap('test')

    for (let i = 0; i < 210; i++) {
      map.set(`key${i}`, `val${i}`)
    }

    expect(entries.value.length).toBeLessThanOrEqual(200)
    expect(entries.value[0]!.id).toBeGreaterThan(0)
  })

  it('clear() empties entries', () => {
    const { entries, clear } = setup()
    const map = doc.getMap('test')
    map.set('a', 'b')

    expect(entries.value.length).toBeGreaterThan(0)
    clear()
    expect(entries.value).toEqual([])
  })

  it('stops recording after scope dispose', () => {
    const { entries } = setup()
    const map = doc.getMap('test')
    map.set('a', 'b')
    const countBefore = entries.value.length

    scope.stop()

    map.set('c', 'd')
    expect(entries.value.length).toBe(countBefore)
  })

  it('includes stateVectorAfter as tuples', () => {
    const { entries } = setup()
    const map = doc.getMap('test')
    map.set('a', 'b')

    const sv = entries.value[0]!.stateVectorAfter
    expect(Array.isArray(sv)).toBe(true)
    expect(sv.length).toBeGreaterThan(0)
    expect(sv[0]!).toHaveLength(2)
  })

  it('assigns incrementing IDs', () => {
    const { entries } = setup()
    const map = doc.getMap('test')
    map.set('a', '1')
    map.set('b', '2')

    expect(entries.value[0]!.id).toBe(0)
    expect(entries.value[1]!.id).toBe(1)
  })
})
