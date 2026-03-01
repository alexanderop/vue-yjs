const MAX_ENTRIES = 500

export type MessageDirection = 'in' | 'out'

/** Outer y-protocols message types (first byte of the envelope). */
export type OuterMessageType = 'sync' | 'awareness' | 'auth' | 'queryAwareness' | 'unknown'

/** Inner sync sub-types (second byte when outer = sync). */
export type SyncSubType = 'SyncStep1' | 'SyncStep2' | 'Update' | 'unknown'

export interface LogEntry {
  id: number
  timestamp: number
  direction: MessageDirection
  outerType: OuterMessageType
  syncSubType: SyncSubType | null
  bytes: number
}

const OUTER_TYPES: Record<number, OuterMessageType> = {
  0: 'sync',
  1: 'awareness',
  2: 'auth',
  3: 'queryAwareness',
}

const SYNC_SUB_TYPES: Record<number, SyncSubType> = {
  0: 'SyncStep1',
  1: 'SyncStep2',
  2: 'Update',
}

function decodeMessageType(data: ArrayBuffer): { outerType: OuterMessageType; syncSubType: SyncSubType | null } {
  const view = new Uint8Array(data)
  if (view.length === 0) return { outerType: 'unknown', syncSubType: null }

  const outerType = OUTER_TYPES[view[0]!] ?? 'unknown'
  let syncSubType: SyncSubType | null = null

  if (outerType === 'sync' && view.length > 1) {
    syncSubType = SYNC_SUB_TYPES[view[1]!] ?? 'unknown'
  }

  return { outerType, syncSubType }
}

export function useMessageLog() {
  let nextId = 0
  const entries = shallowRef<LogEntry[]>([])
  const totalBytes = shallowRef(0)

  function push(direction: MessageDirection, data: ArrayBuffer) {
    const { outerType, syncSubType } = decodeMessageType(data)
    const entry: LogEntry = {
      id: nextId++,
      timestamp: Date.now(),
      direction,
      outerType,
      syncSubType,
      bytes: data.byteLength,
    }

    totalBytes.value += data.byteLength

    const current = entries.value
    if (current.length >= MAX_ENTRIES) {
      entries.value = [...current.slice(current.length - MAX_ENTRIES + 1), entry]
    }
    else {
      entries.value = [...current, entry]
    }
  }

  function clear() {
    entries.value = []
    totalBytes.value = 0
  }

  return {
    entries: readonly(entries),
    totalBytes: readonly(totalBytes),
    push,
    clear,
  }
}
