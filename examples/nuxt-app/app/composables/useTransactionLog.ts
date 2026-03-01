import * as Y from 'yjs'

const MAX_ENTRIES = 200

interface ChangedTypeSummary {
  typeName: string
  changedKeys: string[]
}

export interface TransactionEntry {
  id: number
  timestamp: number
  local: boolean
  originLabel: string
  changedTypes: ChangedTypeSummary[]
  opsCount: number
  deleteCount: number
  stateVectorAfter: [number, number][]
}

function resolveOriginLabel(origin: unknown): string {
  if (origin == null) return 'local'
  if (typeof origin === 'object' && origin.constructor?.name) return origin.constructor.name
  return String(origin)
}

function stateMapToTuples(state: Map<number, number>): [number, number][] {
  const result: [number, number][] = []
  state.forEach((clock, client) => {
    result.push([client, clock])
  })
  return result
}

function computeOpsCount(before: Map<number, number>, after: Map<number, number>): number {
  let count = 0
  after.forEach((clock, client) => {
    const prev = before.get(client) ?? 0
    count += clock - prev
  })
  return count
}

function computeDeleteCount(deleteSet: { clients: Map<number, { len: number }[]> }): number {
  let count = 0
  deleteSet.clients.forEach((items) => {
    for (const item of items) {
      count += item.len
    }
  })
  return count
}

export function useTransactionLog(doc: Y.Doc) {
  let nextId = 0
  const entries = shallowRef<TransactionEntry[]>([])

  function handler(transaction: Y.Transaction) {
    const opsCount = computeOpsCount(transaction.beforeState, transaction.afterState)
    const deleteCount = computeDeleteCount(transaction.deleteSet)
    const hasChanges = transaction.changed.size > 0

    if (opsCount === 0 && deleteCount === 0 && !hasChanges) return

    const changedTypes: ChangedTypeSummary[] = []
    transaction.changed.forEach((keys, type) => {
      let typeName = '(unknown)'
      try {
        typeName = Y.findRootTypeKey(type)
      }
      catch {
        // type might not be attached to a root
      }
      const changedKeys = keys.has(null)
        ? ['(array)']
        : [...keys].filter((k): k is string => k !== null)
      changedTypes.push({ typeName, changedKeys })
    })

    const entry: TransactionEntry = {
      id: nextId++,
      timestamp: Date.now(),
      local: transaction.local,
      originLabel: resolveOriginLabel(transaction.origin),
      changedTypes,
      opsCount,
      deleteCount,
      stateVectorAfter: stateMapToTuples(transaction.afterState),
    }

    const current = entries.value
    if (current.length >= MAX_ENTRIES) {
      entries.value = [...current.slice(current.length - MAX_ENTRIES + 1), entry]
    }
    else {
      entries.value = [...current, entry]
    }
  }

  doc.on('afterTransaction', handler)

  onScopeDispose(() => {
    doc.off('afterTransaction', handler)
  })

  function clear() {
    entries.value = []
  }

  return {
    entries: readonly(entries),
    clear,
  }
}
