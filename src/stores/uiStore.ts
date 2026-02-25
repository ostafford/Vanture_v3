/**
 * UI state (e.g. sidebar collapsed). Persisted in memory; not in DB per arch.
 */

import { createStore } from 'zustand/vanilla'

type UIStore = {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  /** On mobile: sidebar drawer open. When true, overlay sidebar is visible. */
  sidebarMobileOpen: boolean
  setSidebarMobileOpen: (open: boolean) => void
}

export const uiStore = createStore<UIStore>((set) => ({
  sidebarCollapsed: false,
  sidebarMobileOpen: false,

  setSidebarCollapsed(collapsed: boolean) {
    set({ sidebarCollapsed: collapsed })
  },

  toggleSidebar() {
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed }))
  },

  setSidebarMobileOpen(open: boolean) {
    set({ sidebarMobileOpen: open })
  },
}))
