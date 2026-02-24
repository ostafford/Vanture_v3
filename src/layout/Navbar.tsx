import { useState, useEffect } from 'react'
import { Button, Spinner } from 'react-bootstrap'
import { useStore } from 'zustand'
import { uiStore } from '@/stores/uiStore'
import { sessionStore } from '@/stores/sessionStore'
import { syncStore } from '@/stores/syncStore'
import { getAppSetting } from '@/db'
import { performSync } from '@/services/sync'
import { toast } from '@/stores/toastStore'
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
    if (getAppSetting('demo_mode') === '1') {
      toast.info('Demo mode – no sync.')
      return
    }
    setSyncing(true)
    setSyncError(null)
    syncStore.getState().setSyncing(true)
    try {
      await performSync(token, () => {})
      setLastSync(getAppSetting('last_sync'))
      syncStore.getState().syncCompleted()
      toast.success('Sync complete. Data updated.')
    } catch (err) {
      const message =
        err instanceof UpBankUnauthorizedError
          ? SYNC_401_MESSAGE
          : err instanceof Error
            ? err.message
            : 'Sync failed. Please try again.'
      setSyncError(message)
      toast.error(message)
    } finally {
      setSyncing(false)
      syncStore.getState().setSyncing(false)
    }
  }

  return (
    <nav className={`vantura-navbar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="navbar-brand-wrapper">
        <button
          type="button"
          className="navbar-toggler"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          {sidebarCollapsed ? (
            <i className="mdi mdi-menu" aria-hidden />
          ) : (
            <span className="navbar-brand-text">VANTURA</span>
          )}
        </button>
      </div>
      {sidebarCollapsed && (
        <span className="navbar-collapsed-brand" aria-hidden>
          VANTURA
        </span>
      )}
      <div className="navbar-menu-wrapper">
        <div className="ms-auto d-flex flex-column align-items-end gap-1">
          <div className="d-flex align-items-center gap-2">
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
                  <Spinner
                    animation="border"
                    size="sm"
                    className="me-1"
                    role="status"
                    aria-hidden
                  />
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
          <div className="d-none d-md-block navbar-sync-label">
            Last synced: {formatLastSync(lastSync)}
          </div>
        </div>
      </div>
    </nav>
  )
}
