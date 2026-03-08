import type { ReactNode } from 'react'
import { Card, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { formatMoney } from '@/lib/format'

type ColorVariant = 'primary' | 'danger' | 'info' | 'success'

export interface StatCardProps {
  title: string
  value: number
  subtitle?: string
  /** When set, shown instead of $formatMoney(value). Use for non-currency values (e.g. counts). */
  displayValue?: ReactNode
  /** Smaller variant: less padding, smaller typography, gradient background. */
  compact?: boolean
  gradient: ColorVariant
  imgAlt?: string
  tooltip?: string
}

export function StatCard({
  title,
  value,
  subtitle,
  displayValue,
  compact,
  gradient,
  tooltip,
}: StatCardProps) {
  const valueContent =
    displayValue != null ? displayValue : `$${formatMoney(value)}`

  if (compact) {
    const compactTitle = (
      <>
        {title}
        {tooltip && (
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip id={`stat-${title}-tooltip`}>{tooltip}</Tooltip>}
          >
            <span
              className="ms-1"
              style={{ cursor: 'help', fontSize: '0.75rem' }}
              role="img"
              aria-label="Info"
            >
              <i
                className="mdi mdi-information-outline text-white"
                aria-hidden
              />
            </span>
          </OverlayTrigger>
        )}
      </>
    )
    return (
      <Card className={`bg-gradient-${gradient} text-white`}>
        <Card.Body className="py-1 px-2">
          <h6 className="font-weight-normal mb-0 small text-white text-center align-middle">
            {compactTitle}
          </h6>
          <h6 className="mb-0 text-white text-center align-middle">
            {valueContent}
          </h6>
          {subtitle && (
            <small className="card-text opacity-75 d-block">{subtitle}</small>
          )}
        </Card.Body>
      </Card>
    )
  }

  return (
    <Card className={`stat-card-flat stat-card-flat--${gradient}`}>
      <Card.Body className="stat-card-flat__body">
        <div className="stat-card-flat__title">
          {title}
          {tooltip && (
            <OverlayTrigger
              placement="top"
              overlay={
                <Tooltip id={`stat-${title}-tooltip`}>{tooltip}</Tooltip>
              }
            >
              <span
                className="ms-1 stat-card-flat__info"
                role="img"
                aria-label="Info"
              >
                <i className="mdi mdi-information-outline" aria-hidden />
              </span>
            </OverlayTrigger>
          )}
        </div>
        <div className="stat-card-flat__value">{valueContent}</div>
        {subtitle && <div className="stat-card-flat__subtitle">{subtitle}</div>}
      </Card.Body>
    </Card>
  )
}
