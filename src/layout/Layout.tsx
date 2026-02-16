import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useStore } from 'zustand'
import { uiStore } from '@/stores/uiStore'
import { persistErrorStore } from '@/stores/persistErrorStore'
import { Sidebar, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './Sidebar'
import { Navbar } from './Navbar'

const VIEWPORT_AUTO_COLLAPSE_PX = 1280

export function Layout() {
  const sidebarCollapsed = useStore(uiStore, (s) => s.sidebarCollapsed)
  const sidebarWidth = sidebarCollapsed
    ? SIDEBAR_COLLAPSED_WIDTH
    : SIDEBAR_WIDTH

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < VIEWPORT_AUTO_COLLAPSE_PX && !sidebarCollapsed) {
        uiStore.getState().setSidebarCollapsed(true)
      }
    }
    window.addEventListener('resize', onResize)
    onResize()
    return () => window.removeEventListener('resize', onResize)
  }, [sidebarCollapsed])

  const persistError = useStore(persistErrorStore, (s) => s.message)
  const setPersistError = useStore(persistErrorStore, (s) => s.setPersistError)

  return (
    <>
      <Sidebar collapsed={sidebarCollapsed} />
      <Navbar sidebarCollapsed={sidebarCollapsed} />
      <main
        style={{
          marginLeft: sidebarWidth,
          marginTop: 70,
          padding: 30,
          maxWidth: 1400,
          marginRight: 'auto',
          marginBottom: 0,
          minHeight: 'calc(100vh - 70px)',
          backgroundColor: 'var(--vantura-background)',
        }}
      >
        {persistError && (
          <div
            className="d-flex align-items-center justify-content-between px-3 py-2 small mb-3 rounded"
            style={{
              backgroundColor: 'var(--vantura-surface)',
              border: '1px solid var(--vantura-text-secondary)',
            }}
            role="alert"
          >
            <span>{persistError}</span>
            <button
              type="button"
              className="btn-close btn-close-sm"
              aria-label="Dismiss"
              onClick={() => setPersistError(null)}
            />
          </div>
        )}
        <Outlet />
      </main>
    </>
  )
}
