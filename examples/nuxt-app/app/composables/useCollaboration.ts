import { useProvideYDoc, useYRoom, useAwareness } from 'vue-yjs'
import { createWebSocketPolyfill } from './useWebSocketProxy'
import { useMessageLog } from './useMessageLog'

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

export function useCollaboration(roomName: string = 'default') {
  // SSR guard: useYRoom uses WebSocket + IndexedDB which are browser-only
  if (import.meta.server) {
    const doc = useProvideYDoc()
    return {
      doc,
      provider: null as any,
      status: shallowRef('connecting' as const),
      synced: shallowRef(false),
      awarenessStates: shallowRef(new Map<number, AwarenessState>()),
      localClientId: 0,
      userName: '',
      userColor: '',
      updateUserName: (_name: string) => {},
      messageLog: useMessageLog(),
    }
  }

  const config = useRuntimeConfig()
  const wsUrl = config.public.wsUrl
    || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/_ws`

  // Create message log and WebSocket proxy for devtools
  const messageLog = useMessageLog()
  const WebSocketPolyfill = createWebSocketPolyfill(messageLog.push)

  const { doc, provider, status, synced, awareness } = useYRoom(roomName, {
    serverUrl: wsUrl,
    persist: true,
    onPersistError: (err: unknown) => console.warn('[IndexedDB]', err),
    webSocket: { WebSocketPolyfill },
  })

  const { states, localClientId, setLocalState } = useAwareness<AwarenessState>(awareness)

  const userName = getOrCreateUserName()
  const userColor = getOrCreateUserColor(localClientId)
  setLocalState({ name: userName, color: userColor })

  function updateUserName(name: string) {
    localStorage.setItem('collab-user-name', name)
    setLocalState({ name, color: userColor })
  }

  return {
    doc,
    provider,
    status,
    synced,
    awarenessStates: states,
    localClientId,
    userName,
    userColor,
    updateUserName,
    messageLog,
  }
}
