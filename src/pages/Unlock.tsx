import { useState, FormEvent } from 'react'
import { Button, Card, Form } from 'react-bootstrap'
import { useStore } from 'zustand'
import { getAppSetting } from '@/db'
import { sessionStore } from '@/stores/sessionStore'
import { deriveKeyFromPassphrase, decryptToken } from '@/lib/crypto'

export function Unlock() {
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const setUnlocked = useStore(sessionStore, (s) => s.setUnlocked)

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
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Invalid passphrase or corrupted data.'
      )
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
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter passphrase"
                autoComplete="current-password"
                disabled={loading}
                autoFocus
              />
            </Form.Group>
            {error && (
              <div className="text-danger small mb-2" role="alert">
                {error}
              </div>
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
