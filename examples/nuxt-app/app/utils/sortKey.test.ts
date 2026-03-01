import { describe, it, expect } from 'vitest'
import { sortKeyAppend, sortKeyForMove } from './sortKey'

function items(...keys: string[]) {
  return keys.map(sortKey => ({ sortKey }))
}

describe('sortKeyAppend', () => {
  it('generates a key for an empty list', () => {
    const key = sortKeyAppend([])
    expect(typeof key).toBe('string')
    expect(key.length).toBeGreaterThan(0)
  })

  it('generates a key after the last item', () => {
    const key = sortKeyAppend(items('a0', 'a1', 'a2'))
    expect(key > 'a2').toBe(true)
  })

  it('generates incrementing keys on successive appends', () => {
    const list = items('a0')
    const k1 = sortKeyAppend(list)
    list.push({ sortKey: k1 })
    const k2 = sortKeyAppend(list)
    expect(k2 > k1).toBe(true)
  })
})

describe('sortKeyForMove', () => {
  const sorted = items('a0', 'a1', 'a2', 'a3', 'a4')

  it('returns null for same-index move', () => {
    expect(sortKeyForMove(sorted, 2, 2)).toBeNull()
  })

  it('returns null for negative fromIndex', () => {
    expect(sortKeyForMove(sorted, -1, 2)).toBeNull()
  })

  it('returns null for out-of-bounds fromIndex', () => {
    expect(sortKeyForMove(sorted, 5, 2)).toBeNull()
  })

  it('returns null for negative toIndex', () => {
    expect(sortKeyForMove(sorted, 2, -1)).toBeNull()
  })

  it('returns null for out-of-bounds toIndex', () => {
    expect(sortKeyForMove(sorted, 2, 5)).toBeNull()
  })

  it('moves item forward (fromIndex < toIndex)', () => {
    // Move index 1 to index 3 → key between sorted[3] and sorted[4]
    const key = sortKeyForMove(sorted, 1, 3)!
    expect(key).not.toBeNull()
    expect(key > 'a3').toBe(true)
    expect(key < 'a4').toBe(true)
  })

  it('moves item backward (fromIndex > toIndex)', () => {
    // Move index 3 to index 1 → key between sorted[0] and sorted[1]
    const key = sortKeyForMove(sorted, 3, 1)!
    expect(key).not.toBeNull()
    expect(key > 'a0').toBe(true)
    expect(key < 'a1').toBe(true)
  })

  it('moves item to the beginning', () => {
    // Move index 3 to index 0 → key before sorted[0]
    const key = sortKeyForMove(sorted, 3, 0)!
    expect(key).not.toBeNull()
    expect(key < 'a0').toBe(true)
  })

  it('moves item to the end', () => {
    // Move index 1 to index 4 → key after sorted[4]
    const key = sortKeyForMove(sorted, 1, 4)!
    expect(key).not.toBeNull()
    expect(key > 'a4').toBe(true)
  })

  it('returns null for empty list', () => {
    expect(sortKeyForMove([], 0, 1)).toBeNull()
  })
})
