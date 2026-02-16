import { useState, useEffect } from 'react'
import { useStore } from 'zustand'
import { Card, Button, Modal, Spinner, Form } from 'react-bootstrap'
import { getAppSetting, setAppSetting, deleteDatabase } from '@/db'
import { accentStore } from '@/stores/accentStore'
import { ACCENT_PALETTES, type AccentId } from '@/lib/accentPalettes'
import { sessionStore } from '@/stores/sessionStore'
import { performSync } from '@/services/sync'
import { deriveKeyFromPassphrase, decryptToken, encryptToken } from '@/lib/crypto'
import { validateUpBankToken, UpBankUnauthorizedError, SYNC_401_MESSAGE } from '@/api/upBank'

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
  const [showUpdateTokenModal, setShowUpdateTokenModal] = useState(false)
  const [updateTokenPassphrase, setUpdateTokenPassphrase] = useState('')
  const [updateTokenNewToken, setUpdateTokenNewToken] = useState('')
  const [updateTokenError, setUpdateTokenError] = useState<string | null>(null)
  const [updateTokenLoading, setUpdateTokenLoading] = useState(false)
  const [updateTokenSuccess, setUpdateTokenSuccess] = useState(false)
  const accent = useStore(accentStore, (s) => s.accent)
  const setAccent = useStore(accentStore, (s) => s.setAccent)

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

  async function handleUpdateTokenSubmit(e: React.FormEvent) {
    e.preventDefault()
    setUpdateTokenError(null)
    const passphrase = updateTokenPassphrase.trim()
    const newToken = updateTokenNewToken.trim()
    if (!passphrase || !newToken) {
      setUpdateTokenError('Please enter your passphrase and new API token.')
      return
    }
    setUpdateTokenLoading(true)
    try {
      const salt = getAppSetting('encryption_salt')
      const encrypted = getAppSetting('api_token_encrypted')
      if (!salt || !encrypted) {
        setUpdateTokenError('No stored credentials. Please complete onboarding first.')
        setUpdateTokenLoading(false)
        return
      }
      const key = await deriveKeyFromPassphrase(passphrase, salt)
      await decryptToken(encrypted, key)
      const valid = await validateUpBankToken(newToken)
      if (!valid) {
        setUpdateTokenError('Invalid API token. Please check and try again.')
        setUpdateTokenLoading(false)
        return
      }
      const newEncrypted = await encryptToken(newToken, key)
      setAppSetting('api_token_encrypted', newEncrypted)
      sessionStore.getState().setUnlocked(newToken)
      setUpdateTokenPassphrase('')
      setUpdateTokenNewToken('')
      setUpdateTokenError(null)
      setShowUpdateTokenModal(false)
      setUpdateTokenSuccess(true)
      setLastSync(getAppSetting('last_sync'))
      setTimeout(() => setUpdateTokenSuccess(false), 5000)
    } catch (err) {
      setUpdateTokenError(
        err instanceof Error ? err.message : 'Invalid passphrase or failed to update token.'
      )
    } finally {
      setUpdateTokenLoading(false)
    }
  }

  function closeUpdateTokenModal() {
    if (!updateTokenLoading) {
      setShowUpdateTokenModal(false)
      setUpdateTokenPassphrase('')
      setUpdateTokenNewToken('')
      setUpdateTokenError(null)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">
          <span className="page-title-icon">
            <i className="mdi mdi-cog" aria-hidden />
          </span>
          Settings
        </h3>
      </div>

      <Card className="grid-margin mb-4">
        <Card.Header as="h5" className="mb-0">
          Appearance
        </Card.Header>
        <Card.Body>
          <h6 className="text-muted mb-2">Accent color</h6>
          <p className="small text-muted mb-3">
            Choose a color for buttons, charts, and highlights.
          </p>
          <div className="d-flex flex-wrap gap-2">
            {(Object.keys(ACCENT_PALETTES) as AccentId[]).map((id) => {
              const palette = ACCENT_PALETTES[id]
              const isSelected = accent === id
              return (
                <button
                  key={id}
                  type="button"
                  className="border rounded-circle p-0 d-flex align-items-center justify-content-center"
                  style={{
                    width: 40,
                    height: 40,
                    background: palette.primary,
                    borderWidth: isSelected ? 3 : 1,
                    borderColor: isSelected ? 'var(--vantura-text)' : 'var(--vantura-border)',
                  }}
                  onClick={() => setAccent(id)}
                  aria-label={`Select ${palette.label} accent`}
                  aria-pressed={isSelected}
                >
                  {isSelected && (
                    <i
                      className="mdi mdi-check"
                      style={{ fontSize: '1.25rem', color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                      aria-hidden
                    />
                  )}
                </button>
              )
            })}
          </div>
        </Card.Body>
      </Card>

      <Card className="grid-margin">
        <Card.Header as="h5" className="mb-0">
          Data
        </Card.Header>
        <Card.Body>
          <div className="mb-4">
            <h6 className="text-muted mb-2">Re-sync with Up Bank</h6>
            <p className="small text-muted mb-2">
              Sync downloads your Up Bank transactions to this device only. No
              cloud storage is used; we don&apos;t have servers that store your
              data.
            </p>
            <p className="small text-muted mb-2">
              Last synced: {formatLastSync(lastSync)}
            </p>
            <Button
              className="btn-gradient-primary"
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

          <div className="mb-4">
            <h6 className="text-muted mb-2">API token</h6>
            <p className="small text-muted mb-2">
              If your token has expired (e.g. 48-hour token from Up Bank), update
              it here. Your passphrase is required; other data is not deleted.
            </p>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => {
                setUpdateTokenError(null)
                setShowUpdateTokenModal(true)
              }}
              aria-label="Update API token"
            >
              Update API token
            </Button>
            {updateTokenSuccess && (
              <span className="d-block mt-2 text-success small" role="status">
                API token updated. You can re-sync now.
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

      <Modal
        show={showUpdateTokenModal}
        onHide={closeUpdateTokenModal}
        aria-labelledby="update-token-modal-title"
        aria-describedby="update-token-modal-description"
      >
        <Modal.Header closeButton={!updateTokenLoading}>
          <Modal.Title id="update-token-modal-title">
            Update API token
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateTokenSubmit}>
          <Modal.Body id="update-token-modal-description">
            <p className="small text-muted mb-3">
              Enter your passphrase and a new API token from the Up Bank app.
              Your existing data (savers, trackers, etc.) will be kept.
            </p>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="update-token-passphrase">Passphrase</Form.Label>
              <Form.Control
                id="update-token-passphrase"
                type="password"
                value={updateTokenPassphrase}
                onChange={(e) => setUpdateTokenPassphrase(e.target.value)}
                placeholder="Enter passphrase"
                autoComplete="current-password"
                disabled={updateTokenLoading}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="update-token-new">New API token</Form.Label>
              <Form.Control
                id="update-token-new"
                type="password"
                value={updateTokenNewToken}
                onChange={(e) => setUpdateTokenNewToken(e.target.value)}
                placeholder="Paste new token from Up Bank app"
                autoComplete="off"
                disabled={updateTokenLoading}
              />
            </Form.Group>
            {updateTokenError && (
              <div className="text-danger small mb-2" role="alert">
                {updateTokenError}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              type="button"
              variant="secondary"
              onClick={closeUpdateTokenModal}
              disabled={updateTokenLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="btn-gradient-primary"
              disabled={updateTokenLoading}
              aria-busy={updateTokenLoading}
            >
              {updateTokenLoading ? (
                <>
                  <Spinner
                    animation="border"
                    size="sm"
                    className="me-1"
                    role="status"
                    aria-hidden="true"
                  />
                  Updating…
                </>
              ) : (
                'Update token'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}
