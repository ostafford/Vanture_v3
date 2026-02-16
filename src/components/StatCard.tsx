import { Card, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { formatMoney } from '@/lib/format'

const circleImg = '/images/circle.svg'

type GradientVariant = 'primary' | 'danger' | 'info' | 'success'

export interface StatCardProps {
  title: string
  value: number
  subtitle?: string
  gradient: GradientVariant
  imgAlt?: string
  tooltip?: string
}

export function StatCard({ title, value, subtitle, gradient, imgAlt, tooltip }: StatCardProps) {
  const titleContent = (
    <>
      {title}
      {tooltip && (
        <OverlayTrigger placement="top" overlay={<Tooltip id={`stat-${title}-tooltip`}>{tooltip}</Tooltip>}>
          <span
            className="ms-1"
            style={{ cursor: 'help', fontSize: '0.9rem' }}
            role="img"
            aria-label="Info"
          >
            <i className="mdi mdi-information-outline text-white" aria-hidden />
          </span>
        </OverlayTrigger>
      )}
    </>
  )

  return (
    <Card className={`bg-gradient-${gradient} card-img-holder text-white`}>
      <Card.Body>
        <img src={circleImg} className="card-img-absolute" alt={imgAlt ?? ''} />
        <h4 className="font-weight-normal mb-3 text-white">{titleContent}</h4>
        <h2 className="mb-2 text-white">${formatMoney(value)}</h2>
        {subtitle && <h6 className="card-text opacity-75 mb-0">{subtitle}</h6>}
      </Card.Body>
    </Card>
  )
}
