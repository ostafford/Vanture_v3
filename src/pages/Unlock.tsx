import { useState, FormEvent } from 'react'
import { Alert, Button, Card, Form } from 'react-bootstrap'
import { useStore } from 'zustand'
import { getAppSetting } from '@/db'
import { sessionStore } from '@/stores/sessionStore'
import { deriveKeyFromPassphrase, decryptToken } from '@/lib/crypto'

export function Unlock() {
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const setUnlocked = useStore(sessionStore, (s) => s.setUnlocked)

  const isDemoMode = getAppSetting('demo_mode') === '1'

  if (isDemoMode) {
    return (
      <div className="auth-full-bg">
        <Card style={{ width: '100%', maxWidth: 400 }} className="auth-card">
          <Card.Body>
            <Card.Title className="mb-3">Demo mode</Card.Title>
            <Card.Text className="text-muted small mb-3 text-center">
              You&apos;re using sample data. Open the demo to explore the app
              without connecting your Up Bank account.
            </Card.Text>
            <div className="text-center">
              <Button
                type="button"
                className="btn-gradient-primary"
                onClick={() => setUnlocked('demo')}
              >
                Open demo
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const salt = getAppSetting('encryption_salt')
      const encrypted = getAppSetting('api_token_encrypted')
      if (!salt || !encrypted) {
        setError('No stored credentials. Please complete onboarding.')
        return
      }
      const key = await deriveKeyFromPassphrase(passphrase, salt)
      const token = await decryptToken(encrypted, key)
      setUnlocked(token)
    } catch {
      setError('Incorrect passphrase. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-full-bg">
      <Card style={{ width: '100%', maxWidth: 400 }} className="auth-card">
        <Card.Body>
          <Card.Title className="mb-3">Unlock Vantura</Card.Title>
          <Card.Text className="text-muted small mb-3 text-center">
            Enter your passphrase to access your data. Your passphrase is never
            stored.
          </Card.Text>
          <Form onSubmit={handleSubmit}>
            {/* Hidden username field for a11y / password-manager heuristic (single passphrase form) */}
            <input
              id="unlock-username"
              type="text"
              name="username"
              autoComplete="username"
              aria-label="Username"
              tabIndex={-1}
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: '-9999px',
                width: 1,
                height: 1,
              }}
            />
            <Form.Group className="mb-3">
              <Form.Label htmlFor="unlock-passphrase">Passphrase</Form.Label>
              <Form.Control
                id="unlock-passphrase"
                name="passphrase"
                type="password"
                value={passphrase}
                onChange={(e) => {
                  setPassphrase(e.target.value)
                  setError(null)
                }}
                placeholder="Enter passphrase"
                autoComplete="current-password"
                disabled={loading}
                isInvalid={!!error}
                autoFocus
              />
            </Form.Group>
            {error && (
              <Alert
                variant="danger"
                className="py-2 mb-2 text-center"
                role="alert"
              >
                {error}
              </Alert>
            )}
            <div className="text-center">
              <Button
                type="submit"
                className="btn-gradient-primary"
                disabled={loading}
              >
                {loading ? 'Unlocking…' : 'Unlock'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  )
}
