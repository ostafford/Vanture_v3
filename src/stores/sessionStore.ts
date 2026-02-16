/**
 * Session state: unlocked flag and in-memory API token.
 * Never persisted. Cleared on Lock or tab close.
 */

import { createStore } from 'zustand/vanilla'

type SessionStore = {
  unlocked: boolean
  apiToken: string | null
  setUnlocked: (token: string) => void
  lock: () => void
  getToken: () => string | null
}

export const sessionStore = createStore<SessionStore>((set, get) => ({
  unlocked: false,
  apiToken: null,

  setUnlocked(token: string) {
    set({ unlocked: true, apiToken: token })
  },

  lock() {
    set({ unlocked: false, apiToken: null })
  },

  getToken() {
    return get().apiToken
  },
}))

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    sessionStore.getState().lock()
  })
}
