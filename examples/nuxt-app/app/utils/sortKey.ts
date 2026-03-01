import { generateKeyBetween } from 'fractional-indexing'

/**
 * Generate a sort key that places a new item after all existing items.
 */
export function sortKeyAppend(sorted: { sortKey: string }[]): string {
  const lastKey = sorted.length > 0 ? sorted[sorted.length - 1]!.sortKey : null
  return generateKeyBetween(lastKey, null)
}

/**
 * Generate a sort key for moving an item from one position to another
 * in a sorted list. Returns `null` if the move is invalid or a no-op.
 */
export function sortKeyForMove(
  sorted: { sortKey: string }[],
  fromIndex: number,
  toIndex: number,
): string | null {
  if (fromIndex === toIndex) return null
  if (fromIndex < 0 || fromIndex >= sorted.length) return null
  if (toIndex < 0 || toIndex >= sorted.length) return null

  let prevKey: string | null = null
  let nextKey: string | null = null

  if (fromIndex < toIndex) {
    prevKey = sorted[toIndex]!.sortKey
    nextKey = toIndex + 1 < sorted.length ? sorted[toIndex + 1]!.sortKey : null
  } else {
    prevKey = toIndex - 1 >= 0 ? sorted[toIndex - 1]!.sortKey : null
    nextKey = sorted[toIndex]!.sortKey
  }

  return generateKeyBetween(prevKey, nextKey)
}
