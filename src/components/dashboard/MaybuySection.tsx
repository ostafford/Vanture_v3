import type React from 'react'
import { Link } from 'react-router-dom'
import { Card } from 'react-bootstrap'
import { getPendingMaybuys } from '@/services/maybuys'
import { formatMoney } from '@/lib/format'
import { HelpPopover } from '@/components/HelpPopover'

export interface MaybuySectionProps {
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>
}

export function MaybuySection({ dragHandleProps }: MaybuySectionProps) {
  const pending = getPendingMaybuys()
  const total = pending.reduce((s, i) => s + i.price_cents, 0)

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center section-header">
        <div className="d-flex align-items-center gap-2">
          <span
            className="page-title-icon bg-gradient-primary text-white mr-2"
            {...dragHandleProps}
          >
            <i className="mdi mdi-cart-heart" aria-hidden />
          </span>
          <span>Maybuys</span>
          <HelpPopover
            id="maybuys-dashboard-help"
            title="Maybuys"
            content="Things you're considering buying. The timer on each item nudges you toward a more intentional decision. Visit the Maybuys page to add items and act on them."
            ariaLabel="What are Maybuys?"
          />
        </div>
        <Link
          to="/analytics/maybuys"
          className="btn btn-primary btn-sm"
          aria-label="Go to Maybuys"
        >
          <i className="mdi mdi-arrow-right" aria-hidden />
        </Link>
      </Card.Header>
      <Card.Body>
        {pending.length === 0 ? (
          <div className="text-center py-3">
            <p className="text-muted small mb-2">
              Nothing in your wishlist yet.
            </p>
            <Link
              to="/analytics/maybuys"
              className="btn btn-outline-primary btn-sm"
            >
              Add a Maybuy
            </Link>
          </div>
        ) : (
          <>
            <p className="small text-muted mb-2">
              {pending.length} item{pending.length === 1 ? '' : 's'} ·{' '}
              <strong>${formatMoney(total)}</strong> total
            </p>
            <div className="d-flex flex-column gap-2">
              {pending.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="d-flex justify-content-between align-items-center"
                >
                  <span className="text-truncate me-2 small fw-medium">
                    {item.name}
                  </span>
                  <span className="small text-muted flex-shrink-0">
                    ${formatMoney(item.price_cents)}
                  </span>
                </div>
              ))}
              {pending.length > 3 && (
                <p className="small text-muted mb-0">
                  +{pending.length - 3} more
                </p>
              )}
            </div>
            <div className="mt-3">
              <Link
                to="/analytics/maybuys"
                className="btn btn-outline-primary btn-sm"
              >
                View all Maybuys
              </Link>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  )
}
