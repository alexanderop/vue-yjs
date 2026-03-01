import * as Y from 'yjs'

export interface DocMetrics {
  docSizeBytes: number
  liveItems: number
  deletedItems: number
  gcItems: number
  clientCount: number
  stateVector: [number, number][]
}

function compute(doc: Y.Doc): DocMetrics {
  const docSizeBytes = Y.encodeStateAsUpdate(doc).byteLength

  let liveItems = 0
  let deletedItems = 0
  let gcItems = 0

  const store = doc.store as any
  const clients: Map<number, any[]> = store.clients

  const stateVector: [number, number][] = []

  clients.forEach((structs, clientId) => {
    for (const struct of structs) {
      if (struct instanceof Y.GC) {
        gcItems += struct.length
      }
      else if (struct.deleted) {
        deletedItems += struct.length
      }
      else {
        liveItems += struct.length
      }
    }
    if (structs.length > 0) {
      const last = structs[structs.length - 1]!
      stateVector.push([clientId, last.id.clock + last.length])
    }
  })

  return {
    docSizeBytes,
    liveItems,
    deletedItems,
    gcItems,
    clientCount: clients.size,
    stateVector,
  }
}

export function useDocMetrics(doc: Y.Doc) {
  const metrics = shallowRef<DocMetrics>(compute(doc))
  let timer: ReturnType<typeof setTimeout> | null = null

  function handler() {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      metrics.value = compute(doc)
      timer = null
    }, 500)
  }

  doc.on('afterTransaction', handler)

  onScopeDispose(() => {
    doc.off('afterTransaction', handler)
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  })

  return {
    metrics: readonly(metrics),
  }
}
