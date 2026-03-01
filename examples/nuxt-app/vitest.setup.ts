import { vi } from 'vitest'
import { shallowRef, readonly, onScopeDispose } from 'vue'

// Stub Nuxt auto-imports for Vue APIs used by composables
vi.stubGlobal('shallowRef', shallowRef)
vi.stubGlobal('readonly', readonly)
vi.stubGlobal('onScopeDispose', onScopeDispose)
