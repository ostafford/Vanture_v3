import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useStore } from 'zustand'
import { uiStore } from '@/stores/uiStore'
import { persistErrorStore } from '@/stores/persistErrorStore'
import { Sidebar, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './Sidebar'
import { Navbar } from './Navbar'

const VIEWPORT_AUTO_COLLAPSE_PX = 1280
const SIDEBAR_COLLAPSED_KEY = 'vantura_sidebar_collapsed'

export function Layout() {
  const sidebarCollapsed = useStore(uiStore, (s) => s.sidebarCollapsed)
  const sidebarWidth = sidebarCollapsed
    ? SIDEBAR_COLLAPSED_WIDTH
    : SIDEBAR_WIDTH

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    const preferCollapsed = stored === '1'
    if (window.innerWidth < VIEWPORT_AUTO_COLLAPSE_PX) {
      uiStore.getState().setSidebarCollapsed(true)
    } else if (stored !== null) {
      uiStore.getState().setSidebarCollapsed(preferCollapsed)
    }
  }, [])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < VIEWPORT_AUTO_COLLAPSE_PX) {
        uiStore.getState().setSidebarCollapsed(true)
      } else {
        uiStore.getState().setSidebarCollapsed(false)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed ? '1' : '0')
  }, [sidebarCollapsed])

  const persistError = useStore(persistErrorStore, (s) => s.message)
  const setPersistError = useStore(persistErrorStore, (s) => s.setPersistError)

  return (
    <div className="container-scroller">
      <Sidebar collapsed={sidebarCollapsed} />
      <Navbar sidebarCollapsed={sidebarCollapsed} />
      <div className="page-body-wrapper" style={{ marginLeft: sidebarWidth }}>
        <main
          className="content-wrapper"
          style={{ minHeight: 'calc(100vh - 70px)' }}
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
      </div>
    </div>
  )
}
