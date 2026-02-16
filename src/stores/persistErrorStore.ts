/**
 * Phase 5: Non-blocking message when IndexedDB persist fails (e.g. quota).
 * Used by db/index doPersist(); consumed by Layout or Navbar for banner.
 */

import { createStore } from 'zustand/vanilla'

type PersistErrorStore = {
  message: string | null
  setPersistError: (message: string | null) => void
}

export const persistErrorStore = createStore<PersistErrorStore>((set) => ({
  message: null,
  setPersistError(message: string | null) {
    set({ message })
  },
}))
