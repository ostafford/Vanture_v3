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
        err instanceof Error ? err.message : 'Invalid passphrase or corrupted data.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--vantura-background)',
        padding: 24,
      }}
    >
      <Card style={{ width: '100%', maxWidth: 400 }}>
        <Card.Body>
          <Card.Title className="mb-3">Unlock Vantura</Card.Title>
          <Card.Text className="text-muted small mb-3">
            Enter your passphrase to access your data. Your passphrase is never
            stored.
          </Card.Text>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Passphrase</Form.Label>
              <Form.Control
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
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Unlocking…' : 'Unlock'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  )
}
