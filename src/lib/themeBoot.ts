/**
 * Theme hint for first paint before the DB hydrates. The inline script in
 * index.html must use the same storage key string.
 */
export const VANTURA_THEME_STORAGE_KEY = 'vantura-theme'

export function persistThemeForBoot(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(VANTURA_THEME_STORAGE_KEY, theme)
  } catch {
    // Quota, private mode, or disabled storage
  }
}
