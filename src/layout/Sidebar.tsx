import { Link, useLocation } from 'react-router-dom'
import { useStore } from 'zustand'
import { themeStore } from '@/stores/themeStore'
import { sessionStore } from '@/stores/sessionStore'
import { ThemeToggle } from '@/components/ThemeToggle'

const SIDEBAR_WIDTH = 260
const SIDEBAR_COLLAPSED_WIDTH = 70

interface SidebarProps {
  collapsed: boolean
}

export function Sidebar({ collapsed }: SidebarProps) {
  const location = useLocation()
  useStore(themeStore, (s) => s.theme) // subscribe for theme re-renders
  const width = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH

  const navItems = [
    { to: '/', label: 'Dashboard', icon: 'mdi-home', short: 'D' },
    {
      to: '/transactions',
      label: 'Transactions',
      icon: 'mdi-credit-card-multiple',
      short: 'T',
    },
    { to: '/settings', label: 'Settings', icon: 'mdi-cog', short: 'S' },
    {
      to: '/help',
      label: 'Help',
      icon: 'mdi-book-open-page-variant',
      short: 'H',
    },
  ]

  return (
    <nav
      data-tour="sidebar-nav"
      className={`sidebar ${collapsed ? 'collapsed' : ''}`}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width,
        minWidth: width,
        backgroundColor: 'var(--vantura-sidebar-bg)',
        color: 'var(--vantura-sidebar-menu-color)',
        zIndex: 1030,
        transition: 'width 0.25s ease, background 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="sidebar-brand">
        {!collapsed && <span className="brand-text">Vantura</span>}
      </div>
      <div className="sidebar-body">
        <ul className="nav">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to
            return (
              <li
                key={item.to}
                className={`nav-item${isActive ? ' active' : ''}`}
              >
                <Link
                  className="nav-link"
                  to={item.to}
                  style={{ color: 'inherit' }}
                >
                  <span className="menu-title">
                    {collapsed ? item.short : item.label}
                  </span>
                  <i className={`mdi ${item.icon} menu-icon`} aria-hidden />
                </Link>
              </li>
            )
          })}
        </ul>
        <div className="sidebar-footer" data-tour="sidebar-lock">
          <button
            type="button"
            className="sidebar-footer-btn"
            onClick={() => sessionStore.getState().lock()}
            aria-label="Lock"
          >
            <i className="mdi mdi-lock menu-icon" aria-hidden />
            {!collapsed && <span className="menu-title">Lock</span>}
          </button>
          <div className="sidebar-footer-btn-wrapper">
            <ThemeToggle showLabel={!collapsed} />
          </div>
        </div>
      </div>
    </nav>
  )
}

export { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH }
