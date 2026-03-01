import { useProvideYDoc, useWebSocketProvider, useAwareness, useIndexedDB } from 'vue-yjs'

const USER_COLORS = [
  'rgb(255, 107, 237)', 'rgb(107, 237, 255)', 'rgb(237, 255, 107)',
  'rgb(255, 150, 120)', 'rgb(120, 200, 150)', 'rgb(150, 120, 255)',
  'rgb(255, 200, 100)', 'rgb(100, 180, 255)',
]

function getOrCreateUserName(): string {
  const key = 'collab-user-name'
  const name = localStorage.getItem(key)
  if (name) return name
  const generated = `User ${Math.floor(1000 + Math.random() * 9000)}`
  localStorage.setItem(key, generated)
  return generated
}

function getOrCreateUserColor(clientId: number): string {
  const key = 'collab-user-color'
  const color = localStorage.getItem(key)
  if (color) return color
  const generated = USER_COLORS[clientId % USER_COLORS.length]!
  localStorage.setItem(key, generated)
  return generated
}

export interface AwarenessState {
  [key: string]: unknown
  name: string
  color: string
}

export function useCollaboration(roomName: string = 'default') {
  const doc = useProvideYDoc()

  if (import.meta.server) {
    return {
      doc,
      status: shallowRef('connecting' as const),
      synced: shallowRef(false),
      awarenessStates: shallowRef(new Map<number, AwarenessState>()),
      localClientId: 0,
      userName: '',
      userColor: '',
      updateUserName: (_name: string) => {},
    }
  }

  // Persist to IndexedDB for instant load on page refresh
  const { synced: _idbSynced } = useIndexedDB(`yjs-${roomName}`, doc, {
    onError: (err) => console.warn('[IndexedDB]', err),
  })

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = `${protocol}//${window.location.host}/_ws`

  const { provider, status, synced } = useWebSocketProvider(wsUrl, roomName, doc)

  const { states, localClientId, setLocalState } = useAwareness<AwarenessState>(
    provider.awareness,
  )

  const userName = getOrCreateUserName()
  const userColor = getOrCreateUserColor(localClientId)
  setLocalState({ name: userName, color: userColor })

  function updateUserName(name: string) {
    localStorage.setItem('collab-user-name', name)
    setLocalState({ name, color: userColor })
  }

  return {
    doc,
    status,
    synced,
    awarenessStates: states,
    localClientId,
    userName,
    userColor,
    updateUserName,
  }
}
