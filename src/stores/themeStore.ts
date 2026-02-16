/**
 * Theme state. Source of truth is app_settings in DB; this store is hydrated on init and synced on toggle.
 */

import { createStore } from 'zustand/vanilla'
import { getDb, schedulePersist } from '@/db'

export type Theme = 'light' | 'dark'

type ThemeStore = {
  theme: Theme
  hydrated: boolean
  setTheme: (theme: Theme) => void
  hydrateFromDb: () => void
}

export const themeStore = createStore<ThemeStore>((set) => ({
  theme: 'light',
  hydrated: false,

  setTheme(theme: Theme) {
    set({ theme })
    const db = getDb()
    if (db) {
      db.run(
        `INSERT OR REPLACE INTO app_settings (key, value) VALUES ('theme', ?)`,
        [theme]
      )
      schedulePersist()
    }
  },

  hydrateFromDb() {
    const db = getDb()
    if (!db) return
    try {
      const result = db.exec(
        `SELECT value FROM app_settings WHERE key = 'theme'`
      )
      if (result.length > 0 && result[0].values.length > 0) {
        const value = result[0].values[0][0]
        const theme = String(value) as Theme
        if (theme === 'light' || theme === 'dark') {
          set({ theme, hydrated: true })
          return
        }
      }
      set({ theme: 'light', hydrated: true })
      db.run(
        `INSERT OR REPLACE INTO app_settings (key, value) VALUES ('theme', 'light')`
      )
      schedulePersist()
    } catch {
      set({ theme: 'light', hydrated: true })
    }
  },
}))
