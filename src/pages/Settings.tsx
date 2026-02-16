import { useState, useEffect } from 'react'
import { Card, Button, Modal, Spinner } from 'react-bootstrap'
import { getAppSetting, deleteDatabase } from '@/db'
import { sessionStore } from '@/stores/sessionStore'
import { performSync } from '@/services/sync'

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

export function Settings() {
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [showClearModal, setShowClearModal] = useState(false)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    setLastSync(getAppSetting('last_sync'))
  }, [syncing])

  async function handleReSync() {
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

  async function handleClearAllData() {
    setClearing(true)
    try {
      await deleteDatabase()
      sessionStore.getState().lock()
      window.location.reload()
    } catch (err) {
      setSyncError(
        err instanceof Error ? err.message : 'Failed to clear data. Please try again.'
      )
      setClearing(false)
    }
  }

  return (
    <div>
      <h1 className="mb-4">Settings</h1>

      <Card className="mb-4">
        <Card.Header as="h5" className="mb-0">
          Data
        </Card.Header>
        <Card.Body>
          <div className="mb-4">
            <h6 className="text-muted mb-2">Re-sync with Up Bank</h6>
            <p className="small text-muted mb-2">
              Last synced: {formatLastSync(lastSync)}
            </p>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={handleReSync}
              disabled={syncing}
              aria-label="Re-sync with Up Bank"
              aria-busy={syncing}
            >
              {syncing ? (
                <>
                  <Spinner
                    animation="border"
                    size="sm"
                    className="me-1"
                    role="status"
                    aria-hidden="true"
                  />
                  Syncing…
                </>
              ) : (
                'Re-sync now'
              )}
            </Button>
            {syncError && (
              <span className="d-block mt-2 text-danger small" role="alert">
                {syncError}
              </span>
            )}
          </div>

          <hr />

          <div>
            <h6 className="text-muted mb-2">Clear all data</h6>
            <p className="small text-muted mb-2">
              Permanently delete all local data. You will need to re-enter your
              passphrase and API token (re-onboard).
            </p>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => setShowClearModal(true)}
              aria-label="Clear all data"
            >
              Clear all data
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Modal
        show={showClearModal}
        onHide={() => !clearing && setShowClearModal(false)}
        aria-labelledby="clear-data-modal-title"
        aria-describedby="clear-data-modal-description"
      >
        <Modal.Header closeButton={!clearing}>
          <Modal.Title id="clear-data-modal-title">
            Clear all data
          </Modal.Title>
        </Modal.Header>
        <Modal.Body id="clear-data-modal-description">
          All local data will be permanently deleted, including your encrypted API
          token. You will need to re-enter your passphrase and API token to use
          the app again. This cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowClearModal(false)}
            disabled={clearing}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleClearAllData}
            disabled={clearing}
            aria-busy={clearing}
          >
            {clearing ? (
              <>
                <Spinner
                  animation="border"
                  size="sm"
                  className="me-1"
                  role="status"
                  aria-hidden="true"
                />
                Clearing…
              </>
            ) : (
              'Clear all data'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
