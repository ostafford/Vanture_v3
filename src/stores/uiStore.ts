/**
 * UI state (e.g. sidebar collapsed). Persisted in memory; not in DB per arch.
 */

import { createStore } from 'zustand/vanilla'

type UIStore = {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
}

export const uiStore = createStore<UIStore>((set) => ({
  sidebarCollapsed: false,

  setSidebarCollapsed(collapsed: boolean) {
    set({ sidebarCollapsed: collapsed })
  },

  toggleSidebar() {
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed }))
  },
}))
