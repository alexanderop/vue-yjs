import { describe, it, expect } from 'vitest'
import { useMessageLog } from './useMessageLog'

function makeSyncStep1(size: number = 10): ArrayBuffer {
  const buf = new ArrayBuffer(size)
  const view = new Uint8Array(buf)
  view[0] = 0 // sync
  view[1] = 0 // SyncStep1
  return buf
}

function makeSyncStep2(size: number = 20): ArrayBuffer {
  const buf = new ArrayBuffer(size)
  const view = new Uint8Array(buf)
  view[0] = 0 // sync
  view[1] = 1 // SyncStep2
  return buf
}

function makeUpdate(size: number = 15): ArrayBuffer {
  const buf = new ArrayBuffer(size)
  const view = new Uint8Array(buf)
  view[0] = 0 // sync
  view[1] = 2 // Update
  return buf
}

function makeAwareness(size: number = 12): ArrayBuffer {
  const buf = new ArrayBuffer(size)
  const view = new Uint8Array(buf)
  view[0] = 1 // awareness
  return buf
}

describe('useMessageLog', () => {
  it('starts with empty entries', () => {
    const { entries, totalBytes } = useMessageLog()
    expect(entries.value).toEqual([])
    expect(totalBytes.value).toBe(0)
  })

  it('pushes incoming messages', () => {
    const { entries, totalBytes, push } = useMessageLog()
    push('in', makeSyncStep1(10))

    expect(entries.value).toHaveLength(1)
    expect(entries.value[0]!.direction).toBe('in')
    expect(entries.value[0]!.outerType).toBe('sync')
    expect(entries.value[0]!.syncSubType).toBe('SyncStep1')
    expect(entries.value[0]!.bytes).toBe(10)
    expect(totalBytes.value).toBe(10)
  })

  it('pushes outgoing messages', () => {
    const { entries, push } = useMessageLog()
    push('out', makeSyncStep2(20))

    expect(entries.value).toHaveLength(1)
    expect(entries.value[0]!.direction).toBe('out')
    expect(entries.value[0]!.syncSubType).toBe('SyncStep2')
  })

  it('decodes awareness messages', () => {
    const { entries, push } = useMessageLog()
    push('in', makeAwareness())

    expect(entries.value[0]!.outerType).toBe('awareness')
    expect(entries.value[0]!.syncSubType).toBeNull()
  })

  it('decodes update messages', () => {
    const { entries, push } = useMessageLog()
    push('out', makeUpdate())

    expect(entries.value[0]!.outerType).toBe('sync')
    expect(entries.value[0]!.syncSubType).toBe('Update')
  })

  it('accumulates total bytes', () => {
    const { totalBytes, push } = useMessageLog()
    push('in', makeSyncStep1(10))
    push('out', makeSyncStep2(20))
    push('in', makeUpdate(30))

    expect(totalBytes.value).toBe(60)
  })

  it('assigns incrementing IDs', () => {
    const { entries, push } = useMessageLog()
    push('in', makeSyncStep1())
    push('out', makeSyncStep2())

    expect(entries.value[0]!.id).toBe(0)
    expect(entries.value[1]!.id).toBe(1)
  })

  it('evicts oldest entries at max capacity', () => {
    const { entries, push } = useMessageLog()

    for (let i = 0; i < 510; i++) {
      push('in', makeSyncStep1(1))
    }

    expect(entries.value.length).toBeLessThanOrEqual(500)
    // First entry should have been evicted
    expect(entries.value[0]!.id).toBeGreaterThan(0)
  })

  it('clears all entries', () => {
    const { entries, totalBytes, push, clear } = useMessageLog()
    push('in', makeSyncStep1(10))
    push('out', makeSyncStep2(20))

    clear()

    expect(entries.value).toEqual([])
    expect(totalBytes.value).toBe(0)
  })

  it('handles empty ArrayBuffer', () => {
    const { entries, push } = useMessageLog()
    push('in', new ArrayBuffer(0))

    expect(entries.value[0]!.outerType).toBe('unknown')
    expect(entries.value[0]!.syncSubType).toBeNull()
    expect(entries.value[0]!.bytes).toBe(0)
  })

  it('handles unknown outer type', () => {
    const buf = new ArrayBuffer(5)
    const view = new Uint8Array(buf)
    view[0] = 99 // unknown type

    const { entries, push } = useMessageLog()
    push('in', buf)

    expect(entries.value[0]!.outerType).toBe('unknown')
  })
})
