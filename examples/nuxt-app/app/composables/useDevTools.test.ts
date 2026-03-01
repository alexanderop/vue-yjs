import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDevTools } from './useDevTools'

// Mock localStorage
const storage = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
})

beforeEach(() => {
  storage.clear()
})

describe('useDevTools', () => {
  it('starts closed with doc tab by default', () => {
    const { isOpen, activeTab } = useDevTools()
    expect(isOpen.value).toBe(false)
    expect(activeTab.value).toBe('doc')
  })

  it('toggle opens and closes', () => {
    const { isOpen, toggle } = useDevTools()
    toggle()
    expect(isOpen.value).toBe(true)
    toggle()
    expect(isOpen.value).toBe(false)
  })

  it('open sets isOpen to true', () => {
    const { isOpen, open } = useDevTools()
    open()
    expect(isOpen.value).toBe(true)
  })

  it('close sets isOpen to false', () => {
    const { isOpen, open, close } = useDevTools()
    open()
    close()
    expect(isOpen.value).toBe(false)
  })

  it('setTab changes active tab', () => {
    const { activeTab, setTab } = useDevTools()
    setTab('sync')
    expect(activeTab.value).toBe('sync')
    setTab('awareness')
    expect(activeTab.value).toBe('awareness')
  })

  it('persists state to localStorage', () => {
    const { open, setTab } = useDevTools()
    open()
    setTab('sync')

    const stored = JSON.parse(storage.get('yjs-devtools')!)
    expect(stored.open).toBe(true)
    expect(stored.activeTab).toBe('sync')
  })

  it('restores state from localStorage', () => {
    storage.set('yjs-devtools', JSON.stringify({ open: true, activeTab: 'awareness' }))
    const { isOpen, activeTab } = useDevTools()
    expect(isOpen.value).toBe(true)
    expect(activeTab.value).toBe('awareness')
  })

  it('handles corrupted localStorage gracefully', () => {
    storage.set('yjs-devtools', 'not-json')
    const { isOpen, activeTab } = useDevTools()
    expect(isOpen.value).toBe(false)
    expect(activeTab.value).toBe('doc')
  })

  it('handles invalid tab in localStorage', () => {
    storage.set('yjs-devtools', JSON.stringify({ open: false, activeTab: 'invalid' }))
    const { activeTab } = useDevTools()
    expect(activeTab.value).toBe('doc')
  })
})
