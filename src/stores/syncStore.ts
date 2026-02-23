/**
 * Sync completion signal. When Navbar or Settings finishes a sync, they call
 * syncCompleted(). Components that display DB-backed data subscribe to
 * lastSyncCompletedAt so they re-render and re-read from the DB.
 * syncing is set during sync for optional loading UI.
 */

import { createStore } from 'zustand/vanilla'

type SyncStore = {
  lastSyncCompletedAt: number | null
  syncing: boolean
  syncCompleted: () => void
  setSyncing: (syncing: boolean) => void
}

export const syncStore = createStore<SyncStore>((set) => ({
  lastSyncCompletedAt: null,
  syncing: false,

  syncCompleted() {
    set({ lastSyncCompletedAt: Date.now() })
  },

  setSyncing(syncing: boolean) {
    set({ syncing })
  },
}))
