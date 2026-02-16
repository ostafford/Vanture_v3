import { useEffect, useState } from 'react'
import { useStore } from 'zustand'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { initDb, getAppSetting } from '@/db'
import { advanceNextPaydayIfNeeded, recalculateTrackers } from '@/services/sync'
import { themeStore } from '@/stores/themeStore'
import { sessionStore } from '@/stores/sessionStore'
import { Layout } from '@/layout/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { Transactions } from '@/pages/Transactions'
import { Settings } from '@/pages/Settings'
import { Unlock } from '@/pages/Unlock'
import { Onboarding } from '@/pages/Onboarding'

function AppContent() {
  const [ready, setReady] = useState(false)
  const [bootError, setBootError] = useState<string | null>(null)
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(
    null
  )
  const theme = useStore(themeStore, (s) => s.theme)
  const unlocked = useStore(sessionStore, (s) => s.unlocked)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    let cancelled = false
    async function boot() {
      setBootError(null)
      try {
        await initDb()
      } catch (err) {
        if (!cancelled) {
          setBootError(
            err instanceof Error ? err.message : 'Could not load app storage.'
          )
        }
        return
      }
      if (cancelled) return
      themeStore.getState().hydrateFromDb()
      if (cancelled) return
      advanceNextPaydayIfNeeded()
      if (cancelled) return
      recalculateTrackers()
      if (cancelled) return
      const theme = themeStore.getState().theme
      document.documentElement.setAttribute('data-theme', theme)
      if (!cancelled) setReady(true)
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    const complete = getAppSetting('onboarding_complete') === '1'
    setOnboardingComplete(complete)
  }, [ready])

  if (bootError) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: 24,
          backgroundColor: '#f7f7f7',
          color: '#1a1a1a',
        }}
      >
        <h2 className="mb-2">Could not load app storage</h2>
        <p className="text-muted mb-4 text-center">{bootError}</p>
        <p className="small text-muted mb-3 text-center">
          Try again, or clear site data for this origin and re-open the app.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setBootError(null)
            Promise.resolve().then(() => {
              initDb()
                .then(() => window.location.reload())
                .catch((err) =>
                  setBootError(
                    err instanceof Error ? err.message : 'Could not load app storage.'
                  )
                )
            })
          }}
        >
          Try again
        </button>
      </div>
    )
  }

  if (!ready) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f7f7f7',
          color: '#1a1a1a',
        }}
      >
        <div
          className="placeholder-glow d-flex align-items-center gap-2"
          style={{ fontSize: '1rem' }}
        >
          <span className="placeholder col-1 rounded" style={{ height: 20 }} />
          <span className="placeholder col-2 rounded" style={{ height: 20 }} />
        </div>
        <p className="mt-3 mb-0 small text-muted">Loading...</p>
      </div>
    )
  }

  if (onboardingComplete === null) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: 'var(--vantura-background)',
          color: 'var(--vantura-text)',
        }}
      >
        <div
          className="placeholder-glow d-flex align-items-center gap-2"
          style={{ fontSize: '1rem' }}
        >
          <span className="placeholder col-1 rounded" style={{ height: 20 }} />
          <span className="placeholder col-2 rounded" style={{ height: 20 }} />
        </div>
        <p className="mt-3 mb-0 small text-muted">Loading...</p>
      </div>
    )
  }

  if (!onboardingComplete) {
    return (
      <Onboarding
        onComplete={() => {
          setOnboardingComplete(true)
        }}
      />
    )
  }

  if (!unlocked) {
    return <Unlock />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function App() {
  return <AppContent />
}

export default App
