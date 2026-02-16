import { useStore } from 'zustand'
import { themeStore } from '@/stores/themeStore'
import type { Theme } from '@/stores/themeStore'
import { Button } from 'react-bootstrap'

export function ThemeToggle() {
  const theme = useStore(themeStore, (s) => s.theme)
  const setTheme = useStore(themeStore, (s) => s.setTheme)

  const next: Theme = theme === 'light' ? 'dark' : 'light'
  const label = theme === 'light' ? 'Dark' : 'Light'

  return (
    <Button
      variant="outline-secondary"
      size="sm"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${label} theme`}
    >
      {label}
    </Button>
  )
}
