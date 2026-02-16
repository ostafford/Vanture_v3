import { useState, useEffect } from 'react'
import { Button, Navbar as BSNavbar, Container, Spinner } from 'react-bootstrap'
import { useStore } from 'zustand'
import { uiStore } from '@/stores/uiStore'
import { sessionStore } from '@/stores/sessionStore'
import { ThemeToggle } from '@/components/ThemeToggle'
import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './Sidebar'
import { getAppSetting } from '@/db'
import { performSync } from '@/services/sync'

interface NavbarProps {
  sidebarCollapsed: boolean
}

function formatLastSync(iso: string | null): string {
  if (!iso) return 'Never'
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return 'Unknown'
  }
}

export function Navbar({ sidebarCollapsed }: NavbarProps) {
  const toggleSidebar = useStore(uiStore, (s) => s.toggleSidebar)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const sidebarWidth = sidebarCollapsed
    ? SIDEBAR_COLLAPSED_WIDTH
    : SIDEBAR_WIDTH

  useEffect(() => {
    setLastSync(getAppSetting('last_sync'))
  }, [syncing])

  async function handleSync() {
    const token = sessionStore.getState().getToken()
    if (!token || syncing) return
    setSyncing(true)
    setSyncError(null)
    try {
      await performSync(token, () => {})
      setLastSync(getAppSetting('last_sync'))
    } catch (err) {
      setSyncError(
        err instanceof Error ? err.message : 'Sync failed. Please try again.'
      )
    } finally {
      setSyncing(false)
    }
  }

  function handleLock() {
    sessionStore.getState().lock()
  }

  return (
    <BSNavbar
      sticky="top"
      style={{
        height: 70,
        backgroundColor: 'var(--vantura-surface)',
        borderBottom: '1px solid var(--vantura-text-secondary)',
        marginLeft: sidebarWidth,
      }}
    >
      <Container fluid className="d-flex align-items-center">
        <Button
          variant="outline-secondary"
          size="sm"
          className="me-3"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          Menu
        </Button>
        <div className="me-3 d-flex align-items-center gap-2">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            aria-label="Sync with Up Bank"
            aria-busy={syncing}
          >
            {syncing ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" role="status" aria-hidden="true" />
                Syncing…
              </>
            ) : (
              'Sync'
            )}
          </Button>
          {syncError && (
            <span className="text-danger small" role="alert">
              {syncError}
            </span>
          )}
        </div>
        <div className="me-3 d-none d-md-block text-muted small">
          Last synced: {formatLastSync(lastSync)}
        </div>
        <div className="ms-auto d-flex align-items-center gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleLock}
            aria-label="Lock"
          >
            Lock
          </Button>
          <ThemeToggle />
        </div>
      </Container>
    </BSNavbar>
  )
}
