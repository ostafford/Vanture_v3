import { Link, NavLink, Outlet } from 'react-router-dom'
import { Row, Col } from 'react-bootstrap'

const TABS = [
  {
    to: '/analytics/trackers',
    label: 'Trackers',
    icon: 'mdi-chart-timeline-variant',
  },
  { to: '/analytics/savers', label: 'Savers', icon: 'mdi-piggy-bank' },
  {
    to: '/analytics/insights',
    label: 'Weekly Insights',
    icon: 'mdi-chart-bar',
  },
] as const

export function AnalyticsLayout() {
  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">
          <span className="page-title-icon bg-gradient-primary text-white mr-2">
            <i className="mdi mdi-chart-box" aria-hidden />
          </span>
          Analytics
        </h3>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link to="/">Dashboard</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              Analytics
            </li>
          </ol>
        </nav>
      </div>

      <Row className="grid-margin">
        <Col xs={12}>
          <ul className="nav nav-tabs mb-3" role="tablist">
            {TABS.map(({ to, label, icon }) => (
              <li key={to} className="nav-item">
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `nav-link${isActive ? ' active' : ''}`
                  }
                  end={to !== '/analytics/trackers'}
                >
                  <i className={`mdi ${icon} me-1`} aria-hidden />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </Col>
      </Row>

      <Outlet />
    </div>
  )
}
