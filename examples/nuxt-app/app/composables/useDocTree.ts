import * as Y from 'yjs'

export interface DocTreeNode {
  name: string
  type: 'Y.Map' | 'Y.Array' | 'Y.Text' | 'Y.XmlFragment' | 'Y.XmlElement' | 'Y.XmlText' | 'primitive'
  value: unknown
  children: readonly DocTreeNode[]
  path: string
  changed: boolean
}

function getTypeName(yType: unknown): DocTreeNode['type'] {
  if (yType instanceof Y.Map) return 'Y.Map'
  if (yType instanceof Y.Array) return 'Y.Array'
  if (yType instanceof Y.Text) return 'Y.Text'
  if (yType instanceof Y.XmlFragment) return 'Y.XmlFragment'
  if (yType instanceof Y.XmlElement) return 'Y.XmlElement'
  if (yType instanceof Y.XmlText) return 'Y.XmlText'
  return 'primitive'
}

function yTypeToTree(name: string, yType: unknown, basePath: string): DocTreeNode {
  const path = basePath ? `${basePath}.${name}` : name
  const type = getTypeName(yType)

  if (yType instanceof Y.Map) {
    const children: DocTreeNode[] = []
    for (const [key, val] of yType.entries()) {
      children.push(yTypeToTree(key, val, path))
    }
    return { name, type, value: null, children, path, changed: false }
  }

  if (yType instanceof Y.Array) {
    const children: DocTreeNode[] = []
    yType.forEach((item, idx) => {
      children.push(yTypeToTree(String(idx), item, path))
    })
    return { name, type, value: null, children, path, changed: false }
  }

  if (yType instanceof Y.Text) {
    return { name, type, value: yType.toString(), children: [], path, changed: false }
  }

  if (yType instanceof Y.XmlFragment || yType instanceof Y.XmlText) {
    return { name, type, value: yType.toString(), children: [], path, changed: false }
  }

  // Primitive value
  return { name, type: 'primitive', value: yType, children: [], path, changed: false }
}

function markChanged(node: DocTreeNode, paths: Set<string>): void {
  if (paths.has(node.path)) {
    node.changed = true
  }
  for (const child of node.children) {
    markChanged(child, paths)
  }
}

export function useDocTree(doc: Y.Doc) {
  const tree = shallowRef<DocTreeNode[]>([])
  const changedPaths = shallowRef<Set<string>>(new Set())

  const pendingTimeouts = new Set<ReturnType<typeof setTimeout>>()

  function buildTree() {
    const nodes: DocTreeNode[] = []
    const currentChanged = changedPaths.value

    for (const [name, yType] of doc.share.entries()) {
      const node = yTypeToTree(name, yType, '')
      markChanged(node, currentChanged)
      nodes.push(node)
    }

    tree.value = nodes
  }

  function handleDeepEvent(events: Y.YEvent<any>[]) {
    const newPaths = new Set<string>()

    for (const event of events) {
      // Build path from the event's path array
      const pathParts: string[] = []
      const yPath = event.path
      for (const segment of yPath) {
        pathParts.push(String(segment))
      }

      // Also mark the target's parent path
      const target = event.target
      if (target instanceof Y.Map || target instanceof Y.Array) {
        const parentPath = pathParts.join('.')
        // Mark changed keys within the target
        if (event.changes.keys) {
          for (const [key] of event.changes.keys) {
            const fullPath = parentPath ? `${parentPath}.${key}` : key
            newPaths.add(fullPath)
          }
        }
        // For array changes, mark the parent
        if (event.changes.delta && event.changes.delta.length > 0) {
          newPaths.add(parentPath)
        }
      }

      // Always mark at least the event's own path
      if (pathParts.length > 0) {
        newPaths.add(pathParts.join('.'))
      }
    }

    if (newPaths.size > 0) {
      const merged = new Set(changedPaths.value)
      for (const p of newPaths) merged.add(p)
      changedPaths.value = merged
      buildTree()

      // Clear highlights after 1.5s
      const timeout = setTimeout(() => {
        pendingTimeouts.delete(timeout)
        const next = new Set(changedPaths.value)
        for (const p of newPaths) next.delete(p)
        changedPaths.value = next
        buildTree()
      }, 1500)
      pendingTimeouts.add(timeout)
    }
    else {
      buildTree()
    }
  }

  // Observe all shared types
  function attach() {
    for (const [, yType] of doc.share.entries()) {
      yType.observeDeep(handleDeepEvent)
    }
  }

  function detach() {
    for (const [, yType] of doc.share.entries()) {
      yType.unobserveDeep(handleDeepEvent)
    }
    for (const t of pendingTimeouts) clearTimeout(t)
    pendingTimeouts.clear()
  }

  // Initial build
  buildTree()
  attach()

  // Re-attach only when new shared types are added (not on every transaction)
  let knownShareSize = doc.share.size
  const handleShareChange = () => {
    if (doc.share.size !== knownShareSize) {
      knownShareSize = doc.share.size
      detach()
      attach()
      buildTree()
    }
  }
  doc.on('afterTransaction', handleShareChange)

  onScopeDispose(() => {
    detach()
    doc.off('afterTransaction', handleShareChange)
  })

  return {
    tree: readonly(tree),
    changedPaths: readonly(changedPaths),
    refresh: buildTree,
  }
}
