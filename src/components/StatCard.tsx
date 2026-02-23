import type { ReactNode } from 'react'
import { Card, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { formatMoney } from '@/lib/format'

const circleImg = `${import.meta.env.BASE_URL}images/circle.svg`

type GradientVariant = 'primary' | 'danger' | 'info' | 'success'

export interface StatCardProps {
  title: string
  value: number
  subtitle?: string
  /** When set, shown instead of $formatMoney(value). Use for non-currency values (e.g. counts). */
  displayValue?: ReactNode
  /** Smaller variant: less padding, smaller typography, no circle decoration. */
  compact?: boolean
  gradient: GradientVariant
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
  imgAlt,
  tooltip,
}: StatCardProps) {
  const titleContent = (
    <>
      {title}
      {tooltip && (
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip id={`stat-${title}-tooltip`}>{tooltip}</Tooltip>}
        >
          <span
            className="ms-1"
            style={{ cursor: 'help', fontSize: compact ? '0.75rem' : '0.9rem' }}
            role="img"
            aria-label="Info"
          >
            <i className="mdi mdi-information-outline text-white" aria-hidden />
          </span>
        </OverlayTrigger>
      )}
    </>
  )

  const valueContent =
    displayValue != null ? displayValue : `$${formatMoney(value)}`

  if (compact) {
    return (
      <Card className={`bg-gradient-${gradient} text-white`}>
        <Card.Body className="py-1 px-2">
          <h6 className="font-weight-normal mb-0 small text-white text-center align-middle">
            {titleContent}
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
    <Card className={`bg-gradient-${gradient} card-img-holder text-white`}>
      <Card.Body>
        <img src={circleImg} className="card-img-absolute" alt={imgAlt ?? ''} />
        <h4 className="font-weight-normal mb-3 text-white text-center align-middle">
          {titleContent}
        </h4>
        <h2 className="mb-2 text-white text-center align-middle">
          {valueContent}
        </h2>
        {subtitle && (
          <h6 className="card-text opacity-75 mb-0 text-center align-middle">
            {subtitle}
          </h6>
        )}
      </Card.Body>
    </Card>
  )
}
