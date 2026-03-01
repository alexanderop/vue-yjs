import { describe, it, expect, afterEach, vi } from 'vitest'
import { effectScope } from 'vue'
import * as Y from 'yjs'
import { useDocMetrics } from './useDocMetrics'

describe('useDocMetrics', () => {
  let scope: ReturnType<typeof effectScope>
  let doc: Y.Doc

  afterEach(() => {
    scope?.stop()
    doc?.destroy()
    vi.useRealTimers()
  })

  function setup() {
    vi.useFakeTimers()
    doc = new Y.Doc()
    scope = effectScope()
    return scope.run(() => useDocMetrics(doc))!
  }

  it('computes initial metrics', () => {
    const { metrics } = setup()
    expect(metrics.value.docSizeBytes).toBeGreaterThanOrEqual(0)
    expect(metrics.value.liveItems).toBe(0)
    expect(metrics.value.deletedItems).toBe(0)
    expect(metrics.value.gcItems).toBe(0)
    expect(metrics.value.clientCount).toBe(0)
    expect(Array.isArray(metrics.value.stateVector)).toBe(true)
  })

  it('updates after transaction + 500ms debounce', () => {
    const { metrics } = setup()
    const initialSize = metrics.value.docSizeBytes

    const map = doc.getMap('test')
    map.set('key', 'value')

    // Before debounce fires, still has old value
    expect(metrics.value.docSizeBytes).toBe(initialSize)

    vi.advanceTimersByTime(500)

    expect(metrics.value.docSizeBytes).toBeGreaterThan(initialSize)
  })

  it('shows live items after Y.Map set', () => {
    const { metrics } = setup()

    const map = doc.getMap('test')
    map.set('a', 'b')
    vi.advanceTimersByTime(500)

    expect(metrics.value.liveItems).toBeGreaterThan(0)
    expect(metrics.value.clientCount).toBeGreaterThan(0)
  })

  it('shows deleted items after delete', () => {
    const { metrics } = setup()

    const map = doc.getMap('test')
    map.set('a', 'b')
    vi.advanceTimersByTime(500)

    map.delete('a')
    vi.advanceTimersByTime(500)

    expect(metrics.value.deletedItems).toBeGreaterThan(0)
  })

  it('includes stateVector as tuples', () => {
    const { metrics } = setup()

    const map = doc.getMap('test')
    map.set('a', 'b')
    vi.advanceTimersByTime(500)

    expect(metrics.value.stateVector.length).toBeGreaterThan(0)
    expect(metrics.value.stateVector[0]!).toHaveLength(2)
  })

  it('stops updating after scope dispose', () => {
    const { metrics } = setup()

    const map = doc.getMap('test')
    map.set('a', 'b')
    vi.advanceTimersByTime(500)
    const snapshotSize = metrics.value.docSizeBytes

    scope.stop()

    map.set('c', 'd')
    vi.advanceTimersByTime(500)

    expect(metrics.value.docSizeBytes).toBe(snapshotSize)
  })
})
