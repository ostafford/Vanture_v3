import { useState, useEffect } from 'react'
import { Button, Spinner } from 'react-bootstrap'
import { useStore } from 'zustand'
import { uiStore } from '@/stores/uiStore'
import { sessionStore } from '@/stores/sessionStore'
import { ThemeToggle } from '@/components/ThemeToggle'
import { getAppSetting } from '@/db'
import { performSync } from '@/services/sync'
import { UpBankUnauthorizedError, SYNC_401_MESSAGE } from '@/api/upBank'

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
        err instanceof UpBankUnauthorizedError
          ? SYNC_401_MESSAGE
          : err instanceof Error
            ? err.message
            : 'Sync failed. Please try again.'
      )
    } finally {
      setSyncing(false)
    }
  }

  function handleLock() {
    sessionStore.getState().lock()
  }

  return (
    <nav
      className={`vantura-navbar ${sidebarCollapsed ? 'collapsed' : ''}`}
    >
      <div className="navbar-brand-wrapper">
        <button
          type="button"
          className="navbar-toggler"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <i className="mdi mdi-menu" aria-hidden />
        </button>
      </div>
      <div className="navbar-menu-wrapper">
        <div className="me-3 d-flex align-items-center gap-2">
          <Button
            className="btn-gradient-primary"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            aria-label="Sync with Up Bank"
            aria-busy={syncing}
          >
            {syncing ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" role="status" aria-hidden />
                Syncing…
              </>
            ) : (
              <>
                <i className="mdi mdi-sync me-1" aria-hidden />
                Sync
              </>
            )}
          </Button>
          {syncError && (
            <span className="text-danger small" role="alert">
              {syncError}
            </span>
          )}
        </div>
        <div className="me-3 d-none d-md-block small" style={{ color: 'var(--vantura-text-secondary)' }}>
          Last synced: {formatLastSync(lastSync)}
        </div>
        <div className="ms-auto d-flex align-items-center gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleLock}
            aria-label="Lock"
          >
            <i className="mdi mdi-lock me-1" aria-hidden />
            Lock
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}
