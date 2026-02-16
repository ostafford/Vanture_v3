import { useState, FormEvent } from 'react'
import { Button, Card, Form, ProgressBar } from 'react-bootstrap'
import { setAppSetting, getAppSetting } from '@/db'
import { sessionStore } from '@/stores/sessionStore'
import {
  generateSalt,
  deriveKeyFromPassphrase,
  encryptToken,
} from '@/lib/crypto'
import { validateUpBankToken } from '@/api/upBank'
import { performInitialSync, type SyncProgress } from '@/services/sync'

interface OnboardingProps {
  onComplete: () => void
}

const STEPS = 6

type PaydayFrequency = 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY'
const PAYDAY_DAYS_WEEKLY: { value: number; label: string }[] = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
]
const PAYDAY_DAYS_MONTHLY = Array.from({ length: 28 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}`,
}))

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1)
  const [passphrase, setPassphrase] = useState('')
  const [passphraseConfirm, setPassphraseConfirm] = useState('')
  const [apiToken, setApiToken] = useState('')
  const [paydayFrequency, setPaydayFrequency] = useState<PaydayFrequency>('MONTHLY')
  const [paydayDay, setPaydayDay] = useState(1)
  const [nextPayday, setNextPayday] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null)

  async function handleStep2Submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (passphrase.length < 8) {
      setError('Passphrase must be at least 8 characters.')
      return
    }
    if (passphrase !== passphraseConfirm) {
      setError('Passphrases do not match.')
      return
    }
    setStep(3)
  }

  async function handleStep3Submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const valid = await validateUpBankToken(apiToken)
      if (!valid) {
        setError('Invalid API token. Please check and try again.')
        return
      }
      const salt = getAppSetting('encryption_salt') ?? generateSalt()
      setAppSetting('encryption_salt', salt)
      const key = await deriveKeyFromPassphrase(passphrase, salt)
      const encrypted = await encryptToken(apiToken, key)
      setAppSetting('api_token_encrypted', encrypted)
      setPassphrase('')
      setPassphraseConfirm('')
      setStep(4)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to validate or store token.'
      )
    } finally {
      setLoading(false)
    }
  }

  function handleStep4Submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!nextPayday) {
      setError('Please select your next payday.')
      return
    }
    setAppSetting('payday_frequency', paydayFrequency)
    setAppSetting('payday_day', String(effectivePaydayDay))
    setAppSetting('next_payday', nextPayday)
    setStep(5)
    startInitialSync(apiToken)
  }

  async function startInitialSync(token: string) {
    setError(null)
    setSyncProgress({ phase: 'accounts' })
    try {
      await performInitialSync(token, (p) => setSyncProgress(p))
      setStep(6)
      sessionStore.getState().setUnlocked(token)
      setApiToken('')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Sync failed. You can try again from Settings.'
      )
    }
  }

  function handleStep6Go() {
    onComplete()
  }

  const paydayDayOptions =
    paydayFrequency === 'MONTHLY' ? PAYDAY_DAYS_MONTHLY : PAYDAY_DAYS_WEEKLY
  const currentPaydayDayValid = paydayDayOptions.some(
    (opt) => opt.value === paydayDay
  )
  const effectivePaydayDay = currentPaydayDayValid
    ? paydayDay
    : paydayDayOptions[0]?.value ?? 1

  return (
    <div className="auth-full-bg">
      <Card style={{ width: '100%', maxWidth: 480 }} className="auth-card">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Card.Title className="mb-0">Setup</Card.Title>
            <span className="text-muted small">
              Step {step} of {STEPS}
            </span>
          </div>
          <ProgressBar
            now={(step / STEPS) * 100}
            variant="primary"
            className="mb-3"
          />

          {step === 1 && (
            <>
              <h5 className="mb-2">Welcome to Vantura</h5>
              <p className="text-muted small mb-3">
                Vantura syncs with your Up Bank account to give you powerful
                desktop-based financial insights. Your data is stored locally
                and never leaves your device.
              </p>
              <Button className="btn-gradient-primary" onClick={() => setStep(2)}>Get Started</Button>
            </>
          )}

          {step === 2 && (
            <Form onSubmit={handleStep2Submit}>
              <h6 className="mb-2">Create a passphrase</h6>
              <p className="text-muted small mb-3">
                This passphrase protects your API token and is never stored. You
                must enter it each time you open the app to unlock. If you
                forget it, you will need to re-onboard and create a new API
                token in Up Bank.
              </p>
              <Form.Group className="mb-2">
                <Form.Label htmlFor="onboarding-passphrase">Passphrase</Form.Label>
                <Form.Control
                  id="onboarding-passphrase"
                  name="passphrase"
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  minLength={8}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label htmlFor="onboarding-passphrase-confirm">Confirm passphrase</Form.Label>
                <Form.Control
                  id="onboarding-passphrase-confirm"
                  name="passphraseConfirm"
                  type="password"
                  value={passphraseConfirm}
                  onChange={(e) => setPassphraseConfirm(e.target.value)}
                  placeholder="Confirm"
                  autoComplete="new-password"
                />
              </Form.Group>
              {error && (
                <div className="text-danger small mb-2" role="alert">
                  {error}
                </div>
              )}
              <Button type="submit" className="btn-gradient-primary">Continue</Button>
            </Form>
          )}

          {step === 3 && (
            <Form onSubmit={handleStep3Submit}>
              <h6 className="mb-2">Connect your Up Bank account</h6>
              <p className="text-muted small mb-3">
                1. In the Up Bank app go to Data sharing → Personal Access
                Token.
                <br />
                2. Create a new Personal Access Token.
                <br />
                3. Copy and paste it below. It will be encrypted and never
                stored in plain form.
              </p>
              <Form.Group className="mb-3">
                <Form.Label htmlFor="onboarding-api-token">API Token</Form.Label>
                <Form.Control
                  id="onboarding-api-token"
                  name="apiToken"
                  type="password"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="Paste your token"
                  autoComplete="off"
                  disabled={loading}
                />
                <Form.Text className="text-muted">
                  <a
                    href="https://developer.up.com.au/#personal-access-tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Learn more about API tokens
                  </a>
                </Form.Text>
              </Form.Group>
              {error && (
                <div className="text-danger small mb-2" role="alert">
                  {error}
                </div>
              )}
              <Button type="submit" className="btn-gradient-primary" disabled={loading}>
                {loading ? 'Validating…' : 'Continue'}
              </Button>
            </Form>
          )}

          {step === 4 && (
            <Form onSubmit={handleStep4Submit}>
              <h6 className="mb-2">When do you get paid?</h6>
              <p className="text-muted small mb-3">
                This helps calculate your Spendable balance.
              </p>
              <Form.Group className="mb-2">
                <Form.Label htmlFor="onboarding-payday-frequency">Frequency</Form.Label>
                <Form.Select
                  id="onboarding-payday-frequency"
                  name="paydayFrequency"
                  value={paydayFrequency}
                  onChange={(e) =>
                    setPaydayFrequency(e.target.value as PaydayFrequency)
                  }
                >
                  <option value="WEEKLY">Weekly</option>
                  <option value="FORTNIGHTLY">Fortnightly</option>
                  <option value="MONTHLY">Monthly</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label htmlFor="onboarding-payday-day">Day</Form.Label>
                <Form.Select
                  id="onboarding-payday-day"
                  name="paydayDay"
                  value={effectivePaydayDay}
                  onChange={(e) => setPaydayDay(Number(e.target.value))}
                >
                  {paydayDayOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label htmlFor="onboarding-next-payday">Next payday</Form.Label>
                <Form.Control
                  id="onboarding-next-payday"
                  name="nextPayday"
                  type="date"
                  value={nextPayday}
                  onChange={(e) => setNextPayday(e.target.value)}
                />
              </Form.Group>
              {error && (
                <div className="text-danger small mb-2" role="alert">
                  {error}
                </div>
              )}
              <Button type="submit" className="btn-gradient-primary">Continue</Button>
            </Form>
          )}

          {step === 5 && (
            <>
              <h6 className="mb-2">Syncing your transactions</h6>
              <p className="text-muted small mb-2">
                This may take a minute for large transaction histories.
              </p>
              {syncProgress && (
                <>
                  <ProgressBar
                    animated={syncProgress.phase === 'transactions'}
                    now={
                      syncProgress.phase === 'done'
                        ? 100
                        : syncProgress.phase === 'transactions' && syncProgress.fetched != null
                          ? Math.min(95, (syncProgress.fetched / 500) * 90)
                          : 50
                    }
                    className="mb-2"
                  />
                  <p className="small mb-0">
                    {syncProgress.phase === 'done'
                      ? 'Done.'
                      : syncProgress.phase === 'transactions' && syncProgress.fetched != null
                        ? `Fetched ${syncProgress.fetched} transactions…`
                        : `Syncing ${syncProgress.phase}…`}
                  </p>
                </>
              )}
              {error && (
                <div className="text-danger small mt-2" role="alert">
                  {error}
                </div>
              )}
            </>
          )}

          {step === 6 && (
            <>
              <h5 className="mb-2">All set</h5>
              <p className="text-muted small mb-3">
                You're ready to start tracking your finances. Create trackers to
                monitor spending, view Spendable to see safe-to-spend amount,
                and set saver goals to reach financial targets.
              </p>
              <Button className="btn-gradient-primary" onClick={handleStep6Go}>Go to Dashboard</Button>
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}
