const STORAGE_KEY = 'yjs-devtools'

const DEV_TOOLS_TABS = ['doc', 'sync', 'awareness', 'history'] as const
export type DevToolsTab = (typeof DEV_TOOLS_TABS)[number]

interface DevToolsState {
  open: boolean
  activeTab: DevToolsTab
}

function loadState(): DevToolsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        open: typeof parsed.open === 'boolean' ? parsed.open : false,
        activeTab: (DEV_TOOLS_TABS as readonly string[]).includes(parsed.activeTab) ? parsed.activeTab : 'doc',
      }
    }
  }
  catch {}
  return { open: false, activeTab: 'doc' }
}

function saveState(state: DevToolsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }
  catch {}
}

const saved = loadState()
const isOpen = shallowRef(saved.open)
const activeTab = shallowRef<DevToolsTab>(saved.activeTab)

export function useDevTools() {

  function toggle() {
    isOpen.value = !isOpen.value
    saveState({ open: isOpen.value, activeTab: activeTab.value })
  }

  function open() {
    isOpen.value = true
    saveState({ open: true, activeTab: activeTab.value })
  }

  function close() {
    isOpen.value = false
    saveState({ open: false, activeTab: activeTab.value })
  }

  function setTab(tab: DevToolsTab) {
    activeTab.value = tab
    saveState({ open: isOpen.value, activeTab: tab })
  }

  return {
    isOpen: readonly(isOpen),
    activeTab: readonly(activeTab),
    toggle,
    open,
    close,
    setTab,
  }
}
