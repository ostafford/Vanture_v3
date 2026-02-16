import { Nav } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'

const SIDEBAR_WIDTH = 260
const SIDEBAR_COLLAPSED_WIDTH = 70

interface SidebarProps {
  collapsed: boolean
}

export function Sidebar({ collapsed }: SidebarProps) {
  const location = useLocation()
  const width = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH

  return (
    <nav
      className="d-flex flex-column border-end"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: width,
        minWidth: width,
        backgroundColor: 'var(--vantura-surface)',
        zIndex: 1030,
        transition: 'width 0.2s ease',
      }}
    >
      <div className="p-3 border-bottom" style={{ minHeight: 70 }}>
        {!collapsed && (
          <span className="fw-bold" style={{ color: 'var(--vantura-text)' }}>
            Vantura
          </span>
        )}
      </div>
      <Nav className="flex-column p-2">
        <Nav.Link
          as={Link}
          to="/"
          active={location.pathname === '/'}
          style={{ color: 'var(--vantura-text)' }}
        >
          {collapsed ? 'D' : 'Dashboard'}
        </Nav.Link>
        <Nav.Link
          as={Link}
          to="/transactions"
          active={location.pathname === '/transactions'}
          style={{ color: 'var(--vantura-text)' }}
        >
          {collapsed ? 'T' : 'Transactions'}
        </Nav.Link>
        <Nav.Link
          as={Link}
          to="/settings"
          active={location.pathname === '/settings'}
          style={{ color: 'var(--vantura-text)' }}
        >
          {collapsed ? 'S' : 'Settings'}
        </Nav.Link>
      </Nav>
    </nav>
  )
}

export { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH }
